/*
 * tvOS style home for webOS: black, a pinned dock row, an app grid, and one glass highlight that
 * springs between tiles. A port of the Android launcher in ../../launcher.
 *
 * webOS does not let third-party apps list installed apps, so sync-apps.py writes them into apps.js.
 */
(function () {
  'use strict';

  // Tiles per row: picked on the TV with the pencil next to the dock (kept in localStorage), else config.
  var COLS_KEY = 'tvhome.columns', COLS_CHOICES = [4, 5, 6, 7, 8, 9, 10];
  var COLUMNS = (function () {
    var n = 0;
    try { n = parseInt(localStorage.getItem(COLS_KEY), 10); } catch (e) { /* storage unavailable */ }
    return n >= 3 && n <= 10 ? n : Math.max(1, CONFIG.columns || 4);
  })();
  // Tile size follows the column count (4 columns = the original 360x202 tiles).
  var TILE_W = Math.min(360, Math.round((1920 - 2 * 112) / COLUMNS * 0.85));
  var TILE_H = Math.round(TILE_W * 9 / 16);
  (function () {
    var r = Math.round(TILE_W * 32 / 360), st = document.documentElement.style;
    st.setProperty('--tile-w', TILE_W + 'px');
    st.setProperty('--tile-h', TILE_H + 'px');
    st.setProperty('--tile-r', r + 'px');
    st.setProperty('--glass-r', Math.round(r * 47 / 32) + 'px');
  })();
  var CELL_W = (1920 - 2 * 112) / COLUMNS;
  var ROW_PITCH = TILE_H + 90;
  var DOCK_TOP = 708;           // tile top of the dock row: next row peeks in at the bottom
  var DOCK_GAP = 36;            // extra space below the dock
  var FOCUS_SCALE = 1.1;
  var GLASS_PAD = 12;           // room for the glass glow around the scaled tile
  var VIEW_TOP = 80, VIEW_BOTTOM = 1060;    // area grid rows scroll into (the header hides below the dock)

  var KEY = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, OK: 13, BACK: 461, ESC: 27 };

  var LANG = {
    en: {
      greetings: [[5, 'Good night'], [12, 'Good morning'], [17, 'Good afternoon'], [22, 'Good evening'], [24, 'Good night']],
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      date: function (d) {
        var m = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
          'October', 'November', 'December'];
        return this.days[d.getDay()] + '  ' + d.getDate() + ' ' + m[d.getMonth()];
      },
      inputs: 'Inputs', settings: 'Settings', wired: 'Ethernet', offline: 'Offline', liveTv: 'Live TV',
      noInputs: 'No inputs found', cantOpen: "Can't open ", ampm: ['am', 'pm'],
      moveHint: 'Arrows or pointer to move  ·  OK to place  ·  Back to cancel',
      colsTitle: 'Tiles per row', arrange: 'Rearrange apps', done: 'Done',
      arrangeHint: 'Click an app to pick it up, point where it should go, click again to drop it.',
      wallTitle: 'Change wallpaper',
      wallScan: 'Scan this code with your phone camera, then pick a photo.',
      wallOff: 'The wallpaper page is not running. Reboot the TV and try again.'
    },
    vi: {
      greetings: [[5, 'Chúc ngủ ngon'], [11, 'Chào buổi sáng'], [13, 'Chào buổi trưa'], [18, 'Chào buổi chiều'], [22, 'Chào buổi tối'], [24, 'Chúc ngủ ngon']],
      days: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'],
      date: function (d) { return this.days[d.getDay()] + ', ' + d.getDate() + ' tháng ' + (d.getMonth() + 1); },
      inputs: 'Nguồn vào', settings: 'Cài đặt', wired: 'Wi-Fi', offline: 'Mất mạng', liveTv: 'Truyền hình',
      noInputs: 'Không tìm thấy nguồn vào', cantOpen: 'Không mở được ', ampm: ['SA', 'CH'],
      moveHint: 'Mũi tên hoặc con trỏ để di chuyển  ·  OK để đặt  ·  Back để huỷ',
      colsTitle: 'Số ô mỗi hàng', arrange: 'Sắp xếp ứng dụng', done: 'Xong',
      arrangeHint: 'Bấm vào app để nhấc lên, trỏ tới chỗ mới rồi bấm lần nữa để đặt.',
      wallTitle: 'Đổi hình nền',
      wallScan: 'Quét mã này bằng camera điện thoại rồi chọn ảnh.',
      wallOff: 'Trang đổi hình nền chưa chạy. Khởi động lại TV rồi thử lại.'
    }
  };
  var L = LANG[CONFIG.language] || LANG.en;
  var GREETINGS = L.greetings;

  var ICON_INPUT = 'M18,7V4c0,-1.1 -0.9,-2 -2,-2H8C6.9,2 6,2.9 6,4v3H5v6l3,6v3h8v-3l3,-6V7H18zM8,4h8v3h-2V5h-1v2h-2V5h-1v2H8V4z';
  var ICON_MOVE = 'M10,9h4V6h3l-5,-5 -5,5h3v3zM9,10H6V7l-5,5 5,5v-3h3v-4zM23,12l-5,-5v3h-3v4h3v3l5,-5zM14,15h-4v3H7l5,5 5,-5h-3v-3z';
  var ICON_LIVETV = 'M21,6h-7.59l3.29,-3.29L16,2l-4,4l-4,-4l-0.71,0.71L10.59,6H3c-1.1,0 -2,0.89 -2,2v12c0,1.1 0.9,2 2,2h18c1.1,0 2,-0.89 2,-2V8C23,6.89 22.1,6 21,6zM21,20H3V8h18V20zM9,10v8l7,-4L9,10z';

  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), tilesEl = $('tiles'), glass = $('glass'), hero = $('hero');
  var ambients = [$('ambientA'), $('ambientB')], ambientFront = 0, ambientColor = null;
  var pills = [$('btnInputs'), $('btnWifi'), $('btnWall'), $('btnSettings')];
  var panel = $('inputsPanel'), wallPanel = $('wallPanel'), pen = $('penBtn'), colsPanel = $('colsPanel');

  var items = [];               // {app, el, color}
  var zone = 'grid';            // 'grid' | 'top' | 'inputs' | 'wall' | 'pen' | 'cols'
  var colFocus = 0, colCells = [], colRow = 0, arrangeBtn = null;
  var arranging = false;        // "Rearrange apps" mode from the pencil: every tile wiggles
  var focused = 0, pillFocus = 0, inputFocus = 0, inputRows = [];
  var offset = 0, heroShown = false, glassShown = false;
  var editing = null;           // {item, snapshot} while a tile is being moved
  var pressTimer = null, pressedLong = false;   // long press with the pointer

  // ---- luna bus ------------------------------------------------------------------------------

  var bridges = [];   // keep a reference: a collected bridge drops its callback

  function luna(uri, params, cb) {
    try {
      var b = new PalmServiceBridge();
      b.onservicecallback = function (msg) {
        var res;
        try { res = JSON.parse(msg); } catch (e) { res = { returnValue: false }; }
        if (cb) cb(res);
        if (!params || !params.subscribe) bridges.splice(bridges.indexOf(b), 1);
      };
      bridges.push(b);
      b.call(uri, JSON.stringify(params || {}));
    } catch (e) {
      if (cb) cb({ returnValue: false, errorText: String(e) });   // not on a TV (desktop preview)
    }
  }

  function launch(id, title, params) {
    luna('luna://com.webos.applicationManager/launch', { id: id, params: params || {} }, function (res) {
      if (res.returnValue === false) toast(L.cantOpen + (title || id));
    });
  }

  var toastTimer;
  function toast(text) {
    var t = $('toast');
    t.textContent = text;
    t.classList.add('shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('shown'); }, 2200);
  }

  // ---- apps ----------------------------------------------------------------------------------

  function orderedApps() {
    var all = (window.TV_APPS && TV_APPS.apps) || [];
    var byId = {};
    all.forEach(function (a) { byId[a.id] = a; });
    var hidden = {};
    (CONFIG.hiddenApps || []).forEach(function (id) { hidden[id] = true; });
    var byTitle = function (a, b) { return a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1; };

    // An order arranged on the TV wins, until dockApps in config.js changes.
    var saved = loadOrder();
    if (saved) {
      var placed = [];
      saved.forEach(function (id) {
        if (byId[id] && !hidden[id]) { placed.push(byId[id]); hidden[id] = true; }
      });
      return placed.concat(all.filter(function (a) { return !hidden[a.id]; }).sort(byTitle));
    }

    var dock = [];
    (CONFIG.dockApps || []).forEach(function (id) {
      if (byId[id] && !hidden[id] && dock.length < COLUMNS) { dock.push(byId[id]); hidden[id] = true; }
    });
    var rest = all.filter(function (a) { return !hidden[a.id]; });
    rest.sort(byTitle);
    return dock.concat(rest);
  }

  var ORDER_KEY = 'tvhome.order';

  function loadOrder() {
    try {
      var s = JSON.parse(localStorage.getItem(ORDER_KEY));
      return s && s.dock === (CONFIG.dockApps || []).join(',') ? s.ids : null;
    } catch (e) {
      return null;
    }
  }

  function saveOrder() {
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify({
        dock: (CONFIG.dockApps || []).join(','),
        ids: items.map(function (it) { return it.app.id; })
      }));
    } catch (e) { /* storage unavailable: the order lasts until the app restarts */ }
  }

  function rowOf(i) { return Math.floor(i / COLUMNS); }
  function tileLeft(i) { return 112 + (i % COLUMNS) * CELL_W + (CELL_W - TILE_W) / 2; }
  function tileTop(i) { var r = rowOf(i); return DOCK_TOP + r * ROW_PITCH + (r > 0 ? DOCK_GAP : 0); }

  function build() {
    tilesEl.innerHTML = '';
    items = orderedApps().map(function (app) {
      var el = document.createElement('div');
      el.className = 'item';
      var card = document.createElement('div');
      card.className = 'card';
      var img = document.createElement('img');
      var item = { app: app, el: el, card: card, color: null };
      img.onload = function () { paintTile(item, img); };
      img.src = app.icon;
      card.appendChild(img);
      el.appendChild(card);
      var name = document.createElement('div');
      name.className = 'name';
      name.textContent = app.title;
      el.appendChild(name);
      el.addEventListener('mouseover', function () {
        if (editing) { if (item !== editing.item) moveTo(items.indexOf(item)); }   // pointer drags the tile
        else if (zone !== 'inputs' && zone !== 'wall' && zone !== 'cols') focusTile(items.indexOf(item));
      });
      // With the Magic Remote pointer, holding OK sends mousedown ... mouseup + click (no OK key),
      // so a long press is timed here too, and the click that ends it is ignored.
      el.addEventListener('mousedown', function () {
        if (editing || arranging || zone === 'inputs' || zone === 'wall' || zone === 'cols') return;
        clearTimeout(pressTimer);
        pressTimer = setTimeout(function () {
          pressTimer = null;
          pressedLong = true;
          focusTile(items.indexOf(item));
          startEdit();
        }, LONG_PRESS_MS);
      });
      el.addEventListener('mouseup', function () { clearTimeout(pressTimer); pressTimer = null; });
      el.addEventListener('mouseleave', function () { clearTimeout(pressTimer); pressTimer = null; });
      el.addEventListener('click', function () {
        if (pressedLong) { pressedLong = false; return; }
        if (editing) finishEdit(true);
        else if (arranging) { focusTile(items.indexOf(item)); startEdit(); }
        else launch(app.id, app.title);
      });
      tilesEl.appendChild(el);
      return item;
    });
    layout();
  }

  /** Places every tile by its position in items; tiles glide when the order changes. */
  function layout() {
    items.forEach(function (it, i) {
      it.el.style.left = tileLeft(i) + 'px';
      it.el.style.top = tileTop(i) + 'px';
      it.el.classList.toggle('dock', rowOf(i) === 0);   // the dock has no labels: the top shelf names it
    });

    var band = $('dockBand');
    var n = Math.min(COLUMNS, items.length);
    band.style.display = n ? 'block' : 'none';
    band.style.left = (tileLeft(0) - 28) + 'px';
    band.style.top = (DOCK_TOP - 28) + 'px';
    band.style.width = ((n - 1) * CELL_W + TILE_W + 56) + 'px';
    band.style.height = (TILE_H + 56) + 'px';

    // The pencil sits just right of the dock band, centred on the dock row.
    pen.style.display = n ? 'flex' : 'none';
    pen.style.left = Math.min(1920 - 84, tileLeft(0) - 28 + (n - 1) * CELL_W + TILE_W + 56 + 16) + 'px';
    pen.style.top = (DOCK_TOP + TILE_H / 2 - 36) + 'px';
  }

  /** Index of the last tile in the dock row. */
  function lastDock() { return Math.min(COLUMNS, items.length) - 1; }

  function animateIn() {
    items.forEach(function (it, i) {
      it.el.classList.remove('shown');
      setTimeout(function () { it.el.classList.add('shown'); }, 60 + Math.min(i, 16) * 40);
    });
  }

  /**
   * Store icons are square logos on a solid colour: fill the wide tile with that colour so the logo
   * reads as a banner. LG's system icons are glyphs on transparent: use the app's own colour.
   */
  function paintTile(item, img) {
    var px = null, edge = null;
    try {
      var c = document.createElement('canvas');
      c.width = 12; c.height = 12;
      var g = c.getContext('2d');
      g.drawImage(img, 0, 0, 12, 12);
      px = g.getImageData(0, 0, 12, 12).data;
      edge = edgeColor(img);
    } catch (e) { /* tainted canvas: fall back to the app's colour */ }

    var glyphColor = null;
    if (edge && edge[3] > 200) {
      item.card.style.background = 'rgb(' + edge[0] + ',' + edge[1] + ',' + edge[2] + ')';
    } else {
      item.card.classList.add('glyph');
      item.card.style.background = glyphBackground(item.app.iconColor);
      glyphColor = glyphBackground(item.app.iconColor) === '#2c2c2e' ? null : parseColor(item.app.iconColor);
    }
    // A white glyph says nothing about the app: glow in the tile's colour instead.
    item.color = glyphColor || (px ? vividColor(px) : parseColor(item.app.iconColor));
    if (items[focused] === item) setAmbient(item.color);
  }

  /**
   * The icon's background at full size: a corner pixel, or the middle of the left edge for rounded
   * icons whose corners are transparent. A downscaled sample would blend in the logo.
   */
  function edgeColor(img) {
    var w = img.naturalWidth, h = img.naturalHeight;
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    var corner = g.getImageData(2, 2, 1, 1).data;
    return corner[3] > 200 ? corner : g.getImageData(2, Math.floor(h / 2), 1, 1).data;
  }

  function glyphBackground(hex) {
    var c = parseColor(hex);
    if (!c) return '#2c2c2e';
    var hsv = rgbToHsv(c);
    if (hsv[1] < 0.15 && (hsv[2] > 0.85 || hsv[2] < 0.1)) return '#2c2c2e';   // white or black glyph colour
    return 'rgb(' + c.join(',') + ')';
  }

  /** A vivid colour from the icon: the most saturated, not too dark pixel, or the lifted average. */
  function vividColor(px) {
    var best = null, bestScore = -1, sum = [0, 0, 0], n = 0;
    for (var i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 128) continue;
      var p = [px[i], px[i + 1], px[i + 2]];
      sum[0] += p[0]; sum[1] += p[1]; sum[2] += p[2]; n++;
      var hsv = rgbToHsv(p);
      var score = hsv[1] * Math.min(1, hsv[2] * 1.4);
      if (score > bestScore) { bestScore = score; best = p; }
    }
    if (!n) return [68, 68, 68];
    if (bestScore < 0.25) {   // nearly monochrome icon (e.g. white): its average, lifted
      var avg = rgbToHsv([sum[0] / n, sum[1] / n, sum[2] / n]);
      avg[2] = Math.max(avg[2], 0.55);
      return hsvToRgb(avg);
    }
    var h = rgbToHsv(best);
    h[1] = Math.min(1, h[1] * 1.1);
    h[2] = Math.max(0.5, h[2]);
    return hsvToRgb(h);
  }

  function parseColor(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return null;
    var v = parseInt(m[1], 16);
    return [v >> 16 & 255, v >> 8 & 255, v & 255];
  }

  function rgbToHsv(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return [h, max ? d / max : 0, max];
  }

  function hsvToRgb(hsv) {
    var h = hsv[0], s = hsv[1], v = hsv[2];
    var c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c, rgb;
    if (h < 60) rgb = [c, x, 0];
    else if (h < 120) rgb = [x, c, 0];
    else if (h < 180) rgb = [0, c, x];
    else if (h < 240) rgb = [0, x, c];
    else if (h < 300) rgb = [x, 0, c];
    else rgb = [c, 0, x];
    return rgb.map(function (k) { return Math.round((k + m) * 255); });
  }

  // ---- focus & glass -------------------------------------------------------------------------

  function focusTile(i) {
    if (!items.length) return;
    i = Math.max(0, Math.min(i, items.length - 1));
    setZone('grid');
    if (items[focused]) items[focused].el.classList.remove('focused');
    focused = i;
    items[i].el.classList.add('focused');

    var top = tileTop(i), row = rowOf(i);
    if (row === 0) {
      offset = 0;
    } else {
      // Scroll just enough so the whole glass and the name below the tile are visible.
      if (top - offset + TILE_H + 70 > VIEW_BOTTOM) offset = top + TILE_H + 70 - VIEW_BOTTOM;
      if (top - offset - 24 < VIEW_TOP) offset = top - 24 - VIEW_TOP;
    }
    stage.style.transform = 'translateY(' + (-offset) + 'px)';
    // Keep the header until the content (the dock band is topmost) would run into it.
    var header = document.querySelector('header');
    var headerBottom = header.offsetTop + header.offsetHeight;   // layout box: ignores the hide slide
    document.body.classList.toggle('scrolled', DOCK_TOP - 28 - offset < headerBottom + 24);

    var w = TILE_W * FOCUS_SCALE + 2 * GLASS_PAD, h = TILE_H * FOCUS_SCALE + 2 * GLASS_PAD;
    var x = tileLeft(i) + TILE_W / 2 - w / 2, y = top + TILE_H / 2 - h / 2;
    glass.style.width = w + 'px';
    glass.style.height = h + 'px';
    glass.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    if (!glassShown) {
      // First show: jump there without the spring, then fade in.
      glass.style.transition = 'none';
      glass.offsetWidth;   // flush the jump before restoring the transition
      glass.style.transition = '';
      glass.style.opacity = '1';
      glassShown = true;
    }

    if (row === 0) showHero(items[i]);
    else hideHero();
    setAmbient(items[i].color);   // the glow follows the focused tile in every row
  }

  function hideGlass() {
    glassShown = false;
    glass.style.opacity = '0';
  }

  function showHero(item) {
    var label = item.app.title;
    hero.style.top = (DOCK_TOP - 28 - 52 - 96) + 'px';
    if (!heroShown) {
      hero.textContent = label;
      hero.style.transform = 'none';
      hero.style.opacity = '1';
      heroShown = true;
    } else if (hero.textContent !== label) {
      hero.style.opacity = '0';
      hero.style.transform = 'translateX(-24px)';
      clearTimeout(hero.swap);
      hero.swap = setTimeout(function () {
        hero.textContent = label;
        hero.style.transition = 'none';
        hero.style.transform = 'translateX(24px)';
        hero.offsetWidth;
        hero.style.transition = '';
        hero.style.transform = 'none';
        hero.style.opacity = '1';
      }, 120);
    }
    setAmbient(item.color);
  }

  function hideHero() {
    if (!heroShown) return;
    heroShown = false;
    hero.style.opacity = '0';
  }

  /** Crossfades the glow to a new colour by swapping between two layers. */
  function setAmbient(color) {
    if (!color) return;
    var key = color.join(',');
    if (key === ambientColor) return;
    ambientColor = key;
    var back = ambients[1 - ambientFront];
    back.style.background = 'radial-gradient(circle 1190px at 32% 42%, rgba(' + key + ',0.36) 0%, rgba(' +
      key + ',0.15) 50%, rgba(' + key + ',0) 100%)';
    back.style.opacity = '1';
    ambients[ambientFront].style.opacity = '0';
    ambientFront = 1 - ambientFront;
  }

  function focusPill(i) {
    setZone('top');
    document.body.classList.remove('scrolled');
    pills[pillFocus].classList.remove('focused');
    pillFocus = Math.max(0, Math.min(i, pills.length - 1));
    pills[pillFocus].classList.add('focused');
  }

  function setZone(z) {
    if (zone === z) return;
    if (zone === 'top') pills[pillFocus].classList.remove('focused');
    if (zone === 'pen') pen.classList.remove('focused');
    if (zone === 'grid') {
      if (items[focused]) items[focused].el.classList.remove('focused');
      hideGlass();
    }
    zone = z;
  }

  /** The pill straight above a dock tile, by horizontal distance. */
  function pillAbove(i) {
    var cx = tileLeft(i) + TILE_W / 2, best = 0, bestD = Infinity;
    pills.forEach(function (p, k) {
      var r = p.getBoundingClientRect();
      var d = Math.abs(r.left + r.width / 2 - cx);
      if (d < bestD) { bestD = d; best = k; }
    });
    return best;
  }

  // ---- top bar -------------------------------------------------------------------------------

  function updateClock() {
    var now = new Date(), h = now.getHours();
    for (var k = 0; k < GREETINGS.length; k++) {
      if (h < GREETINGS[k][0]) { $('greeting').textContent = GREETINGS[k][1]; break; }
    }
    var m = now.getMinutes();
    if (CONFIG.clock24) {
      $('clock').textContent = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
      $('ampm').textContent = '';
    } else {
      $('clock').textContent = ((h % 12) || 12) + ':' + (m < 10 ? '0' : '') + m;
      $('ampm').textContent = h < 12 ? L.ampm[0] : L.ampm[1];
    }
    $('date').textContent = L.date(now);
  }

  /** Shows the Wi-Fi network name when the TV reports it, otherwise the connection type. */
  function watchNetwork() {
    luna('luna://com.palm.connectionmanager/getStatus', { subscribe: true }, function (res) {
      if (res.returnValue === false && !res.wifi && !res.wired) return;
      var text = 'Wi-Fi';
      if (res.wired && res.wired.state === 'connected') text = L.wired;
      else if (res.wifi && res.wifi.state === 'connected') text = res.wifi.ssid || 'Wi-Fi';
      else if (res.isInternetConnectionAvailable === false) text = L.offline;
      $('wifiLabel').textContent = text;
    });
  }

  function activatePill(i) {
    if (i === 0) showInputs();
    else if (i === 1) launch('com.palm.app.settings', 'Settings', { target: 'network' });
    else if (i === 2) showWall();
    else launch('com.palm.app.settings', 'Settings');
  }

  // ---- wallpaper QR panel --------------------------------------------------------------------

  // tv/wallpaper-server.js (rooted TVs) serves a phone page for picking the wallpaper and writes
  // its address into wall.js. Web apps on webOS 6 cannot call HTTP on the TV itself, so the file is
  // (re)loaded here, and the server relaunches the launcher with {reload: true} after a change.
  function loadWallUrl(cb) {
    var old = $('wallJs');
    if (old) old.parentNode.removeChild(old);
    window.WALL_URL = '';
    var sc = document.createElement('script');
    sc.id = 'wallJs';
    sc.src = 'wall.js';
    sc.onload = function () { cb(window.WALL_URL || ''); };
    sc.onerror = function () { cb(''); };
    document.body.appendChild(sc);
  }

  function showWall() {
    loadWallUrl(function (url) {
      if (!url) { toast(L.wallOff); return; }
      var qr = qrcode(0, 'M');
      qr.addData(url);
      qr.make();
      $('wallQr').innerHTML = '<img src="' + qr.createDataURL(8, 0) + '">';
      $('wallTitle').textContent = L.wallTitle;
      $('wallScan').textContent = L.wallScan;
      $('wallUrl').textContent = url.split('?')[0];

      // Hang below the top row, right-aligned with the last pill.
      var r = pills[pills.length - 1].getBoundingClientRect();
      wallPanel.style.right = Math.round(1920 - r.right) + 'px';
      wallPanel.style.top = (r.bottom + 20) + 'px';
      wallPanel.classList.remove('hidden');
      pills[pillFocus].classList.remove('focused');
      zone = 'wall';
    });
  }

  function hideWall() {
    wallPanel.classList.add('hidden');
    zone = 'none';
    focusPill(2);
  }

  // ---- tiles-per-row picker (the pencil next to the dock) ------------------------------------

  function focusPen() {
    setZone('pen');
    hideHero();
    pen.classList.add('focused');
  }

  function showCols() {
    colsPanel.innerHTML = '';
    var title = document.createElement('div');
    title.className = 'colsTitle';
    title.textContent = L.colsTitle;
    colsPanel.appendChild(title);
    var row = document.createElement('div');
    row.className = 'colsRow';
    colCells = COLS_CHOICES.map(function (n, k) {
      var c = document.createElement('div');
      c.className = 'colCell' + (n === COLUMNS ? ' current' : '');
      c.textContent = n;
      c.addEventListener('mouseover', function () { focusCol(k); });
      c.addEventListener('click', function () { applyCols(n); });
      row.appendChild(c);
      return c;
    });
    colsPanel.appendChild(row);
    arrangeBtn = document.createElement('div');
    arrangeBtn.className = 'arrangeBtn';
    arrangeBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="' + ICON_MOVE + '"/></svg>';
    arrangeBtn.appendChild(document.createTextNode(L.arrange));
    arrangeBtn.addEventListener('mouseover', function () { focusArrangeBtn(); });
    arrangeBtn.addEventListener('click', function () { startArrange(); });
    colsPanel.appendChild(arrangeBtn);

    // Above the dock, right-aligned with the pencil.
    var r = pen.getBoundingClientRect();
    colsPanel.style.right = Math.round(1920 - r.right) + 'px';
    colsPanel.style.bottom = Math.round(1080 - (DOCK_TOP - 28 - 24)) + 'px';
    colsPanel.classList.remove('hidden');
    pen.classList.remove('focused');
    zone = 'cols';
    focusCol(Math.max(0, COLS_CHOICES.indexOf(COLUMNS)));
  }

  function focusCol(i) {
    if (colCells[colFocus]) colCells[colFocus].classList.remove('focused');
    arrangeBtn.classList.remove('focused');
    colRow = 0;
    colFocus = Math.max(0, Math.min(i, colCells.length - 1));
    colCells[colFocus].classList.add('focused');
  }

  function focusArrangeBtn() {
    if (colCells[colFocus]) colCells[colFocus].classList.remove('focused');
    colRow = 1;
    arrangeBtn.classList.add('focused');
  }

  // ---- "Rearrange apps": click an app to pick it up, point, click to drop; Done or Back ends ----

  function startArrange() {
    colsPanel.classList.add('hidden');
    arranging = true;
    document.body.classList.add('arranging');
    $('arrangeText').textContent = L.arrangeHint;
    $('arrangeDone').textContent = L.done;
    zone = 'none';
    focusTile(Math.min(focused, items.length - 1));
  }

  function stopArrange() {
    if (editing) finishEdit(true);
    arranging = false;
    document.body.classList.remove('arranging');
    focusTile(focused);
  }

  function hideCols() {
    colsPanel.classList.add('hidden');
    zone = 'none';
    focusPen();
  }

  function applyCols(n) {
    if (n === COLUMNS) { hideCols(); return; }
    try { localStorage.setItem(COLS_KEY, String(n)); } catch (e) { /* storage unavailable */ }
    location.reload();
  }

  // ---- inputs dropdown -----------------------------------------------------------------------

  function showInputs() {
    panel.innerHTML = '';
    inputRows = [];
    var inputs = (window.TV_APPS && TV_APPS.inputs) || [];
    inputs.forEach(function (inp) { addInputRow(ICON_INPUT, inp.label, inp.appId); });
    if (CONFIG.liveTvApp) {
      if (inputRows.length) panel.appendChild(Object.assign(document.createElement('div'), { className: 'separator' }));
      addInputRow(ICON_LIVETV, L.liveTv, CONFIG.liveTvApp);
    }
    if (!inputRows.length) { toast(L.noInputs); return; }

    // Hang right below the Inputs pill, at least as wide as it.
    var r = pills[0].getBoundingClientRect();
    panel.style.left = r.left + 'px';
    panel.style.top = (r.bottom + 20) + 'px';
    panel.style.minWidth = Math.max(r.width, 300) + 'px';
    panel.classList.remove('hidden');
    pills[pillFocus].classList.remove('focused');
    zone = 'inputs';
    focusInput(0);
  }

  function addInputRow(icon, label, appId) {
    var row = document.createElement('div');
    row.className = 'inputRow';
    row.innerHTML = '<svg viewBox="0 0 24 24"><path d="' + icon + '"/></svg>';
    row.appendChild(document.createTextNode(label));
    var idx = inputRows.length;
    row.addEventListener('mouseover', function () { focusInput(idx); });
    row.addEventListener('click', function () { hideInputs(); launch(appId, label); });
    row.appId = appId;
    row.label = label;
    inputRows.push(row);
    panel.appendChild(row);
  }

  function focusInput(i) {
    if (inputRows[inputFocus]) inputRows[inputFocus].classList.remove('focused');
    inputFocus = Math.max(0, Math.min(i, inputRows.length - 1));
    inputRows[inputFocus].classList.add('focused');
  }

  function hideInputs() {
    panel.classList.add('hidden');
    zone = 'none';
    focusPill(0);
  }

  // ---- rearranging ---------------------------------------------------------------------------

  /** Hold OK on a tile: it wiggles, the arrows move it, OK places it, Back puts everything back. */
  function startEdit() {
    var it = items[focused];
    if (!it) return;
    editing = { item: it, snapshot: items.slice() };
    it.el.classList.add('moving');
    document.body.classList.add('editing');
    if (!arranging) toast(L.moveHint);
  }

  function moveTo(to) {
    if (to < 0 || to >= items.length || to === focused) return;
    items.splice(to, 0, items.splice(focused, 1)[0]);
    focused = to;
    layout();
    focusTile(to);
  }

  function finishEdit(keep) {
    var it = editing.item;
    if (!keep) {
      items = editing.snapshot;
      layout();
    }
    editing = null;
    it.el.classList.remove('moving');
    document.body.classList.remove('editing');
    if (keep) saveOrder();
    focused = items.indexOf(it);
    focusTile(focused);
  }

  // ---- keys ----------------------------------------------------------------------------------

  var LONG_PRESS_MS = 600;
  var okDown = false, okTimer = null;

  // On tiles OK acts on release, so a held OK can start rearranging instead of opening the app.
  document.addEventListener('keyup', function (e) {
    if (e.keyCode !== KEY.OK) return;
    okDown = false;
    if (!okTimer) return;
    clearTimeout(okTimer);
    okTimer = null;
    var it = items[focused];
    if (zone === 'grid' && it && !editing) launch(it.app.id, it.app.title);
  });

  document.addEventListener('keydown', function (e) {
    var k = e.keyCode;
    if (k === KEY.OK && okDown) { e.preventDefault(); return; }   // key repeat while held
    if (k === KEY.OK) okDown = true;
    if (editing) {
      if (k === KEY.LEFT) moveTo(focused - 1);
      else if (k === KEY.RIGHT) moveTo(focused + 1);
      else if (k === KEY.UP) moveTo(focused - COLUMNS);
      else if (k === KEY.DOWN) moveTo(Math.min(focused + COLUMNS, items.length - 1));
      else if (k === KEY.OK) finishEdit(true);
      else if (k === KEY.BACK || k === KEY.ESC) finishEdit(false);
      else return;
    } else if (zone === 'inputs') {
      if (k === KEY.UP) focusInput(inputFocus - 1);
      else if (k === KEY.DOWN) focusInput(inputFocus + 1);
      else if (k === KEY.OK) { var row = inputRows[inputFocus]; hideInputs(); launch(row.appId, row.label); }
      else if (k === KEY.BACK || k === KEY.ESC || k === KEY.LEFT || k === KEY.RIGHT) hideInputs();
      else return;
    } else if (zone === 'cols') {
      if (k === KEY.LEFT && colRow === 0) focusCol(colFocus - 1);
      else if (k === KEY.RIGHT && colRow === 0) focusCol(colFocus + 1);
      else if (k === KEY.DOWN && colRow === 0) focusArrangeBtn();
      else if (k === KEY.UP && colRow === 1) focusCol(colFocus);
      else if (k === KEY.OK) { if (colRow === 1) startArrange(); else applyCols(COLS_CHOICES[colFocus]); }
      else if (k === KEY.BACK || k === KEY.ESC || k === KEY.UP || k === KEY.DOWN) hideCols();
      else if (k !== KEY.LEFT && k !== KEY.RIGHT) return;
    } else if (zone === 'pen') {
      if (k === KEY.LEFT) focusTile(lastDock());
      else if (k === KEY.UP) focusPill(pills.length - 1);
      else if (k === KEY.DOWN) focusTile(Math.min(lastDock() + COLUMNS, items.length - 1));
      else if (k === KEY.OK) showCols();
      else if (k === KEY.BACK) { /* home screen: Back goes nowhere */ }
      else return;
    } else if (zone === 'wall') {
      if (k === KEY.BACK || k === KEY.ESC || k === KEY.OK || k === KEY.LEFT || k === KEY.RIGHT ||
          k === KEY.UP || k === KEY.DOWN) hideWall();
      else return;
    } else if (zone === 'top') {
      if (k === KEY.LEFT) focusPill(pillFocus - 1);
      else if (k === KEY.RIGHT) focusPill(pillFocus + 1);
      else if (k === KEY.DOWN) focusTile(rowOf(focused) === 0 ? focused : 0);
      else if (k === KEY.OK) activatePill(pillFocus);
      else if (k === KEY.BACK) { /* home screen: Back goes nowhere */ }
      else return;
    } else {
      var col = focused % COLUMNS, last = items.length - 1;
      if (arranging && k === KEY.OK) { startEdit(); e.preventDefault(); return; }
      if (arranging && (k === KEY.BACK || k === KEY.ESC)) { stopArrange(); e.preventDefault(); return; }
      if (k === KEY.LEFT) { if (col > 0) focusTile(focused - 1); }
      else if (k === KEY.RIGHT) {
        if (col < COLUMNS - 1 && focused < last) focusTile(focused + 1);
        else if (focused === lastDock() && !arranging) focusPen();
      }
      else if (k === KEY.UP) {
        if (rowOf(focused) === 0) { if (!arranging) focusPill(pillAbove(focused)); }
        else focusTile(focused - COLUMNS);
      } else if (k === KEY.DOWN) {
        if (rowOf(focused) < rowOf(last)) focusTile(Math.min(focused + COLUMNS, last));
      } else if (k === KEY.OK) {
        okTimer = setTimeout(function () { okTimer = null; startEdit(); }, LONG_PRESS_MS);
      } else if (k === KEY.BACK) { /* home screen: Back goes nowhere */ }
      else return;
    }
    e.preventDefault();
  });

  pen.addEventListener('mouseover', function () { if (zone !== 'inputs' && zone !== 'wall' && zone !== 'cols' && !editing && !arranging) focusPen(); });
  pen.addEventListener('click', function () { if (!editing && !arranging) showCols(); });
  $('arrangeDone').addEventListener('click', stopArrange);

  pills.forEach(function (p, i) {
    p.addEventListener('mouseover', function () { if (zone !== 'inputs' && zone !== 'wall' && zone !== 'cols') focusPill(i); });
    p.addEventListener('click', function () { activatePill(i); });
  });

  // ---- lifecycle -----------------------------------------------------------------------------

  /** Back from another app (or opened again from the shortcut): replay the entrance, keep the tile. */
  function resume() {
    if (editing) finishEdit(false);
    if (arranging) { arranging = false; document.body.classList.remove('arranging'); }
    updateClock();
    if (zone === 'inputs') panel.classList.add('hidden');
    if (zone === 'wall') wallPanel.classList.add('hidden');
    if (zone === 'cols') colsPanel.classList.add('hidden');
    pen.classList.remove('focused');
    pills.forEach(function (p) { p.classList.remove('focused'); });
    zone = 'none';
    animateIn();
    focusTile(focused);
  }

  // The wallpaper page relaunches us with {reload: true} after changing the wallpaper.
  document.addEventListener('webOSRelaunch', function (e) {
    var p = (e && e.detail) || {};
    if (!p.reload && window.PalmSystem) { try { p = JSON.parse(PalmSystem.launchParams || '{}'); } catch (x) { p = {}; } }
    if (p.reload) { location.reload(); return; }
    resume();
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) resume(); });

  build();
  updateClock();
  setInterval(updateClock, 10000);
  document.documentElement.lang = CONFIG.language === 'vi' ? 'vi' : 'en';
  pills[0].querySelector('span').textContent = L.inputs;
  pills[3].querySelector('span').textContent = L.settings;
  watchNetwork();
  animateIn();
  zone = 'none';
  focusTile(0);
})();
