#!bin/sh
starting_dir=`pwd`
target_distribution="$1"
if [ "$target_distribution" = "" ]
then 
    read -p "Select the target distribution : moode, volumio, picore " target_distribution
    case $target_distribution in
        moode|volumio|picore) 
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
for file in *
do 
    test -f $file/build.sh && cd $file && sh build.sh "$target_distribution" && mv release/* $out_dir/archives
    cd "$starting_dir"
done

printf '#!bin/sh
for file in archives/*
do 
	a=`tar -xvf $file | grep .sh`
	sh $a
done
' > $out_dir/install_rdm_"$target_distribution".sh


cd $out_dir/..

tar -cvzhf install_rdm_"$target_distribution".tar.gz install_rdmlcd
exit 0


