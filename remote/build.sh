#!/bin/sh
target_distribution="$1"
current_folder=`pwd`
temp_folder='/tmp/temprdmlcdremotebuild'

rm -r "$temp_folder" > /dev/null 2>&1
set -e
mkdir -p $temp_folder
cp -rL ./ $temp_folder/
cd $temp_folder

case "$target_distribution" in 
volumio|moode)
cp installation/volumio_moode.sh  installrdm_remote.sh
cp -r config/"$target_distribution"/lirc ./lirc
tar -cvhzf rdmlcdremote.tar.gz ./lirc
tar -cvf rdmlcdremote.tar installrdm_remote.sh rdmlcdremote.tar.gz
mkdir -p $current_folder/release 
mv rdmlcdremote.tar $current_folder/release/rdm_"$target_distribution"_remote.tar 
;;
'volumio')
chown -R volumio $current_folder/release/
;;
"plugin_vol" )
mkdir -p $current_folder/release 
cp -r config/volumio/lirc $current_folder/release/
;;
'picore')

;;
esac 

cd $current_folder
rm -r "$temp_folder"