#!/bin/sh

target_distribution="$1"
startingdirectory=`pwd`
 
 
 
 

case "$target_distribution" in 
'moode')
	nodebin=`which node`
	nodegypbin=`which node-gyp`
;;

'volumio')
	nodebin=`which node12`
	nodegypbin=`which node-gyp12`
;;
esac 
 
echo "BUILDING CANVAS NATIVE ADDON"

rm -r canvas32 > /dev/null 2>&1
rm -r canvas64 > /dev/null 2>&1


echo "	...Fetching source"
set -e
wget `npm view canvas dist.tarball`  > /dev/null 2>&1
mkdir canvas32

tar -xvf canvas-*.tgz -C canvas32 > /dev/null 2>&1


# workaround for messy Debian patch
set +e
sudo sed -i "s/'-lnode'//" /usr/share/nodejs/node-gyp/addon.gypi
set -e


echo "BUILDING CANVAS NATIVE ADDON FOR 32BIT ARM (Volumio & moOde Audio Legacy)"

arch=`dpkg --print-architecture`
if [ "$arch" = "arm64" ];
	then 
	sudo apt-get --no-install-recommends install -y glib-2.0:armhf libcairo2-dev:armhf libpango1.0-dev:armhf libjpeg-dev:armhf libgif-dev:armhf librsvg2-dev:armhf
	sudo apt-get install -y libgif-dev:armhf
	sudo ldconfig -n /usr/lib/arm-linux-gnueabihf/
fi

cd canvas32/package
unset CC 
unset CXX
unset LINK
export CC=`ls /usr/bin/arm-linux-gnueabihf-gcc | head`
export CXX=`ls /usr/bin/arm-linux-gnueabihf-g++ | head`
$nodegypbin --arch=arm clean
$nodegypbin --arch=arm configure
sed -i 's/usr\/lib\/aarch64-linux-gnu/usr\/lib\/arm-linux-gnueabihf/' build/canvas.target.mk
$nodegypbin  --arch=arm build
cd $startingdirectory
mv canvas32/package/ $startingdirectory/utils/canvas32
rm -r canvas32
echo "...done building nodejs canvas 32-bit native addon"
	

if [ "$arch" = "arm64" ];
then 
	echo "BUILDING CANVAS NATIVE ADDON FOR 64BIT ARM (moOde Audio standard)"
	sudo apt-get install -y libgif-dev
	cd $startingdirectory
	mkdir canvas64
	tar -xvf canvas-*.tgz -C canvas64 > /dev/null 2>&1
	cd canvas64/package
	
	unset CC 
	unset CXX
	unset LINK
	$nodegypbin  --arch=arm clean
	$nodegypbin --arch=arm configure
	$nodegypbin  --arch=arm build
	cd $startingdirectory
	mv canvas64/package/ $startingdirectory/utils/canvas64
	rm -r canvas64
	echo "...done building nodejs canvas 64-bit native addon"
	
else 
	echo "We are building on a 32bit system, so the renderer will only be compatible with moOde Audio 32-bit legacy version"
fi

rm -r canvas-*.tgz > /dev/null 2>&1
