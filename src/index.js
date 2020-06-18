import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import bodyparser from 'body-parser';
import favicon from 'serve-favicon';
import metaRouter from './meta'
import slotRouter from './slot'
import ws from './webhooks'

const app = express()
const staticPath = './public';

app.use(cors());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use('*', (req, res, next) => {
    res.staticPath = staticPath;
    res.setHeader('Access-Control-Expose-Headers', '*');
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});
app.use('/api/webhooks', ws);
app.use('/api/meta', metaRouter);
app.use('/api/slot', slotRouter);

// Static
app.use(favicon('./public/favicon.ico'))
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

// error handler
app.use((error, req, res, next) => {
    console.log('Error status: ', error.status || 500)
    console.log('Message: ', error.message)
    res.status(error.status || 500).json({ message: error.message })
})

app.listen(8888);
console.log('Express started on port 8888');
