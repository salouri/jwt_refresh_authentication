import app from './app'; // express, routes, middleware
import getEnvVar from 'utils/getEnvVar';
import logger from 'utils/logger';
import exceptionHandler from 'utils/exceptions-handler';
import connectDB from './utils/database'; // connect to MongoDB

exceptionHandler.uncaughtException();

// Connect to database
connectDB();

// Start listening to the http server
const httpPort = getEnvVar('HTTP_PORT', true) || '0';

const server = app.listen(parseInt(httpPort), async () => {
  logger.info(
    `Server is running on port ${httpPort}, "${getEnvVar(
      'NODE_ENV',
      true
    ).toUpperCase()}" environment`
  );
});

// listen on "unhandledRejection" event
exceptionHandler.unhandledRejection(server);

exceptionHandler.SIGTERM(server);
