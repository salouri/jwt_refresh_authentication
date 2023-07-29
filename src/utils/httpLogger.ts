import morgan from 'morgan';
import getEnvVar from './getEnvVar';

  const httpLogger = getEnvVar('NODE_ENV', true) === 'development'? morgan('dev') : morgan('tiny');

export default httpLogger;