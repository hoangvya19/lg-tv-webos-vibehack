#!/usr/bin/env node
/*
 * LG TV Vibehack - diagnostics. Runs ON the TV, changes nothing.
 * Prints exactly what sync.js sees, so an empty app list can be explained.
 *
 *   curl -fsSL https://raw.githubusercontent.com/hoangvya19/lg-tv-webos-vibehack/main/tv/diag.js -o /tmp/diag.js && node /tmp/diag.js
 */
'use strict';
var fs = require('fs');
var path = require('path');
var execFileSync = require('child_process').execFileSync;

var APP_DIRS = [
  '/usr/palm/applications',
  '/media/cryptofs/apps/usr/palm/applications',
  '/media/developer/apps/usr/palm/applications',
  '/mnt/otycabi/usr/palm/applications',
  '/mnt/otncabi/usr/palm/applications'
];

function isFile(p) { try { return !!p && fs.statSync(p).isFile(); } catch (e) { return false; } }

console.log('== node ' + process.version + ', uid ' + process.getuid());

// ---- 1. what luna-send actually answers -------------------------------------------------------
var raw = '';
try {
  raw = execFileSync('luna-send',
    ['-n', '1', 'luna://com.webos.applicationManager/listLaunchPoints', '{}'],
    { encoding: 'utf8', timeout: 20000, maxBuffer: 10 * 1024 * 1024 });
} catch (e) {
  console.log('luna-send threw: ' + e.message);
}
console.log('== luna-send: ' + raw.length + ' chars, ' + raw.split('\n').length + ' line(s)');
console.log('   first 200: ' + raw.slice(0, 200).replace(/\n/g, '\\n'));
console.log('   last  120: ' + raw.slice(-120).replace(/\n/g, '\\n'));
var parsedWhole = null, parsedLast = null;
try { parsedWhole = JSON.parse(raw.trim()); } catch (e) { console.log('   whole output does not parse: ' + e.message); }
try { parsedLast = JSON.parse(raw.trim().split('\n').pop()); } catch (e) { console.log('   last line does not parse: ' + e.message); }
['whole', 'last'].forEach(function (k) {
  var o = k === 'whole' ? parsedWhole : parsedLast;
  if (!o) return;
  console.log('   ' + k + ': keys=' + Object.keys(o).join(',') +
    ' launchPoints=' + (o.launchPoints ? o.launchPoints.length : 'none'));
});

// ---- 2. what the app folders look like --------------------------------------------------------
APP_DIRS.forEach(function (dir) {
  var names;
  try { names = fs.readdirSync(dir); } catch (e) {
    console.log('== ' + dir + ': cannot read (' + e.code + ')');
    return;
  }
  var withInfo = 0, badJson = 0, noId = 0, hidden = 0, usable = 0, samples = [];
  names.forEach(function (n) {
    var base = path.join(dir, n);
    var file = path.join(base, 'appinfo.json');
    if (!isFile(file)) return;
    withInfo++;
    var info = null;
    try { info = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { badJson++; return; }
    if (!info.id) { noId++; return; }
    if (info.visible === false) { hidden++; return; }
    usable++;
    if (samples.length < 4) {
      var icon = info.icon ? path.join(base, info.icon) : '';
      var large = info.largeIcon ? path.join(base, info.largeIcon) : '';
      samples.push('      ' + info.id + ' | title=' + JSON.stringify(info.title) +
        ' | icon=' + JSON.stringify(info.icon) + ' exists=' + isFile(icon) +
        ' | largeIcon=' + JSON.stringify(info.largeIcon) + ' exists=' + isFile(large));
    }
  });
  console.log('== ' + dir + ': ' + names.length + ' entries, ' + withInfo + ' with appinfo.json, ' +
    'bad json ' + badJson + ', no id ' + noId + ', visible:false ' + hidden + ', usable ' + usable);
  samples.forEach(function (s) { console.log(s); });
});

console.log('== done. Please paste everything above into the issue.');
