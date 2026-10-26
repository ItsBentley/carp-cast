/* ==========================================================================
   main.js: loads the forecast and connects the buttons
   ========================================================================== */

// Fetches, scores and draws the forecast for the current location
async function loadForecast() {
  setPlace(state.location.name);
  showMessage("Loading forecast…");
  try {
    var days = (await fetchForecast(state.location)).map(summariseDay);
    renderForecast(days);
    var time = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    showMessage("Updated " + time + state.gpsNote);
  } catch (e) {
    showMessage("Couldn’t load the forecast: " + e.message + ". Check your connection and try Refresh.");
  }
}

// ---- Search box: postcode or town ----
$("search-form").onsubmit = async function (event) {
  event.preventDefault();
  var query = $("search-input").value.trim();
  if (!query) return;
  showMessage("Finding " + query + "…");
  try {
    setLocation(await geocode(query));
    $("search-input").value = "";
  } catch (err) {
    showMessage(err.message + ". Try a full postcode or a nearby town.");
  }
};

// ---- "Use my location" button ----
$("gps-btn").onclick = function () { useDeviceLocation(false); };

// ---- "Refresh" button: re-checks device location if that is the current mode ----
$("refresh-btn").onclick = function () {
  if (state.mode === "gps") useDeviceLocation(true);
  else loadForecast();
};

// ---- Start-up: restore saved place, then follow the device location if allowed ----
restoreState();
if (state.mode === "gps") useDeviceLocation(true);
else loadForecast();
