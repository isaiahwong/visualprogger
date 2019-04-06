import express from 'express';
import path from 'path';
import helmet from 'helmet';

import { iterate } from '../libs/routes';

const API_PATH = path.join(__dirname, '../controllers/');

const app = express();

app.use(helmet());
app.use(helmet.hidePoweredBy({ setTo: '' })); 

const v1Router = express.Router(); 

// Run through api routes
iterate(v1Router, API_PATH);

app.use(v1Router);

export default app;