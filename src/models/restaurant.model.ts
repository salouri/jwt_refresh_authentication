import { InferSchemaType, model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import getEnvVar from 'utils/getEnvVar';
import logger from 'utils/logger';

const pointSchema: Schema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
  },
  coordinates: {
    type: [Number],
    required: true,
  },
});

const restaurantSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  address: {
    type: String,
  },
  cusisine: {
    type: String,
  },
  location: {
    type: pointSchema,
    required: true,
  },
});
restaurantSchema.index({ location: '2dsphere' }); // geospacial field index

restaurantSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    // remove these props from document when returning it to the user (as json)
    delete ret.__v;
    ret.id = ret._id;
    return ret;
  },
});
restaurantSchema.set('toObject', {
  virtuals: true,
  transform: function (doc, ret) {
    // remove these props from document when returning it to the user (as object)
    delete ret.__v;
    ret.id = ret._id;
    return ret;
  },
});

export type IRestaurant = InferSchemaType<typeof restaurantSchema>;
const Restaurant = model<IRestaurant>('Restaurant', restaurantSchema);

export default Restaurant;
