import http from 'http';
import { Server as sockServer } from 'socket.io';
import app from './app'; // express, routes, middleware
import getEnvVar from 'utils/getEnvVar';
import logger from 'utils/logger';

process.on('uncaughtException', (err: any) => {
  logger.error('UNCAUGHT EXCEPTION !! Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1); // crash the app
  //Note: another 3rd party tool, on the host, should be set to restart the app once it crashes
});
const httpServer = http.createServer(app);
const io = new sockServer(httpServer);

io.on('connection', (socket) => {
  logger.info('a user connected');
  socket.on('disconnect', () => {
    logger.info('user disconnected');
  });
});

// Start listening to the http server
const httpPort = getEnvVar('HTTP_PORT', true) || '0';
const server = app.listen(parseInt(httpPort), () => {
  logger.info(
    `Server is running on port ${httpPort}, "${getEnvVar(
      'NODE_ENV',
      true
    ).toUpperCase()}" environment`
  );
});

// listen on "unhandledRejection" event
process.on('unhandledRejection', (err: any) => {
  logger.error('UNHANDLER REJECTION * Shutting down...');
  logger.error(err.name, err.message);
  // close the app gracefully
  server.close(() => {
    process.exit(1); // crash the app
    //Note: another 3rd party tool, on the host, should be set to restart the app once it crashes
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down the app gracefully...');
  server.close(() => {
    logger.info('Process Terminated!');
  });
});
