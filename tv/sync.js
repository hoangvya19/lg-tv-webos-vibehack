#!/usr/bin/env node
/*
 * LG TV Vibehack - runs ON the rooted TV.
 * Reads the installed apps and HDMI inputs straight from webOS (no computer needed), copies their
 * icons into the launcher, and applies your personal settings and wallpaper.
 * Runs at every boot and after every install, so new or removed apps show up automatically.
 *
 *   node /home/root/lg-tv-vibehack/sync.js          # sync now
 *   node /home/root/lg-tv-vibehack/sync.js --list   # print app ids and titles
 */
'use strict';
var fs = require('fs');
var path = require('path');
var execFileSync = require('child_process').execFileSync;

var APP_ID = 'com.gathin.tvhome';
var APP_DIR = '/media/developer/apps/usr/palm/applications/' + APP_ID;
var DATA = '/home/root/lg-tv-vibehack';

function luna(uri, payload) {
  var out = execFileSync('luna-send', ['-n', '1', uri, JSON.stringify(payload || {})], { encoding: 'utf8', timeout: 15000 });
  return JSON.parse(out.trim().split('\n').pop());
}

function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; }
}

function safeName(id) { return id.replace(/[^A-Za-z0-9._-]/g, '_') + '.png'; }

function isFile(p) { try { return !!p && fs.statSync(p).isFile(); } catch (e) { return false; } }

// Where webOS keeps installed apps. Read when listLaunchPoints gives nothing (seen on webOS 4.4).
var APP_DIRS = [
  '/usr/palm/applications',
  '/media/cryptofs/apps/usr/palm/applications',
  '/media/developer/apps/usr/palm/applications',
  '/mnt/otycabi/usr/palm/applications',
  '/mnt/otncabi/usr/palm/applications'
];

function fromLuna() {
  var res;
  try {
    res = luna('luna://com.webos.applicationManager/listLaunchPoints');
  } catch (e) {
    console.error('listLaunchPoints failed: ' + e.message);
    return [];
  }
  if (res && res.launchPoints && res.launchPoints.length) return res.launchPoints;
  console.error('listLaunchPoints returned no apps: ' + JSON.stringify(res).slice(0, 300));
  return [];
}

/** Builds launch points by reading every appinfo.json on disk. */
function fromDisk() {
  var seen = {}, out = [];
  APP_DIRS.forEach(function (dir) {
    var names;
    try { names = fs.readdirSync(dir); } catch (e) { return; }
    names.forEach(function (n) {
      var base = path.join(dir, n);
      var info = readJSON(path.join(base, 'appinfo.json'), null);
      if (!info || !info.id || seen[info.id] || info.visible === false) return;
      seen[info.id] = true;
      out.push({
        id: info.id,
        title: info.title || info.id,
        icon: info.icon ? path.join(base, info.icon) : '',
        largeIcon: info.largeIcon ? path.join(base, info.largeIcon) : '',
        iconColor: info.iconColor || info.bgColor || ''
      });
    });
  });
  return out;
}

/** webOS first; on firmware where that stays empty, the app folders on disk. */
function listPoints() {
  var points = fromLuna();
  if (points.length) return { points: points, source: 'webOS' };
  console.error('Falling back to reading the app folders on disk.');
  return { points: fromDisk(), source: 'disk' };
}

function main() {
  var found = listPoints(), points = found.points;

  if (process.argv.indexOf('--list') !== -1) {
    points.forEach(function (p) { console.log((p.id + '                                             ').slice(0, 45) + ' ' + p.title); });
    return;
  }

  if (!fs.existsSync(APP_DIR)) {
    console.error('Launcher is not installed (' + APP_DIR + ' missing).');
    process.exit(1);
  }

  // Inputs: ask webOS, fall back to the four standard HDMI ports.
  var inputs = [];
  try {
    var devs = luna('luna://com.webos.service.eim/getAllInputStatus').devices || [];
    devs.forEach(function (d) { if (d.appId) inputs.push({ appId: d.appId, label: d.label || d.id }); });
  } catch (e) { /* older/newer firmware: use the fallback */ }
  if (!inputs.length) {
    [1, 2, 3, 4].forEach(function (n) { inputs.push({ appId: 'com.webos.app.hdmi' + n, label: 'HDMI ' + n }); });
  }

  // Apps and icons. Your own icons in DATA/icons/<app id>.png win over the TV's.
  var iconDir = path.join(APP_DIR, 'icons');
  if (!fs.existsSync(iconDir)) fs.mkdirSync(iconDir);
  var apps = [];
  points.forEach(function (p) {
    if (p.hidden) return;
    var name = safeName(p.id);
    var custom = path.join(DATA, 'icons', name);
    var src = isFile(custom) ? custom : (isFile(p.largeIcon) ? p.largeIcon : p.icon);
    if (!isFile(src)) return;
    try { fs.copyFileSync(src, path.join(iconDir, name)); } catch (e) { return; }
    apps.push({ id: p.id, title: p.title, icon: 'icons/' + name, iconColor: p.iconColor || p.bgColor || '' });
  });
  // An empty list would leave an empty launcher on screen, so keep whatever is already there.
  if (!apps.length) {
    console.error('No apps found. Tried listLaunchPoints and ' + APP_DIRS.join(', ') + '.');
    console.error('The app list was left unchanged. Please report this with your TV model and');
    console.error('webOS version: https://github.com/hoangvya19/lg-tv-webos-vibehack/issues');
    process.exit(1);
  }

  fs.writeFileSync(path.join(APP_DIR, 'apps.js'),
    '// Generated on the TV by sync.js\nwindow.TV_APPS = ' + JSON.stringify({ apps: apps, inputs: inputs }, null, 1) + ';\n');

  // Personal settings and wallpaper. The copy is named after the photo's timestamp so a new photo
  // gets a new file name and the launcher never shows a cached old one.
  var settings = readJSON(path.join(DATA, 'settings.json'), {});
  var wp = path.join(DATA, 'wallpaper.jpg');
  var bgName = isFile(wp) ? 'bg-' + Math.floor(fs.statSync(wp).mtime.getTime() / 1000) + '.jpg' : '';
  fs.readdirSync(APP_DIR).forEach(function (f) {
    if (/^bg(-\d+)?\.jpg$/.test(f) && f !== bgName) fs.unlinkSync(path.join(APP_DIR, f));
  });
  if (bgName && !isFile(path.join(APP_DIR, bgName))) fs.copyFileSync(wp, path.join(APP_DIR, bgName));
  settings.wallpaper = bgName;
  fs.writeFileSync(path.join(APP_DIR, 'user.js'),
    '// Generated on the TV by sync.js from ' + DATA + '/settings.json\n' +
    '(function () { var u = ' + JSON.stringify(settings) + '; for (var k in u) window.CONFIG[k] = u[k]; })();\n');

  console.log('Synced ' + apps.length + ' apps (from ' + found.source + ') and ' + inputs.length + ' inputs.');
}

main();
