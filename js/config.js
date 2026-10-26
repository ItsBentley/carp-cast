/* ==========================================================================
   config.js: settings you may want to change
   ========================================================================== */

// Shown when there is no saved location and location access is blocked
var DEFAULT_LOCATION = {
  name: "Stollies Lake, Theydon Mount",
  lat: 51.6749,
  lon: 0.1527
};

// Keys used to remember the last place in the browser (localStorage)
var STORAGE_KEYS = {
  location: "fwloc",
  mode: "fwmode"   // "gps" = use device location, "manual" = use a typed place
};

// How many days of forecast to fetch
var FORECAST_DAYS = 7;

// Pressure is compared between these two hours of each day (24h clock)
var PRESSURE_START_HOUR = 6;
var PRESSURE_END_HOUR = 21;

// Hours of the day used for wind, cloud and rain averages
var DAYTIME_START_HOUR = 6;
var DAYTIME_END_HOUR = 20;
