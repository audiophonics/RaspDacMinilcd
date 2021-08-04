#!/bin/bash
#
# moOde audio player (C) 2014 Tim Curtis
# http://moodeaudio.org
#
# This Program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 3, or (at your option)
# any later version.
#
# This Program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
# 2020-04-24 TC moOde 6.5.0
#
#

# Turn off display power management
xset -dpms

# Screensaver timeout in secs or 'off' for no timeout
xset s 'off'

# Capture screen size
SCREENSIZE="$(fbset -s | awk '$1 == "geometry" { print $2","$3 }')"

# Launch chromium browser
# --disk-cache-dir=/dev/null
chromium-browser \
--app=http://localhost:4150/ap-display
--window-size=$SCREENSIZE\
--window-position=0,0\
--no-first-run\
--disable-infobars\
--disable-session-crashed-bubble\
--enable-lcd-text\
--kiosk\
--ignore-gpu-blacklist\
--enable-gpu-rasterization\
--enable-native-gpu-memory-buffers\
--enable-checker-imaging\
--disable-quic\
--enable-tcp-fast-open\
--disable-gpu-compositing\
--enable-fast-unload\
--enable-experimental-canvas-features\
--enable-scroll-prediction\
--enable-simple-cache-backend\
--max-tiles-for-interest-area=512\
--num-raster-threads=4\
--default-tile-height=512
