import Printer from "../util/Printer.js";

/** 
 * List for Output Devices, defined by MixerControl
 * Structure of entries is defined via gsetting xml with key: output-devices-available 
 * (uses ObserverPattern, and notifies if device list changes)
*/
export default class DeviceList  {

    _settingProvider = null;
    _dataMap = [];
    _observerList = [];

    constructor(settingProvider) {
        this._settingProvider = settingProvider;
        this._load();
    }

    _store() {
        // dump into setting
        this._settingProvider.storeInSchema(this._dataMap);
    }

    _load() {
        // load from setting
        console.debug(`LOADING SETTINGS`);
        this._dataMap = this._settingProvider.getOutputDevicesSchemaList();
    }

    keys () {
        return Object.keys(this._dataMap);
    }

    getItem(key) {
        return this._dataMap[key];
    }
    
    /**
     * adds a device and if already in list but has another runtime id it will be updated
     */
    add(id, mixerUiDevice) {
        if (this._dataMap) {
            if (Object.hasOwn(this._dataMap, id)) {
                // Id is already in list
                return;
            }
        }

        let uuid = this.getUniqueIdentifierForDevice(mixerUiDevice);
        let hasUpdate = this._updateDataset(uuid, id);
        
        if (!hasUpdate) {
            console.log(`Added new Entry: ${uuid}  with new id ${id}`);
            this._dataMap[id] = [this._buildDescriptionString(mixerUiDevice), uuid];
            this.storeAndNotifyUpdate(this._dataMap[id], id, id);
        }

        return this._dataMap;
    }

    delete(id) {
        if (!Object.hasOwn(this._dataMap, id)) {
            return;
        }
        delete this._dataMap[id];
        // TODO store in Schema

        this.storeAndNotifyUpdate(undefined, id, undefined);

        return this._dataMap;
    }

    _updateDataset(identifier, new_id) {
        let hasUpdate = false;
        for (const [key, values] of Object.entries(this._dataMap)) {
            if (values.includes(identifier)) {
                console.debug(`UPDATING IDs from ${key} to ${new_id}`);
                this._updateDeviceSet(this._dataMap, values, key, new_id);
                // Update Subcribers that the key has changed
                this.storeAndNotifyUpdate(values, key, new_id);
                hasUpdate = true;
                break;
            }
        }
        return hasUpdate;
    }


    /**
     * construct a Unique Identifier for the device entries
     * devices don't have device.name and the id is only unique within it's runtime
     * to identify the same device also after a session has ended or the extension has been disabled, 
     * this ID is necessary
     * 
     * @param device  mixerUiDevice
     */
    getUniqueIdentifierForDevice(device) {
        // Get various properties of the device
        let description = device.get_description().replace(/ /g, "_");;
        let origin = device.get_origin().replace(/ /g, "_");;
        let serial = device.get_icon_name().replace(/ /g, "_");;
        // let port = device.get_port().replace(/ /g, "_");;
        // Construct the UID using the properties
        let uniqueIdentifier = `${description}-${origin}-${serial}`;
        return uniqueIdentifier;
    }


    _updateDeviceSet(currentOutputDeviceSchemaList, dataset, oldRuntimeId, newRuntimeId) {
        console.debug(`Found object: ${dataset.join(" / ")}`);
        // new entry for the dataset
        currentOutputDeviceSchemaList[newRuntimeId] = dataset;

        // TODO subcription of Object this._updateSpeakerAndHeadphones(oldRuntimeId, newRuntimeId);
        // delete old one
        delete currentOutputDeviceSchemaList[oldRuntimeId];
    }


    _buildDescriptionString(mixerUiDevice) {
        let description = mixerUiDevice.get_description();
        let origin = mixerUiDevice.get_origin();
        description += (origin) ? " - " + origin : "";
        return description;
    }

    printSchema() {
        return Printer.printBeautyObject(this._settingProvider.getOutputDevicesSchemaList());
    }
    
    printData() {
        return Printer.printBeautyObject(this._dataMap);
    }

    /****************** Observer pattern ***************/
    subscribeOnChange(func) {
        this._observerList.push(func);
    }
    unsubscribeOnChange(func) {
        this._observerList = this._observerList.filter((observer) => observer !== func);
    }
    
    storeAndNotifyUpdate(element, indexOld, indexNew) {
        this._store();
        this.notifyUpdate(element, indexOld, indexNew);
    }
    notifyUpdate(element, indexOld, indexNew) {
        this._observerList.forEach(callback => {
            callback(element, indexOld, indexNew)
        });
    }
    /****************** Observer pattern ***************/
}