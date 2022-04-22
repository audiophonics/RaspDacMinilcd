# RaspDac Mini LCD for moOde Audio 8+

![This is the correct hardware](https://www.audiophonics.fr/img/cms/Images/Produits/15K/15148/rdinpage_2mlcd4.jpg)


## Usage : 
- You should use this on a fresh moOde Audio 8+ image. Such image can be downloaded from [here](https://moodeaudio.org/#download).
- Most DAC functions and MPD are pre-configured with this script. Still could not find a reliable to set Hardware volume without doing too much black magic reboot, so you might want to configure that in http://moode/snd-config.php (2nd entry).
- If this set of file is not working on your moOde Audio version, you should try to rebuild the patch from source (soon to be uploaded).
- This has not been tested on moOde < 8

## Important note :
I removed the chromium layer from the display and replaced it by a nodejs generated canvas that writes directly to the main framebufffer. 
Because of this you no longer have to enable localUI in http://moode/sys-config.php.
In fact you should not enable Local UI display **at all** since both process will then try to take over the display and thus produce a glitchy image.


## How to install : 
- Connect to your RDM LCD through SSH and run the following commands : 
```
wget https://github.com/audiophonics/RaspDacMinilcd/archive/moode.zip

unzip moode.zip

cd RaspDacMinilcd-moode

sudo sh install_rdm_moode.sh

```
- Display should turn on after a couple minutes.
- Remote and DAC need a reboot to be fully working.
```
sudo reboot
```

## What does it do : 
- Automatic configuration of snd-config within moOde (I2S output & MPD DSD). 
    - Exposes a script to configure the DAC functions. Run ```apessq2m help``` to get more details.
- Installation of a precompiled fbcp-ili9341 driver.
    - You can disable / enable the display by running ```sudo systemctl disable rdmlcd rdmlcdfb```  / ```sudo systemctl enable rdmlcd rdmlcdfb```
- Installation LIRC from apt. Creation a systemd service to run LIRC & IREXEC during boot.

## Tested on  : 
- moOde Audio 8.02 & RPI 4B Revision 1.5

