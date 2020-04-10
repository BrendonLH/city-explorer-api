'use strict';

require('dotenv').config();

const cors = require('cors');
const express = require('express');

const PORT = process.env.PORT;

const app = express();

app.use(cors());
console.log(process.env.PORT);

app.get( '/test', (request, response) => {
  const name = request.query.name;
  response.send(`this is ${name}`);
});

app.listen(PORT, () => console.log('server up on', PORT));
