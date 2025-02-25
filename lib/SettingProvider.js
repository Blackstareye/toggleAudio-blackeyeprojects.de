import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import AppSettingsProvider from './AppSettingsProvider.js';

/**
 *  Setting Provider - Helper for GSettings interactions
 */
export default class SettingProvider extends AppSettingsProvider {

    constructor(settingInstance) {
        super(settingInstance);
    }


    onHeadphoneStatusChanged(onChangeEvent) {
        return this._settingsInstance.connect("changed::headphone-on", onChangeEvent);
        // this._settingProvider.settingInstance.connect("changed::headphone-on", (_, k) => {
        //     this._applyChanges(k)
        // });
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

    getSpeakerIcon(use_symbolic) {
        let symbolic = use_symbolic ? "-symbolic" : ""; 
        return this._settingsInstance.get_string(`speaker-icon${symbolic}`);
    }
    getHeadphoneIcon(use_symbolic) {
        let symbolic = use_symbolic ? "-symbolic" : ""; 
        return this._settingsInstance.get_string(`headphone-icon${symbolic}`);
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


    getEnabledToggleHotkey() {
        return this._settingsInstance.get_boolean("enable-toggle-headphone-key");
    }
    getEnabledSelectSpeakerHotkey() {
        return this._settingsInstance.get_boolean("enable-select-speaker-key");
    }
    getEnabledSelectHeadphoneHotkey() {
        return this._settingsInstance.get_boolean("enable-select-headphone-key");
    }

    setSpeaker(speakerDataSet) {
        this._settingsInstance.set_value("speaker", new GLib.Variant("(iss)", speakerDataSet));
    }

    setHeadphone(headphoneDataSet) {
        this._settingsInstance.set_value("headphone", new GLib.Variant("(iss)", headphoneDataSet));
    }

    getOutputDevicesSchemaList() {
        return this._unpackSchemaDict("output-devices-available");
    }

}