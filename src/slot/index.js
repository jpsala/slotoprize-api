import express from 'express';
const apiv2 = express.Router();


apiv2.get('/', (req, res) => {
  res.send('Hello from APIv2 root route.');
});

apiv2.get('/users', (req, res) => {
  res.send('List of APIv1 users.');
});

export default apiv2
