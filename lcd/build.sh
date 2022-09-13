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
# also volumio on 32bit arch uses node14 which is discontinued for this system, so we install node 12 alongside

cd "$current_folder"/../nodebin
sh install.sh $target_distribution

# remove previous build temp files if any and recreate clean directory
rm -r "$temp_folder" > /dev/null 2>&1

set -e 
mkdir -p $temp_folder

# copy any file in temp dir
cd "$current_folder"
cp -rL ./ $temp_folder/


case "$target_distribution" in 
'moode')

	echo "install base deps that should be there regardless of distro"
	cd "$temp_folder"/rdmlcd
	npm install

	echo "Adding local scripts specific for moOde Audio to graphic renderer."
	cp -a "$temp_folder"/modules/moodelistener.js "$temp_folder"/rdmlcd/utils/moodelistener.js
	cp -a "$temp_folder"/modules/upnp_albumart_fallback.js "$temp_folder"/rdmlcd/utils/upnp_albumart_fallback.js
	sh ../buildrpio32_64.sh "$target_distribution"
	sh ../buildcanvas32_64.sh "$target_distribution"
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

'volumio')

	echo "install base deps that should be there regardless of distro"
	cd "$temp_folder"/rdmlcd
	npm12 install
	
	echo "Adding local scripts specific for Volumio to graphic renderer."
	socket_client_version=$(echo "console.log(`cat /volumio/node_modules/socket.io-client/package.json`.version)" | node)
	printf "\tsocket.io-client@${socket_client_version}  (communication with Volumio player)..."
	npm12 install socket.io-client@"$socket_client_version"
	
	cp -a "$temp_folder"/modules/volumiolistener.js "$temp_folder"/rdmlcd/utils/volumiolistener.js
	sh ../buildrpio32_64.sh "$target_distribution"
	sh ../buildcanvas32_64.sh "$target_distribution"
	cp -a  "$current_folder"/../nodebin/install.sh  "$temp_folder"/rdmlcd/installnodev12.sh
	echo "...OK"
	cd "$temp_folder"
	echo "Writing installation script for Volumio"
	cp "$temp_folder"/installation/volumio.sh installrdm_lcd.sh
	echo "Packing files"
	tar -cvhzf rdmlcd.tar.gz rdmlcd 
	tar -cvhf rdmlcd.tar rdmlcd.tar.gz installrdm_lcd.sh
	mkdir -p $current_folder/release 
	mv rdmlcd.tar $current_folder/release/rdm_"$target_distribution"_lcd.tar
	chown -R volumio $current_folder/release
;;
'plugin_vol')
	echo "install base deps that should be there regardless of distro"
	cd "$temp_folder"/rdmlcd
	npm12 install
	
	echo "Adding local scripts specific for Volumio to graphic renderer."
	socket_client_version=$(echo "console.log(`cat /volumio/node_modules/socket.io-client/package.json`.version)" | node)
	printf "\tsocket.io-client@${socket_client_version}  (communication with Volumio player)..."
	npm12 install socket.io-client@"$socket_client_version"
	
	cp -a "$temp_folder"/modules/volumiolistener.js "$temp_folder"/rdmlcd/utils/volumiolistener.js
	sh ../buildrpio32_64.sh volumio
	sh ../buildcanvas32_64.sh volumio
	cp -a  "$current_folder"/../nodebin/install.sh  "$temp_folder"/rdmlcd/installnodev12.sh
	echo "...OK"
	cd "$temp_folder"
	set +e
	rm -r $current_folder/release 
	set -e
	mkdir -p $current_folder/release 
	mv "$temp_folder"/rdmlcd/ $current_folder/release/
	chown -R volumio $current_folder/release
;;
esac 
set +e
rm -r "$temp_folder"