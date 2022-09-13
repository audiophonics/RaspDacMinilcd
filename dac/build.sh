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
temp_folder='/tmp/temprdmdacbuild'
rm -r "$temp_folder" > /dev/null 2>&1

set -e
mkdir -p $temp_folder
cp -rL ./ $temp_folder/
cd $temp_folder


case "$target_distribution" in 

volumio)
mkdir -p config
cp /data/configuration/audio_interface/alsa_controller/config.json config/alsa_controller.json
cp /data/configuration/system_controller/i2s_dacs/config.json config/i2s_dacs.json
cp /data/configuration/music_service/mpd/config.json config/mpd.json

chmod +xX apessq2m
printf "#!/bin/sh
tar -xvzf rdmdac.tar.gz -C /usr/local/bin/
chmod +xX /usr/local/bin/apessq2m
node volumio_autoconf
exit 0
" > installrdmlcd_dac.sh
tar -cvhzf rdmdac.tar.gz apessq2m 
tar -cvf rdmdac.tar installrdmlcd_dac.sh rdmdac.tar.gz volumio_autoconf
mkdir -p $current_folder/release 
mv rdmdac.tar $current_folder/release/rdm_"$target_distribution"_dac.tar 
chown -R volumio $current_folder/release 
;;

"plugin_vol" )
chmod +xX apessq2m
mkdir -p "$current_folder"/release 
cp apessq2m "$current_folder"/release/ 
chown -R volumio $current_folder/release 
;;

moode)

chmod +xX apessq2m
cp $temp_folder/installation/moode.sh installrdmlcd_dac.sh
tar -cvhzf rdmdac.tar.gz apessq2m
tar -cvf rdmdac.tar installrdmlcd_dac.sh rdmdac.tar.gz
mkdir -p $current_folder/release 
mv rdmdac.tar $current_folder/release/rdm_"$target_distribution"_dac.tar 
;;

'picore')

chmod +xX apessq2m
echo "#!/bin/sh" > installrdmlcd_dac.sh
echo "tar -xvzf rdmdac.tar.gz " >> installrdmlcd_dac.sh
echo "mv apessq2m.tcz /etc/sysconfig/tcedir/optional/apessq2m.tcz" >> installrdmlcd_dac.sh
echo "mv apessq2m.tcz.md5.txt /etc/sysconfig/tcedir/optional/apessq2m.tcz.md5.txt" >> installrdmlcd_dac.sh
echo "wget -S -q -O '/dev/null' 'localhost/cgi-bin/chooseoutput.cgi?AUDIO=audophonics_sabre_q2m'" >> installrdmlcd_dac.sh
echo "wget -S -q -O '/dev/null' 'localhost/cgi-bin/writetoconfig.cgi?FROM_PAGE=squeezelite.cgi&NAME=piCorePlayer&OUTPUT=hw\%3ACARD\%3DDAC&ALSA_PARAMS1=80&ALSA_PARAMS2=4&ALSA_PARAMS3=&ALSA_PARAMS4=1&ALSA_PARAMS5=&BUFFER_SIZE=&_CODEC=&XCODEC=&PRIORITY=&MAX_RATE=&UPSAMPLE=&MAC_ADDRESS=&SERVER_IP=127.0.0.1&LOGLEVEL=&DSDOUT=3%3Au32le&CLOSEOUT=&UNMUTE=&ALSAVOLUME=Digital&POWER_GPIO=&POWER_SCRIPT=&OTHER=&SUBMIT=Save&FROM_PAGE=squeezelite.cgi'" >> installrdmlcd_dac.sh
echo "echo apessq2m.tcz >> /etc/sysconfig/tcedir/onboot.lst" >> installrdmlcd_dac.sh
echo "tce-load -li /etc/sysconfig/tcedir/optional/apessq2m.tcz" >> installrdmlcd_dac.sh
echo "exit 0 " >> installrdmlcd_dac.sh
echo "" >> installrdmlcd_dac.sh

mkdir -p release/usr/local/bin
cp apessq2m release/usr/local/bin/

sh "$current_folder"/../nodebin/build_tcz.sh apessq2m release

tar -cvhzf rdmdac.tar.gz apessq2m.tcz apessq2m.tcz.md5.txt
tar -cvf rdmdac.tar installrdmlcd_dac.sh rdmdac.tar.gz

mkdir -p $current_folder/release 
mv rdmdac.tar $current_folder/release/rdm_"$target_distribution"_dac.tar 

;;
esac 

set +e
cd $current_folder
rm -r "$temp_folder"