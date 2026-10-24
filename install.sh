#!/bin/sh
# LG TV Vibehack - one-command installer for ROOTED LG webOS TVs.
# Run it ON the TV as root (over SSH):
#
#   curl -fsSL https://raw.githubusercontent.com/hoangvya19/lg-tv-vibehack/main/install.sh | sh
#
# Options (add after `sh -s --`), e.g.
#   curl -fsSL .../install.sh | sh -s -- --lang vi --city "Hanoi" --wallpaper https://example.com/photo.jpg
#
#   --lang en|vi            Interface language (default: en)
#   --clock24 on|off        24-hour clock
#   --columns N             Tiles per row, 3-10 (default: 6; the pencil next to the dock overrides it)
#   --city "Name"           Turn on weather for this city (looked up on Open-Meteo)
#   --fahrenheit            Weather in °F
#   --no-weather            Turn weather off
#   --wallpaper URL|PATH    Background picture (web link, or a file on the TV / USB stick)
#   --no-wallpaper          Back to plain black
#   --dim 0-0.8             Darken the wallpaper so text stays readable (default: 0.35)
#   --glow on|off           Coloured glow behind the focused app
#   --no-home-button        Do not remap the remote's Home button
#   --uninstall             Remove everything this script installed
set -e

REPO="hoangvya19/lg-tv-vibehack"
BRANCH="main"
RAW="https://raw.githubusercontent.com/$REPO/$BRANCH"
IPK_URL="https://github.com/$REPO/releases/latest/download/lg-tv-vibehack.ipk"

APP_ID="com.gathin.tvhome"
APP_DIR="/media/developer/apps/usr/palm/applications/$APP_ID"
DATA="/home/root/lg-tv-vibehack"
INITD="/var/lib/webosbrew/init.d/lg-tv-vibehack"
HOOK_APP="/media/developer/apps/usr/palm/applications/org.webosbrew.inputhook"
HOOK_CFG="/home/root/.config/lginputhook/keybinds.json"
HOME_KEY="773"
export PATH=/usr/sbin:/usr/bin:/sbin:/bin:$PATH

say()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m ok\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m  !\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

# luna_wait URI JSON: subscribes and waits until the app installer reports it is done.
# (`luna-send -n 1` returns after the first reply, before the job has finished.)
luna_wait() {
  node -e '
    var spawn=require("child_process").spawn;
    var p=spawn("luna-send",["-i",process.argv[1],process.argv[2]]);
    var out="",done=false;
    function end(code,msg){if(done)return;done=true;p.kill();if(msg)console.error(msg);process.exit(code);}
    p.stdout.on("data",function(d){out+=d;
      if(/"statusValue":\s*30|"state":\s*"(installed|removed)"/.test(out)) end(0);
      if(/"errorCode"|"state":\s*"(install|remove) failed"|"state":\s*"failed"|"returnValue":\s*false/.test(out)) end(1,out);
    });
    setTimeout(function(){end(1,"Timed out waiting for the app installer:\n"+out)},120000);
  ' "$1" "$2"
}

# ---------------------------------------------------------------- options
LANG_OPT=""; CLOCK=""; COLS=""; CITY=""; FAHR=""; NOWEATHER=""; WALL=""; NOWALL=""; DIM=""; GLOW=""
HOME_BTN=1; UNINSTALL=""
while [ $# -gt 0 ]; do
  case "$1" in
    --lang) LANG_OPT="$2"; shift ;;
    --clock24) CLOCK="$2"; shift ;;
    --columns) COLS="$2"; shift ;;
    --city) CITY="$2"; shift ;;
    --fahrenheit) FAHR=1 ;;
    --no-weather) NOWEATHER=1 ;;
    --wallpaper) WALL="$2"; shift ;;
    --no-wallpaper) NOWALL=1 ;;
    --dim) DIM="$2"; shift ;;
    --glow) GLOW="$2"; shift ;;
    --no-home-button) HOME_BTN="" ;;
    --uninstall) UNINSTALL=1 ;;
    *) die "Unknown option: $1" ;;
  esac
  shift
done

# ---------------------------------------------------------------- checks
[ "$(id -u)" = "0" ] || die "Run this as root over SSH (ssh root@<TV IP>). The webOS Terminal app is not root."
[ -d /var/lib/webosbrew ] || die "Homebrew Channel with root not found. Root the TV first (see README)."
for c in node luna-send curl; do command -v "$c" >/dev/null 2>&1 || die "'$c' not found on this TV."; done

# ---------------------------------------------------------------- uninstall
if [ -n "$UNINSTALL" ]; then
  say "Removing LG TV Vibehack"
  pkill -f "$DATA/homewatch.js" 2>/dev/null || true
  pkill -f "$DATA/wallpaper-server.js" 2>/dev/null || true
  rm -f "$INITD"
  if [ -f "$HOOK_CFG" ]; then
    node -e '
      var fs=require("fs"),f=process.argv[1],k=process.argv[2];
      var j={}; try{j=JSON.parse(fs.readFileSync(f,"utf8"))}catch(e){}
      if(j[k]&&String(j[k].command||"").indexOf("lg-tv-vibehack")!==-1){delete j[k];fs.writeFileSync(f,JSON.stringify(j));}
    ' "$HOOK_CFG" "$HOME_KEY"
  fi
  luna_wait luna://com.webos.appInstallService/remove "{\"id\":\"$APP_ID\",\"subscribe\":true}" || warn "Could not remove the launcher app"
  rm -f /tmp/lg-tv-vibehack.log
  rm -rf "$DATA"
  ok "Removed. Reboot the TV to get LG's Home button back: reboot"
  exit 0
fi

# ---------------------------------------------------------------- files
say "Downloading scripts"
mkdir -p "$DATA/icons"
for f in sync.js homewatch.js wallpaper-server.js wallpaper.html golauncher.sh boot.sh; do
  curl -fsSL "$RAW/tv/$f" -o "$DATA/$f" || die "Could not download $f. Is the TV online?"
done
chmod +x "$DATA"/*.sh "$DATA"/*.js
ok "Scripts in $DATA"

# ---------------------------------------------------------------- settings
[ -f "$DATA/settings.json" ] || echo '{"language":"en","columns":6}' > "$DATA/settings.json"

LAT=""; LON=""; PLACE=""
if [ -n "$CITY" ]; then
  say "Looking up \"$CITY\" for the weather"
  Q=$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$CITY")
  GEO=$(curl -fsSL "https://geocoding-api.open-meteo.com/v1/search?name=$Q&count=1&format=json") || die "Weather lookup failed (no internet?)"
  LAT=$(echo "$GEO" | node -e 'var s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{var r=JSON.parse(s).results[0];process.stdout.write(String(r.latitude))}catch(e){}})')
  LON=$(echo "$GEO" | node -e 'var s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{var r=JSON.parse(s).results[0];process.stdout.write(String(r.longitude))}catch(e){}})')
  PLACE=$(echo "$GEO" | node -e 'var s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{var r=JSON.parse(s).results[0];process.stdout.write(r.name)}catch(e){}})')
  [ -n "$LAT" ] || die "City \"$CITY\" not found. Try the English name, e.g. \"Ho Chi Minh City\"."
  ok "$PLACE ($LAT, $LON)"
fi

if [ -n "$WALL" ]; then
  say "Setting wallpaper"
  case "$WALL" in
    http://*|https://*) curl -fsSL "$WALL" -o "$DATA/wallpaper.jpg" || die "Could not download the wallpaper" ;;
    *) [ -f "$WALL" ] || die "File not found: $WALL"; cp "$WALL" "$DATA/wallpaper.jpg" ;;
  esac
  ok "Wallpaper saved"
fi
[ -n "$NOWALL" ] && rm -f "$DATA/wallpaper.jpg"

LANG_OPT="$LANG_OPT" CLOCK="$CLOCK" COLS="$COLS" LAT="$LAT" LON="$LON" PLACE="$PLACE" FAHR="$FAHR" \
NOWEATHER="$NOWEATHER" DIM="$DIM" GLOW="$GLOW" node -e '
  var fs=require("fs"),f=process.argv[1],e=process.env,s={};
  try{s=JSON.parse(fs.readFileSync(f,"utf8"))}catch(x){}
  if(e.LANG_OPT) s.language=e.LANG_OPT==="vi"?"vi":"en";
  if(e.CLOCK) s.clock24=e.CLOCK==="on";
  if(e.COLS){var n=parseInt(e.COLS,10); if(n>=3&&n<=10) s.columns=n;}
  if(e.DIM){var d=parseFloat(e.DIM); if(d>=0&&d<=0.8) s.wallpaperDim=d;}
  if(e.GLOW) s.ambientGlow=e.GLOW!=="off";
  if(e.LAT) s.weather={enabled:true,latitude:+e.LAT,longitude:+e.LON,place:e.PLACE,unit:e.FAHR?"fahrenheit":"celsius"};
  if(e.NOWEATHER&&s.weather) s.weather.enabled=false;
  fs.writeFileSync(f,JSON.stringify(s,null,1));
' "$DATA/settings.json"
ok "Settings saved in $DATA/settings.json"

# ---------------------------------------------------------------- launcher app
say "Installing the launcher (latest release)"
# Stop the Home watcher first: while the old launcher is replaced, LG's home shows and the watcher
# would start the new launcher before its app list and settings are written.
pkill -f "$DATA/homewatch.js" 2>/dev/null || true
pkill -f "$DATA/wallpaper-server.js" 2>/dev/null || true
curl -fsSL "$IPK_URL" -o /tmp/lg-tv-vibehack.ipk || die "Could not download the launcher package."
luna_wait luna://com.webos.appInstallService/dev/install \
  '{"id":"com.ares.defaultName","ipkUrl":"/tmp/lg-tv-vibehack.ipk","subscribe":true}' || die "Install failed (see message above)."
rm -f /tmp/lg-tv-vibehack.ipk
ok "Launcher installed"

# ---------------------------------------------------------------- app list, settings, wallpaper
say "Reading your apps"
node "$DATA/sync.js" || die "App sync failed."

# ---------------------------------------------------------------- start at boot + Home watcher
cp "$DATA/boot.sh" "$INITD"
chmod +x "$INITD"
nohup setsid /usr/bin/node "$DATA/homewatch.js" >> /tmp/lg-tv-vibehack.log 2>&1 < /dev/null &
nohup setsid /usr/bin/node "$DATA/wallpaper-server.js" >> /tmp/lg-tv-vibehack.log 2>&1 < /dev/null &
ok "Starts automatically at every boot"

# ---------------------------------------------------------------- Home button
if [ -n "$HOME_BTN" ]; then
  if [ -d "$HOOK_APP" ]; then
    mkdir -p "$(dirname "$HOOK_CFG")"
    node -e '
      var fs=require("fs"),f=process.argv[1],k=process.argv[2],cmd=process.argv[3];
      var j={}; try{j=JSON.parse(fs.readFileSync(f,"utf8"))}catch(e){}
      j[k]={action:"exec",command:cmd}; fs.writeFileSync(f,JSON.stringify(j));
    ' "$HOOK_CFG" "$HOME_KEY" "$DATA/golauncher.sh"
    ok "Home button mapped to the launcher (takes effect after a reboot)"
  else
    warn "LG Input Hook is not installed: the Home button still opens LG's home for a moment."
    warn "Install 'LG Input Hook' from the Homebrew Channel, then run this command again."
  fi
fi

luna-send -n 1 luna://com.webos.applicationManager/launch "{\"id\":\"$APP_ID\",\"params\":{\"reload\":true}}" >/dev/null 2>&1 || true
echo
ok "Done! Reboot once to finish:  reboot"
