#!/bin/sh
scriptpath=`readlink -f "$0"`
dirpath=`dirname "$scriptpath"`
configpath="$dirpath"/config.json
case $1 in
"")
        printf "
\033[32m rdmlcd\033[0m deepsleep 0 ... (seconds)
\033[32m rdmlcd\033[0m blank 
"
;;
deepsleep)
        curl -m 0.5 localhost:4153/deep_sleep_after=$2
         jq '.deep_sleep_after = '"$2" "$configpath" > /tmp/lcdcconf.tmp && mv /tmp/lcdcconf.tmp  "$configpath"
;;
blank)
       node "$dirpath"/blank.js
;;
esac
