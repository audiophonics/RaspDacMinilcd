#!/bin/bash

SRC=/etc/apt/sources.list
if ! grep -q 'stretch' $SRC; then
	sed -i '$adeb http://raspbian.raspberrypi.org/raspbian/ stretch main contrib non-free rpi' $SRC
fi
apt-get update

apt-get -y install binutils
apt-get -y install libstdc++-4.9-dev
apt-get -y install gcc-4.9 gcc g++-4.9 g++ dpkg-dev

sed -i '/stretch/d' $SRC
apt-get update

