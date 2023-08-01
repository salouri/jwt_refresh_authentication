import JWT, { Secret, JwtPayload } from 'jsonwebtoken';
import AppError from 'utils/appError';
import catchAsync from 'utils/catchAsync';
import getEnvVar from 'utils/getEnvVar';
import PayloadType from 'types/payload.type';

import type { Request, Response, NextFunction } from 'express';
import logger from 'utils/logger';
import User from 'models/user.model';
import { access } from 'fs';
import generateToken from 'utils/generateToken';

//---------------------------------------------------------------------------
// isLoggedIn MIDDLEWARE: to be used for rendered pages ONLY(no errors)
export const isLoggedIn = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Check if (JWT) token exists in the request header: Authorization
    let currentUser;
    if (req.cookies.jwt) {
      const token = req.cookies.jwt;
      // generate access token
      const accessTokenSecret = getEnvVar('JWT_ACCESS_SECRET');

      const decoded = JWT.verify(token, accessTokenSecret as Secret) as PayloadType;
      if (decoded) {
        currentUser = await User.findById(decoded.id); // returns a model instance of User ==> a complete Document

        if (!currentUser) {
          return next();
        }
        // check if passwored has changed since issuing the JWT token
        const wasPasswordChangeAfterJWT = await currentUser.changedPasswordAfter(
          decoded.exp
        );
        if (wasPasswordChangeAfterJWT) {
          return next();
        }
      }
      // THERE IS A LOGGED IN USER
      if (currentUser) {
        const { id, email, username } = currentUser;
        res.locals.user = { id, email, username }; // PUG templates have access to res.locals automatically
      }
      return next();
    }
  }
); //end-of isLoggedIn middleware

//---------------------------------------------------------------------------
// "PROTECT" MIDDLEWARE method
export const isAuthenticated = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Check if (JWT) token exists in the request header: Authorization
    let token;
    // Bearer Schema => {"Authorization" : "Bearer <token>" }
    if (req.headers.authorization) {
      const position = req.headers.authorization.startsWith('Bearer ') ? 1 : 0;
      token = req.headers.authorization.split(' ')[position];
    } else if (req.cookies.jwt) {
      // for requests coming from browsers
      token = req.cookies.jwt;
    }

    if (!token || typeof token === 'undefined') {
      return next(
        new AppError('You are not logged in! Please, log in to get access', 401)
      );
    }
    let myUser;
    //verify the token:
    const accessTokenSecret = getEnvVar('JWT_ACCESS_SECRET');
    const decoded = JWT.verify(token, accessTokenSecret as Secret) as PayloadType;
    if (decoded) {
      myUser = await User.findById(decoded.id); // returns a model instance of User ==> a complete Document

      if (!myUser) {
        return next(new AppError('User of this token no longer exists.', 401)); // 401: unauthorized (user doesn't exist)
      }
      // check if passwored has changed since issuing the JWT token
      const wasPasswordChangeAfterJWT = await myUser.changedPasswordAfter(
        decoded.exp
      );
      if (wasPasswordChangeAfterJWT) {
        return next(
          new AppError(
            'Password of this user has been changed. Please, try to login again',
            401
          )
        );
      }

      const { id, email, username } = myUser;
      req.user = { id, email, username }; // usefull for later middleware methods
      res.locals.user = myUser; // usefull for (views) web page rendering
      return next();
    } else {
      return next(new AppError('Invalid token', 401));
    }
  }
); //end-of isAuthenticated middleware
