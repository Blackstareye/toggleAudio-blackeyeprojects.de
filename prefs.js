import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';


import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import AudioDevicePreferences from './lib/AudioDevicePreferences.js';


export default class ToggleAudioPreferences extends ExtensionPreferences {

    fillPreferencesWindow(window) {
        window._settingsInstance = this.getSettings();
        let audioDevicePreferences = new AudioDevicePreferences();
        audioDevicePreferences.create_ui(window); 
    }
}