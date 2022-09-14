# RaspDac Mini LCD for Volumio 3+

![This is the correct hardware](https://www.audiophonics.fr/img/cms/Images/Produits/15K/15148/rdinpage_2mlcd4.jpg)


## Usage : 
- You should use this on a fresh Volumio 3+ image. Such image can be downloaded from [here](https://volumio.com/en/get-started/).
- This is the legacy standalone version of this code. I hope to publish this as a Volumio plugin soon which will be a better long-term solution.
- Most DAC functions and MPD are pre-configured by this script. Make sure to ignore the WebUI if you are prompted to reboot while whe installer is not done working in your SSH console.
- This has not been tested on Volumio < 3.

## Important note :

I removed the chromium layer from the display and replaced it by a nodejs generated canvas that writes directly to the main framebufffer. 
Because of this you no longer have to use the TouchDisplay Plugin.

In fact **you should not enable TouchDisplay at all** since both process will then write to the display at once, thus producing a glitchy image.
When starting, the display renderer will attempt to stop the localui service as well, so the issue will only arise if you try to start the localui service while the display is already running.  


## How to install : 
- Connect to your RDM LCD through SSH and run the following commands : 
```
wget -O rdmlcd_volumio.tar.gz https://github.com/audiophonics/RaspDacMinilcd/archive/volumio.tar.gz

tar -xvzf rdmlcd_volumio.tar.gz

cd RaspDacMinilcd-volumio

sudo sh install_rdm_volumio.sh

```
- Display should turn on after a couple minutes.
- Remote and DAC need a reboot to be fully working.
```
sudo reboot
```

## What does it do : 
- Overwrites the DAC / MPD configuration.
    - Exposes a script to configure the DAC functions. Run ```apessq2m help``` to get more details.
- Installation of a precompiled fbcp-ili9341 driver.
    - You can disable / enable the display by running ```sudo systemctl disable rdmlcd rdmlcdfb```  / ```sudo systemctl enable rdmlcd rdmlcdfb```
- Installation LIRC from apt. Creation a systemd service to run LIRC & IREXEC during boot.

## Troubleshooting

If something seems to be not working as it should, here are some tips to see what is going on. 

There are [4 main components](https://github.com/audiophonics/RaspDacMinilcd/tree/patch_compiler#anatomy-of-a-fully-customized-rdmlcd) that make the RDMLCD work: 
* The display driver 
    * You can test it by running ```sudo systemctl status rdmlcdfb```
    * Should print *active (running)* in green.
    * You can restart it by running ```sudo systemctl restart rdmlcdfb```
* The display renderer
    * You can test it by running ```sudo systemctl status rdmlcd```
    * Should print *active (running)* in green.
    * You can restart it by running ```sudo systemctl restart rdmlcd```
* The DAC layer 
    * You can test it by running ```apessq2m```
    * Should print the soundcard ID (any number, including 0) if correctly installed.
* The Remote interface
    * You can test it by running ```sudo systemctl status lircd irexec```
    * Both services should print *active (running)* in green.
    
    *Remember that the DAC and the Remote are not fully installed until you have rebooted at least once after applying this patch. Those tests will fail if you run them before rebooting.*.
 
 

## Last tested on  : 
- Volumio-3.324-2022-07-11-pi 1.5

## Credits 
- The only reason why the RDMLCD can display a fast smooth image is because of the incredible [fbcp-ili9341](https://github.com/juj/fbcp-ili9341) driver.
- [node-canvas](https://github.com/Automattic/node-canvas) is used for graphics rendering. It replaces the previous method of overriding the built-in chromium/localui and allows faster boot time.
- Some additionnal stability is achieved thanks to [node-rpio](https://github.com/jperkin/node-rpio).
