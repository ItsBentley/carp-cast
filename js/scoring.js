/* ==========================================================================
   scoring.js: turns a day of weather into a 0-100 fishing score
   Weighting: pressure trend 40, then wind 20, sky 20, temperature 15 and
   moon 15 (those four are scaled down to fit the remaining 60).
   ========================================================================== */

// ---- Moon phase (calculated from the date, no data feed needed) ----
function moonInfo(dateString) {
  var synodic = 29.530588853;                 // days in a lunar cycle
  var knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
  var time = new Date(dateString + "T12:00:00Z").getTime();
  var age = (((time - knownNewMoon) / 86400000) % synodic + synodic) % synodic;

  // Days away from the nearest new or full moon
  var distance = Math.min(age, Math.abs(age - synodic / 2), synodic - age);

  var names = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous",
               "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];
  return {
    name: names[Math.round(age / synodic * 8) % 8],
    points: 3 + 12 * Math.max(0, 1 - distance / 7.4)   // best near new/full moon
  };
}

// ---- Wind (mph): light breeze scores best, calm and gales score worst ----
function windPoints(mph) {
  return mph <= 2 ? 12 : mph <= 10 ? 20 : mph <= 15 ? 13 : mph <= 20 ? 7 : 2;
}

// ---- Temperature (C): mild is best ----
function tempPoints(celsius) {
  if (celsius >= 10 && celsius <= 24) return 15;
  if ((celsius >= 4 && celsius < 10) || (celsius > 24 && celsius <= 29)) return 10;
  return 4;
}

// ---- Pressure: rate of change (mb per hour) matters most ----
// Slowly falling is best, steady is good, fast rises and crashes are poor.
// A penalty applies when pressure is very high (1025+) or very low (1000-).
function pressurePoints(ratePerHour, averageMb) {
  var points =
    ratePerHour <= -1   ? 10 :   // falling fast
    ratePerHour <= -0.5 ? 22 :   // falling quickly
    ratePerHour <= -0.1 ? 40 :   // falling slowly (best)
    ratePerHour < 0.15  ? 30 :   // steady
    ratePerHour < 0.5   ? 20 :   // rising slowly
                           6;    // rising fast
  if (averageMb >= 1025 || averageMb <= 1000) points -= 8;
  return Math.max(points, 0);
}

// ---- Sky: returns [label, points] from rain (mm) and cloud cover (%) ----
function skyInfo(rainMm, cloudPercent) {
  if (rainMm >= 6) return ["Wet", 6];
  if (rainMm >= 1.5) return ["Rain", 14];
  if (cloudPercent < 25) return ["Clear", 12];
  if (cloudPercent < 60) return ["Partly cloudy", 17];
  return ["Cloudy", 20];
}

// ---- Labels ----
function trendWord(ratePerHour) {
  if (ratePerHour <= -1) return "falling fast";
  if (ratePerHour <= -0.1) return "falling";
  if (ratePerHour < 0.15) return "steady";
  if (ratePerHour < 0.5) return "rising slowly";
  return "rising fast";
}

function verdict(score) {
  return score >= 75 ? "Great" : score >= 55 ? "Good" : score >= 35 ? "Fair" : "Slow";
}

// ---- Summarise one day of hourly data into a scored day ----
function summariseDay(day) {
  var hours = day.hours;
  var daytime = hours.filter(function (h) {
    return h.hr >= DAYTIME_START_HOUR && h.hr <= DAYTIME_END_HOUR;
  });

  // Pressure at the start and end of the day (falls back to first/last hour)
  var first = hours.filter(function (h) { return h.hr === PRESSURE_START_HOUR; })[0] || hours[0];
  var last = hours.filter(function (h) { return h.hr === PRESSURE_END_HOUR; })[0] || hours[hours.length - 1];
  var rate = (last.p - first.p) / Math.max(1, last.hr - first.hr);
  var p0 = Math.round(first.p);
  var p1 = Math.round(last.p);

  // Daytime averages
  var wind = Math.round(mean(daytime.map(function (h) { return h.w; })));
  var cloud = mean(daytime.map(function (h) { return h.c; }));
  var rain = daytime.reduce(function (sum, h) { return sum + h.r; }, 0);

  // Temperature range over the whole day
  var temps = hours.map(function (h) { return h.t; });
  var hi = Math.round(Math.max.apply(null, temps));
  var lo = Math.round(Math.min.apply(null, temps));

  var sky = skyInfo(rain, cloud);
  var moon = moonInfo(day.date);

  // Everything except pressure is scaled from 70 down to 60, pressure adds up to 40
  var base = windPoints(wind) + sky[1] + tempPoints((hi + lo) / 2) + moon.points;
  var score = Math.round(base * 60 / 70 + pressurePoints(rate, (p0 + p1) / 2));

  return {
    label: new Date(day.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric" }),
    hi: hi, lo: lo, wind: wind, rain: rain,
    sky: sky[0], moon: moon.name,
    p0: p0, p1: p1, trend: trendWord(rate),
    score: score
  };
}
