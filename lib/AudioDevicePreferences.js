import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';


import {gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import SettingProvider from './SettingProvider.js';
import OutputDeviceList from './OutputDeviceList.js';
import * as Constants from './util/Constants.js';
import Printer from './util/Printer.js';
import DebugHelper from './util/preferencewindow/DebugHelper.js';


export default class AudioDevicePreferences {

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
        this._settingProvider = new SettingProvider(window._settingsInstance);
        this._outputDeviceMap = new OutputDeviceList(this._settingProvider);

        let headphoneSet = this._settingProvider.getHeadphone();
        let speakerSet = this._settingProvider.getSpeaker();

        console.debug(`Speakerset: Description:${speakerSet[1]} #${speakerSet.length}`);
        console.debug(`Headset: Description:${headphoneSet[1]} #${headphoneSet.length}`);
        this._currentSpeakerValue = (speakerSet && speakerSet.length === 3) ? speakerSet[1] : undefined;
        this._currentHeadphoneValue = (headphoneSet && headphoneSet.length === 3) ? headphoneSet[1] : undefined;
    }

    buildIndex() {

        this._reverseLookUpDeviceMap = new Map();

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
            console.debug(this._outputDeviceMap.printData());
            
            let item = this._outputDeviceMap.getItem(key);
            console.debug(`Item is: ${item}`);
            if (item) {
                this._reverseLookUpDeviceMap.set(item[0], key);
            } else {
                console.debug(`Item is empty.. ${item}`);
            }   
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

    _createToggleHotKeys(page) {
        const toggleHotKeysGroup = new Adw.PreferencesGroup({
            title: _('Shotcuts'),
            description: _(`Control whether shortcuts should be activated or not.\nIf true, the audio device can  also be selected / toggled with a hotkey.\nHotkeys can be changed via dconf-editor.`),
        });
        page.add(toggleHotKeysGroup);

        const activateToggleHotkey = new Adw.SwitchRow({
            title: _('Toggle Headphone / Speaker hotkey'),
            subtitle: _('Default Hotkey: Ctrl+Super+T'),
        });
        const activateSelectSpeakerHotkey = new Adw.SwitchRow({
            title: _('Select speaker hotkey'),
            subtitle: _('Default Hotkey: Ctrl+Super+S'),
        });
        const activateSelectHeadphoneHotkey = new Adw.SwitchRow({
            title: _('Select headphone hotkey'),
            subtitle: _('Default Hotkey: Ctrl+Super+H'),
        });

        toggleHotKeysGroup.add(activateToggleHotkey);
        toggleHotKeysGroup.add(activateSelectSpeakerHotkey);
        toggleHotKeysGroup.add(activateSelectHeadphoneHotkey);
        this._settingProvider.bindEnableToggleHeadphoneHotKey(activateToggleHotkey);
        this._settingProvider.bindEnableSelectSpeakerHotKey(activateSelectSpeakerHotkey);
        this._settingProvider.bindEnableSelectHeadphoneHotKey(activateSelectHeadphoneHotkey);
    }

    _createOutputDeviceGroup(page) {
        const outputDeviceGroup = new Adw.PreferencesGroup({
            title: _('Output Devices'),
            description: _('Select your Speaker and Headphone Device'),
        });
        page.add(outputDeviceGroup);

        if (Constants.DEBUG) {
            let debugWindow = DebugHelper.createDebugBanner(outputDeviceGroup);
            let debugWindow2 = DebugHelper.createDebugBanner(outputDeviceGroup);
            
    
            debugWindow.set_title(`Reverse Map:${Printer.printBeautyMap(this._reverseLookUpDeviceMap)}`);
            debugWindow2.set_title(`Device List:${this._outputDeviceMap.printData()}`);
        }

        const showIndicator = new Adw.SwitchRow({
            title: _('Show System Indicator Icon'),
            subtitle: _('Whether to show the system indicator (e.g. the headphone) or not.'),
        });
        this._settingProvider.bindSystemIconStatus(showIndicator);
        outputDeviceGroup.add(showIndicator);
        


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

        outputDeviceGroup.add(this._speakerModel);
        outputDeviceGroup.add(this._headphoneModel);

        this._headphoneModel.connect(`notify::selected-item`, () => {
            this._settingProvider.setHeadphone(this._packData(this._headphoneModel.selected_item));
            
        });
        this._speakerModel.connect(`notify::selected-item`, () => {
            this._settingProvider.setSpeaker(this._packData(this._speakerModel.selected_item));
        });
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

        this._createOutputDeviceGroup(page);

        this._createToggleHotKeys(page);



        
    }

    _packData (selectedItem) {
        let item = Object.assign(selectedItem, Gtk.StringObject);
        let text = item.get_string();
        console.log(`selected: ${text}`);
        console.log(`is in device list: ${this._reverseLookUpDeviceMap.has(text)}`);
        let id = this._reverseLookUpDeviceMap.get(text);
        let deviceItem =  this._outputDeviceMap.getItem(id);
        let metaData = deviceItem[1];
        return [id, text,metaData];
    }
    
}