import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet'; // Security
import compression from 'compression';
import * as auth from 'middlewares/auth';
import cookieParser from 'cookie-parser';
import AppError from 'utils/appError';
import getEnvVar from 'utils/getEnvVar';
import errorHandler from 'utils/errorsHandler';
import httpLogger from 'utils/httpLogger';
import authRoutes from 'routes/auth.router';
import restaurantRoutes from 'routes/restaurant.router';

const app = express();

// Development logging
if (getEnvVar('NODE_ENV', true) === 'development') {
  app.use(httpLogger); // uses Morgan Middleware for logging HTTP requests
}
// enable ONLY if your website is running behind a proxy (e.g. allows to check on "X-Forwarded-Proto" header)
app.enable('trust proxy');
// Implement CORS to allow other domains to request our API

app.use(cors()); // Acess-Control-Allow-Origin *

// ***** middleware *****

//set Security HTTP headers
app.use(helmet());

// handle cookies (for authentication from web browser)
app.use(cookieParser());

//Body parser, reading data from body into req.body (with size limit of 10 kb)
app.use(express.json({ limit: '10kb' }));
// Url-Encoded Form Parser
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

//Prevent paramter pollution (duplicate parameters in the query string)
// app.use(hpp({whitelist: ['duration',],}));

// The middleware will attempt to compress response bodies for all request that traverse through the middleware,
// except when response has "Cache-Control" header with ""no-transform"" directive.
app.use(compression());

// **** Routes ****

app.use('/api/heartbeat', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);

// A midleware to handle ALL other (undefined) routes
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Error Handling Middleware:
app.use(errorHandler);

export default app;
