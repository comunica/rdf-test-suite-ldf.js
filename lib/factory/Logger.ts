import * as winston from 'winston';

// Logger used for logging through application
export const logger = winston.createLogger({
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});
