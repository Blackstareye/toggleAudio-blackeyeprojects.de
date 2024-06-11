import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';


import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import SettingProvider from './lib/SettingProvider.js';
import OutputDeviceList from './lib/OutputDeviceList.js';
import Printer from './lib/Printer.js';


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
                this.buildModel();
            }
        );

        // fill List
        console.log(`Keys are: ${this._outputDeviceMap.keys().join()}`);
        for (let key in this._outputDeviceMap.keys()) {
            // // es-lint no-prototype-builtins fix
            if (Object.prototype.hasOwnProperty.call(this._outputDeviceMap, key)) {
                this._reverseLookUpDeviceMap.set(this._outputDeviceMap[key][0], key);
            }
        }
    }

    _buildListModel() {
        // build the model again
        this._listModelOfDevices = null;
        this._listModelOfDevices = new Gtk.StringList();
        this._indexHeadphoneModel = 0;//deviceList.keys().findIndex(this._currentSpeakerValue);
        this._indexSpeakerModel = 0;//deviceList.keys().findIndex(this._currentHeadphoneValue);
        console.log(`Creating Device List now \nDebugging Values: Headphone:${this._currentHeadphoneValue}, Speaker: ${this._currentSpeakerValue}`);
        // we need a array and need to put all in the device list
        [ ...this._reverseLookUpDeviceMap.keys()].map( (e, index) => {
                console.log(`Stepping to: ${e}, ${index}`);
                if (this._currentHeadphoneValue && this._currentHeadphoneValue === e) {
                    console.log(`Found Entry in headphone list: ${e}, ${index}`);
                    this._indexHeadphoneModel = index;
                }
                if (this._currentSpeakerValue && this._currentSpeakerValue === e) {
                    console.log(`Found Entry in speaker list: ${e}, ${index}`);
                    this._indexSpeakerModel = index;
                }
                this._listModelOfDevices.append(e);
        }
        );
        console.log(`headphone: ${this._indexHeadphoneModel}, speaker: ${this._indexSpeakerModel}`);
        // console.log(`Updating Models now...`);
        // if (this._headphoneModel != null) {
        //     this._updateModel(this._headphoneModel, this._indexHeadphoneModel);
        // }
        // if (this._speakerModel != null) {
        //     this._updateModel(this._speakerModel, this._indexSpeakerModel);
        // }
        
    }
    
    // _updateModel(modelToUpdate, selectedIndex) {
    //         // modelToUpdate.model = this._listModelOfDevices;
    //         // modelToUpdate.selected = selectedIndex;
    //         // console.log(`Model is null, not updating it..`);
    //     // headphone.bind('model', this, '_listModelOfDevices', Gio.SettingsBindFlags.DEFAULT);
    //     // headphone.bind('selected', this, '_indexHeadphoneModel', Gio.SettingsBindFlags.DEFAULT);
    //     // speaker.bind('model', this, '_listModelOfDevices', Gio.SettingsBindFlags.DEFAULT);
    //     // speaker.bind('selected', this, '_indexSpeakerModel', Gio.SettingsBindFlags.DEFAULT);
    // }

    create_ui(window) {
        this.unpackSettings(window);
        // for (let key in this._outputDeviceMap) {
        //     // // es-lint no-prototype-builtins fix
        //     if (Object.prototype.hasOwnProperty.call(this._outputDeviceMap, key)) {
        //         this._reverseLookUpDeviceMap.set(this._outputDeviceMap[key][0], key);
        //     }
        // }
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


        // CHECK IF DATA IS THERE
        console.log(this._outputDeviceMap.printData());
        
        //HIER DEBUGGEN
        console.log(Printer.printBeautyMap(this._reverseLookUpDeviceMap));

        
        // this._listModelOfDevices.map(e => {
        //     console.log(`DEBUGGING ${e.get_string()}`);
        // })



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

        console.log(`MODELS: ${this._speakerModel} ${this._headphoneModel}`);

        // this._updateModel(this._headphoneModel, this._indexHeadphoneModel);
        // this._updateModel(this._speakerModel, this._indexSpeakerModel);

        let storeSelectedDevice = function (key, origin, this_ref) {
            let item = Object.assign(origin.selected_item, Gtk.StringObject);
            let text = item.get_string();
            console.debug(`selected: ${text}`);
            console.debug(`is in device list: ${this_ref._reverseLookUpDeviceMap.has(text)}`);
            let id = this_ref._reverseLookUpDeviceMap.get(text);
            let metaData = this_ref._outputDeviceMap[id][1];
            window._settingsInstance.set_value(key, new GLib.Variant("(iss)", [id,text, metaData]));
        };

        // headphone.bind('model', this, '_listModelOfDevices', Gio.SettingsBindFlags.DEFAULT);
        // headphone.bind('selected', this, '_indexHeadphoneModel', Gio.SettingsBindFlags.DEFAULT);
        // speaker.bind('model', this, '_listModelOfDevices', Gio.SettingsBindFlags.DEFAULT);
        // speaker.bind('selected', this, '_indexSpeakerModel', Gio.SettingsBindFlags.DEFAULT);

        this._headphoneModel.connect(`notify::selected-item`, () => {
            storeSelectedDevice('headphone', this._headphoneModel, this);
        });
        this._speakerModel.connect(`notify::selected-item`, () => {
            storeSelectedDevice('speaker', this._speakerModel, this);
        });

        console.log(this._listModelOfDevices);

    }

    fillPreferencesWindow(window) {
        this.create_ui(window)
    }

    
}