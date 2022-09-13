#!/bin/sh

target_distribution="$1"
startingdirectory=`pwd`


case "$target_distribution" in 
'moode')
	nodebin=`which node`
	nodegypbin=`which node-gyp`
;;

'volumio'|'plugin_vol')
	nodebin=`which node12`
	nodegypbin=`which node-gyp12`
;;
esac 
 


echo "BUILDING RPIO NATIVE ADDON"

rm -r rpio32 > /dev/null 2>&1
rm -r rpio64 > /dev/null 2>&1

echo "	...Fetching source"
set -e
wget `npm view rpio dist.tarball`  
mkdir -p rpio32

tar -xvf rpio-*.tgz -C rpio32 

echo "BUILDING RPIO NATIVE ADDON FOR 32BIT ARM (moOde Audio Legacy & Volumio)"

arch=`dpkg --print-architecture`

cd rpio32/package
unset CC 
unset CXX
unset LINK
export CC=`ls /usr/bin/arm-linux-gnueabihf-gcc | head`
export CXX=`ls /usr/bin/arm-linux-gnueabihf-g++ | head`
$nodegypbin --arch=arm clean
$nodegypbin --arch=arm configure
if [ "$target_distribution" = "moode" ]
then
sed -i 's/usr\/lib\/aarch64-linux-gnu/usr\/lib\/arm-linux-gnueabihf/' build/rpio.target.mk
fi
$nodegypbin --arch=arm build
cd $startingdirectory
mv rpio32/package/ $startingdirectory/utils/rpio32
rm -r rpio32
echo "...done building nodejs rpio 32-bit native addon"

if [ "$arch" = "arm64" ];
then 
	echo "BUILDING RPIO NATIVE ADDON FOR 64BIT ARM (moOde Audio standard)"
	cd $startingdirectory
	mkdir rpio64
	tar -xvf rpio-*.tgz -C rpio64 > /dev/null 2>&1
	cd rpio64/package
	
	unset CC 
	unset CXX
	unset LINK
	$nodegypbin --arch=arm clean
	$nodegypbin --arch=arm configure
	$nodegypbin --arch=arm build
	cd $startingdirectory
	mv rpio64/package/ $startingdirectory/utils/rpio64
	rm -r rpio64
	echo "...done building nodejs rpio 64-bit native addon"
	
fi

rm -r rpio-*.tgz > /dev/null 2>&1
