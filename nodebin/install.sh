#!bin/sh
target_distribution="$1"

echo "Trying to install nodejs for" "$1" "..."

case "$target_distribution" in 
'volumio')
	exit 0
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