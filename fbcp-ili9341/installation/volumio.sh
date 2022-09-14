#!/bin/sh

echo ""
echo "Installing LCD driver fbcp-ili9341"
echo ""

install="/usr/sbin/"

set -e
if [ "$1" = "-help" ];
then
	printf "Pass either one those flags : (mutually exclusive)	
\033[32m -noconfig \033[0m 
Completely ignores configuration step. 
Use this if you want to configure the environment for the LCD driver yourself.
Those are the items that are ignored by noconfig 
	- edit /boot/cmdline.txt with fbcon=map:2 so console won't appear on LCD at boot. 
	- create /boot/userconfig.txt to store non-moOde boot parameters.
	- define hdmi_group, hdmi_mode & hdmi_cvt in /boot/userconfig.txt
 	- create a systemd service to run the LCD driver at boot
	
		
\033[32m -noinstall \033[0m  
Completely ignores the file installation step. 
Use this if you have already installed the driver before and you want to restore the default configuration of your Raspdac Mini LCD display driver



________________________________
" 

fi
if [ "$1" != "-noinstall" ];
then
	echo "extracting files"
	tar -xvzf rdmlcdfb.tar.gz -C "$install" > /dev/null
	chmod +x "$install"fbcp-ili9341
	chmod +x "$install"rdmlcdfb
	echo "extracting dependencies"
	apt update -y
	apt --no-install-recommends install -y fbset
	
fi
if [ "$1" != "-noconfig" ];
then
	echo "updating /boot/cmdline.txt to hide console at boot"
	cp /boot/cmdline.txt cmdline.tmp
	sed -i 's/\s\?fbcon=map:2//g' cmdline.tmp
	sed -i '$s/$/ fbcon=map:2/' cmdline.tmp
	strdate=`date +"%d_%m_%y__%H_%M_%S"`
	bakpath=/var/backups/rdmlcd/installbak/"$strdate"
	mkdir -p $bakpath
	cp /boot/cmdline.txt $bakpath/cmdline.txt
	mv cmdline.tmp /boot/cmdline.txt

	# ---------------------------------------------------
	# make sure userconfig exists to survive updates
	echo "setting display parameters in /boot/userconfig.txt"
	touch /boot/userconfig.txt
	sed -i '/include userconfig.txt/d' /boot/config.txt
	echo "include userconfig.txt" >> /boot/config.txt
	if ! grep -q "hdmi_group=2" /boot/userconfig.txt; then echo "hdmi_group=2" >> /boot/userconfig.txt; fi
	if ! grep -q "hdmi_mode=87" /boot/userconfig.txt; then echo "hdmi_mode=87" >> /boot/userconfig.txt; fi
	if ! grep -q "hdmi_cvt=320 240 60 1 0 0 0" /boot/userconfig.txt; then echo "hdmi_cvt=320 240 60 1 0 0 0" >> /boot/userconfig.txt; fi

	echo "creating systemd service -> /etc/systemd/system/rdmlcdfb.service "
	printf "[Unit]
	Description=fbcp-ili9341 compiled for Volumio3
	[Service]
	ExecStartPre=`which sudo` "$install"rdmlcdfb pre
	ExecStart=`which sudo` "$install"fbcp-ili9341
	StandardOutput=null
	KillSignal=SIGINT
	Restart=always
	Type=simple
	User=root
	[Install]
	WantedBy=multi-user.target"> /etc/systemd/system/rdmlcdfb.service 
	systemctl daemon-reload
	systemctl enable rdmlcdfb	
	systemctl restart rdmlcdfb	
fi
echo "LCD driver installed. "
exit 0
