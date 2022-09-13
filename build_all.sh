#!bin/sh
starting_dir=`pwd`
target_distribution="$1"

sh clear.sh

if [ "$target_distribution" = "" ]
then 
    read -p "Select the target distribution : moode, volumio, plugin_vol, picore " target_distribution
    case $target_distribution in
        moode|volumio|picore|plugin_vol) 
			echo $target_distribution 
			break	;;
       * ) 
		   echo $target_distribution is not a valid choice 
		   exit 1 ;;
    esac
fi

set -e

out_dir="$starting_dir"/release/install_rdmlcd
mkdir -p $out_dir/archives

if [ "$target_distribution" = "plugin_vol" ] || [ "$target_distribution" = "volumio"  ]
then
	chown -R volumio "$starting_dir"/release 
fi

for file in *
do 
    test -f $file/build.sh && cd $file && sh build.sh "$target_distribution" && mv release/* $out_dir/archives
    cd "$starting_dir"
done


if [ "$target_distribution" = "plugin_vol" ]

then
	set +e
	rm -r "$starting_dir"/vol_plugin/apps 2> /dev/null
	set -e
	mkdir -p "$starting_dir"/vol_plugin/apps
	mv $out_dir/archives/* "$starting_dir"/vol_plugin/apps
	
else 
	printf '#!bin/sh
	for file in archives/*
	do 
		a=`tar -xvf $file | grep .sh`
		sh $a
	done
	' > $out_dir/install_rdm_"$target_distribution".sh
	cd $out_dir/..
	tar -cvzhf install_rdm_"$target_distribution".tar.gz install_rdmlcd
	cd "$starting_dir"/vol_plugin 
	npm install

fi

exit 0


