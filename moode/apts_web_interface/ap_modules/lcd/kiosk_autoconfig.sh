#!/bin/bash
# ---------------------------------------------------
# Overwrite xinitrc
rm -rf ~/.config/chromium/Singleton*
rm  /home/pi/.xinitrc
cp config_files/.xinitrc /home/pi/.xinitrc
systemctl restart localui
systemctl restart lcd 
