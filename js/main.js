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

var suggestionsTimer;
var suggestionsRequest = 0;
var activeSuggestion = -1;
var placeSuggestions = [];
var selectedPlace = null;

function hideSuggestions() {
  suggestionsRequest++;
  $("search-suggestions").hidden = true;
  $("search-input").setAttribute("aria-expanded", "false");
  $("search-input").removeAttribute("aria-activedescendant");
  activeSuggestion = -1;
}

function showSuggestionMessage(message) {
  var list = $("search-suggestions");
  var item = document.createElement("li");
  item.className = "suggestion-message";
  item.setAttribute("role", "presentation");
  item.textContent = message;
  list.replaceChildren(item);
  list.hidden = false;
  $("search-input").setAttribute("aria-expanded", "true");
  $("search-input").removeAttribute("aria-activedescendant");
  activeSuggestion = -1;
}

function renderSuggestions(places) {
  var list = $("search-suggestions");
  placeSuggestions = places;
  activeSuggestion = -1;
  list.replaceChildren();
  places.forEach(function (place, index) {
    var option = document.createElement("li");
    option.id = "search-suggestion-" + index;
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", "false");
    option.dataset.index = index;
    option.textContent = place.name;
    list.appendChild(option);
  });
  list.hidden = places.length === 0;
  $("search-input").setAttribute("aria-expanded", places.length > 0 ? "true" : "false");
  $("search-input").removeAttribute("aria-activedescendant");
}

function setActiveSuggestion(index) {
  activeSuggestion = index;
  Array.prototype.forEach.call($("search-suggestions").querySelectorAll('[role="option"]'), function (option, i) {
    option.setAttribute("aria-selected", i === index ? "true" : "false");
  });
  if (index >= 0) {
    $("search-input").setAttribute("aria-activedescendant", "search-suggestion-" + index);
  } else {
    $("search-input").removeAttribute("aria-activedescendant");
  }
}

async function updateSuggestions(query) {
  var request = ++suggestionsRequest;
  var normalized = query.trim();
  var compact = normalized.replace(/\s+/g, "");
  selectedPlace = null;

  if (normalized.length < 2 || /^[A-Z]{1,2}\d/i.test(compact)) {
    placeSuggestions = [];
    hideSuggestions();
    return;
  }

  showSuggestionMessage("Searching towns…");
  try {
    var places = await searchPlaces(normalized, 5);
    if (request !== suggestionsRequest || $("search-input").value.trim() !== normalized) return;
    if (places.length) {
      renderSuggestions(places);
    } else {
      placeSuggestions = [];
      showSuggestionMessage("No towns found");
    }
  } catch (error) {
    if (request !== suggestionsRequest) return;
    placeSuggestions = [];
    showSuggestionMessage("Suggestions unavailable. You can still search.");
  }
}

async function submitLocation(query, place) {
  clearTimeout(suggestionsTimer);
  showMessage("Finding " + query + "…");
  hideSuggestions();
  try {
    setLocation(place || await geocode(query));
    $("search-input").value = "";
    selectedPlace = null;
  } catch (error) {
    showMessage(error.message + ". Try a full postcode or a nearby town.");
  }
}

// ---- Search box: postcode or town ----
$("search-form").onsubmit = async function (event) {
  event.preventDefault();
  var query = $("search-input").value.trim();
  if (!query) return;
  submitLocation(query, selectedPlace && selectedPlace.name === query ? selectedPlace : null);
};

$("search-input").oninput = function () {
  clearTimeout(suggestionsTimer);
  placeSuggestions = [];
  selectedPlace = null;
  hideSuggestions();
  var query = this.value;
  suggestionsTimer = setTimeout(function () {
    updateSuggestions(query);
  }, 250);
};

$("search-input").onkeydown = function (event) {
  if (event.key === "ArrowDown" && placeSuggestions.length) {
    event.preventDefault();
    setActiveSuggestion((activeSuggestion + 1) % placeSuggestions.length);
  } else if (event.key === "ArrowUp" && placeSuggestions.length) {
    event.preventDefault();
    setActiveSuggestion((activeSuggestion - 1 + placeSuggestions.length) % placeSuggestions.length);
  } else if (event.key === "Escape") {
    hideSuggestions();
  } else if (event.key === "Enter" && activeSuggestion >= 0) {
    event.preventDefault();
    selectedPlace = placeSuggestions[activeSuggestion];
    this.value = selectedPlace.name;
    suggestionsRequest++;
    hideSuggestions();
  }
};

$("search-suggestions").onclick = function (event) {
  var option = event.target.closest('[role="option"]');
  if (!option) return;
  selectedPlace = placeSuggestions[Number(option.dataset.index)];
  $("search-input").value = selectedPlace.name;
  suggestionsRequest++;
  hideSuggestions();
  $("search-input").focus();
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
