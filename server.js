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

app.get('/location', handleLocation);
app.get('/weather', handleWeather);




function handleLocation( request, response) {
  let city = request.query.city;
  let fixedData = require('./data/geo.json');
  let location = new Location(city,fixedData[0]);
  //   console.log(location);
  response.json(location);
}

function Location(city, data) {
  this.search_query = city;
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}


function handleWeather( request, response) {
  let weatherList = [];
  let weatherData = require('./data/darksky.json');
  weatherData.daily.data.forEach(w => {
    let weather = new Weather(w);
    weatherList.push(weather);
    console.log(w);
  });
  response.json(weatherList);
}

function Weather(data) {
  this.forecast = data.summary;
  this.time = data.time;
}

function errorFunc(error, request, response) {
  response.status(500).send(error);
}
app.use(errorFunc);

app.listen(PORT, () => console.log('server up on', PORT));
