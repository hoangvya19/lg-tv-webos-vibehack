#!/usr/bin/env node
/*
 * LG TV Vibehack - runs ON the rooted TV.
 * Backup for the Home button: whenever LG's home screen comes to the front (at boot, or if the
 * button remap is not installed), bring the launcher back. Gives up after 5 tries in 10 s so it can
 * never fight the TV in a loop.
 *
 * Right after boot the TV usually opens Live TV (or the last input) instead of LG's home, so for
 * BOOT_GRACE_MS after webOS is ready Live TV is treated like LG's home too.
 * Plain ES5: the TV runs Node 8.
 */
'use strict';
var spawn = require('child_process').spawn;
var execFile = require('child_process').execFile;

var LAUNCHER = 'com.gathin.tvhome';
var HOME_IDS = ['com.webos.app.home'];
var BOOT_IDS = ['com.webos.app.livetv'];
var BOOT_GRACE_MS = 90000;
var READY_TIMEOUT_MS = 8000;    // no foreground app reported yet: subscribe again
var hits = [];
var readyAt = 0;

function log(msg) { console.log(new Date().toISOString() + ' ' + msg); }

function launch() {
  execFile('luna-send', ['-n', '1', 'luna://com.webos.applicationManager/launch', JSON.stringify({ id: LAUNCHER })]);
}

function isHome(id) {
  if (HOME_IDS.indexOf(id) !== -1) return true;
  return BOOT_IDS.indexOf(id) !== -1 && Date.now() - readyAt < BOOT_GRACE_MS;
}

function handle(id) {
  if (!isHome(id)) return;
  var now = Date.now();
  hits = hits.filter(function (t) { return now - t < 10000; });
  if (hits.length >= 5) { log('LG home keeps coming back, giving up for now'); return; }
  hits.push(now);
  log(id + ' -> launcher');
  setTimeout(launch, hits.length > 1 ? 400 : 0);
}

// Subscribing before webOS is ready gives a subscription that never reports anything, so until the
// first real app id arrives the subscription is renewed every READY_TIMEOUT_MS.
function start() {
  var p = spawn('luna-send', ['-i', 'luna://com.webos.applicationManager/getForegroundAppInfo', '{"subscribe":true}']);
  var buf = '';
  var retry = readyAt ? null : setTimeout(function () { p.kill(); }, READY_TIMEOUT_MS);
  p.stdout.on('data', function (d) {
    buf += d;
    var lines = buf.split('\n');
    buf = lines.pop();
    lines.forEach(function (l) {
      var j;
      try { j = JSON.parse(l); } catch (e) { return; }
      if (!j.appId) return;
      if (!readyAt) {
        readyAt = Date.now();
        clearTimeout(retry);
        log('webOS ready, foreground: ' + j.appId);
      }
      handle(j.appId);
    });
  });
  p.on('exit', function () { clearTimeout(retry); setTimeout(start, readyAt ? 2000 : 1000); });
}

log('homewatch started');
start();
