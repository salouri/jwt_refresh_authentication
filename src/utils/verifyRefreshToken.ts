import JWT from 'jsonwebtoken';
import getEnvVar from './getEnvVar';
import PayloadType from '../types/payload.type';
import User from 'models/user.model';

interface iPayload extends PayloadType {
  email: string;
}

const verifyRefreshToken = async (id: string, token: string): Promise<boolean> => {
  try {
    const refreshTokenSecret = getEnvVar('JWT_REFRESH_SECRET');

    const decoded = JWT.verify(token, refreshTokenSecret) as iPayload;
    if (!decoded) return false;
    const user = await User.findById(decoded.id);
    return decoded.id === user?.id;
  } catch (error) {
    // logger.error(error);
    return false;
  }
};

export default verifyRefreshToken;
