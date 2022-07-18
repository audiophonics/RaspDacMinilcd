#!bin/sh
currentdir=`pwd`
target_path=`basename "$currentdir"`
cd ..
mkdir -p  /tmp/rdmlcdsources
tar -cvzf /tmp/rdmlcdsources/rdmlcdsources.tar.gz $target_path
mv /tmp/rdmlcdsources/rdmlcdsources.tar.gz $target_path
rm -r /tmp/rdmlcdsources/