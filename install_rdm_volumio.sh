#!bin/sh
	for file in archives/*
	do 
		a=`tar -xvf $file | grep .sh`
		sh $a
	done
	