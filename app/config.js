// Default launcher settings.
// Rooted TVs: change these with the installer flags (see README) - they are saved in user.js.
// No-root: edit this file, then run ./install-noroot.sh again.
// App ids: `python3 sync-apps.py <TV IP> --list`, or look in app/apps.js after a sync.
window.CONFIG = {
  // Apps pinned to the dock row, in this order. Missing apps are skipped.
  dockApps: ['netflix', 'amazon', 'youtube.leanback.v4', 'org.jellyfin.webos', 'org.xbmc.kodi', 'com.webos.app.browser'],

  // Apps never shown as tiles (inputs and Live TV are already in the Inputs menu).
  hiddenApps: [
    'com.gathin.tvhome',
    'com.webos.app.livetv',
    'com.webos.app.hdmi1', 'com.webos.app.hdmi2', 'com.webos.app.hdmi3', 'com.webos.app.hdmi4',
    'com.webos.app.lgchannels', 'tv.amasian.webos.vn1.channels',   // LG Channels (global, Vietnam)
    'shortcutcopilot'             // Copilot
  ],

  // The Live TV app, offered at the end of the Inputs menu. Leave empty to omit.
  liveTvApp: 'com.webos.app.livetv',

  // Tiles per row (3-10). The dock always has this many slots. Tiles resize automatically.
  // On the TV, the pencil next to the dock changes it (that choice wins over this one).
  columns: 6,

  // 'en' or 'vi'
  language: 'en',

  // true = 14:45, false = 2:45 pm
  clock24: false,

  // Background image file inside the app folder (e.g. 'bg.jpg'). Empty = plain black.
  wallpaper: '',
  // How much to darken the wallpaper so text stays readable: 0 (none) to 0.8.
  wallpaperDim: 0.35,
  // Coloured glow behind the focused app. Turn off if it clashes with your wallpaper.
  ambientGlow: true,

  // Weather from Open-Meteo (free, no account). Set your coordinates to turn it on.
  weather: { enabled: false, latitude: 0, longitude: 0, place: '', unit: 'celsius' }
};
