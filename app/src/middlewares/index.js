import express from 'express';
import bodyParser from 'body-parser';
import favicon from 'serve-favicon';
import expressHandlebars from 'express-handlebars';
import path from 'path';

import morgan from './morgan';
import notFound from './notFound';
import errorHandler from './errorHandler';

import routes from './routes';

export default function attachMiddleWares(app, server) {

  // Logs every request
  app.use(morgan);


  // view engine setup
  app.engine('.hbs', expressHandlebars({ 
    defaultLayout: 'layout', 
    extname: '.hbs'
  }))
  // app.use(favicon(path.join('./favicon.ico')));
  app.set('view engine', 'hbs');  
  
  app.use(express.static(path.join(__dirname, '..', '..', 'public')));

  // get information from html forms
  app.use(bodyParser.urlencoded({
    extended: false
  }));
  app.use(bodyParser.json());
  
  // Api Routes
  app.use(routes); 
  
  app.use(notFound);
  app.use(errorHandler);
}