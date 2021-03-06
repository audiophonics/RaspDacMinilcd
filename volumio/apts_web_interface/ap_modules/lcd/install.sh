#!/bin/bash
start_time="$(date +"%T")"
echo "* Installing : LCD display server"
echo "" > install_log.txt
# ---------------------------------------------------
# get socket io (version compatible with volumio)
npm install xmlhttprequest-ssl
npm install ws
npm install socket.io-client@2.1.1


# ---------------------------------------------------
# Allow user to reconfigure kiosk in system
groupadd audiophonics > /dev/null 2>> install_log.txt &&
usermod -a -G audiophonics volumio > /dev/null 2>> install_log.txt && 
echo "group created" || echo "skip group creation"
if ! grep -q '%audiophonics ALL=(ALL) NOPASSWD: /bin/sh '${PWD}'/kiosk_autoconfig.sh' "/etc/sudoers"; then
    echo '%audiophonics ALL=(ALL) NOPASSWD: /bin/sh '${PWD}'/kiosk_autoconfig.sh' | sudo EDITOR='tee -a' visudo >> install_log.txt  2>> install_log.txt &&
    echo "allowed user to edit kiosk configuration from web interface"
fi

# ---------------------------------------------------
# Configure kiosk
bash kiosk_autoconfig.sh

# ---------------------------------------------------
# Say something nice and exit
echo "* End of installation : LCD display server - no reboot required"
echo started at $start_time finished at "$(date +"%T")" >> install_log.txt
exit 0
