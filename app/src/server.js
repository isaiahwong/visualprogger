/* eslint import/first: 0 */ 
import express from 'express';
import http from 'http';
import helmet from 'helmet';
import logger from './libs/logger';
import setupSocket from './libs/setupSocket';

const server = http.createServer();
const app = express();

app.set('port', process.env.PORT);

app.use(helmet());

const IS_PROD = process.env.NODE_ENV === 'production';

import attachMiddlewares from './middlewares';

// loads database config
import './libs/setupMongoose';

attachMiddlewares(app, server);

server.on('request', app);
server.listen(app.get('port'), () => {
  logger.info(`Node Server listening on port ${app.get('port')}`);
  logger.verbose(`Running Production: ${IS_PROD}`);
});

setupSocket(server);

export default server;