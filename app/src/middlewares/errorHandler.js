import { omit, map } from 'lodash';
import logger from '../libs/logger';
import {
  CustomError,
  BadRequest,
  InternalServerError,
} from '../libs/errors';

export default function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let responseErr = err instanceof CustomError ? err : null;

  // Handle errors created with 'http-errors' or similar that have a status/statusCode property
  if (err.statusCode && typeof err.statusCode === 'number') {
    responseErr = new CustomError();
    responseErr.httpCode = err.statusCode;
    responseErr.name = err.name;
    responseErr.message = err.message;
  }

  // Handle errors by express-validator
  if (Array.isArray(err) && err[0].param && err[0].msg) {
    responseErr = new BadRequest('invalidReqParams');
    responseErr.errors = err.map(paramErr => ({
      message: paramErr.msg,
      param: paramErr.param,
      value: paramErr.value,
    }));
  }

  // Handle mongoose validation errors
  if (err.name === 'ValidationError') {
    const model = err.message.split(' ')[0];
    responseErr = new BadRequest(`${model} validation failed`);
    responseErr.errors = map(err.errors, (mongooseErr) => {
      return {
        message: mongooseErr.message,
        path: mongooseErr.path,
        value: mongooseErr.value,
      };
    });
  }

  if (!responseErr || responseErr.httpCode >= 500) {
    responseErr = new InternalServerError();
  }

  // log the error
  logger.error(err, {
    method: req.method,
    originalUrl: req.originalUrl,

    headers: omit(req.headers, ['x-api-key', 'cookie', 'password', 'confirmPassword']),
    body: omit(req.body, ['password', 'confirmPassword']),

    httpCode: responseErr.httpCode,
    isHandledError: responseErr.httpCode < 500,
  });

  const jsonRes = {
    success: false,
    error: responseErr.name,
    message: responseErr.message,
  };

  if (responseErr.errors) {
    jsonRes.errors = responseErr.errors;
  }

  return res.status(responseErr.httpCode).json(jsonRes);
}