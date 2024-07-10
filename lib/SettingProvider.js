import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

/**
 *  Setting Provider - Helper for GSettings interactions
 */
export default class SettingProvider {

    _settingsInstance = null;
    // Can be modularized in Settingsprovider

    constructor(settingInstance) {
        this._settingsInstance = settingInstance;
    }

    // this._outputDeviceMap = window._settingsInstance.get_value("output-devices-available").recursiveUnpack();
    //     let headphoneSet = window._settingsInstance.get_value("headphone").recursiveUnpack();
    //     let speakerSet = window._settingsInstance.get_value("speaker").recursiveUnpack();

    onHeadphoneStatusChanged(onChangeEvent) {
        return this._settingsInstance.connect("changed::headphone-on", onChangeEvent);
        // this._settingProvider.settingInstance.connect("changed::headphone-on", (_, k) => {
        //     this._applyChanges(k)
        // });
    }

    bindSystemIconStatus(button) {
        this._settingsInstance.bind('show-indicator', button, 'active',
            Gio.SettingsBindFlags.DEFAULT);
    }
    bindEnableToggleHeadphoneHotKey(button) {
        this._settingsInstance.bind('enable-toggle-headphone-key', button, 'active',
            Gio.SettingsBindFlags.DEFAULT);
    }
    bindEnableSelectSpeakerHotKey(button) {
        this._settingsInstance.bind('enable-select-speaker-key', button, 'active',
            Gio.SettingsBindFlags.DEFAULT);
    }
    bindEnableSelectHeadphoneHotKey(button) {
        this._settingsInstance.bind('enable-select-headphone-key', button, 'active',
            Gio.SettingsBindFlags.DEFAULT);
    }

    // onHeadphoneValueChanged()
    // onSpeakerValueChanged()



    get settingInstance() {
        console.log("GETTING settingInstance");
        return this._settingsInstance;
    }

    getSpeaker() {
        return this._settingsInstance.get_value("speaker").recursiveUnpack();
    }

    getHeadphone() {
        return this._settingsInstance.get_value("headphone").recursiveUnpack();
    }

    getHeadPhoneOnStatus() {
        return this._settingsInstance.get_boolean("headphone-on");
    }
    getShowIconFlag() {
        return this._settingsInstance.get_boolean("show-icon");
    }


    setSpeaker(speakerDataSet) {
        this._settingsInstance.set_value("speaker", new GLib.Variant("(iss)", speakerDataSet));
    }

    setHeadphone(headphoneDataSet) {
        this._settingsInstance.set_value("headphone", new GLib.Variant("(iss)", headphoneDataSet));
    }

    _unpackSchemaDict(key) {
        return this._settingsInstance.get_value(key).recursiveUnpack();
    }

    getOutputDevicesSchemaList() {
        return this._unpackSchemaDict("output-devices-available");
    }

    storeInSchema(listToStore, key = "output-devices-available", format = "a{i(ss)}") {
        this._settingsInstance.set_value(key, new GLib.Variant(format, listToStore));
    }

}