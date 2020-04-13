'use strict';

require('dotenv').config();

const cors = require('cors');
const express = require('express');
const superagent = require('superagent');
const PORT = process.env.PORT;

const app = express();

app.use(cors());
// console.log(process.env.PORT);

app.get( '/test', (request, response) => {
  const name = request.query.name;
  response.send(`this is ${name}`);
});

app.get('/location', handleLocation);
app.get('/weather', handleWeather);


// LOCATION

function handleLocation( request, response) {
  let city = request.query.city;
  // let fixedData = require('./data/geo.json');

  const url = 'https://us1.locationiq.com/v1/search.php';
  const queryStringParams = {
    key: process.env.GEOCODE_API_KEY,
    q : city,
    format: 'json',
    limit: 1,
  };

  console.log(url);
  console.log(queryStringParams);
  superagent.get(url)
    .query(queryStringParams)
    .then( data => {
      let locationData = data.body[0];
      let location = new Location(city,locationData);
      response.json(location);
    });
}

function Location(city, data) {
  this.searchQuery = city;
  this.formattedQuery = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}


// WEATHER

function handleWeather(request, response) {
  const weatherAPI = process.env.DARKSKY_API_KEY;
  let {latitude,} = request.query;
  let {longitude,} = request.query;
  let urlLocation = `https://api.darksky.net/forecast/${weatherAPI}/${latitude},${longitude}`;

  superagent.get(urlLocation)
    .then(result => {
      let data = result.body.daily.data;
      let dailyWeather = data.map(value => {
        return new Weather(value);
      });
      response.status(200).send(dailyWeather);
    });
}

function Weather(data) {
  this.forecast = data.summary;
  this.time = data.time;
}

// function errorFunc(error, request, response) {
//   response.status(500).send(error);
// }
// app.use(errorFunc);

app.listen(PORT, () => console.log('server up on', PORT));
