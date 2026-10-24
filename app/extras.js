/*
 * LG TV Vibehack additions: wallpaper, ambient glow toggle and weather.
 * Plain ES5 on purpose: webOS 6 runs Chromium 79.
 */
(function () {
  'use strict';
  var C = window.CONFIG || {};

  // ---- Wallpaper ----
  if (C.wallpaper) {
    var dim = typeof C.wallpaperDim === 'number' ? Math.max(0, Math.min(0.8, C.wallpaperDim)) : 0.35;
    var bg = 'linear-gradient(rgba(0,0,0,' + dim + '), rgba(0,0,0,' + dim + ')), url("' + C.wallpaper +
      '") center / cover no-repeat, #000';
    document.documentElement.style.background = bg;
    document.body.style.background = bg;
  }
  if (C.ambientGlow === false) document.body.className += ' no-glow';

  // ---- Weather (Open-Meteo, no API key) ----
  var W = C.weather || {};
  var el = document.getElementById('weather');
  if (!el || !W.enabled || !W.latitude || !W.longitude) return;

  var vi = C.language === 'vi';
  var NAMES = vi ? {
    0: 'Trời quang', 1: 'Ít mây', 2: 'Có mây', 3: 'Nhiều mây', 45: 'Sương mù', 48: 'Sương mù',
    51: 'Mưa phùn nhẹ', 53: 'Mưa phùn', 55: 'Mưa phùn dày', 61: 'Mưa nhẹ', 63: 'Mưa vừa', 65: 'Mưa to',
    71: 'Tuyết nhẹ', 73: 'Tuyết', 75: 'Tuyết dày', 80: 'Mưa rào nhẹ', 81: 'Mưa rào', 82: 'Mưa rào lớn',
    95: 'Dông', 96: 'Dông, mưa đá', 99: 'Dông, mưa đá'
  } : {
    0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Cloudy', 45: 'Fog', 48: 'Fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Light showers', 81: 'Showers', 82: 'Heavy showers',
    95: 'Thunderstorm', 96: 'Thunderstorm, hail', 99: 'Thunderstorm, hail'
  };
  var fahrenheit = W.unit === 'fahrenheit';

  function load() {
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + W.latitude + '&longitude=' + W.longitude +
      '&current=temperature_2m,weather_code' +
      '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
      '&timezone=auto&forecast_days=1' + (fahrenheit ? '&temperature_unit=fahrenheit' : '');
    var x = new XMLHttpRequest();
    x.open('GET', url);
    x.timeout = 10000;
    x.onload = function () {
      try {
        var d = JSON.parse(x.responseText), c = d.current, day = d.daily;
        var u = fahrenheit ? '°F' : '°C';
        var text = Math.round(c.temperature_2m) + u;
        if (NAMES[c.weather_code]) text += ' · ' + NAMES[c.weather_code];
        if (W.place) text += ' · ' + W.place;
        text += '   ↑' + Math.round(day.temperature_2m_max[0]) + '° ↓' + Math.round(day.temperature_2m_min[0]) + '°';
        var rain = day.precipitation_probability_max[0];
        if (rain !== null && rain !== undefined) text += '  ☂ ' + rain + '%';
        el.textContent = text;
        el.className = 'shown';
      } catch (e) { /* keep the old text */ }
    };
    x.send();
  }
  load();
  setInterval(load, 30 * 60 * 1000);
})();
