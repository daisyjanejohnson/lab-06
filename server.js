'use strict';


//use exoress library to set up server
const express = require('express');
//add the bodyguard
const cors = require('cors');
const superagent = require('superagent');
// get our secrets from our secret keeper
require('dotenv').config();

const app = express();
// bring in the PORT from the env
const PORT = process.env.PORT || 3001;

app.use(cors());

// get the location
app.get('/location', (request, response) => {
  try {

    let city = request.query.city

    let url = `https://us1.locationiq.com/v1/search.php?key=${process.env.GEO_DATA_API_KEY}&q=${city}&format=json`;

    superagent.get(url)
      .then(resultsFromSuperAgent => {
        let returnObj = new Location(city, resultsFromSuperAgent.body[0]);

        response.status(200).send(returnObj);
      })
  } catch (err) {
    console.log('ERROR', err);
    response.status(500).send('Sorry, this isn\'t working dawg.');
  }
})

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

    // console.log('the thing the front end is sending on the weather route', search_query);

    let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${search_query}&key=${process.env.WEATHER_API_KEY}&days=8`;

    superagent.get(url)
      .then(resultsFromSuperAgent => {
        // console.log(resultsFromSuperAgent.body);
        const weatherArr = resultsFromSuperAgent.body.data.map(day => {
          return new Weather(day);
        })
        response.status(200).send(weatherArr);

      })


  } catch (err) {
    console.log('ERROR', err);
    response.status(500).send('Sorry we messed up!');
  }
})
function Weather(obj) {
  // console.log(obj);
  this.forecast = obj.weather.description;
  this.time = new Date(obj.datetime).toDateString();
}

app.get('/trails', (request, response) => {
  let {search_query, formatted_query, latitude, longitude} = request.query;
  // let lat = request.query.latitude;
  // let lon = request.query.longitude;
  // console.log(request.query);

  let url = `https://www.hikingproject.com/data/get-trails`;
// ?lat=${lat}&lon=${lon}&key=${process.env.TRAILS_API_KEY}
  superagent.get(url)
    .query({
      lat: latitude,
      lon: longitude,
      maxDistance: 200,
      key: process.env.TRAILS_API_KEY,
    })
    .then(resultsFromTrails => {
      let trailsArr = resultsFromTrails.body.trails;
      const finalArr = trailsArr.map(trailPath => {
        return new Trail(trailPath);
      })
      // let returnObj = new Trail(resultsFromSuperAgent.body.trails[0]);

      response.status(200).send(finalArr);
    }).catch(err => console.log(err));

})


function Trail(obj) {
  this.name = obj.name;
  this.location = obj.location;
  this.length = obj.length;
  this.stars = obj.stars;
  this.star_votes = obj.starVotes;
  this.trail_url = obj.url;
  this.conditions = `${obj.conditionDetails} ${obj.conditionStatus}`;
  this.condition_date = new Date(obj.conditionDate).toDateString();
  this.condition_time = obj.conditionDate.slice(11);
}
//

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
})
