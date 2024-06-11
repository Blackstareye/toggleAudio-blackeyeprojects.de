#!/usr/bin/env bash
moduleName="toggleAudio@blackeyeprojects.de.zip"
exportDir="./export/"
zip -r $exportDir/$moduleName lib/ po/ schemas/ extension.js metadata.json prefs.js README.md stylesheet.css 