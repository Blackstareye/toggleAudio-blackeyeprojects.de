#!/usr/bin/env bash
moduleName="toggleAudio@blackeyeprojects.de.zip"
exportDir="./export/"
#zip -r $exportDir/$moduleName lib/ schemas/ extension.js metadata.json prefs.js README.md CHANGELOG.md po/
glib-compile-schemas schemas/
gnome-extensions pack --podir=po --extra-source=lib/ -o $exportDir --force 