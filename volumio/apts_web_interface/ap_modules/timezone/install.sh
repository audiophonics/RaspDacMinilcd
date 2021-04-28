#!/bin/bash

start_time="$(date +"%T")"
echo "* Installing : Timezone Editor (web interface)"
echo "" > install_log.txt
# ---------------------------------------------------
# Allow user to change timezone in system
groupadd audiophonics > /dev/null 2>> install_log.txt &&
usermod -a -G audiophonics volumio > /dev/null 2>> install_log.txt && 
echo "group created" || echo "skip group creation"

if ! grep -q '%audiophonics ALL=(ALL) NOPASSWD: /bin/sh '${PWD}'/settime.sh *' "/etc/sudoers"; then
    echo '%audiophonics ALL=(ALL) NOPASSWD: /bin/sh '${PWD}'/settime.sh *' | sudo EDITOR='tee -a' visudo >> install_log.txt  2>> install_log.txt &&
    echo "allowed user to edit system timezone from web interface"
fi

# ---------------------------------------------------
# Say something nice and exit
echo "* End of installation : Timezone Editor (web interface) - no reboot required"
echo started at $start_time finished at "$(date +"%T")" >> install_log.txt
exit 0