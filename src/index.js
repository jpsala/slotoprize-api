import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import bodyparser from 'body-parser';
import favicon from 'serve-favicon';
import meta from './meta'

const app = express()
const staticPath = './public';

app.use(cors());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(favicon('./public/favicon.ico'))
app.use('*', (req, res, next) => {
  res.staticPath = staticPath;
  res.setHeader('Access-Control-Expose-Headers', '*');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.use('/api/meta', meta);

// Static
console.log('staticPath', staticPath);
const staticFileMiddleware = express.static(staticPath);
app.use(staticFileMiddleware);

// not found
app.use((req, res, next) => {
  const err = new Error(`The requested page "${req.url}" was not Found`);
  err.status = 404;
  err.stack = '';
  next(err);
});

// all other requests are not implemented.
app.use((err, req, res) => {
  res.status(err.status || 501);
  res.json({
    error: {
      code: err.status || 501,
      message: err.message,
    },
  });
});

/* istanbul ignore next */
if (!module.parent) {
  app.listen(8888);
  console.log('Express started on port 8888');
}
