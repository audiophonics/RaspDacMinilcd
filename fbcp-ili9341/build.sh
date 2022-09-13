#/bin/sh
target_distribution="$1"
current_folder=`pwd`
temp_folder='/tmp/fbcp-ili9341'


# remove previous build temp files if any and recreate clean dir
rm -rf "$temp_folder" > /dev/null 2>&1

set -e
mkdir -p $temp_folder
cd $temp_folder
git clone https://github.com/juj/fbcp-ili9341.git 
cp -a "$current_folder"/patch/* fbcp-ili9341 
cd fbcp-ili9341 
mkdir build 
cd build
mkdir -p $current_folder/release 
specificToolChain="";
arch=`dpkg --print-architecture`
if [ "$arch" = "arm64" ];
	then specificToolChain="-DCMAKE_TOOLCHAIN_FILE=""$current_folder""/crosscompileforarmhf";
fi
cmake "$specificToolChain"  -DARMV8A=ON -DILI9341=ON -DSPI_BUS_CLOCK_DIVISOR=20 -DGPIO_TFT_DATA_CONTROL=27 -DGPIO_TFT_RESET_PIN=24 -DDISPLAY_ROTATE_180_DEGREES=ON -DSTATISTICS=0 .. 
make 
chmod +x fbcp-ili9341
cp -a  $current_folder/rdmlcdfb ./rdmlcdfb

case "$target_distribution" in 
'moode') cp -a  $current_folder/installation/moode.sh installrdm_lcdfb.sh
;;
'volumio') cp -a  $current_folder/installation/volumio.sh installrdm_lcdfb.sh
;;
'plugin_vol')
	chmod +xX rdmlcdfb
	cp -a  fbcp-ili9341 $current_folder/release
	cp -a  rdmlcdfb $current_folder/release 
exit 0
esac 


tar -cvhzf rdmlcdfb.tar.gz fbcp-ili9341 rdmlcdfb
tar -cvhf rdmlcdfb.tar rdmlcdfb.tar.gz installrdm_lcdfb.sh

mv rdmlcdfb.tar $current_folder/release/rdm_"$target_distribution"_lcdfb.tar

cd $current_folder


set +e
rm -rf "$temp_folder"