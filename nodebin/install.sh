#!bin/sh
target_distribution="$1"
_localdir="$2"

if [ "$_localdir" = "1" ]; then installdir=`pwd`; else installdir="/usr/local/lib/node12/node-v12.22.12-linux-armv7l"; fi

echo "Trying to install nodejs for" "$1" "..."

case "$target_distribution" in 
'volumio')

	nodebin=`which node12`
	if [ "$nodebin" = "" ]
	then 
		echo "node not installed..."
	else 
		echo "nodejs found ok"
		exit 0
	fi

	echo "Installing node 12 (node 14 is discontinued for this arch/hardware and is not stable enough to do real-time image processing on Volumio)"
	mkdir -p /tmp/node12/
	cd  /tmp/node12/
	wget https://nodejs.org/download/release/v12.22.12/node-v12.22.12-linux-armv7l.tar.xz
	tar -xvf node-v12.22.12-linux-armv7l.tar.xz
	rm node-v12.22.12-linux-armv7l.tar.xz
	mkdir -p /usr/local/lib/node12
	cp -a node-v12.22.12-linux-armv7l $installdir
	ln -sf $installdir/bin/node /usr/local/bin/node12
	ln -sf $installdir/bin/npm /usr/local/bin/npm12
	echo "" > $installdir/node-gyp12
	echo '#!/bin/sh' >> $installdir/node-gyp12
	echo "/usr/local/bin/node12 $installdir/lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js" '$@' >> $installdir/node-gyp12
	ln -sf $installdir/node-gyp12 /usr/local/bin/node-gyp12
	chmod +xX /usr/local/bin/node-gyp12
	
	nodebin=`which node`
	if [ "$nodebin" = "" ]
	then 
		echo "Error : could not install nodejs to build deps" 
		exit 1
	else 
		echo "nodejs found OK"
		exit 0
	fi

;;
'moode')
	sudo apt update -y
	sudo apt install --no-install-recommends -y nodejs npm
	exit 0
;;
'picore')
	scriptpath=`readlink -f "$0"`
	nodepath=`dirname "$scriptpath"`
	
	mkdir -p /tmp/node/release/usr/local
	cd /tmp/node
	wget https://nodejs.org/dist/v16.14.1/node-v16.14.1-linux-armv7l.tar.xz
	tar -xvf node-v16.14.1-linux-armv7l.tar.xz
	rm -r node-v16.14.1-linux-armv7l.tar.xz
	cp -a node-v16.14.1-linux-armv7l/bin  	release/usr/local
	cp -a node-v16.14.1-linux-armv7l/include  release/usr/local
	cp -a node-v16.14.1-linux-armv7l/lib  release/usr/local
	sh "$nodepath"/build_tcz.sh node release
	tce-load -wi gcc_libs.tcz
	tce-load -li node.tcz
	mkdir -p "$nodepath"/release
	cp node.tcz "$nodepath"/release/
	
	exit 0
;;
esac 
 
# rsync -a install/ /usr/local/