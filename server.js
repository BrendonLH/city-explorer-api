'use strict';

require('dotenv').config();

const cors = require('cors');
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const PORT = process.env.PORT;

// connect to database
const client = new pg.Client(process.env.DATABASE_URL);


// empty cache for location
let locationCache = {};

const app = express();

app.use(cors());
// console.log(process.env.PORT);




// call the handler functions
app.get('/weather', handleWeather);
app.get('/trails', handleTrails);
app.get('/location', handleLocation);


// LOCATION


function handleLocation( request, response) {
  console.log(request.query);
  let city = request.query.city;
  console.log('CurrentCache');
  console.log('location');
  console.log(locationCache);
  console.log('------------');
  if( locationCache[city]) {
    console.log(city, 'came from already stored memory');
    response.json(locationCache[city]);
    return;
  }

  const url = 'https://us1.locationiq.com/v1/search.php';
  const queryStringParams = {
    key: process.env.GEOCODE_API_KEY,
    q : city,
    format: 'json',
    limit: 1,
  };

  console.log(url, 'this is before superagent');
  console.log(queryStringParams);
  superagent.get(url)
    .query(queryStringParams)
    .then( data => {
      console.log('this is inside superagent');
      let locationData = data.body[0];
      let location = new Location(city,locationData);
      let SQL = 'INSERT INTO city (city_name, lattitude, longitude) VALUES ($1, $2, $3);';
      let safeVal = [location.searchQuery, location.latitude, location.longitude];
      client.query(SQL, safeVal);
      locationCache[city] = location;
      response.json(location);
    });
}

// location constructor
function Location(city, data) {
  this.searchQuery = city;
  this.formattedQuery = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}


// WEATHER

function handleWeather(request, response) {
  const weatherAPI = process.env.DARKSKY_API_KEY;
  console.log('weather');
  let {latitude,} = request.query;
  let {longitude,} = request.query;
  let weatherURL = `https://api.darksky.net/forecast/${weatherAPI}/${latitude},${longitude}`;

  superagent.get(weatherURL)
    .then(result => {
      let data = result.body.daily.data;
      let dailyWeather = data.map(value => {
        return new Weather(value);
      });
      response.status(200).send(dailyWeather);
    });
}

// weather constructor
function Weather(data) {
  this.forecast = data.summary;
  this.time = data.time;
}

// TRAILS
function handleTrails(request, response) {
  console.log('trails');
  const trailAPI = process.env.TRAIL_API_KEY;
  let {latitude,} = request.query;
  let {longitude,} = request.query;
  let trailsURL = `https://www.hikingproject.com/data/get-trails?lat=${latitude}&lon=${longitude}&maxDistance=10&key=${trailAPI}`;
  superagent.get(trailsURL)
    .then(result => {
      let parsedTrails = JSON.parse(result.text);
      let trailList = parsedTrails.trails.map(value => {
        return new Trails(value);
      });
      response.status(200).send(trailList);
    });
}

// trails constructor
function Trails(trail) {
  this.name = trail.name;
  this.location = trail.location;
  this.length = trail.length;
  this.stars = trail.stars;
  this.star_votes = trail.starVotes;
  this.summary = trail.summary;
  this.trail_url = trail.url;
  this.conditions = trail.conditionDetails;
  this.condition_date = trail.conditionDate.slice(0,10);
  this.condition_time = trail.conditionDate.slice(11,18);
}

// function errorFunc(error, request, response) {
//   response.status(500).send(error);
// }
// app.use(errorFunc);

// client.on('error', err => console.error(err));
// client.connect()
//   .then(
//     .catch(err => console.error(err));

app.listen(PORT, () => console.log('server up on', PORT));
