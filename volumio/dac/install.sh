#!/bin/bash

start_time="$(date +"%T")"
echo "* Installing : Basic instructions set for Audiophonics ES90X8 DAC"
echo "" > install_log.txt

# ---------------------------------------------------
# Make the control script a global command
cp apessq2m.sh /bin/apessq2m &&
chmod +xX /bin/apessq2m

# ---------------------------------------------------
# Say something nice and exit
echo "* End of installation :Basic instructions set for Audiophonics ES90X8 DAC"
echo started at $start_time finished at "$(date +"%T")" >> install_log.txt
exit 0