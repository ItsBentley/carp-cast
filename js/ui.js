/* ==========================================================================
   ui.js: everything that draws on the page
   ========================================================================== */

// Shows the place name above the forecast
function setPlace(name) {
  $("place").textContent = name;
}

// Shows a status message (loading, errors, last updated)
function showMessage(text) {
  $("msg").textContent = text;
}

// Score colours match the verdict bands
function scoreColour(score) {
  return score >= 75 ? "var(--score-great)" :
    score >= 50 ? "var(--score-good)" :
    score >= 25 ? "var(--score-fair)" : "var(--score-slow)";
}

function weatherIcon(sky) {
  if (sky === "Clear") return "☀";
  if (sky === "Rain" || sky === "Wet") return "🌧";
  if (sky === "Partly cloudy") return "⛅";
  return "☁";
}

// Draws the "best day" card and one card per day
function renderForecast(days) {
  var best = days.reduce(function (a, b) { return b.score > a.score ? b : a; });

  // Best day summary
  $("best").hidden = false;
  $("best").innerHTML =
    '<div>Best day this week</div>' +
    '<div class="big">' + best.label + '</div>' +
    '<p>' + verdict(best.score) + ' (' + best.score + '/100) · pressure ' + best.trend +
    ' at ' + best.p1 + ' mb, ' + best.sky.toLowerCase() + ', ' + best.hi + '°C</p>';

  // Daily cards
  $("list").innerHTML = days.map(function (d) {
    var colour = scoreColour(d.score);
    var rainfall = d.rain >= 0.2
      ? '<div class="rainfall">Rainfall <strong>' + d.rain.toFixed(1) + ' mm</strong></div>'
      : "";
    var fishingTime = d.fishingWindow
      ? d.fishingWindow.name + " · " + d.fishingWindow.start + "–" + d.fishingWindow.end
      : "No suitable forecast window available";
    var bank = d.bankDirection
      ? d.bankDirection + " side, if accessible"
      : "No clear wind-based side";

    return '<article class="row' + (d === best ? ' top' : '') + '">' +
      '<div class="forecast-header">' +
        '<div class="forecast-main">' +
          '<div class="day">' + d.label + '</div>' +
          '<div class="forecast-condition"><span aria-hidden="true">' + weatherIcon(d.sky) +
            '</span> ' + d.sky + '</div>' +
          '<div class="temperature">High ' + d.hi + '° <span>·</span> Low ' + d.lo + '°C</div>' +
          rainfall +
        '</div>' +
        '<div class="sc" style="color:' + colour + '">' +
          d.score + '<small>' + verdict(d.score) + '</small>' +
        '</div>' +
      '</div>' +
      '<div class="weather-metrics">' +
        '<div class="metric"><span>Wind</span><strong>~' + d.wind + ' mph</strong><small>' +
          d.windDirection + '</small></div>' +
        '<div class="metric"><span>Pressure</span><strong>' + d.p1 + ' mb</strong><small>' +
          d.trend + '</small></div>' +
        '<div class="metric"><span>Moon phase</span><strong>' + d.moon + '</strong></div>' +
      '</div>' +
      '<div class="sun-times"><span>Sunrise <strong>' + d.sunrise.slice(11, 16) +
        '</strong></span><span>Sunset <strong>' + d.sunset.slice(11, 16) + '</strong></span></div>' +
      '<div class="fishing-advice">' +
        '<div><span>Best time</span><strong>' + fishingTime + '</strong></div>' +
        '<div><span>Bank to try</span><strong>' + bank + '</strong></div>' +
      '</div>' +
      '<div class="bar"><i style="width:' + d.score + '%;background:' + colour + '"></i></div>' +
      '</article>';
  }).join("");
}
