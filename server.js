'use strict';


//use exoress library to set up server
const express = require('express');
//add the bodyguard
const cors = require('cors');
// get our secrets from our secret keeper
require('dotenv').config();

const app = express();
// bring in the PORT from the env
const PORT = process.env.PORT || 3001;

app.use(cors());

// get the location
app.get('/location', (request, response) => {
  try {
    // request the data
    const city = request.query.city
    // grab the data
    let geoData = require('./data/location.json');
    // grab geoData[0] to grab the object
    let returnObj = new Location(city, geoData[0]);
    // respond to the request by sending out the data
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

// Make a location consrtuctor to make new locations as data comes in
function Location(searchQuery, obj) {
  this.search_query = searchQuery;
  this.formatted_query = obj.display_name;
  this.latitude = obj.lat;
  this.longitude = obj.lon;
}


app.get('/weather', (request, response) => {
  try {
    let search_query = request.query.search_query;

    let weatherArray = [];
    let weatherData = require('./data/weather.json');

    weatherData.data.forEach((day) => {
      weatherArray.push(new Weather(day));
    })

    response.status(200).send(weatherArray);
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



app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
})
