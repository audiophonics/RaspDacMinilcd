#!/bin/bash


echo "Installing RaspDacMini LCD Hardware..."


SCRIPT=$(realpath "$0")
current_dir=$(dirname "$SCRIPT")

INSTALLING="/home/volumio/Audiophonics_RaspDacMiniLcd-plugin.installing"

if [ `dpkg --print-architecture` != "armhf" ]; then
	echo "This plugin is made for armhf hardware (Raspberry Pi) and cannot run under a different arch. Nothing will happen."; 
	exit 0;
fi

if [ ! -f $INSTALLING ]; then
	touch $INSTALLING

	apt-get update -y > /dev/null
	apt-get install --no-install-recommends -y \
	fbset \
	jq \
	libcairo2-dev \
	libpango1.0-dev \
	libjpeg-dev \
	libgif-dev \
	librsvg2-dev \
	lirc

	 systemctl disable lircd irexec
	 systemctl stop lircd irexec
	
	# Updating /boot/cmdline.txt to hide console at boot
	sed -i 's/\s\?fbcon=map:2//g' /boot/cmdline.txt
	sed -i '$s/$/ fbcon=map:2/' /boot/cmdline.txt

	# Expose gpio-ir kernel driver
	if ! grep -q "dtoverlay=gpio-ir,gpio_pin=4" "/boot/userconfig.txt"; then echo "dtoverlay=gpio-ir,gpio_pin=4"  >> /boot/userconfig.txt; fi
	# Configure display
	if ! grep -q "hdmi_group=2" /boot/userconfig.txt; then echo "hdmi_group=2" >> /boot/userconfig.txt; fi
	if ! grep -q "hdmi_mode=87" /boot/userconfig.txt; then echo "hdmi_mode=87" >> /boot/userconfig.txt; fi
	if ! grep -q "hdmi_cvt=320 240 60 1 0 0 0" /boot/userconfig.txt; then echo "hdmi_cvt=320 240 60 1 0 0 0" >> /boot/userconfig.txt; fi

	mkdir "$current_dir"/service

	echo "Installing Node12 (Node14 is discontinued for this arch/hardware and is not stable enough to do real-time image processing)"
	mkdir -p /tmp/node12/
	cd  /tmp/node12/
	wget -q https://nodejs.org/download/release/v12.22.12/node-v12.22.12-linux-armv7l.tar.xz >/dev/null
	tar -xvf node-v12.22.12-linux-armv7l.tar.xz >/dev/null
	rm node-v12.22.12-linux-armv7l.tar.xz

	mkdir "$current_dir"/node12
	cp -a node-v12.22.12-linux-armv7l/* "$current_dir"/node12 >/dev/null
	ln -sf "$current_dir"/node12/bin/node /usr/local/bin/node12
	ln -sf "$current_dir"/node12/bin/npm /usr/local/bin/npm12
	echo "" > $current_dir/node12/node-gyp12
	echo '#!/bin/sh' >> $current_dir/node12/node-gyp12
	echo "/usr/local/bin/node12 $current_dir/node12/lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js" '$@' >> $current_dir/node12/node-gyp12
	ln -sf $current_dir/node12/node-gyp12 /usr/local/bin/node-gyp12
	chmod +xX $current_dir/node12/node-gyp12
	chown -R volumio $current_dir/node12
	
	
	# creating systemd for ili9341 userspace driver -> /etc/systemd/system/rdmlcdfb.service 

	printf "[Unit]
Description=fbcp-ili9341 compiled for Volumio3
[Service]
ExecStartPre=`which sudo` "$current_dir"/apps/rdmlcdfb pre
ExecStart=`which sudo` "$current_dir"/apps/fbcp-ili9341
StandardOutput=null
KillSignal=SIGINT
Restart=always
Type=simple
User=root
[Install]
WantedBy=multi-user.target
"> "$current_dir"/service/rdmlcdfb.service 

	ln -s -f "$current_dir"/service/rdmlcdfb.service /etc/systemd/system/rdmlcdfb.service 

	printf "[Unit]
Description=LCD Display Service for Volumio
After=volumio.service
Requires=volumio.service
[Service]
WorkingDirectory="$current_dir"/apps/rdmlcd/
ExecStartPre=/bin/sh -c 'if (`which systemctl` -q is-active voluio-kiosk.service); then `which sudo` `which systemctl` stop volumio-kiosk ;fi' 
ExecStart=`which sudo` `which node12` "$current_dir"/apps/rdmlcd/index.js volumio
ExecStop=`which sudo` "$current_dir"/apps/rdmlcdfb post
StandardOutput=null
KillSignal=SIGINT
Type=simple
Restart=always
User=root
[Install]
WantedBy=multi-user.target"> "$current_dir"/service/rdmlcd.service 

	ln -s -f "$current_dir"/service/rdmlcd.service /etc/systemd/system/rdmlcd.service

	# Creating systemd for lirc & irexec userspace driver -> /etc/systemd/system/rdm_remote.service && /etc/systemd/system/rdm_irexec.service	
	printf "[Unit]
Wants=lircd-setup.service
After=network.target lircd-setup.service
[Service]
ExecStart=/usr/sbin/lircd -O "$current_dir"/apps/lirc/lirc_options.conf -o /var/run/lirc/lircd -H default -d /dev/lirc0 -n "$current_dir"/apps/lirc/lircd.conf
Type=simple
User=root
[Install]
WantedBy=multi-user.target
"> "$current_dir"/service/rdm_remote.service 

	ln -s -f "$current_dir"/service/rdm_remote.service  /etc/systemd/system/rdm_remote.service

	printf "[Unit]
Wants=lircd-setup.service
After=network.target lircd-setup.service
[Service]
ExecStart=/usr/bin/irexec "$current_dir"/apps/lirc/irexec.lircrc
Type=simple
User=root
[Install]
WantedBy=multi-user.target
"> "$current_dir"/service/rdm_irexec.service 
		
	ln -s -f "$current_dir"/service/rdm_irexec.service  /etc/systemd/system/rdm_irexec.service	
		
	# make sure everything is executable
	chmod +xX "$current_dir"/apps/fbcp-ili9341
	chmod +xX "$current_dir"/apps/rdmlcdfb 

		
	rm $INSTALLING
	#requred to end the plugin install
	echo "plugininstallend"
	
else
	echo "This plugin is already installing. Stopped."
fi
