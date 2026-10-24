#!/bin/sh
# Called by LG Input Hook when the Home button is pressed.
/usr/bin/luna-send -n 1 luna://com.webos.applicationManager/launch '{"id":"com.gathin.tvhome"}' >/dev/null 2>&1
