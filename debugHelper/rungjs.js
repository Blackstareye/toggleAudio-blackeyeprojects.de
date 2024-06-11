//imports.gi.versions.Gtk = "3.0";
//const Gtk = imports.gi.Gtk;

// GSETTINGS_SCHEMA_DIR=$(pwd)/schemas gjs -m debugHelper/rungjs.js
import Gio from 'gi://Gio';
const settings = new Gio.Settings({ schema_id: 'org.gnome.shell.extensions.toggle-audio' });
console.log(settings);


//Do something