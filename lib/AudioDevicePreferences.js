import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';


import {gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import SettingProvider from './SettingProvider.js';
import OutputDeviceList from './OutputDeviceList.js';
import * as Constants from './util/Constants.js';
import Printer from './util/Printer.js';
import DebugHelper from './util/preferencewindow/DebugHelper.js';


export default class AudioDevicePreferences {

    _tooltipfactory = null;

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
    
    _remoteHeadphoneModel = null;
    _indexRemoteHeadphoneModel = null;
    _currentRemoteHeadphoneValue=null;

    _activateToggleRemoteHeadphoneHotkey=null;
    unpackSettings(window) {
        this._settingProvider = new SettingProvider(window._settingsInstance);
        this._outputDeviceMap = new OutputDeviceList(this._settingProvider);

        let headphoneSet = this._settingProvider.getHeadphone();
        let remoteHeadphoneSet = this._settingProvider.getRemoteHeadphone(); //TODO add it
        let speakerSet = this._settingProvider.getSpeaker();

        console.debug(`Speakerset: Description:${speakerSet[1]} #${speakerSet.length}`);
        console.debug(`Headset: Description:${headphoneSet[1]} #${headphoneSet.length}`);
        console.debug(`Remote Headset: Description:${remoteHeadphoneSet[1]} #${remoteHeadphoneSet.length}`);
        this._currentSpeakerValue = (speakerSet && speakerSet.length === 3) ? speakerSet[1] : undefined;
        this._currentHeadphoneValue = (headphoneSet && headphoneSet.length === 3) ? headphoneSet[1] : undefined;
        this._currentRemoteHeadphoneValue = (remoteHeadphoneSet && remoteHeadphoneSet.length === 3) ? remoteHeadphoneSet[1] : undefined;
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
    _buildLabelsForComboRow() {
        // Simple factory with tooltip
        const comboRowLabelFactory = new Gtk.SignalListItemFactory();
        comboRowLabelFactory.connect("setup", (factory, listItem) => {
        const label = new Gtk.Label({ xalign: 0 });
        listItem.set_child(label);
        });

        comboRowLabelFactory.connect("bind", (factory, listItem) => {
            const label = listItem.get_child();
            const item = listItem.get_item();
            const fullText = item.get_string();

            // Trim to 50 characters and add ellipsis if needed
            const displayText = fullText.length > 50 
                ? fullText.substring(0, 50) + '...' 
                : fullText;
    
            label.set_text(displayText);
            label.set_tooltip_text(fullText); // Full text in tooltip
        });
        return comboRowLabelFactory;
    }
    _buildListModel() {
        // build the model again
        this._listModelOfDevices = null;
        this._listModelOfDevices = new Gtk.StringList();
        this._indexHeadphoneModel = 0;
        this._indexSpeakerModel = 0;
        this._indexRemoteHeadphoneModel = 0;
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
                if (this._currentRemoteHeadphoneValue && this._currentRemoteHeadphoneValue === e) {
                    console.debug(`Found Entry in remote headphone list: ${e}, ${index}`);
                    this._indexRemoteHeadphoneModel = index;
                }
                this._listModelOfDevices.append(e);
        }
        );
        console.debug(`headphone: ${this._indexHeadphoneModel}, speaker: ${this._indexSpeakerModel}, remote headphone: ${this._indexRemoteHeadphoneModel}`);
    }
    
    _updateModel(modelToUpdate, selectedIndex) {
        if (modelToUpdate) {
            modelToUpdate.set_model(this._listModelOfDevices);
            modelToUpdate.set_selected(selectedIndex);
        }
    }

    _createStylingPage(page) {
        const iconStyling = new Adw.PreferencesGroup({
            title: _('Icon Styling - use monochrome symbolic icons'),
            description: _(` Whether you want colorful or symbolic monochrome icons`),
        });
        page.add(iconStyling);

        const activateMonochromeSystemtray = new Adw.SwitchRow({
            title: _('Systemtray Icon'),
            subtitle: _('toggle on: use symbolic icon'),
        });
        const activateMonochromeQuickSetting = new Adw.SwitchRow({
            title: _('(Quick) Setting Menu'),
            subtitle: _('toggle on: use symbolic icon'),
        });

        iconStyling.add(activateMonochromeSystemtray);
        iconStyling.add(activateMonochromeQuickSetting);

        const customization = new Adw.PreferencesGroup({
            title: _('Customized Icons'),
            description: _(`If you want customized icons, you can follow this <a href='%s'>wiki</a>`).format(Constants.WIKI_LINKS["Customization"]),
        });
        page.add(customization);
        this._settingProvider.bindSystemTrayIconUseMonochrome(activateMonochromeSystemtray);
        this._settingProvider.bindSettingIconUseMonochrome(activateMonochromeQuickSetting);
    }

    _createToggleHotKeys(page) {
        const toggleHotKeysGroup = new Adw.PreferencesGroup({
            title: _('Shortcuts'),
            description: _(`Control whether shortcuts should be activated or not.`) + `\n` 
                         + _(`If true, the audio device can  also be selected / toggled with a hotkey.`) + `\n`
                         + _(`Hotkeys can be changed via <a href='%s'>dconf-editor.</a>`).format(Constants.WIKI_LINKS["HOTKEYS"]),
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

        this._activateToggleRemoteHeadphoneHotkey = new Adw.SwitchRow({
            title: _('Toggle headphone / remote headphone hotkey'),
            subtitle: _('Default Hotkey: Ctrl+Super+R'),
        });
        

        toggleHotKeysGroup.add(activateToggleHotkey);
        toggleHotKeysGroup.add(activateSelectSpeakerHotkey);
        toggleHotKeysGroup.add(activateSelectHeadphoneHotkey);
        toggleHotKeysGroup.add(this._activateToggleRemoteHeadphoneHotkey);
        this._settingProvider.bindEnableToggleHeadphoneHotKey(activateToggleHotkey);
        this._settingProvider.bindEnableSelectSpeakerHotKey(activateSelectSpeakerHotkey);
        this._settingProvider.bindEnableSelectHeadphoneHotKey(activateSelectHeadphoneHotkey);
        this._settingProvider.bindEnableToggleRemoteHeadphoneHotKey(this._activateToggleRemoteHeadphoneHotkey); //bindEnableToggleRemoteHeadphoneHotKey
    }

    _createOutputDeviceGroup(page) {

        this._tooltipfactory = this._buildLabelsForComboRow();

        const enableRemoteHeadset = new Adw.PreferencesGroup({
            title: _('Toggle Between Headphone and Remote Headphone'),
            description: _('Activates a toggle between the headphone device and a second headphone device e.g. a remote device'),
        });

        const enableRemoteHeadsetToggler = new Adw.SwitchRow({
            title: _("Activate Feature"),
            subtitle: _("Activates the Feature - Select your second Headset (e.g. remote Headset)"),
        });

        enableRemoteHeadset.add(enableRemoteHeadsetToggler);
        page.add(enableRemoteHeadset);


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
            use_subtitle: true, 
        });
        


        this._headphoneModel = new Adw.ComboRow({
            title: _('Headphone'),
            model: this._listModelOfDevices,
            selected: this._indexHeadphoneModel,
            use_subtitle: true, 
        });


        outputDeviceGroup.add(this._speakerModel);
        outputDeviceGroup.add(this._headphoneModel);

        this._headphoneModel.connect(`notify::selected-item`, () => {
            this._settingProvider.setHeadphone(this._packData(this._headphoneModel.selected_item));
            
        });
        this._speakerModel.connect(`notify::selected-item`, () => {
            this._settingProvider.setSpeaker(this._packData(this._speakerModel.selected_item));
        });


        this._settingProvider.bindEnableRemoteHeadsetToggler(
            enableRemoteHeadsetToggler
        );
        outputDeviceGroup.add(enableRemoteHeadsetToggler);

        this._remoteHeadphoneModel = new Adw.ComboRow({
            title: _('Remote-Headphone'),
            model: this._listModelOfDevices,
            selected: this._indexRemoteHeadphoneModel,
            visible: this._settingProvider.getEnabledToggleRemoteHeadphone(),
            use_subtitle: true,
        });

        // expand Labels
        this._speakerModel.set_factory(this._tooltipfactory);
        this._headphoneModel.set_factory(this._tooltipfactory);
        this._remoteHeadphoneModel.set_factory(this._tooltipfactory);


        this._settingProvider.onRemoteHeadphoneSettingChange( (_,k) => {
            console.debug("CHANGED");
            let provider = this._settingProvider;
            let is_remote = provider.getEnabledToggleRemoteHeadphone();
            this._remoteHeadphoneModel.visible = is_remote;
            this._activateToggleRemoteHeadphoneHotkey.visible = is_remote;
        });
        outputDeviceGroup.add(this._remoteHeadphoneModel);

        this._remoteHeadphoneModel.connect(`notify::selected-item`, () => {
            this._settingProvider.setRemoteHeadphone(this._packData(this._remoteHeadphoneModel.selected_item)); 
        });
    }

    _createSupport(page) {
        const support = new Adw.PreferencesGroup({
            title: _('Support'),
            description: _('Enjoying this extension?') + `\n`
                        + _(`If you'd like to show your support, you can make a donation using this <a href='%s'>link.</a>`).format(Constants.SUPPORT_LINKS["Support"])
                        + _(`– every contribution helps keep the project going!`)
        });
        page.add(support);
    }

    create_ui(window) {
        this.unpackSettings(window);
        this.buildIndex();
        this._buildListModel();

        // Create a preferences page, with a single group
        const page = new Adw.PreferencesPage({
            title: _('General-Preferences'),
            icon_name: 'preferences-system-symbolic',
            description: _(`If the toggle button is true (indicator icon is a headphone), the selected 'Headphone' device will be used as default audio output device. Otherwise the 'Speaker' device will be used.`)
        });
        window.add(page);
        
        this._createOutputDeviceGroup(page);
        
        this._createToggleHotKeys(page);

        this._createSupport(page);
        
        const stylingPage = new Adw.PreferencesPage({
            title: _('Styling'),
            icon_name: 'applications-graphics-symbolic',
            description: _(`Customize your experience`)
        });
        window.add(stylingPage);
        this._createStylingPage(stylingPage);



        
    }

    _packData (selectedItem) {
        let item = Object.assign(selectedItem, Gtk.StringObject);
        let text = item.get_string();
        console.debug(`selected: ${text}`);
        console.debug(`is in device list: ${this._reverseLookUpDeviceMap.has(text)}`);
        let id = this._reverseLookUpDeviceMap.get(text);
        let deviceItem =  this._outputDeviceMap.getItem(id);
        let metaData = deviceItem[1];
        return [id, text,metaData];
    }
    
}