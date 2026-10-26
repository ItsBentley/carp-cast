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

// Score colour: green = good, amber = fair, red = poor
function scoreColour(score) {
  return score >= 55 ? "var(--ok)" : score >= 35 ? "var(--mid)" : "var(--acc)";
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
    var rainText = d.rain >= 0.2 ? "Rain " + d.rain.toFixed(1) + " mm" : "Dry";
    return '<div class="row' + (d === best ? ' top' : '') + '">' +
      '<div class="day">' + d.label + '</div>' +
      '<div class="sc" style="color:' + colour + '">' + d.score + '<small>' + verdict(d.score) + '</small></div>' +
      '<div class="cond">Pressure ' + d.p0 + ' to ' + d.p1 + ' mb, ' + d.trend + '</div>' +
      '<div class="cond">' + d.sky + ', ' + d.hi + '° / ' + d.lo + '°C</div>' +
      '<div class="cond">Wind ~' + d.wind + ' mph · ' + rainText + ' · ' + d.moon + '</div>' +
      '<div class="bar"><i style="width:' + d.score + '%;background:' + colour + '"></i></div>' +
      '</div>';
  }).join("");
}
