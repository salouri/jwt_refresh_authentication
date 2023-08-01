import mongoose from 'mongoose';
import getEnvVar from 'utils/getEnvVar';

const Schema = mongoose.Schema;

const userTokenExpireTime =
  Number(getEnvVar('JWT_REFRESH_EXPIRES_IN_DAYS', true) || '30') * 24 * 60 * 60; // 30 days
const userTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }, // 30 days
  expireAt: { type: Date, expires: userTokenExpireTime }, // 30 days
});

const UserToken = mongoose.model('UserToken', userTokenSchema);

export default UserToken;
