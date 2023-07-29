import crypto from 'crypto';
import JWT from 'jsonwebtoken';
import AppError from 'utils/appError';
import catchAsync from 'utils/catchAsync';
import getEnvVar from 'utils/getEnvVar';
import { db } from 'utils/db.server';

import type { Request, Response, NextFunction } from 'express';
import type UserType from 'types/user.type';
import type PayloadType from 'types/payload.type';
import logger from 'utils/logger';

const User = db.User;
//---------------------------------------------------------------------------

const signToken = (id: number) =>
  JWT.sign({ id }, getEnvVar('JWT_SECRET'), {
    expiresIn: getEnvVar('JWT_EXPIRES_IN'),
  });

//---------------------------------------------------------------------------
const createSendToken = (
  userObj: UserType,
  returnData = false,
  statusCode: number,
  req: Request,
  res: Response
) => {
  const token = signToken(userObj.id);

  //   if ('password' in userObj) userObj.password = undefined;

  const data = returnData ? { user: userObj } : null;

  const cookieOptions = {
    expires: new Date(
      Date.now() + parseInt(getEnvVar('JWT_COOKIE_EXPIRES_IN')) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // prevents browser from accessing or modification cookie
    // req.secure: an attribute added by Express.js if https is used
    // must add app.enable('trust proxy') in app.js to check on 'x-forwarded-proto' header

    // secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  };
  // if (process.env.NODE_ENV === 'production') // not all production deployments use https

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token: getEnvVar('NODE_ENV', true) === 'development' ? token : null,
    data,
  });
};

//---------------------------------------------------------------------------
// async func bc we will use db operations(return promises)
export const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    return;
  }
); // end-of signup handler

//---------------------------------------------------------------------------
export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    return;
  }
); //end-of login handler

//---------------------------------------------------------------------------

export const logout = (req: Request, res: Response) => {
  return;
};
//---------------------------------------------------------------------------
// isLoggedIn MIDDLEWARE using jwt token: to be used for rendered pages ONLY(no errors)
export const isLoggedIn = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    return;
  }
); // end-of isLoggedIn handler

// export const isLoggedIn = catchAsync(
//     async (req: Request, res: Response, next: NextFunction) => {
//       // Check if (JWT) token exists in the request header: Authorization
//       let decoded: PayloadType | string;
//       let loggedInUser: UserType | null = null;
//       if (req.cookies.jwt) {
//         const JWT_SECRET: string = getEnvVar('JWT_SECRET');
//         decoded = await JWT.verify(req.cookies.jwt, JWT_SECRET);
//         if (decoded) {
//           loggedInUser = await User.findUnique({
//             where: { id: decoded.id },
//             select: {
//               id: true,
//               sub: true,
//             },
//           });
//         }
//         if (!loggedInUser) {
//           return next();
//         }
//         // check if passwored has changed since issuing the JWT token
//         //   const wasPasswordChangeAfterJWT = await currentUser.changedPasswordAfter(
//         //     decoded.iat
//         //   );
//         //   if (wasPasswordChangeAfterJWT) {
//         //     return next();
//         //   }
//       }
//       // THERE IS A LOGGED IN USER
//       res.locals.user = loggedInUser; // PUG templates have access to res.locals automatically
//       next();
//     }
//   ); //end-of isAuthorized middleware

//---------------------------------------------------------------------------
// "isAuthorized" MIDDLEWARE method
export const isAuthorized = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // ** Note: token is only needed when token-based authentication is used
    // Check if (JWT) token exists in the request header: Authorization
    let token;
    // Bearer Schema => {"Authorization" : "Bearer <token>" }
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      // for requests coming from browsers
      token = req.cookies.jwt;
    }

    if (!token || typeof token === 'undefined') {
      return next(
        new AppError('You are not logged in! Please, log in to get access', 401)
      );
    }
    const loggedInUser = await User.findUnique({
      where: { sub: req.body.userSub },
      select: {
        id: true,
        sub: true,
      },
    });

    if (!loggedInUser || loggedInUser === null) {
      return next(new AppError('User of this token no longer exists.', 401)); // 401: unauthorized (user doesn't exist)
    }

    // console.log(`currentUser: ${JSON.stringify(currentUser, null, 2)}`);
    // req.user = currentUser; // usefull for later middleware methods
    res.locals.user = loggedInUser; // usefull for (views) web page rendering
    next();
  }
); //end-of isAuthorized middleware

//---------------------------------------------------------------------------
/* restrictTo is a MIDDLEWARE function that limits access to certain roles only
function matches the group only if matchGroup is provided and exempts from group matching the privileged role */
export const restrictTo = (
  privilegedRole = '',
  matchGroup = false,
  ...roles: Array<string>
) => {
  // Middleware methods don't take-in custom arguments. Only: err, req, res, next
  //   catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  //     // req.user comes from "isAuthorized" middleware method, which always comes BEFORE "restrictTo"
  //     const userRoles = req.user.Roles.map((roleObj) => roleObj.role); // extract roles' names
  //     const isPrivileged = privilegedRole ? userRoles.includes(privilegedRole) : false;
  //     if (!isPrivileged) {
  //       if (!!req.user || !roles.some((r) => userRoles.includes(r))) {
  //         return next(
  //           new AppError('You do not have permission to perform this action', 403) // 403: forbidden.
  //         );
  //       }
  //       if (matchGroup) {
  //         const groups = req.accessedGroup;
  //         const userGroups = req.user.Roles.map((roleObj) => roleObj.Group.name); // extract groups names
  //         if (!groups || !userGroups.some((usrGrp) => groups.includes(usrGrp))) {
  //           return next(
  //             new AppError(
  //               'This action is only allowed for an entity that belongs to your group',
  //               403
  //             )
  //           );
  //         }
  //       } // group matching ends
  //     } // !isPrivileged

  // next();
  //   }); //end-of restrictTo
  return;
};
