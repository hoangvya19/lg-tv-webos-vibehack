#!/usr/bin/env node
/*
 * LG TV Vibehack - runs ON the rooted TV.
 * A small web page for changing the wallpaper from a phone: the launcher's Wallpaper button shows a
 * QR code, the phone opens this page, picks a photo (from the phone or from a USB stick in the TV),
 * and the photo becomes the wallpaper. The phone crops and shrinks the photo to 1920x1080 first.
 * The same page sets the weather city (looked up on Open-Meteo, no API key).
 *
 * Every page and action needs the key in the QR code (kept in DATA/.wallpaper-key), so other people
 * on the same Wi-Fi cannot change it. The launcher cannot make HTTP calls to the TV itself on webOS 6,
 * so the address goes into a file it loads (wall.js), and after a change the server relaunches it
 * with {reload: true}.
 * Plain ES5: the TV runs Node 8.
 */
'use strict';
var http = require('http');
var fs = require('fs');
var os = require('os');
var path = require('path');
var crypto = require('crypto');
var parseUrl = require('url').parse;
var execFile = require('child_process').execFile;

var PORT = 8090;
var DATA = '/home/root/lg-tv-vibehack';
var APP_DIR = '/media/developer/apps/usr/palm/applications/com.gathin.tvhome';
var WALLPAPER = path.join(DATA, 'wallpaper.jpg');
var SETTINGS = path.join(DATA, 'settings.json');
var USB_ROOT = '/tmp/usb';
var MAX_UPLOAD = 10 * 1024 * 1024;
var IMAGE_RE = /\.(jpe?g|png|webp)$/i;

function log(msg) { console.log(new Date().toISOString() + ' wallpaper: ' + msg); }

function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; }
}

function loadKey() {
  var f = path.join(DATA, '.wallpaper-key');
  try {
    var k = fs.readFileSync(f, 'utf8').trim();
    if (/^[0-9a-f]{12}$/.test(k)) return k;
  } catch (e) { /* first run */ }
  k = crypto.randomBytes(6).toString('hex');
  fs.writeFileSync(f, k, { mode: 384 });
  return k;
}
var KEY = loadKey();

function tvAddress() {
  var nets = os.networkInterfaces(), names = ['eth0', 'wlan0'].concat(Object.keys(nets));
  for (var i = 0; i < names.length; i++) {
    var list = nets[names[i]] || [];
    for (var j = 0; j < list.length; j++) {
      if (list[j].family === 'IPv4' && !list[j].internal) return list[j].address;
    }
  }
  return '';
}

/** Tells the launcher where this page is (for the QR code). */
function writeWallJs() {
  var ip = tvAddress();
  var url = ip ? 'http://' + ip + ':' + PORT + '/?k=' + KEY : '';
  try {
    fs.writeFileSync(path.join(APP_DIR, 'wall.js'), '// Written by wallpaper-server.js\nwindow.WALL_URL = ' + JSON.stringify(url) + ';\n');
  } catch (e) { log('cannot write wall.js: ' + e.message); }
}

/** Rewrites the launcher's files, then reloads the launcher so the new wallpaper shows. */
function sync(cb) {
  execFile('/usr/bin/node', [path.join(DATA, 'sync.js')], { timeout: 60000 }, function (err, out, errOut) {
    if (err) log('sync failed: ' + (errOut || err.message));
    writeWallJs();
    execFile('luna-send', ['-n', '1', 'luna://com.webos.applicationManager/launch',
      JSON.stringify({ id: 'com.gathin.tvhome', params: { reload: true } })]);
    cb(err);
  });
}

function saveSettings(change, res) {
  var st = readJSON(SETTINGS, {});
  change(st);
  fs.writeFileSync(SETTINGS, JSON.stringify(st, null, 1));
  sync(function (err) { json(res, err ? 500 : 200, { ok: !err }); });
}

/** City search on Open-Meteo. curl, because Node 8's certificates are too old for some sites. */
function findCity(q, lang, cb) {
  var url = 'https://geocoding-api.open-meteo.com/v1/search?count=6&format=json&language=' + lang +
    '&name=' + encodeURIComponent(q);
  execFile('curl', ['-fsSL', '--max-time', '15', url], { timeout: 20000 }, function (err, out) {
    if (err) return cb(err);
    var list;
    try { list = JSON.parse(out).results || []; } catch (e) { return cb(e); }
    cb(null, list.map(function (r) {
      // Open-Meteo spells some Vietnamese names with the Icelandic Ð.
      var fix = function (t) { return String(t || '').replace(/Ð/g, 'Đ').replace(/ð/g, 'đ'); };
      return { name: fix(r.name), region: fix(r.admin1), country: fix(r.country), latitude: r.latitude, longitude: r.longitude };
    }));
  });
}

function send(res, code, type, body, extra) {
  var h = { 'Content-Type': type, 'Cache-Control': 'no-store' };
  for (var k in extra || {}) h[k] = extra[k];
  res.writeHead(code, h);
  res.end(body);
}
function json(res, code, obj, extra) { send(res, code, 'application/json', JSON.stringify(obj), extra); }

/** Images on USB sticks (webOS mounts them under /tmp/usb/sdX/sdX1). */
function usbImages() {
  var found = [];
  function walk(dir, depth) {
    if (depth > 5 || found.length >= 300) return;
    var names;
    try { names = fs.readdirSync(dir); } catch (e) { return; }
    names.sort().forEach(function (n) {
      if (n.charAt(0) === '.' || found.length >= 300) return;
      var p = path.join(dir, n), st;
      try { st = fs.statSync(p); } catch (e) { return; }
      if (st.isDirectory()) walk(p, depth + 1);
      else if (IMAGE_RE.test(n) && st.size > 0) found.push(p);
    });
  }
  walk(USB_ROOT, 0);
  return found;
}

function insideUsb(p) {
  try {
    var real = fs.realpathSync(p);
    return real.indexOf(USB_ROOT + '/') === 0 && IMAGE_RE.test(real) ? real : '';
  } catch (e) { return ''; }
}

function handle(req, res) {
  var u = parseUrl(req.url, true), q = u.query, route = req.method + ' ' + u.pathname;
  if (q.k !== KEY) {
    return send(res, 403, 'text/html; charset=utf-8', page403());
  }

  if (route === 'GET /') {
    return fs.readFile(path.join(DATA, 'wallpaper.html'), function (err, buf) {
      if (err) return send(res, 500, 'text/plain', 'wallpaper.html missing, run the installer again');
      send(res, 200, 'text/html; charset=utf-8', buf);
    });
  }

  if (route === 'GET /api/state') {
    var s = readJSON(SETTINGS, {}), w = s.weather || {};
    return json(res, 200, {
      language: s.language === 'vi' ? 'vi' : 'en',
      hasWallpaper: fs.existsSync(WALLPAPER),
      dim: typeof s.wallpaperDim === 'number' ? s.wallpaperDim : 0.35,
      weather: { enabled: !!(w.enabled && w.latitude), place: w.place || '' }
    });
  }

  if (route === 'GET /api/city') {
    var name = String(q.q || '').trim().slice(0, 80);
    if (!name) return json(res, 400, { error: 'empty' });
    var lang = readJSON(SETTINGS, {}).language === 'vi' ? 'vi' : 'en';
    return findCity(name, lang, function (err, list) {
      if (err) return json(res, 502, { error: 'lookup failed' });
      json(res, 200, { results: list });
    });
  }

  if (route === 'POST /api/weather') {
    if (q.off) {
      log('weather off');
      return saveSettings(function (st) { if (st.weather) st.weather.enabled = false; }, res);
    }
    var lat = parseFloat(q.lat), lon = parseFloat(q.lon), place = String(q.place || '').slice(0, 80);
    if (!(lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180)) return json(res, 400, { error: 'bad place' });
    log('weather city: ' + place);
    return saveSettings(function (st) {
      var unit = st.weather && st.weather.unit === 'fahrenheit' ? 'fahrenheit' : 'celsius';
      st.weather = { enabled: true, latitude: lat, longitude: lon, place: place, unit: unit };
    }, res);
  }

  if (route === 'GET /current.jpg') {
    return fs.readFile(WALLPAPER, function (err, buf) {
      if (err) return send(res, 404, 'text/plain', 'none');
      send(res, 200, 'image/jpeg', buf);
    });
  }

  if (route === 'POST /api/upload') {
    var chunks = [], size = 0, tooBig = false;
    req.on('data', function (d) {
      if (tooBig) return;
      size += d.length;
      if (size > MAX_UPLOAD) { tooBig = true; chunks = []; json(res, 413, { error: 'too big' }); return; }
      chunks.push(d);
    });
    req.on('end', function () {
      if (tooBig) return;
      var buf = Buffer.concat(chunks);
      if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return json(res, 400, { error: 'not a JPEG' });
      var tmp = WALLPAPER + '.part';
      fs.writeFileSync(tmp, buf);
      fs.renameSync(tmp, WALLPAPER);
      log('new wallpaper, ' + Math.round(buf.length / 1024) + ' KB');
      sync(function (err) { json(res, err ? 500 : 200, { ok: !err }); });
    });
    return;
  }

  if (route === 'POST /api/dim') {
    var v = parseFloat(q.v);
    if (!(v >= 0 && v <= 0.8)) return json(res, 400, { error: 'bad value' });
    return saveSettings(function (st) { st.wallpaperDim = Math.round(v * 100) / 100; }, res);
  }

  if (route === 'POST /api/clear') {
    try { fs.unlinkSync(WALLPAPER); } catch (e) { /* already gone */ }
    log('wallpaper removed');
    return sync(function (err) { json(res, err ? 500 : 200, { ok: !err }); });
  }

  if (route === 'GET /api/usb') {
    return json(res, 200, { images: usbImages().map(function (p) { return p.slice(USB_ROOT.length + 1); }) });
  }

  if (route === 'GET /api/usb/img') {
    var real = insideUsb(path.join(USB_ROOT, String(q.p || '')));
    if (!real) return send(res, 404, 'text/plain', 'not found');
    var ext = path.extname(real).toLowerCase();
    res.writeHead(200, { 'Content-Type': ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg' });
    return fs.createReadStream(real).pipe(res);
  }

  send(res, 404, 'text/plain', 'not found');
}

function page403() {
  return '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<body style="font:18px system-ui,sans-serif;background:#111;color:#eee;padding:24px">' +
    '<p>Open this page by scanning the QR code on the TV (Wallpaper button).</p>' +
    '<p>Hãy mở trang này bằng cách quét mã QR trên TV (nút Hình nền).</p>';
}


http.createServer(function (req, res) {
  try { handle(req, res); } catch (e) { log('error: ' + e.message); try { json(res, 500, { error: 'server error' }); } catch (x) { /* sent */ } }
}).on('error', function (e) {
  log('cannot start: ' + e.message);
  process.exit(1);
}).listen(PORT, function () { writeWallJs(); log('listening on port ' + PORT); });
