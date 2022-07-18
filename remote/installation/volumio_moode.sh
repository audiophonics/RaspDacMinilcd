#!/bin/sh
echo ""
echo "Installing remote"
echo ""
# ---------------------------------------------------
# Install dependencies 
set -e
echo "installing dependencies"
apt-get update -y > /dev/null
apt-get install --no-install-recommends -y lirc > /dev/null

# ---------------------------------------------------
# make sure userconfig exists to survive updates
echo "configuring userconfig with GPIO pins for remote"
touch /boot/userconfig.txt
sed -i '/include userconfig.txt/d' /boot/config.txt
echo "include userconfig.txt" >> /boot/config.txt

# ---------------------------------------------------
# Enable gpio-ir driver to allow hardware interfacing
if ! grep -q "dtoverlay=gpio-ir,gpio_pin=4" "/boot/userconfig.txt"; then
    echo "dtoverlay=gpio-ir,gpio_pin=4"  >> /boot/userconfig.txt
fi

# ---------------------------------------------------
# push config
echo "extracting files."
tar -xvzf rdmlcdremote.tar.gz -C /etc/


# tune config to load 32-bit / 64-bit libs depending on system arch
arch=`dpkg --print-architecture` 
if [ "$arch" = "arm64" ]
then
	sudo sed -i 's/--nodaemon.*$/--nodaemon -U \/usr\/lib\/aarch64-linux-gnu\/lirc\/plugins/' /lib/systemd/system/lircd.service
else
	sudo sed -i 's/--nodaemon.*$/--nodaemon -U \/usr\/lib\/arm-linux-gnueabihf\/lirc\/plugins/' /lib/systemd/system/lircd.service
fi
# ---------------------------------------------------
# enable service

systemctl daemon-reload
systemctl enable lircd
systemctl restart lircd
systemctl enable irexec
systemctl restart irexec

echo ""
echo "Remote installed. Will be fully functionnal after a reboot."
echo ""
exit 0