import GLib from 'gi://GLib';

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