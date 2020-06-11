DROP TABLE IF EXISTS locations;

CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  formatted_query VARCHAR(255),
  latitude DECIMAL,
  longitude DECIMAL
);

INSERT INTO locations (
  search_query,
  formatted_query,
  latitude,
  longitude
)

VALUES (
  'seattle',
  'Seattle, King County, Washington, USA',
  '47.6038321',
  '-122.3300624'
);

SELECT * FROM locations;

