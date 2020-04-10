'use strict';

require('dotenv').config();
const express = require('express');

const app = express();
app.listen(process.env.PORT() => console.log('server up on' PORT.));

console.log(process.env.PORT);
