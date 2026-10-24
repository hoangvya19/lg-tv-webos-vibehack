#!/usr/bin/env bash
# LG TV Vibehack - installer for TVs WITHOUT root (Developer Mode).
# Run it on a Mac or Linux computer on the same network as the TV:
#
#   ./install-noroot.sh
#
# It asks for the TV's IP and Developer Mode passphrase the first time, then reads your apps,
# packages the launcher and installs it. Run it again whenever you add or remove apps.
# Personal settings (language, columns, weather, wallpaper): edit app/config.js first.
set -euo pipefail
cd "$(dirname "$0")"
APP_ID=com.gathin.tvhome
DEVICE="${DEVICE:-lgtv}"

ares() {
  if command -v "ares-$1" >/dev/null; then "ares-$1" "${@:2}"
  else npx -y -p @webos-tools/cli "ares-$1" "${@:2}"; fi
}

command -v python3 >/dev/null || { echo "Please install Python 3 first: https://www.python.org/downloads/"; exit 1; }
command -v npx >/dev/null || { echo "Please install Node.js (LTS) first: https://nodejs.org/"; exit 1; }

if [ -z "${TV_HOST:-}" ]; then
  [ -f .tv-host ] && TV_HOST=$(cat .tv-host)
  read -r -p "TV IP address [${TV_HOST:-e.g. 192.168.1.50}]: " IN
  TV_HOST="${IN:-${TV_HOST:-}}"
  [ -n "$TV_HOST" ] || { echo "TV IP is required."; exit 1; }
  echo "$TV_HOST" > .tv-host
fi

if [ ! -x venv/bin/python ]; then
  echo "==> Setting up Python helper (one time)"
  python3 -m venv venv
  venv/bin/pip install -q websockets
fi

if ! ares setup-device --list 2>/dev/null | grep -q "^$DEVICE "; then
  echo "==> Connecting to the TV (one time)"
  echo "    On the TV: open the Developer Mode app and turn ON 'Key Server'."
  ares setup-device -a "$DEVICE" -i "{'host':'$TV_HOST','port':'9922','username':'prisoner'}"
  ares novacom --device "$DEVICE" --getkey
  read -r -p "Passphrase shown in the Developer Mode app: " PASS
  ares setup-device -m "$DEVICE" -i "{'privatekey':'${DEVICE}_webos','passphrase':'$PASS'}"
fi

echo "==> Reading your apps (accept the prompt on the TV the first time)"
venv/bin/python sync-apps.py "$TV_HOST"

[ -f app/wallpaper.jpg ] && cp app/wallpaper.jpg app/bg.jpg

echo "==> Packaging and installing"
rm -rf build && mkdir build
ares package app -o build
ares install -d "$DEVICE" build/${APP_ID}_*.ipk
ares launch -d "$DEVICE" "$APP_ID"
echo
echo "Done. Tip: while the launcher is open, hold a number key on the remote to make it a one-press shortcut."
