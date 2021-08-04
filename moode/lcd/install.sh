#!/bin/bash
start_time="$(date +"%T")"
start_pwd=$PWD
echo "* Installing : RaspDac Mini LCD Display driver"
echo "" > install_log.txt

systemctl stop lcd &>/dev/null

# ---------------------------------------------------
# install C dependencies
echo "using fbcp-ili9341 as driver see : https://github.com/juj/fbcp-ili9341"
rm -r fbcp-ili9341
apt-get install -y build-essential cmake  &&
git clone https://github.com/juj/fbcp-ili9341.git &&
cd fbcp-ili9341 &&
mkdir build &&
cd build &&
cmake -DILI9341=ON -DSPI_BUS_CLOCK_DIVISOR=20 -DARMV8A=ON -DGPIO_TFT_DATA_CONTROL=27 -DGPIO_TFT_RESET_PIN=24 -DGPIO_TFT_BACKLIGHT=26 -DDISPLAY_ROTATE_180_DEGREES=ON -DSTATISTICS=0 .. &&
make &&
cp fbcp-ili9341 $start_pwd/start_lcd &&
cd $start_pwd  &&
rm -r fbcp-ili9341  &&
chmod +x ./start_lcd

# ---------------------------------------------------
# Allow user to reinstall driver from web interface 
groupadd audiophonics  &&
usermod -a -G audiophonics pi  && 
echo "group created" || echo "skip group creation"
if ! grep -q '%audiophonics ALL=(ALL) NOPASSWD: /bin/aplcdi *' "/etc/sudoers"; then
    echo '%audiophonics ALL=(ALL) NOPASSWD: /bin/aplcdi *' | sudo EDITOR='tee -a' visudo >> install_log.txt  &&
    echo "allowed user to reinstall driver from web interface"
fi

if [ -e /bin/aplcdi ]
then 
	echo "reinstall script already configured"
else
printf "#!/bin/sh 
cd ${PWD}
bash ${PWD}/install.sh
" > /bin/aplcdi
chmod +xX /bin/aplcdi
fi
# ---------------------------------------------------
# Write in config
if ! grep -q "hdmi_group=2" /boot/config.txt; then echo "hdmi_group=2" >> /boot/config.txt; fi
if ! grep -q "hdmi_mode=87" /boot/config.txt; then echo "hdmi_mode=87" >> /boot/config.txt; fi
if ! grep -q "hdmi_cvt=320 240 60 1 0 0 0" /boot/config.txt; then echo "hdmi_cvt=320 240 60 1 0 0 0" >> /boot/config.txt; fi

# ---------------------------------------------------
# Register & service
printf "[Unit]
Description=LCD Display Service
Wants=multi-user.target
[Service]
WorkingDirectory=${PWD}
#ExecStartPre=/bin/sleep 10
ExecStart=${PWD}/start_lcd
StandardOutput=null
User=root
Type=simple
Restart=always
KillSignal=SIGINT
[Install]
WantedBy=multi-user.target" > /etc/systemd/system/lcd.service	
systemctl restart lcd
# ---------------------------------------------------
# Say something nice and exit
echo "* End of installation : RaspDac Mini LCD Display - no reboot required"
echo started at $start_time finished at "$(date +"%T")" >> install_log.txt
exit 0
