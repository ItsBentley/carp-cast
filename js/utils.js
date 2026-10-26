/* ==========================================================================
   utils.js: small helpers used across the app
   ========================================================================== */

// Shortcut for document.getElementById
function $(id) {
  return document.getElementById(id);
}

// Average of a list of numbers
function mean(numbers) {
  return numbers.reduce(function (sum, n) { return sum + n; }, 0) / numbers.length;
}
