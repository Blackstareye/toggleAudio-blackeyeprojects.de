import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';


import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import SettingProvider from './lib/SettingProvider.js';
import OutputDeviceList from './lib/OutputDeviceList.js';
import Printer from './lib/Printer.js';
import DebugHelper from './lib/DebugHelper.js';


export default class ToggleAudioPreferences extends ExtensionPreferences {

    _settingProvider = null;
    _outputDeviceMap = null;
    _currentHeadphoneValue=null;
    _currentSpeakerValue=null;
    _reverseLookUpDeviceMap = new Map();
    
    _listModelOfDevices = null;
    _speakerModel = null;
    _indexSpeakerModel = null;
    _headphoneModel = null;
    _indexHeadphoneModel = null;

    unpackSettings(window) {
        window._settingsInstance = this.getSettings();
        this._settingProvider = new SettingProvider(window._settingsInstance);
        this._outputDeviceMap = new OutputDeviceList(this._settingProvider);

        // TODO aufräumen und in settingprovider
        //this._outputDeviceMap = window._settingsInstance.get_value("output-devices-available").recursiveUnpack();

        // TOIMPROVE try bind 
        let headphoneSet = window._settingsInstance.get_value("headphone").recursiveUnpack();
        let speakerSet = window._settingsInstance.get_value("speaker").recursiveUnpack();
        
        console.debug(`Speakerset: Description:${speakerSet[1]} #${speakerSet.length}`);
        console.debug(`Headset: Description:${headphoneSet[1]} #${headphoneSet.length}`);
        this._currentSpeakerValue = (speakerSet && speakerSet.length === 3) ? speakerSet[1] : undefined;
        this._currentHeadphoneValue = (headphoneSet && headphoneSet.length === 3) ? headphoneSet[1] : undefined;
    }

    buildIndex() {

        this._reverseLookUpDeviceMap = new Map();
        // this._reverseLookUpDeviceMap.clear();

        // maybe async?
        this._outputDeviceMap.subscribeOnChange(
            (element, indexOld, indexNew) => {
                if (indexOld === indexNew) {
                    // ADD
                    this._reverseLookUpDeviceMap.set(element[0], indexNew);
                } else if (indexNew && indexOld !== indexNew) {
                    // UPDATE
                    this._reverseLookUpDeviceMap.set(element[0], indexNew);
                } else if (indexNew == undefined) {
                    // DELETE
                    this._reverseLookUpDeviceMap.delete(element[0]);
                }
                this._buildListModel();
            }
        );

        // fill List
        console.debug(`Keys are: ${this._outputDeviceMap.keys().join()}`);
        this._outputDeviceMap.keys().map( key => {
            console.debug(`Key is: ${key}`);
            // // es-lint no-prototype-builtins fix
            // if (Object.prototype.hasOwnProperty.call(this._outputDeviceMap, key)) {
            console.debug(this._outputDeviceMap.printData());
            let item = this._outputDeviceMap.getItem(key);
            console.debug(`Item is: ${item}`);
            if (item) {
                this._reverseLookUpDeviceMap.set(item[0], key);
            } else {
                console.debug(`Item is empty.. ${item}`);
            }   
            // }

        });
    }

    _buildListModel() {
        // build the model again
        this._listModelOfDevices = null;
        this._listModelOfDevices = new Gtk.StringList();
        this._indexHeadphoneModel = 0;
        this._indexSpeakerModel = 0;
        console.debug(`Creating Device List now \nDebugging Values: Headphone:${this._currentHeadphoneValue}, Speaker: ${this._currentSpeakerValue}`);

        // we need a array and need to put all in the device list
        [ ...this._reverseLookUpDeviceMap.keys()].map( (e, index) => {
                console.debug(`Stepping to: ${e}, ${index}`);
                if (this._currentHeadphoneValue && this._currentHeadphoneValue === e) {
                    console.debug(`Found Entry in headphone list: ${e}, ${index}`);
                    this._indexHeadphoneModel = index;
                }
                if (this._currentSpeakerValue && this._currentSpeakerValue === e) {
                    console.debug(`Found Entry in speaker list: ${e}, ${index}`);
                    this._indexSpeakerModel = index;
                }
                this._listModelOfDevices.append(e);
        }
        );
        console.log(`headphone: ${this._indexHeadphoneModel}, speaker: ${this._indexSpeakerModel}`);
    }
    
    _updateModel(modelToUpdate, selectedIndex) {
        if (modelToUpdate) {
            modelToUpdate.set_model(this._listModelOfDevices);
            modelToUpdate.set_selected(selectedIndex);
        }
    }


    create_ui(window) {
        this.unpackSettings(window);
        this.buildIndex();
        this._buildListModel();

        // Create a preferences page, with a single group
        const page = new Adw.PreferencesPage({
            title: _('Preferences'),
            icon_name: 'dialog-information-symbolic',
            description: `If the toggle button is true (indicator icon is a headphone), the selected 'Headphone' device will be used as default audio output device. Otherwise the 'Speaker' device will be used.`
        });
        window.add(page);

        const group = new Adw.PreferencesGroup({
            title: _('Output Devices'),
            description: _('Select your Speaker and Headphone Device'),
        });
        page.add(group);


        if (DEBUG) {
            let debugWindow = DebugHelper.createDebugBanner(group);
            let debugWindow2 = DebugHelper.createDebugBanner(group);
            
    
            debugWindow.set_title(`Reverse Map:${Printer.printBeautyMap(this._reverseLookUpDeviceMap)}`);
            debugWindow2.set_title(`Device List:${this._outputDeviceMap.printData()}`);
        }

        this._speakerModel = new Adw.ComboRow({
            title: _('Speaker'),
            model: this._listModelOfDevices,
            selected: this._indexSpeakerModel,
        });


        this._headphoneModel = new Adw.ComboRow({
            title: _('Headphone'),
            model: this._listModelOfDevices,
            selected: this._indexHeadphoneModel,
        });

        group.add(this._speakerModel);
        group.add(this._headphoneModel);
    }

    fillPreferencesWindow(window) {
        this.create_ui(window)
    }

    
}