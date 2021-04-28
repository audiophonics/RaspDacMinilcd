#!/bin/bash

start_time="$(date +"%T")"
echo "* Installing : Audiophonics ToolSet (web interface)"
start_pwd=${PWD}
echo "" > install_log.txt
# ---------------------------------------------------
# Install modules
for file in ap_modules/* 
do 
    test -f $file/install.sh && 
    cd $file &&
    bash install.sh 
    cd $start_pwd
done

# ---------------------------------------------------
# Enable service
printf "[Unit]
Description=Audiophonics toolset in a web interface
After=volumio.service

[Service]
WorkingDirectory=${PWD}
ExecStart= /bin/node ${PWD}/apts_web_interface.js 
#StandardOutput=null
Type=simple
Restart=always
User = volumio

[Install]
WantedBy=multi-user.target
"> /etc/systemd/system/apts_web_interface.service &&

systemctl daemon-reload > /dev/null 2>> install_log.txt &&
systemctl enable apts_web_interface > /dev/null 2>> install_log.txt &&
systemctl restart apts_web_interface > /dev/null 2>> install_log.txt &&
echo "Audiophonics ToolSet service enabled & started" 
# ---------------------------------------------------
# Say something nice and exit
echo "* End of installation : Audiophonics ToolSet (web interface) - no reboot required"
echo started at $start_time finished at "$(date +"%T")" >> install_log.txt
exit 0