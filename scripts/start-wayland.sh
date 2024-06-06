#!/usr/bin/env bash
dbus-run-session -- gnome-shell --nested --wayland

# journalctl -f -o cat /usr/bin/gnome-shell     