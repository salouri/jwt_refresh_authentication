import type { Request, Response, NextFunction } from 'express';
import User from 'models/user.model';
import generateToken from 'utils/generateToken';
import catchAsync from 'utils/catchAsync';
import getEnvVar from 'utils/getEnvVar';
import AppError from 'utils/appError';
import crypto from 'crypto';
import Email from 'utils/email';
import logger from 'utils/logger';
import verifyRefreshToken from 'utils/verifyRefreshToken';

// async func bc we will use db operations(return promises)
export const register = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Note: password will be encrypted before saving to the database (pre-save middleware)
    const userDoc = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    });

    // generate access token
    const accessTokenSecret = getEnvVar('JWT_ACCESS_SECRET');
    const accessTokenExpireTime =
      60 * (Number(getEnvVar('JWT_ACCESS_EXPIRES_IN_MINS', true)) | 10);

    const accessToken = await generateToken(
      userDoc._id,
      accessTokenSecret,
      accessTokenExpireTime
    );

    const cookieOptions = {
      expires: new Date(
        Date.now() +
          (Number(getEnvVar('JWT_COOKIE_EXPIRES_IN_MINS', true)) | 10) * 60 * 1000
      ),
      httpOnly: true, // prevents browser from accessing or modifying the cookie
      // req.secure: an attribute added by Express.js if https is used
      // must add app.enable('trust proxy') in app.js to check on 'x-forwarded-proto' header
      secure: req.secure || req.header('x-forwarded-proto') === 'https',
    };

    userDoc.password = '';

    res.cookie('jwt', accessToken, cookieOptions);

    res.status(201).json({
      status: 'success',
      token: accessToken,
      data: { user: userDoc },
    });
  }
); // end-of signup handler

//---------------------------------------------------------------------------
export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password: plainPassword } = req.body;

    if (!email || !plainPassword)
      return next(new AppError('Please provide email and password!', 400));
    //Because of "select: false" on "password" field at the User model, we need to select it manually on queries

    const myUser = await User.findOne({ email }).select('+password');
    if (!myUser) {
      return next(new AppError('Email used does not exist!', 400));
    }

    const correctPassword = await myUser.isPasswordCorrect(
      plainPassword,
      myUser.password
    );
    if (!correctPassword)
      return next(new AppError('Incorrect email or password!', 401)); // not authorized

    // generate an accesstoken and a refreshtoken
    const accessTokenSecret = getEnvVar('JWT_ACCESS_SECRET');
    const accessTokenExpireTime =
      60 * (Number(getEnvVar('JWT_ACCESS_EXPIRES_IN_MINS', true)) | 10);

    const accessToken = await generateToken(
      myUser._id,
      accessTokenSecret,
      accessTokenExpireTime
    );
    const refreshTokenSecret = getEnvVar('JWT_REFRESH_SECRET');
    const refreshTokenExpireTime =
      Number(getEnvVar('JWT_REFRESH_EXPIRES_IN_DAYS', true)) | 30;
    const isRefreshToken = true;
    const refreshToken = await generateToken(
      myUser._id,
      refreshTokenSecret,
      refreshTokenExpireTime,
      isRefreshToken
    );

    const cookieOptions = {
      expires: new Date(
        Date.now() +
          (Number(getEnvVar('JWT_COOKIE_EXPIRES_IN_MINS', true)) | 10) * 60 * 1000
      ),
      httpOnly: true, // prevents browser from accessing or modifying the cookie
      // req.secure: an attribute added by Express.js if https is used
      // must add app.enable('trust proxy') in app.js to check on 'x-forwarded-proto' header
      secure: req.secure || req.header('x-forwarded-proto') === 'https',
    };

    myUser.password = '';

    res.cookie('jwt', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions); // refresh token is not accessible by the browser

    res.status(201).json({
      status: 'success',
      accessToken,
      data: { user: myUser },
    });
  }
); //end-of login handler

//---------------------------------------------------------------------------
// ROUTE HANDLER method
export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body?.email)
      return next(new AppError('Email address is required!', 404));
    // get user based on POSTed email
    const myUser = await User.findOne({ email: req.body.email });
    if (!myUser || myUser == null)
      return next(
        new AppError('There is no user with the provided email address.', 404)
      );

    // Generat the "salt" token to be used in generating the hashed password later
    //sets the fields: passwordResetToken, passwordResetExpireAt and returns the "salt token"
    const saltToken = await myUser.createPasswordResetToken();
    await myUser.save({ validateBeforeSave: false }); // saves the modified fields of the document in previous method

    // send new password to user by email
    const host = req.get('host');
    const resetURL = `${req.protocol}://${host}/api/v1/users/resetPassword/${saltToken}`;

    try {
      await new Email(myUser.email, resetURL).send(
        'passwordReset',
        'Your password reset token (valid for only 10 minutes)'
      );

      res.status(200).json({
        status: 'success',
        message: `Token sent to email: ${myUser.email}`,
      });
    } catch (err) {
      myUser.passwordResetToken = undefined;
      myUser.passwordResetExpireAt = undefined;

      await myUser.save({ validateBeforeSave: false });
      logger.error(err);
      return next(
        new AppError('There was a problem sending the email. Try again later!', 500)
      );
    }
  }
); //end-of forgotPassword handler

//---------------------------------------------------------------------------
// ROUTE HANDLER method for "auth/resetPassword" route
export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Get user; based on the token provided
    const saltToken = req.params.saltToken;
    const hashedToken = crypto.createHash('sha256').update(saltToken).digest('hex');
    const myUser = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpireAt: { $gt: Date.now() },
    });
    // 2) If token has not expired and the user exists, set the new password
    if (!myUser)
      return next(new AppError('Token either is invalid or has expired', 400)); // 400: bad request

    myUser.password = req.body.password;
    myUser.passwordResetToken = undefined;
    myUser.passwordResetExpireAt = undefined;
    // myUser.passwordChangedAt = Date.now() - 1000;// moved to a pre-save document middleware
    await myUser.save();

    // 3) Update changedPasswordAt property: // Done on a pre-save middleware inside userModel.js

    // 4) Log the user in and send the JWT token
    res.status(200).json({
      status: 'success',
      saltToken,
      data: null,
    });
  }
); //end-of resetPassword handler

//---------------------------------------------------------------------------
// Handler for refresh token verification
export const refreshToken = async (req: Request, res: Response) => {
  const { id, refreshToken } = req.body;
  if (!refreshToken || !id)
    return res.status(404).send('required parameters are missing');

  const isValid = await verifyRefreshToken(id, refreshToken);

  if (!isValid) return res.status(401).send('Invalid refresh token');

  const accessTokenSecret = getEnvVar('JWT_ACCESS_SECRET');
  const accessTokenExpireTime =
    Number(getEnvVar('JWT_ACCESS_EXPIRES_IN_MINS', true) || '10') * 60;
  const accessToken = await generateToken(
    id,
    accessTokenSecret,
    accessTokenExpireTime
  );
  return res.status(200).json({ status: 'success', accessToken });
}; //end-of refreshToken handler
