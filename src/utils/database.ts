/* eslint-disable no-console */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import getEnvVar from './getEnvVar';
import logger from 'utils/logger';

dotenv.config();

dotenv.config({ path: './config.env' });

const connectDB = async () => {
  try {
    const password = getEnvVar('DB_PASSWORD');
    const databaseURI: string = getEnvVar('CONNECTION_STRING')
      .replace('<PASSWORD>', password)
      .replace('<USERNAME>', getEnvVar('DB_USER'))
      .replace('<DATABASE>', getEnvVar('DB_NAME'));

    const connectOptions = {
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      ssl: true,
    };

    await mongoose.connect(databaseURI, connectOptions);
    logger.info('Database Connection Successful...');
  } catch (error: any) {
    logger.error('Database connection failed!');

    throw new Error(error.message);
  }
};

export default connectDB;
