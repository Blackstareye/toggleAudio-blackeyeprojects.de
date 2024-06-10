import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';


import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import { DEBUG } from './lib/Constants';


export default class ToggleAudioPreferences extends ExtensionPreferences {

    _settingsInstance = null;
    _outputDeviceMap = null;
    _currentHeadphoneValue=null;
    _currentSpeakerValue=null;
    _reverseLookUpDeviceMap = new Map();

    unpackSettings() {
        this._settingsInstance = this.getSettings();
        this._outputDeviceMap = this._settingsInstance.get_value("output-devices-available").recursiveUnpack();
        let headphoneSet = this._settingsInstance.get_value("headphone").recursiveUnpack();
        let speakerSet = this._settingsInstance.get_value("speaker").recursiveUnpack();
        
        console.debug(`Speakerset: Description:${speakerSet[1]} #${speakerSet.length}`);
        console.debug(`Headset: Description:${headphoneSet[1]} #${headphoneSet.length}`);
        this._currentSpeakerValue = (speakerSet && speakerSet.length === 3) ? speakerSet[1] : undefined;
        this._currentHeadphoneValue = (headphoneSet && headphoneSet.length === 3) ? headphoneSet[1] : undefined;
    }


    create_ui(window) {
        this.unpackSettings();
        for (let key in this._outputDeviceMap) {
            // // es-lint no-prototype-builtins fix
            if (Object.prototype.hasOwnProperty.call(this._outputDeviceMap, key)) {
                this._reverseLookUpDeviceMap.set(this._outputDeviceMap[key][0], key);
            }
        }
        const deviceList = new Gtk.StringList();

        let indexOfSelectedSpeaker = 0;//deviceList.keys().findIndex(this._currentSpeakerValue);
        let indexOfSelectedHeadphone = 0;//deviceList.keys().findIndex(this._currentHeadphoneValue);
        console.debug(`Creating Device List now \nDebugging Values: Headphone:${this._currentHeadphoneValue}, Speaker: ${this._currentSpeakerValue}`);

        // we need a array and need to put all in the device list
        [ ...this._reverseLookUpDeviceMap.keys()].map( (e, index) => {
                console.debug(`Stepping to: ${e}, ${index}`);
                if (this._currentHeadphoneValue && this._currentHeadphoneValue === e) {
                    console.debug(`Found Entry in headphone list: ${e}, ${index}`);
                    indexOfSelectedHeadphone = index;
                }
                if (this._currentSpeakerValue && this._currentSpeakerValue === e) {
                    console.debug(`Found Entry in speaker list: ${e}, ${index}`);
                    indexOfSelectedSpeaker = index;
                }
                deviceList.append(e);
        }
        );
        console.debug(`headphone: ${indexOfSelectedHeadphone}, speaker: ${indexOfSelectedSpeaker}`);

        // Create a preferences page, with a single group
        const page = new Adw.PreferencesPage({
            title: _('Preferences'),
            icon_name: 'dialog-information-symbolic',
            description: 'This will be refreshed'
        });
        window.add(page);

        const group = new Adw.PreferencesGroup({
            title: _('Devices'),
            description: _('Select your Speaker and Headphone Device'),
        });
        page.add(group);

        const speaker = new Adw.ComboRow({
            title: _('Speaker'),
            subtitle: _('Whether to show the panel indicator'),
            model: deviceList,
            selected: indexOfSelectedSpeaker,
        });


        const headphone = new Adw.ComboRow({
            title: _('Headphone'),
            subtitle: _('Whether to show the panel indicator'),
            model: deviceList,
            selected: indexOfSelectedHeadphone,
        });

        group.add(speaker);
        group.add(headphone);

        
        let storeSelectedDevice = function (key, origin, this_ref) {
            let item = Object.assign(origin.selected_item, Gtk.StringObject);
            let text = item.get_string();
            console.debug(`selected: ${text}`);
            console.debug(`is in device list: ${this_ref._reverseLookUpDeviceMap.has(text)}`);
            let id = this_ref._reverseLookUpDeviceMap.get(text);
            let metaData = this_ref._outputDeviceMap[id][1];
            this_ref._settingsInstance.set_value(key, new GLib.Variant("(iss)", [id,text, metaData]));
        };

        headphone.connect(`notify::selected-item`, () => {
            storeSelectedDevice('headphone', headphone, this);
        });
        speaker.connect(`notify::selected-item`, () => {
            storeSelectedDevice('speaker', speaker, this);
        });
    }

    fillPreferencesWindow(window) {
        this.create_ui(window)
    }

    
}