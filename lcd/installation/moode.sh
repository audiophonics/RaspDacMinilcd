#!/bin/sh
echo ""
echo "Installing LCD renderer"
echo ""
path_prefix="/usr/local"
set -e
echo "installing dependencies (this part can take around 5 minutes if this is your first time running this script)"
apt-get update -y > /dev/null
apt-get install --no-install-recommends -y nodejs npm jq libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev > /dev/null
mkdir -p "$path_prefix"/etc/
echo "extracting files"
tar -xvzf rdmlcd.tar.gz -C "$path_prefix"/etc/ > /dev/null
set +e
rm "$path_prefix"/bin/rdmlcd
ln -s "$path_prefix"/etc/rdmlcd/rdmlcd.sh "$path_prefix"/bin/rdmlcd
set -e
chmod +x "$path_prefix"/bin/rdmlcd


printf "[Unit]
Description=LCD Display Service for moOde
After=mpd.service
Requires=mpd.service
[Service]
WorkingDirectory="$path_prefix"/etc/rdmlcd/
ExecStartPre=`which sudo` `which systemctl` stop localui
ExecStart=`which sudo` `which node` "$path_prefix"/etc/rdmlcd/index.js moode
StandardOutput=null
KillSignal=SIGINT
Type=simple
Restart=always
User=root
[Install]
WantedBy=multi-user.target"> /etc/systemd/system/rdmlcd.service 
set +e
systemctl daemon-reload
systemctl stop localui	
systemctl enable rdmlcd	
systemctl restart rdmlcd
echo "LCD graphics renderer installed."
exit 0
	