printf "#!/bin/bash
while true; do timeout 3 bash -c \"</dev/tcp/127.0.0.1/3000\" >/dev/null 2>&1 && break; done
sed -i 's/\"exited_cleanly\":false/\"exited_cleanly\":true/' /data/volumiokiosk/Default/Preferences
sed -i 's/\"exit_type\":\"Crashed\"/\"exit_type\":\"None\"/' /data/volumiokiosk/Default/Preferences
openbox-session &
while true; do
  /usr/bin/chromium-browser \\
    --simulate-outdated-no-au='Tue, 31 Dec 2099 23:59:59 GMT' \\
	--no-first-run\\
	--disable-infobars\\
	--disable-session-crashed-bubble\\
	--enable-lcd-text\\
	--kiosk\\
	--ignore-gpu-blacklist\\
	--enable-gpu-rasterization\\
	--enable-native-gpu-memory-buffers\\
	--enable-checker-imaging\\
	--disable-quic\\
	--enable-tcp-fast-open\\
	--disable-gpu-compositing\\
	--enable-fast-unload\\
	--enable-experimental-canvas-features\\
	--enable-scroll-prediction\\
	--enable-simple-cache-backend\\
	--max-tiles-for-interest-area=512\\
	--num-raster-threads=4\\
	--default-tile-height=512\\
    --user-data-dir='/data/volumiokiosk'     http://localhost:4150/ap-display
done" > /opt/volumiokiosk.sh
rm -rf /data/volumiokiosk/Singleton*
systemctl restart volumio-kiosk