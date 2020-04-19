'use strict';

require('dotenv').config();

const cors = require('cors');
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const PORT = process.env.PORT;

// connect to database
const client = new pg.Client(process.env.DATABASE_URL);


const app = express();
app.use(cors());


// client.connect();


// function routes
app.get('/weather', handleWeather);
app.get('/trails', handleTrails);
app.get('/location', handleLocation);


// LOCATION handler
console.log('before location');
function handleLocation( request, response) {
  console.log('Location handler');
  let city = request.query.city;

  const url = 'https://us1.locationiq.com/v1/search.php';
  const queryStringParams = {
    key: process.env.GEOCODE_API_KEY,
    q : city,
    format: 'json',
    limit: 1,
  };

  const searchSQL = ` SELECT * FROM city WHERE city_name = $1`;
  const searchValues = [city];
  client.query(searchSQL, searchValues)
    .then(results => {
      console.log(results);
      if (results.rowCount >= 1) {
        console.log(`${city} came from database request`);
        console.log(results.rows[0]);
        response.json(results.rows[0]);
      } else {
        superagent.get(url)
          .query(queryStringParams)
          .then( data => {
            let locationData = data.body[0];
            console.log(locationData);
            let location = new Location(city,locationData);
            console.log(`${city} came from API`);
            let SQL = `INSERT INTO city (city_name, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING * `;
            let saveVal = [location.search_query, location.formatted_query, location.latitude, location.longitude];
            client.query(SQL, saveVal)
              .then( result => {
                response.json(result);
              });
          });
      }
    })
    .catch(error => {
      let err = {
        status:500,
        responseErr: 'something went wrong',
      };
      response.status(500).json(err);
    });

}

// location constructor
function Location(city, data) {
  this.search_query = city;
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}


// WEATHER

function handleWeather(request, response) {
  const weatherAPI = process.env.DARKSKY_API_KEY;
  console.log('weather handler');
  let latitude = request.query.latitude;
  let longitude = request.query.longitude;
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
  console.log('trails handler');
  const trailAPI = process.env.TRAIL_API_KEY;
  let latitude = request.query.latitude;
  let longitude = request.query.longitude;
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
client.connect((err) => {
  if (err) console.log(`${err} you are broken`);
  else app.listen(PORT, () => console.log(`Server is live on Port ${PORT}`));
});
