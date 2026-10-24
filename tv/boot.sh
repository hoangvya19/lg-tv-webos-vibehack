#!/bin/sh
# Started by the Homebrew Channel at every boot (via /var/lib/webosbrew/init.d/lg-tv-vibehack).
# Starts the Home watcher right away (it waits for webOS itself), then refreshes the app list once
# webOS has settled and starts the wallpaper page.
export PATH=/usr/sbin:/usr/bin:/sbin:/bin:$PATH
DIR=/home/root/lg-tv-vibehack
LOG=/tmp/lg-tv-vibehack.log
echo "$(date) boot" >> "$LOG"
nohup setsid /usr/bin/node $DIR/homewatch.js >> "$LOG" 2>&1 < /dev/null &
nohup setsid sh -c "sleep 30; /usr/bin/node $DIR/sync.js; exec /usr/bin/node $DIR/wallpaper-server.js" >> "$LOG" 2>&1 < /dev/null &
