#!/usr/bin/env bash
nixosbin=${1:-"../gnome-dev-vm/result/bin/run-gnome-dev-vm"}
if [[ $nixosbin != "" ]]; then
    echo "running $nixosbin .. correct? [Yn]"
    read -e yn
    yn=${yn:-y}
    case $yn in 
        [yY]*) ./$nixosbin;;
        [nN]*) echo "exit script" && exit 0;;
    esac
else 
    echo "$nixosbin is empty"
    exit 0
fi