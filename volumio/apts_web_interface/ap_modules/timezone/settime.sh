#!/bin/bash
sudo bash -c 'echo '"$1"' > /etc/timezone' && sudo dpkg-reconfigure -f noninteractive tzdata && exit 0
