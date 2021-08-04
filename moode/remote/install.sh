#!/bin/bash

start_time="$(date +"%T")"
echo "* Installing : RaspDac Mini LCD Remote"
echo "" > install_log.txt
# ---------------------------------------------------
# Install C dependencies 
apt-get install -y lirc > /dev/null 2>> install_log.txt

# ---------------------------------------------------
# Enable gpio-ir driver to allow hardware interfacing
if ! grep -q "dtoverlay=gpio-ir,gpio_pin=4" "/boot/config.txt"; then
    echo "dtoverlay=gpio-ir,gpio_pin=4"  >> /boot/config.txt
fi
rsync -a config/ /etc/lirc/

# ---------------------------------------------------
# lirc & irexec service
systemctl enable irexec.service
systemctl enable lircd.service

systemctl restart irexec.service
systemctl restart lircd.service

# ---------------------------------------------------
# Say something nice and exit
echo "* End of installation : RaspDac Mini LCD Remote - reboot required"
echo started at $start_time finished at "$(date +"%T")" >> install_log.txt
exit 0