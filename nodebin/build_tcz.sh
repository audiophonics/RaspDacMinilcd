extension_name=$1
extension_path=$2
basedir=`pwd`

if [ "$2" == "" ]
then 
echo "usage : sudo sh build_tcz.sh name_of_ext path_to_filetree"
exit 1
fi

sudo rm -r /tmp/ext_build
mkdir /tmp/ext_build
cp -r $extension_path/* /tmp/ext_build/


if test -f /tmp/ext_build/onload.sh; 
then 
	mkdir /tmp/ext_build/usr/local/tce.installed
	mv /tmp/ext_build/onload.sh /tmp/ext_build/usr/local/tce.installed/$extension_name
	sudo chown root:staff /tmp/ext_build/usr/local/tce.installed
	sudo chown tc:staff /tmp/ext_build/usr/local/tce.installed/$extension_name
	sudo chmod 755 /tmp/ext_build/usr/local/tce.installed/$extension_name
fi

cd /tmp/ext_build/

printf "\n\nExecutables:\n"
while read p; do
  mod=`echo $p | sed  "s/.*\s/\1/"`
  file=`echo $p | sed  "s/\s.*/\1/"`
  # echo 'chmod' $mod '/tmp/ext_build/'$file
  chmod $mod '/tmp/ext_build/'$file
done </tmp/ext_build/executables.txt
rm /tmp/ext_build/executables.txt

tce-load -wi squashfs-tools.tcz 
sudo rm -r $basedir/$extension_name.tcz
mksquashfs /tmp/ext_build/ $basedir/$extension_name.tcz
cp /tmp/ext_build/dependencies.txt $basedir/$extension_name.tcz.dep
cd $basedir
md5sum $extension_name.tcz > $extension_name.tcz.md5.txt
sudo rm -r /tmp/ext_build