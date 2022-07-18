#!bin/sh
starting_dir=`pwd`
target_distro="$1"
out_dir=/release
test -d release && rm -r ./release
for file in *
do 
    test -d $file/release && rm -r $file/release;
done
rm -r rdmlcdsources.tar.gz 2> /dev/null 