#!/bin/bash
start_time="$(date +"%T")"
start_pwd=$PWD
echo "* Installing : RaspDac Mini LCD Display driver"
echo "" > install_log.txt

systemctl stop lcd &>/dev/null

# ---------------------------------------------------
# install C dependencies
rm -r fbcp-ili9341 > /dev/null 2>> install_log.txt
apt-get install -y build-essential cmake > /dev/null 2>> install_log.txt  &&
git clone https://github.com/juj/fbcp-ili9341.git > /dev/null 2>> install_log.txt &&
cd fbcp-ili9341 > /dev/null 2>> install_log.txt &&
mkdir build > /dev/null 2>> install_log.txt &&
cd build > /dev/null 2>> install_log.txt &&
cmake -DILI9341=ON -DSPI_BUS_CLOCK_DIVISOR=24 -DARMV8A=ON -DGPIO_TFT_DATA_CONTROL=27 -DGPIO_TFT_RESET_PIN=24 -DSTATISTICS=0 -DDISPLAY_ROTATE_180_DEGREES=ON .. 
make > /dev/null 2>> install_log.txt &&
cp fbcp-ili9341 $start_pwd/start_lcd > /dev/null 2>> install_log.txt &&
cd $start_pwd  &&
chmod +x start_lcd &&
rm -r fbcp-ili9341  &&

# ---------------------------------------------------
# Allow user to reinstall driver from web interface 
groupadd audiophonics  &&
usermod -a -G audiophonics volumio  && 
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
# Write in userconfig
if ! grep -q "hdmi_group=2" /boot/userconfig.txt; then echo "hdmi_group=2" >> /boot/userconfig.txt; fi
if ! grep -q "hdmi_mode=87" /boot/userconfig.txt; then echo "hdmi_mode=87" >> /boot/userconfig.txt; fi
if ! grep -q "hdmi_cvt=320 240 60 1 0 0 0" /boot/userconfig.txt; then echo "hdmi_cvt=320 240 60 1 0 0 0" >> /boot/userconfig.txt; fi

# ---------------------------------------------------
# Register & enable service so display will run at boot
printf "[Unit]
Description=LCD Display Service
After=localui.service
[Service]
WorkingDirectory=${start_pwd}
ExecStart=${start_pwd}/start_lcd
ExecStop=/bin/bash ${start_pwd}/kill.sh
StandardOutput=null
Type=simple
Restart=always
KillSignal=SIGINT
[Install]
WantedBy=multi-user.target"> /etc/systemd/system/lcd.service
systemctl daemon-reload	
systemctl enable lcd		
systemctl restart lcd		


# ---------------------------------------------------
# Say something nice and exit
echo "* End of installation : RaspDac Mini LCD Display - no reboot required"
echo started at $start_time finished at "$(date +"%T")" >> install_log.txt
exit 0