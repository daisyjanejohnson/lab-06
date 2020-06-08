'use strict';


//use exoress library to set up server
const express = require('express');
const app = express();


// get our secrets from our secret keeper
require('dotenv').config();

//add the bodyguard
const cors = require('cors');
app.use(cors());

// bring in the PORT from the env
const PORT = process.env.PORT || 3001;


// get the location
app.get('/location', (request, response) => {
  try {
    console.log(request.query.city);
    let search_query = request.query.city
    let geoData = require('./data/location.json');

    let returnObj = new Location(search_query, geoData[0]);

    console.log(returnObj);
    response.status(200).send(returnObj);
  } catch (err) {
    console.log('ERROR', err);
    response.status(500).send('Sorry, this isn\'t working dawg.');
  }
})

// app.get('/', (request, response) => {
//   console.log('hello out there');
//   response.status(200).send('I like pizza');
// });


function Location(searchQuery, obj) {
  this.search_query = searchQuery;
  this.formatted_query = obj.display_name;
  this.latitude = obj.lat;
  this.longitude = obj.lon;
}


app.get('/weather', (request, response) => {
  try {
    const weatherInfo = getTheWeather(request.query.data);
    response.status(200).send(weatherInfo)
  } catch (err) {
    console.log('ERROR', err);
    response.status(500).send('Sorry we messed up!');
  }
})


function Weather(obj) {
  this.forecast = obj.weather.description;
  this.time = obj.valid_date;
}

// your gonna have an empty array for weather. forEach over that data and push new instance into array.

function getTheWeather() {
  const weatherData = require('./data/weather.json');
  const weatherArray = [];
  weatherData.data.forEach((day) => {
    weatherArray.push(new Weather(day));
  })
  return weatherArray;
}


app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
})
