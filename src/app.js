import express from 'express';
import userRoute from './routes/user.js';
import loginRoute from './routes/login.js';
import mongoUtil from './utils/mongo.js'
import bodyParser from 'body-parser';

const app = express();
const httpListenPort = 8080;

// Setup body parser so we can interrogate the request body for POST/PUT
app.use(bodyParser.json({
  limit: '32mb',
  extended: false
}));
app.use(bodyParser.urlencoded({
  limit: '32mb',
  extended: false
}));

// Setup the various routes for "user" and "login". Include "v1" in the route
// to handle future versioning.
app.use('/api/v1/', userRoute);
app.use('/api/v1/', loginRoute);

// Squash the favicon.ico errors when querying from a browser
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Setup a custom error handler
app.use(async function (err, req, res, next) {
  const error = {
      message: err.message,
      detail: err.detail || {},
      code: err.code || 500,
      method: req.method,
      url: req.url
  };
  
  res.status(error.code).json(error);
  next();
});

// Setup connection to Mongo
await mongoUtil.getConnection();

// Setup listening port on 127.0.0.1:8080 for now
app.listen(httpListenPort, function () {
  console.log('User App listening on port ', httpListenPort);
});

export default app;
