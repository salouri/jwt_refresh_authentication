import { InferSchemaType, model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import getEnvVar from 'utils/getEnvVar';
import logger from 'utils/logger';

const userSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    Selection: false, // password will not be returned in any query
  },
  // password will be encrypted before saving to the database

  passwordChangedAt: Date, // Only set if the "password" field is modified in a pre-save middleware
  //Below fields ONLY get set in "forgotPassword", and then get deleleted in "resetPassword"
  passwordResetToken: String,
  passwordResetExpireAt: Date,
});

userSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    // remove these props from document when returning it to the user (as json)
    delete ret.password;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpireAt;
    delete ret.passwordChangedAt;
    delete ret.__v;
    ret.id = ret._id;
    return ret;
  },
});
userSchema.set('toObject', {
  virtuals: true,
  transform: function (doc, ret) {
    // remove these props from document when returning it to the user (as object)
    delete ret.password;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpireAt;
    delete ret.passwordChangedAt;
    delete ret.__v;
    ret.id = ret._id;
    return ret;
  },
});

// Document Middleware: runs before .save() and .create()
userSchema.pre<IUser>('save', async function (next): Promise<void> {
  try {
    if (this.password && (this.isModified('password') || this.isNew)) {
      const cpuCost = 12; // default value is 10. The higher the slower but it'll be more secure
      const salt = await bcrypt.genSalt(cpuCost);
      this.password = await bcrypt.hash(this.password, salt);
    }
    return next();
  } catch (error: any) {
    logger.error(error);
    return next(error);
  }
});

// Instance Method: available on all documents of the collection:
// method will compare plainPassword send by the user, with the encrypted encrPassword in the document
userSchema.methods.isPasswordCorrect = async function (
  plainPassword: string,
  encryPassword: string
): Promise<boolean> {
  return await bcrypt.compare(plainPassword, encryPassword);
};

//instance method to check if password was changed after a timestamp
userSchema.methods.changedPasswordAfter = async function (jwtTimestamp: number) {
  let result = false;
  if (this.passwordChangedAt) {
    result = Number(this.passwordChangedAt.getTime() / 1000) > jwtTimestamp;
  }
  return result;
};

// instance method to generate new temporary password for user
userSchema.methods.createPasswordResetToken = async function () {
  const saltToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(saltToken)
    .digest('hex');
  const expireTime = Number(getEnvVar('PASSWORD_RESET_EXPIRES_IN_MINS', true));
  this.passwordResetExpireAt = Date.now() + (expireTime | 10) * 60 * 1000; // in milliseconds
  return saltToken;
};

export interface IUser extends InferSchemaType<typeof userSchema> {
  isPasswordCorrect: (
    plainPassword: string,
    encryPassword: string
  ) => Promise<boolean>;
  changedPasswordAfter: (jwtTimestamp: number) => Promise<boolean>;
  createPasswordResetToken: () => Promise<string>;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpireAt?: Date;
}
const User = model<IUser>('User', userSchema);

export default User;
