import JWT from 'jsonwebtoken';
import { Types } from 'mongoose';
import UserToken from '../models/userToken.model';

const generateToken = async (
  id: Types.ObjectId, // id of the user
  secret: string,
  expireTimeInSecs: number, // in seconds
  isRefresh = false
) => {
  try {
    const payload = {
      id,
      exp: Math.floor(Date.now() / 1000) + expireTimeInSecs,
    };
    const token = JWT.sign(payload, secret);
    if (isRefresh) {
      // replace (remove+add, no update) old refresh token, if any
      const userToken = await UserToken.findOne({ userId: id });
      if (userToken) await userToken.deleteOne({ userId: id });

      await UserToken.create({ userId: id, token });
    }
    return token;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export default generateToken;
