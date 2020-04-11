'use strict';

require('dotenv').config();

const cors = require('cors');
const express = require('express');

const PORT = process.env.PORT;

const app = express();

app.use(cors());
// console.log(process.env.PORT);

app.get( '/test', (request, response) => {
  const name = request.query.name;
  response.send(`this is ${name}`);
});

function handleLocation( request, response) {
  let city = request.query.city;
  let fixedData = require('./data/geo.json');
  let location = new Location(city,fixedData[0]);
  console.log(location);
  response.json(location);
}

function Location(city, data) {
  this.search_query = city;
  this.formattedQuery = data.display_name;
  this.lattitude = data.lat;
  this.longitude = data.lon;
}



app.listen(PORT, () => console.log('server up on', PORT));
