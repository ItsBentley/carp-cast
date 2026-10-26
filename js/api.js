/* ==========================================================================
   api.js: everything that talks to outside weather and location services
   - postcodes.io: UK postcode lookups
   - Open-Meteo: town search and the weather forecast
   ========================================================================== */

// Turns a postcode or town name into {name, lat, lon}. Throws if not found.
async function geocode(query) {
  var compact = query.toUpperCase().replace(/\s+/g, "");

  // Full postcode, e.g. CM16 4AB
  if (/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(compact)) {
    var pc = await (await fetch("https://api.postcodes.io/postcodes/" + compact)).json();
    if (pc.status !== 200) throw new Error("Postcode not found");
    return {
      name: query.toUpperCase() + " (" + (pc.result.admin_ward || pc.result.admin_district) + ")",
      lat: pc.result.latitude,
      lon: pc.result.longitude
    };
  }

  // Postcode area only, e.g. CM16
  if (/^[A-Z]{1,2}\d[A-Z\d]?$/.test(compact)) {
    var oc = await (await fetch("https://api.postcodes.io/outcodes/" + compact)).json();
    if (oc.status !== 200) throw new Error("Postcode area not found");
    return { name: compact + " area", lat: oc.result.latitude, lon: oc.result.longitude };
  }

  // Anything else is treated as a town or place name
  var url = "https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(query) +
            "&count=1&language=en&countryCode=GB";
  var place = await (await fetch(url)).json();
  if (!place.results) throw new Error("Place not found");
  var p = place.results[0];
  return {
    name: p.name + (p.admin1 ? ", " + p.admin1 : ""),
    lat: p.latitude,
    lon: p.longitude
  };
}

// Finds a friendly name ("Near Theydon Bois") for GPS coordinates
async function nameForCoordinates(lat, lon) {
  try {
    var url = "https://api.postcodes.io/postcodes?lon=" + lon + "&lat=" + lat + "&limit=1";
    var data = await (await fetch(url)).json();
    if (data.result && data.result[0]) {
      return "Near " + (data.result[0].admin_ward || data.result[0].admin_district);
    }
  } catch (e) { /* fall through to the generic name */ }
  return "My location";
}

// Downloads the hourly forecast and returns it grouped by day:
// [{ date: "2026-10-26", hours: [{hr, t, p, w, c, r}, ...] }, ...]
// t = temp (C), p = pressure (mb), w = wind (mph), c = cloud (%), r = rain (mm)
async function fetchForecast(location) {
  var url = "https://api.open-meteo.com/v1/forecast" +
    "?latitude=" + location.lat + "&longitude=" + location.lon +
    "&hourly=temperature_2m,pressure_msl,wind_speed_10m,cloud_cover,precipitation" +
    "&wind_speed_unit=mph&timezone=Europe%2FLondon&forecast_days=" + FORECAST_DAYS;

  var res = await fetch(url);
  if (!res.ok) throw new Error("Weather service error");
  var h = (await res.json()).hourly;

  var byDate = {};
  h.time.forEach(function (time, i) {
    var date = time.slice(0, 10);
    (byDate[date] = byDate[date] || []).push({
      hr: +time.slice(11, 13),
      t: h.temperature_2m[i],
      p: h.pressure_msl[i],
      w: h.wind_speed_10m[i],
      c: h.cloud_cover[i],
      r: h.precipitation[i]
    });
  });

  return Object.keys(byDate).map(function (date) {
    return { date: date, hours: byDate[date] };
  });
}
