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


    onHeadphoneStatusChanged(onChangeEvent) {
        return this._settingsInstance.connect("changed::headphone-on", onChangeEvent);
    }

    onSettingIconChanged(onChangeEvent) {
        return this._settingsInstance.connect("changed::toggle-use-monochrome-setting-icon", onChangeEvent);
    }
    onSystemTrayIconChanged(onChangeEvent) {
        return this._settingsInstance.connect("changed::toggle-use-monochrome-system-tray-icon", onChangeEvent);
    }
    onRemoteHeadphoneSettingChange(onChangeEvent) {
        return this._settingsInstance.connect("changed::enable-toggle-remote-headphone", onChangeEvent);
    }


    onFlagForUseRemoteHeadphone(onChangeEvent) {
        return this._settingsInstance.connect("changed::use-remote-headphone-flag", onChangeEvent);
    }

    


    bindSystemTrayIconUseMonochrome(button) {
        this._settingsInstance.bind('toggle-use-monochrome-system-tray-icon', button, 'active',
            Gio.SettingsBindFlags.DEFAULT);
    }

    bindSettingIconUseMonochrome(button) {
        this._settingsInstance.bind('toggle-use-monochrome-setting-icon', button, 'active',
            Gio.SettingsBindFlags.DEFAULT);
    }

    bindSystemIconStatus(button) {
        this._settingsInstance.bind('show-indicator', button, 'active',
            Gio.SettingsBindFlags.DEFAULT);
    }

    bindEnableRemoteHeadsetToggler(button) {
        this._settingsInstance.bind('enable-toggle-remote-headphone', button, 'active',
            Gio.SettingsBindFlags.DEFAULT);
    }

    bindEnableRemoteHeadsetMenu(quickMenuToggler) {
        this._settingsInstance.bind('enable-toggle-remote-headphone', quickMenuToggler, 'menu-enabled',
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
    bindEnableToggleRemoteHeadphoneHotKey(button) {
        this._settingsInstance.bind('enable-toggle-remote-headphone-key', button, 'active',
            Gio.SettingsBindFlags.DEFAULT);
    }



    bindFlagForUseRemoteHeadphone(button) {
    //     return this._settingsInstance.get_boolean(`use-remote-headphone-flag`);
           this._settingsInstance.bind('use-remote-headphone-flag', button, 'state',
            Gio.SettingsBindFlags.DEFAULT);
    }

    // onHeadphoneValueChanged()
    // onSpeakerValueChanged()



    get settingInstance() {
        console.debug("GETTING settingInstance");
        return this._settingsInstance;
    }

    getUseMonochromeIconOnSetting() {
        return this._settingsInstance.get_boolean(`toggle-use-monochrome-setting-icon`);
    }

    getUseMonochromeIconOnSystemtray() {
        return this._settingsInstance.get_boolean(`toggle-use-monochrome-system-tray-icon`);
    }

    getSystemTrayIcon() {
        let use_monochrome = this.getUseMonochromeIconOnSystemtray();
        let headphonestatus = this.getHeadPhoneOnStatus();
        return headphonestatus ? this.getCorrectHeadphoneIcon(use_monochrome) : this.getSpeakerIcon(use_monochrome);
    }
    getQuickSettingIcon() {
        let use_monochrome = this.getUseMonochromeIconOnSetting();
        return this.getHeadphoneIcon(use_monochrome);
    }

    getSpeakerIcon(use_symbolic) {
        let symbolic = use_symbolic ? "-symbolic" : ""; 
        return this._settingsInstance.get_string(`speaker-icon${symbolic}`);
    }

    getCorrectHeadphoneIcon(use_monochrome) {
        let remoteHeadphoneEnabled = this.getRemoteHeadphoneStatus();
        let headphoneicon = remoteHeadphoneEnabled ? this.getRemoteHeadphoneIcon(use_monochrome) : this.getHeadphoneIcon(use_monochrome);
        console.log(`HEADPHONE_ICON: ${headphoneicon} - REMOTE_ENABLED: ${remoteHeadphoneEnabled}`);
        return headphoneicon;
    }

    

    // TODO make `_` out of it to differentiate

    getHeadphoneIcon(use_symbolic) {
        let symbolic = use_symbolic ? "-symbolic" : ""; 
        return this._settingsInstance.get_string(`headphone-icon${symbolic}`);
    }
    getRemoteHeadphoneIcon(use_symbolic) {
        let symbolic = use_symbolic ? "-symbolic" : ""; 
        return this._settingsInstance.get_string(`remote-headphone-icon${symbolic}`);
    }

    getSpeaker() {
        return this._settingsInstance.get_value("speaker").recursiveUnpack();
    }

    getHeadphone() {
        return this._settingsInstance.get_value("headphone").recursiveUnpack();
    }
    
    getRemoteHeadphone() {
        return this._settingsInstance.get_value("remote-headphone").recursiveUnpack();
    }

    getFlagForUseRemoteHeadphone() {
        return this._settingsInstance.get_boolean(`use-remote-headphone-flag`);
    }

    getRemoteHeadphoneStatus() {
        let is_remote_on = this.getFlagForUseRemoteHeadphone();
        let is_remote_headphone_feature_on = this.getEnabledToggleRemoteHeadphone();
        return is_remote_on && is_remote_headphone_feature_on;
    }

    getHeadPhoneOnStatus() {
        return this._settingsInstance.get_boolean("headphone-on");
    }
    getShowIconFlag() {
        return this._settingsInstance.get_boolean("show-icon");
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

    getEnabledToggleRemoteHeadphone() {
        return this._settingsInstance.get_boolean("enable-toggle-remote-headphone");
    }

    setSpeaker(speakerDataSet) {
        this._settingsInstance.set_value("speaker", new GLib.Variant("(iss)", speakerDataSet));
    }

    setHeadphone(headphoneDataSet) {
        this._settingsInstance.set_value("headphone", new GLib.Variant("(iss)", headphoneDataSet));
    }

    setHeadPhoneOnStatus(state) {
        return this._settingsInstance.set_boolean("headphone-on", state);
    }
    
    setRemoteHeadphone(remoteHeadphoneDataSet) {
        this._settingsInstance.set_value("remote-headphone", new GLib.Variant("(iss)", remoteHeadphoneDataSet));
    }

    setFlagForUseRemoteHeadphone(state) {
        return this._settingsInstance.set_boolean(`use-remote-headphone-flag`,state);
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