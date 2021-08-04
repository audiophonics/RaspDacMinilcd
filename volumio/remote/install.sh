#!/bin/bash

start_time="$(date +"%T")"
echo "* Installing : Audiophonics Evo Remote"
echo "" > install_log.txt
# ---------------------------------------------------
# Install C dependencies 
apt-get install -y lirc > /dev/null 2>> install_log.txt

# ---------------------------------------------------
# Enable gpio-ir driver to allow hardware interfacing
if ! grep -q "dtoverlay=gpio-ir,gpio_pin=4" "/boot/userconfig.txt"; then
    echo "dtoverlay=gpio-ir,gpio_pin=4"  >> /boot/userconfig.txt
fi
rsync -a config/ /etc/lirc/

# ---------------------------------------------------
# Say something nice and exit
echo "* End of installation : Evo Remote - reboot required"
echo started at $start_time finished at "$(date +"%T")" >> install_log.txt
exit 0