/* ==========================================================================
   location.js: which place we are showing, and how it is chosen
   ========================================================================== */

// Current state of the app
var state = {
  location: DEFAULT_LOCATION,
  mode: "gps",     // "gps" = follow the device location, "manual" = typed place
  gpsNote: ""      // small note added to the status message (e.g. location blocked)
};

// Loads the last saved place and mode from the browser
function restoreState() {
  try {
    var saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.location) || "null");
    if (saved && typeof saved.name === "string" &&
        Number.isFinite(saved.lat) && Number.isFinite(saved.lon)) {
      state.location = saved;
    }
    var mode = localStorage.getItem(STORAGE_KEYS.mode);
    if (mode === "gps" || mode === "manual") state.mode = mode;
  } catch (e) { /* storage unavailable: keep defaults */ }
}

// Switches to a new place, remembers it, and reloads the forecast
function setLocation(location, mode) {
  state.location = location;
  state.mode = mode || "manual";
  state.gpsNote = "";
  try {
    localStorage.setItem(STORAGE_KEYS.location, JSON.stringify(location));
    localStorage.setItem(STORAGE_KEYS.mode, state.mode);
  } catch (e) { /* storage unavailable: carry on without saving */ }
  loadForecast();
}

// Asks the device for its location.
// auto = true when run on page open or Refresh (falls back quietly if blocked)
function useDeviceLocation(auto) {
  if (!navigator.geolocation) {
    state.gpsNote = " · location not available here";
    if (auto) loadForecast();
    else showMessage("Location isn’t available on this device.");
    return;
  }

  showMessage("Getting your location…");
  navigator.geolocation.getCurrentPosition(
    // Success: name the spot and show its forecast
    async function (pos) {
      var name = await nameForCoordinates(pos.coords.latitude, pos.coords.longitude);
      setLocation({ name: name, lat: pos.coords.latitude, lon: pos.coords.longitude }, "gps");
    },
    // Blocked or failed
    function () {
      if (auto) {
        state.gpsNote = " · location blocked, showing " + state.location.name;
        loadForecast();
      } else {
        showMessage("Couldn’t get your location. Check location permission, or type a postcode.");
      }
    },
    { timeout: 10000, maximumAge: 600000 }
  );
}
