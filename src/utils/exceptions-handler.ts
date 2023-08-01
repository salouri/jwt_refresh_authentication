/* eslint-disable no-console */
import logger from 'utils/logger';

export default {
  // Handler of uncaught exception is supposed to be at the top before the entire app.
  //crashing the app after an uncaught exception is a must; to get out of the unclean-state
  uncaughtException: () =>
    process.on('uncaughtException', (err: any) => {
      logger.error('UNCAUGHT EXCEPTION !! Shutting down...');
      logger.error(err.name, err.message);
      process.exit(1); // crash the app
      //Note: another 3rd party tool, on the host, should be set to restart the app once it crashes
    }),

  // listen on "unhandledRejection" event
  unhandledRejection: (server: any) =>
    process.on('unhandledRejection', (err: any) => {
      logger.error('UNHANDLER REJECTION * Shutting down...');
      logger.error(err.name, err.message);
      // close the app gracefully
      server.close(() => {
        process.exit(1); // crash the app
        //Note: another 3rd party tool, on the host, should be set to restart the app once it crashes
      });
    }),

  SIGTERM: (server: any) =>
    process.on('SIGTERM', () => {
      logger.error('SIGTERM received. Shutting down the app gracefully...');
      server.close(() => {
        logger.error('Process Terminated!');
      });
    }),
};
