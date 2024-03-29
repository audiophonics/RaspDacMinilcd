#!bin/sh
starting_dir=`pwd`
target_distribution="$1"
if [ "$target_distribution" = "" ]
then 
    read -p "Select the target distribution : moode, volumio, picore " target_distribution
    case $target_distribution in
        moode|volumio|picore) 
			echo $target_distribution 
			break	;;
       * ) 
		   echo $target_distribution is not a valid choice 
		   exit 1 ;;
    esac
fi


case "$target_distribution" in 
'moode')
	sudo apt update -y
	sudo apt --no-install-recommends install -y libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev git cmake nodejs npm 
	
	# pour cross-compiler le driver fbcp-ili9341 vers une arch32bit
	arch=`dpkg --print-architecture`
	if [ "$arch" = "arm64" ];
		then	
		echo "since we are on a 64-bit arch, we'll also fetch dependencies to cross-compile 32-bit and enable legacy version to run this patch"
		sudo apt-get --no-install-recommends install -y gcc-arm-linux-gnueabihf g++-arm-linux-gnueabihf;
		if [ ! -f /lib/arm-linux-gnueabihf/libbcm_host.so ] 
		then 
			 sudo apt-get --no-install-recommends install -y libc6:armhf
			 sudo apt-get --no-install-recommends install -y libraspberrypi0:armhf 
			 
			 sudo apt-get --no-install-recommends install -y libnode-dev:armhf 
			 libnode=`ls /lib/arm-linux-gnueabihf/libnode.so* | tail -1`
			 sudo apt --no-install-recommends install -y npm 
			 sudo ln -f $libnode /lib/arm-linux-gnueabihf/libnode.so 
			 
			 
			 
			 libbmc=`ls /lib/arm-linux-gnueabihf/libbcm_host.so* | tail -1`
			 sudo ln -f $libbmc /lib/arm-linux-gnueabihf/libbcm_host.so 
		fi
	fi
	
;;
'volumio')
	sh nodebin/install.sh volumio
	sudo apt update -y
	sudo apt --no-install-recommends install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev git cmake
	
;;
'picore')
	echo "Unfortunately this script is not compatible with piCore yet"
;;
esac
