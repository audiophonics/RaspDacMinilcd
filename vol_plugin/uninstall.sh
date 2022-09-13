#!/bin/bash

SCRIPT=$(realpath "$0")
current_dir=$(dirname "$SCRIPT")

systemctl stop rdmlcd
systemctl stop rdmlcdfb
systemctl stop remote
systemctl stop irexec


rm -r $current_dir/service
rm -r /etc/systemd/system/rdmlcdfb.service 
rm -r /etc/systemd/system/rdmlcd.service 
rm -r /etc/systemd/system/remote.service 

echo "Done"
echo "pluginuninstallend"