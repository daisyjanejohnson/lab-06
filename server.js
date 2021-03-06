'use strict';

// get our secrets from our secret keeper
require('dotenv').config();
//use exoress library to set up server
const express = require('express');
const app = express();
//add the bodyguard
const cors = require('cors');
app.use(cors());
// connect to SQL postgress
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));
//Import supergaent - connects us to get data from APIs
const superagent = require('superagent');
// bring in the PORT from the env
const PORT = process.env.PORT || 3001;



// LOCATION ROUTE
app.get('/location', (request, response) => {
  try {
    // get the requested city
    let city = request.query.city
    // get URL and API key
    let url = `https://us1.locationiq.com/v1/search.php?key=${process.env.GEO_DATA_API_KEY}&q=${city}&format=json`;
    // SQL Query
    let sqlQuery = 'SELECT * FROM locations WHERE search_query LIKE ($1);';
    let safeValue = [city];

    // query the database to see if city is already in there
    client.query(sqlQuery, safeValue)
      // returns the promise of the results it finds.
      .then(sqlResults => {

        if (sqlResults.rowCount > 0) {
          let output = new QueryLocation(sqlResults.rows[0]);
          console.log('I found the city in the database! Sending it to the front end', sqlResults.rows);
          // if city is in database return it the one location object it asks for.
          response.status(200).send(output);
        } else {
          console.log('I did not find the location in the database, going to location IQ to get location information');
          // if not there grab it from API
          superagent.get(url)
            .then(resultsFromSuperAgent => {
              // make a variable for the response we get from the constructore function.
              let returnObj = new Location(city, resultsFromSuperAgent.body[0]);

              // A SQL to put the new location into the database.
              let sqlQuery = 'INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);';

              // Safe Values
              let safeValue = [
                returnObj.search_query,
                returnObj.formatted_query,
                returnObj.latitude,
                returnObj.longitude];

              // put location into database
              client.query(sqlQuery, safeValue)
                .then(() => {}).catch()

              response.status(200).send(returnObj);
            }).catch(err => console.log(err));
        }
      })
      // .catch();

  } catch (err) {
    errorHandler(response, err);
  }
});



// WEATHER ROUTE
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

      }).catch(err => console.log(err));


  } catch (err) {
    errorHandler(response, err);
  }
})

// TRAILS ROUTE
app.get('/trails', (request, response) => {

  let url = 'https://www.hikingproject.com/data/get-trails';

  superagent.get(url)
    .query({
      lat: request.query.latitude,
      lon: request.query.longitude,
      maxDistance: 10,
      key: process.env.TRAILS_API_KEY
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


// RESTURANT ROUTE
app.get('/yelp', (request, response) => {
  try {
    let url = 'https://api.yelp.com/v3/businesses/search';

    // pagination
    const page = request.query.page;
    const numPerPage = 5;
    const start = (page - 1) * numPerPage;
    // define Query
    const queryParams = {
      latitude: request.query.latitude,
      longitude: request.query.longitude,
      limit: numPerPage,
      offset: start
    }

    superagent.get(url)
      .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
      .query(queryParams)
      .then(data => {
        const finalYelp = data.body.businesses.map(value => {
          console.log('this is my yelp');
          return new Yelp(value);
        })
        response.status(200).send(finalYelp);

      }).catch(err => console.log(err));
  } catch (err) {
    errorHandler(response, err);
  }

});

//MOVIE ROUTE
app.get('/movies', (request, response) => {
  try {
    let city = request.query.search_query;
    // api url
    let url = 'https://api.themoviedb.org/3/search/movie';

    // define query params
    const queryParams = {
      api_key: process.env.MOVIE_API_KEY,
      query: city,
      limit: 20
    }

    // Grab movies from database
    superagent.get(url)
    // use wuery params
      .query(queryParams)
      .then(data => {
        console.log('data from superagent', data.body);
        // map data into array
        let moviesArr = data.body.results.map(value => new Movie(value));
        // put array on front end
        response.status(200).send(moviesArr);
      }).catch(err => console.log(err));
  } catch (err) {
    errorHandler(response, err);
  }
})


// LOCATION CONSTRUCTOR
function Location(searchQuery, obj) {
  this.search_query = searchQuery;
  this.formatted_query = obj.display_name;
  this.latitude = obj.lat;
  this.longitude = obj.lon;
}

// QUERY LOCATION CONSTRUCTOR
function QueryLocation(obj){
  this.search_query = obj.search_query;
  this.formatted_query = obj.formatted_query;
  this.latitude = obj.latitude;
  this.longitude = obj.longitude;
}

// WEATHER CONSTRUCTOR
function Weather(obj) {
  // console.log(obj);
  this.forecast = obj.weather.description;
  this.time = new Date(obj.datetime).toDateString();
}

// TRAIL CONSTRUCTOR
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

// RESTURANT CONSTRUCTOR
function Yelp(obj) {
  this.name = obj.name;
  this.image_url = obj.image_url;
  this.price = obj.price;
  this.rating = obj.rating;
  this.url = obj.url;
}

// MOVIE CONSTRUCTOR
function Movie(obj) {
  this.title = obj.original_title;
  this.overview = obj.overview;
  this.average_votes = obj.vote_average;
  this.total_votes = obj.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500/${obj.poster_path}`;
  this.popularity = obj.popularity;
  this.realeased_on = obj.release_date;
}
// Error
const errorHandler = (response, err) => {
  console.log('ERROR', err);
  response.status(500).send('Something went wrong.');
}

app.get('*', (request, response) => {
  response.status(404).send('route not found');
});


client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}`);
    })
  })

