#!/bin/sh

echo ""
echo "Installing DAC"
echo ""

set -e
if [ "$1" = "-help" ];
then
	printf "Pass either one those flags : (mutually exclusive)	
\033[32m -noconfig \033[0m 
Completely ignores configuration step. 
Use this to keep your current configuration while allowing apps (namely the LCD display and the remote) to talk to the DAC.
Those are the items that are ignored by noconfig 
	- setting DSD config to DOP in MPD configuration
	- set the mixer type to Hardware
	- set moOde Audio to use i-sabre-q2m dtoverlay 
		
\033[32m -noinstall \033[0m  
Completely ignores the file installation step. 
Use this if you have already installed this before and you want to restore the default configuration of your Raspdac Mini LCD
________________________________

If this is your first configuration or if you changed the DAC, you will need to reboot after installing this.
" 
	exit 0
fi;
if [ "$1" != "-noconfig" ];
then
	session=`sqlite3 /var/local/www/db/moode-sqlite3.db "select value from cfg_system where param ='sessionid'"`
	
	# yes I recorded the rest seqence from my browser and it looks silly.

   curl -s 'http://moode/snd-config.php' -q \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9' \
  -H 'Accept-Language: fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7' \
  -H 'Cache-Control: no-cache' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H "Cookie: PHPSESSID=$session" \
  -H 'Origin: http://moode' \
  -H 'Pragma: no-cache' \
  -H 'Referer: http://moode/snd-config.php' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36' \
  --data-raw 'output_device=0&mixer_type=hardware&i2sdevice=Audiophonics+ES9028%2F9038+DAC&update_i2s_device=novalue&i2soverlay=None&drvoptions=none&alsavolume_max=100&alsa_output_mode=plughw&alsa_loopback=Off&autoplay=0&ashufflesvc=0&ashuffle_mode=Track&ashuffle_filter=None&volume_step_limit=10&volume_mpd_max=100&volume_db_display=0&usb_volknob=0&rotaryenc=0&rotenc_params=100+2+3+23+24&mpdcrossfade=0&crossfeed=Off&invert_polarity=0&mpd_httpd=0&mpd_httpd_port=8000&mpd_httpd_encoder=lame&eqfa12p=0&alsaequal=Off&camilladsp=off&btsvc=0&btname=Moode+Bluetooth&pairing_agent=0&btmulti=0&rsmafterbt=0&airplaysvc=0&airplayname=Moode+Airplay&rsmafterapl=No&spotifysvc=0&spotifyname=Moode+Spotify&rsmafterspot=No&slsvc=0&rsmaftersl=No&upnpsvc=0&upnpname=Moode+UPNP&dlnasvc=0&dlnaname=Moode+DLNA&upnp_browser=0' \
  --compressed \
  --insecure > /dev/null
  
  sleep 2
  
  curl -s 'http://moode/mpd-config.php' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9' \
  -H 'Accept-Language: fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7' \
  -H 'Cache-Control: no-cache' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H "Cookie: PHPSESSID=$session" \
  -H 'Origin: http://moode' \
  -H 'Pragma: no-cache' \
  -H 'Referer: http://moode/mpd-config.php' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36' \
  --data-raw 'save=1&conf%5Bdop%5D=yes&conf%5Bstop_dsd_silence%5D=no&conf%5Bthesycon_dsd_workaround%5D=no&sox_enabled=No&sox_bit_depth=*&sox_sample_rate=*&sox_channels=2&conf%5Bselective_resample_mode%5D=0&conf%5Bsox_quality%5D=high&conf%5Bsox_precision%5D=20&conf%5Bsox_phase_response%5D=50&conf%5Bsox_passband_end%5D=95&conf%5Bsox_stopband_begin%5D=100&conf%5Bsox_attenuation%5D=0&conf%5Bsox_flags%5D=0&conf%5Bsox_multithreading%5D=1&conf%5Breplaygain%5D=off&conf%5Breplaygain_preamp%5D=0&conf%5Bvolume_normalization%5D=no&conf%5Baudio_buffer_size%5D=4&conf%5Bmax_output_buffer_size%5D=128&conf%5Bmax_playlist_length%5D=16384&conf%5Binput_cache%5D=Disabled&conf%5Blog_level%5D=default' \
  --compressed \
  --insecure > /dev/null
  
	echo "Restart mpd" 
	systemctl restart mpd
fi
if [ "$1" != "-noinstall" ];
then
	echo "extracting files"
	tar -xvzf rdmdac.tar.gz -C /usr/local/bin/ > /dev/null
	chmod +xX /usr/local/bin/apessq2m
	echo "installing dependencies"
	apt-get update -y > /dev/null
	apt-get install -y bc > /dev/null
fi
echo "DAC installed. Will be fully functionnal after a reboot." 
exit 0
