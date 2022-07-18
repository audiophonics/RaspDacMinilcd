#!/bin/sh

startingdirectory=`pwd`

echo "BUILDING RPIO NATIVE ADDON"

rm -r rpio32 > /dev/null 2>&1
rm -r rpio64 > /dev/null 2>&1

echo "	...Fetching source"
set -e
wget `npm view rpio dist.tarball`  > /dev/null 2>&1
mkdir rpio32

tar -xvf rpio-*.tgz -C rpio32 > /dev/null 2>&1

# workaround for messy Debian patch
sudo sed -i "s/'-lnode'//" /usr/share/nodejs/node-gyp/addon.gypi

echo "BUILDING RPIO NATIVE ADDON FOR 32BIT ARM (moOde Audio Legacy)"

arch=`dpkg --print-architecture`

cd rpio32/package
unset CC 
unset CXX
unset LINK
export CC=`ls /usr/bin/arm-linux-gnueabihf-gcc | head`
export CXX=`ls /usr/bin/arm-linux-gnueabihf-g++ | head`
node-gyp --arch=arm clean
node-gyp --arch=arm configure
sed -i 's/usr\/lib\/aarch64-linux-gnu/usr\/lib\/arm-linux-gnueabihf/' build/rpio.target.mk
node-gyp --arch=arm build
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
	node-gyp --arch=arm clean
	node-gyp --arch=arm configure
	node-gyp --arch=arm build
	cd $startingdirectory
	mv rpio64/package/ $startingdirectory/utils/rpio64
	rm -r rpio64
	echo "...done building nodejs rpio 64-bit native addon"
	
fi

rm -r rpio-*.tgz > /dev/null 2>&1
