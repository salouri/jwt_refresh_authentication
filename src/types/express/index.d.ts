import UserType from '../user.type';

export {}; // to make the file a module and avoid the TypeScript error

declare global {
  namespace Express {
    export interface Request {
      user?: Omit<UserType, 'password'>;
    }
  }
}
