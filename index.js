import express from "express"; // Import Express for routing
import axios from "axios"; // Axios is used to make HTTP requests
import bodyParser from "body-parser"; // Middleware to parse form data

// Base URLs for Open-Meteo APIs
const GEO_API_URL = "https://geocoding-api.open-meteo.com/v1/search?name=";
const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast?";

const app = express(); // Create the Express app
const port = 3000; // Define the server port

// Set up middleware
app.use(express.static("public")); // Serve static files (like CSS)
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded form data
app.set("view engine", "ejs"); // Use EJS as the templating engine

// GET route to show the homepage
app.get("/", (req, res) => {
  res.render("index.ejs"); // Render the form initially
});

// 1- Get the city from the form
// 2- Use the Open-Meteo Geocoding API to get the coordinates of the city
// 3- Use the Open-Meteo Weather API to get the weather of the city

// POST route to handle form submission
app.post("/", async (req, res) => {
  const city = req.body.city; // Get the city from the form

  try {
    // Step 1: Get city coordinates using the Geocoding API
    const geoResponse = await axios.get(GEO_API_URL + city);
    // Results have an array of locations. Get the first location from the results array
    const location = geoResponse.data.results[0];
    console.log(location);

    // If the location is not found, return an error
    if (!location) {
      return res.render("index.ejs", {
        weather: null,
        error: "City not found.",
      });
    }

    const { latitude, longitude, name } = location; // get the latitude, longitude and name from the location object
    console.log(latitude, longitude, name);

    // Step 2: Get current weather using the coordinates
    const weatherResponse = await axios.get(WEATHER_API_URL, {
      params: {
        latitude: latitude,
        longitude: longitude,
        current_weather: true,
        timezone: "auto",
      },
    });
    const weatherData = weatherResponse.data.current_weather;
    console.log(weatherData);

    const temperature = weatherData.temperature;
    const weatherCode = weatherData.weathercode;
    console.log(temperature, weatherCode);

    // Step 3: Map weather codes to descriptions
    // Translate weather code
    const weatherDescriptions = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Depositing rime fog",
      51: "Drizzle: Light",
      53: "Drizzle: Moderate",
      55: "Drizzle: Dense",
      56: "Freezing Drizzle: Light",
      57: "Freezing Drizzle: Dense",
      61: "Rain: Slight",
      63: "Rain: Moderate",
      65: "Rain: Heavy",
      66: "Freezing Rain: Light",
      67: "Freezing Rain: Heavy",
      71: "Snowfall: Slight",
      73: "Snowfall: Moderate",
      75: "Snowfall: Heavy",
      77: "Snow grains",
      80: "Rain showers: Slight",
      81: "Rain showers: Moderate",
      82: "Rain showers: Violent",
      85: "Snow showers: Slight",
    };

    // Step 4: Prepare data for rendering
    const weather = {
      city: name,
      temp: temperature,
      description: weatherDescriptions[weatherCode] || "Unknown",
    };

    res.render("index.ejs", { weather, error: null }); // Render with weather
  } catch (error) {
    console.error(error.message);
    res.render("index.ejs", {
      weather: null,
      error: "Failed to get weather data.",
    });
    res.status(500);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
