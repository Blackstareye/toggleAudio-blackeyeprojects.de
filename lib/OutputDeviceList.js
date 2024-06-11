import Printer from "./Printer.js";

export default class OutputDeviceList  {

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
    

    add(id, mixerUiDevice) {
        if (this._dataMap) {

            
            if (Object.hasOwn(this._dataMap, id)) {
                // Id is already in list
                return;
            }
        }
        //TODO in MixerFunction let mixerUiDevice = this._mixerControl.lookup_output_id(id);

        let uuid = this.getUniqueIdentifierForDevice(mixerUiDevice);


        let hasUpdate = this._updateDataset(uuid, id);

        if (!hasUpdate) {
            console.log(`Added new Entry: ${uuid}  with new id ${id}`);
            this._dataMap[id] = [this._buildDeviceString(mixerUiDevice), uuid];
            // TODO store in Schema
            this.storeAndNotifyUpdate(this._dataMap[id], id, id);
        }


        // TODO store in Schema

        return this._dataMap;
    }

    _buildDeviceString(mixerUiDevice) {
        let description = mixerUiDevice.get_description();
        let origin = mixerUiDevice.get_origin();
        description += (origin) ? " - " + origin : "";
        return description;
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

    // find(uuid) {
    //     // for (let key in this._outputDeviceMap) {
    //     //     // // es-lint no-prototype-builtins fix
    //     //     if (Object.prototype.hasOwnProperty.call(this._outputDeviceMap, key)) {
    //     //         this._reverseLookUpDeviceMap.set(this._outputDeviceMap[key][0], key);
    //     //     }
    //     // }
    // }

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


    _updateDeviceSet(currentOutputDeviceSchemaList, dataset, oldRuntimeId, newRuntimeId) {
        console.debug(`Found object: ${dataset.join(" / ")}`);
        // new entry for the dataset
        currentOutputDeviceSchemaList[newRuntimeId] = dataset;

        // TODO subcription of Object this._updateSpeakerAndHeadphones(oldRuntimeId, newRuntimeId);
        // delete old one
        delete currentOutputDeviceSchemaList[oldRuntimeId];
    }

    printSchema() {
        return Printer.printBeautyObject(this._settingProvider.getOutputDevicesSchemaList());
    }
    
    printData() {
        return Printer.printBeautyObject(this._dataMap);
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


    // _addNewDeviceEntry(currentOutputDeviceSchemaList, id) {

    //     if (currentOutputDeviceSchemaList)

    //         if (Object.hasOwn(currentOutputDeviceSchemaList, id)) {
    //             // Id is already in list
    //             return;
    //         }

    //     let mixerUiDevice = this._mixerControl.lookup_output_id(id);

    //     let uuid = this.getUniqueIdentifierForDevice(mixerUiDevice);
    //     for (const [key, values] of Object.entries(currentOutputDeviceSchemaList)) {
    //         if (values.includes(uuid)) {
    //             this._updateDeviceSet(currentOutputDeviceSchemaList, values, key, id);
    //         }
    //     }

    //     return {
    //         ...currentOutputDeviceSchemaList,
    //         [id]: [this._buildDeviceString(mixerUiDevice), uuid]
    //     };
    // }




    // this._outputDeviceMap = window._settingsInstance.get_value("output-devices-available").recursiveUnpack();
    // let headphoneSet = window._settingsInstance.get_value("headphone").recursiveUnpack();
    // let speakerSet = window._settingsInstance.get_value("speaker").recursiveUnpack();
}