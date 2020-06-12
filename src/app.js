import express from 'express';
import bodyparser from 'body-parser';
import cors from 'cors';

import usuarios from './api/usuarios';
import subscription from './api/subscription';
import push from './api/push';

const app = express();

app.use(cors());
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//   next();
// });
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: false }));

app.use('/usuarios', usuarios);
app.use('/subscription', subscription);
app.use('/push', push);

// if we are here then the specified request is not found
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// all other requests are not implemented.
app.use((err, req, res, next) => {
  res.status(err.status || 501);
  res.json({
    error: {
      code: err.status || 501,
      message: err.message,
    },
  });
});


app.listen(3000);

// module.exports = app;
