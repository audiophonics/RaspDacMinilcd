#!/bin/bash

start_time="$(date +"%T")"
starting_dir=${PWD}

echo "***   Installation of RaspDacMiniLCD for Volumio" 
echo "***   _____________________________________" 

# Install modules
for file in "$starting_dir"/*
do 
    test -f $file/install.sh && cd $file && bash $file/install.sh 
    cd $starting_dir
done
node enable_volumio_wizard.js &&

# ---------------------------------------------------
# Say something nice and exit
echo "* End of installation : RaspDacMiniLCD for Volumio"
echo started at $start_time finished at "$(date +"%T")"
exit 0