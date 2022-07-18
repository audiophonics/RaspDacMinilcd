#!/bin/sh

target_distribution="$1"
if [ "$target_distribution" = "" ]
then 
    read -p "Select the target distribution : moode, volumio, picoreplayer " target_distribution
    case $target_distribution in
        moode|volumio|picoreplayer) 
			echo $target_distribution 
			break	;;
       * ) 
		   echo $target_distribution is not a valid choice 
		   exit 1 ;;
    esac
fi

current_folder=`pwd`
temp_folder='/tmp/temprdmlcdbuild'

# we need nodejs to build the app
nodebin=`which node`
if [ "$nodebin" = "" ]
then 
	echo "node not installed..."
	cd "$current_folder"/../nodebin
	sh install.sh $target_distribution
fi
nodebin=`which node`
if [ "$nodebin" = "" ]
then 
	echo "Error : could not install nodejs to build deps" 
	exit 1
else 
	echo "nodejs found OK"
fi

# remove previous build temp files if any and recreate clean directory
rm -r "$temp_folder" > /dev/null 2>&1

set -e 
mkdir -p $temp_folder

# copy any file in temp dir
cd "$current_folder"
cp -rL ./ $temp_folder/

echo "install base deps that should be there regardless of distro"
cd "$temp_folder"/rdmlcd
npm install

case "$target_distribution" in 
'moode')
	path_prefix='/usr/local'
	echo "Adding local scripts specific for moOde Audio to graphic renderer."
	cp -a "$temp_folder"/modules/moodelistener.js "$temp_folder"/rdmlcd/utils/moodelistener.js
	cp -a "$temp_folder"/modules/upnp_albumart_fallback.js "$temp_folder"/rdmlcd/utils/upnp_albumart_fallback.js
	sh ../buildrpio32_64.sh
	sh ../buildcanvas32_64.sh
	echo "...OK"
	cd "$temp_folder"
	echo "Writing installation script for moOde Audio"
	cp "$temp_folder"/installation/moode.sh installrdm_lcd.sh
	echo "Packing files"
	tar -cvhzf rdmlcd.tar.gz rdmlcd 
	tar -cvhf rdmlcd.tar rdmlcd.tar.gz installrdm_lcd.sh
	mkdir -p $current_folder/release 
	mv rdmlcd.tar $current_folder/release/rdm_"$target_distribution"_lcd.tar
;;
esac 

set +e
rm -r "$temp_folder"