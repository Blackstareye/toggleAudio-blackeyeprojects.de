import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

/**
 *  Setting Provider - Helper for GSettings interactions
 */
export default class AppSettingsProvider {

    _settingsInstance = null;
    // Can be modularized in Settingsprovider

    constructor(settingInstance) {
        this._settingsInstance = settingInstance;
    }


    get settingInstance() {
        console.log("GETTING settingInstance");
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
        return headphonestatus ? this.getHeadphoneIcon(use_monochrome) : this.getSpeakerIcon(use_monochrome);
    }
    getQuickSettingIcon() {
        let use_monochrome = this.getUseMonochromeIconOnSetting();
        return this.getHeadphoneIcon(use_monochrome);
    }

    getShowIconFlag() {
        return this._settingsInstance.get_boolean("show-icon");
    }

    // this._outputDeviceMap = window._settingsInstance.get_value("output-devices-available").recursiveUnpack();
    //     let headphoneSet = window._settingsInstance.get_value("headphone").recursiveUnpack();
    //     let speakerSet = window._settingsInstance.get_value("speaker").recursiveUnpack();


    onSettingIconChanged(onChangeEvent) {
        return this._settingsInstance.connect("changed::toggle-use-monochrome-setting-icon", onChangeEvent);
        // this._settingProvider.settingInstance.connect("changed::headphone-on", (_, k) => {
        //     this._applyChanges(k)
        // });
    }
    onSystemTrayIconChanged(onChangeEvent) {
        return this._settingsInstance.connect("changed::toggle-use-monochrome-system-tray-icon", onChangeEvent);
        // this._settingProvider.settingInstance.connect("changed::headphone-on", (_, k) => {
        //     this._applyChanges(k)
        // });
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

    storeInSchema(listToStore, key = "output-devices-available", format = "a{i(ss)}") {
        this._settingsInstance.set_value(key, new GLib.Variant(format, listToStore));
    }
    _unpackSchemaDict(key) {
        return this._settingsInstance.get_value(key).recursiveUnpack();
    }

}