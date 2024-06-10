/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */
import Gvc from 'gi://Gvc';
import GLib from 'gi://GLib';
export default class MixerControlFacade {
    _outputAudioDeviceMap = null;
    _mixerControl = null;
    _signalsHandler = null;
    _sessionName = null;


    constructor(sessionName, settingsInstance) {

        console.log(`Initializing MixerControlFacade`);
        this._sessionName = sessionName;
        this._outputAudioDeviceMap = new Map();
        this._signalsHandler = [];
        this._settingsInstance = settingsInstance;

        this._mixerControl = Gvc.MixerControl.new(this._sessionName);
        this._mixerControl.open();
        this._addSignals();

        this._sync_default_output();
    }

    _sync_default_output() {
        this._applyChanges("headphone-on");
        this._settingsInstance.connect("changed::headphone-on", (_, k) => {
            this._applyChanges(k);
        });
    }

    _applyChanges(key) {
        let v = this._settingsInstance.get_boolean(key);
        console.debug("Change detected!: key is now " + v);
        if (v) {
            // toggle to headphone
            let headphone_id = this._getHeadphone()[0];
            console.trace("Runtime id: " + headphone_id);
            this._setDefaultAudioOutput(headphone_id);
        } else {
            // toggle back to speaker
            let speaker_id = this._getSpeaker()[0];
            console.trace("Runtime id: " + speaker_id);
            this._setDefaultAudioOutput(speaker_id);
        }
    }

    _addSignals() {
        this._signalsHandler.push(this._mixerControl.connect("output-added", (mixerControl, id) => this._mixerDeviceAdded(id)))
        this._signalsHandler.push(this._mixerControl.connect("output-removed", (mixerControl, id) => this._mixerDeviceRemoved(id)))
    }

    /**
     * print infos of this Facade
     */
    printInfos(log_function = console.log) {
        log_function(`
            Debugging-Log:
                Instance ${this._sessionName}
                    Sessionname: ${this._sessionName}
                    Signals: ${this._signalsHandler.join(";")}
                    Mixerinstance: ${this._mixerControl}
                    Map: ${this._printBeautyMap()}
                    Default-Audio-Output: ${this._getDefaultAudioOutput().join(" / ")}
                    Default-Audio-Input: ${this._getDefaultAudioInput().join(" / ")}
                    Gnome-Settings:
                        headphone: ${this._getHeadphone().join(" / ")}
                        speaker: ${this._getSpeaker().join(" / ")}
                        output-schema-list: ${this._printBeautyArray(this._getOutputDevicesSchemaList())}
        `);
    }

    _printBeautyArray(variantObject) {
        return JSON.stringify(variantObject, null, 2);
    }

    _printBeautyMap() {
        let beautyPrint = "";
        for (const [key, value] of this._outputAudioDeviceMap) {
            beautyPrint += `Device ${key} - ${value}` + "\n";
        }
        return beautyPrint;
    }


    _setDefaultAudioOutput(runtime_id) {
        let device = this._mixerControl.lookup_output_id(runtime_id);
        if (device) {
            this._mixerControl.change_output(device);
            console.log(`Default Audio Output changed for ${runtime_id}`);
        } else {
            console.error(`Could not change Audio Output Device. Runtime id is not valid`);
            console.error(`${this._printBeautyArray(this._getOutputDevicesSchemaList())} and id: ${runtime_id}`);
        }
    }

    _getDefaultAudioOutput() {
        let mixerStream = this._mixerControl.get_default_sink();
        return [mixerStream.get_description(), mixerStream.get_name()];
    }
    _getDefaultAudioInput() {
        let mixerStream = this._mixerControl.get_default_source();
        return [mixerStream.get_description(), mixerStream.get_name()];
    }



    /**
      * MixerControl signal handler for adding a device
    */
    _mixerDeviceAdded(id) {
        console.log(`Device added with id ${id}`);
        // get old list 
        let currentOutputDeviceSchemaList = this._getOutputDevicesSchemaList();
        // add newDevice
        let newOutputDeviceSchemaList = this._addNewDeviceEntry(currentOutputDeviceSchemaList, id);
        this._storeInSchema(newOutputDeviceSchemaList);

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
        let port = device.get_port().replace(/ /g, "_");;
        // Construct the UID using the properties
        let uniqueIdentifier = `${description}-${origin}-${serial}-${port}`;
        return uniqueIdentifier;
    }

    /**
      * MixerControl signal handler for removing a device
      * 
      * @param id output runtime id 
    */
    _mixerDeviceRemoved(id) {
        console.log(`Device added with id ${id}`);
        // get old list 
        let currentOutputDeviceSchemaList = this._getOutputDevicesSchemaList();
        // remove DeviceEntry
        let newOutputDeviceSchemaList = this._removeDeviceEntry(currentOutputDeviceSchemaList, id);
        this._storeInSchema(newOutputDeviceSchemaList);
    }

    _buildDeviceString(mixerUiDevice) {
        let description = mixerUiDevice.get_description();
        let origin = mixerUiDevice.get_origin();
        description += (origin) ? " - " + origin : "";
        return description;
    }

    _addNewDeviceEntry(currentOutputDeviceSchemaList, id) {

        if (currentOutputDeviceSchemaList)

            if (Object.hasOwn(currentOutputDeviceSchemaList, id)) {
                // Id is already in list
                return;
            }

        let mixerUiDevice = this._mixerControl.lookup_output_id(id);

        let uuid = this.getUniqueIdentifierForDevice(mixerUiDevice);
        for (const [key, values] of Object.entries(currentOutputDeviceSchemaList)) {
            if (values.includes(uuid)) {
                this._updateDeviceSet(currentOutputDeviceSchemaList, values, key, id);
            }
        }

        return {
            ...currentOutputDeviceSchemaList,
            [id]: [this._buildDeviceString(mixerUiDevice), uuid]
        };
    }

    _updateDeviceSet(currentOutputDeviceSchemaList, dataset, oldRuntimeId, newRuntimeId) {
        console.debug(`Found object: ${dataset.join(" / ")}`);
        // new entry for the dataset
        currentOutputDeviceSchemaList[newRuntimeId] = dataset;

        this._updateSpeakerAndHeadphones(oldRuntimeId, newRuntimeId);
        // delete old one
        delete currentOutputDeviceSchemaList[oldRuntimeId];
    }

    _updateSpeakerAndHeadphones(oldRuntimeId, newRuntimeId) {
        let headphoneSet = this._getHeadphone();
        let speakerSet = this._getSpeaker();
        console.trace(`Entering loop`);
        [headphoneSet, speakerSet].map((currentSet, index) => {
            console.trace(`Entering map: ${oldRuntimeId} / ${newRuntimeId}; index:${index}; set: ${currentSet.join(" / ")}`);
            if (currentSet[0] == oldRuntimeId) {
                console.trace(`Found oldid in set. Update ${oldRuntimeId} => ${newRuntimeId} for ${currentSet.join(" / ")}`);
                currentSet[0] = newRuntimeId;
                if (index == 0) {
                    this._setHeadphone(currentSet);
                } else {
                    this._setSpeaker(currentSet);
                }
            }

        });
    }


    _removeDeviceEntry(currentOutputDeviceSchemaList, id) {
        if (!Object.hasOwn(currentOutputDeviceSchemaList, id)) {
            return;
        }
        delete currentOutputDeviceSchemaList[id];
        return currentOutputDeviceSchemaList;
    }

    destroy() {
        console.log(`Destroying Mixer Control Facade`);
        this._signalsHandler.forEach((signal) => this._mixerControl.disconnect(signal));
        this._outputAudioDeviceMap = null;
        this._mixerControl = null;
        this._signalsHandler = null;
        this._sessionName = null;
        this._settingsInstance = null;
    }


    // Can be modularized in Settingsprovider
    _getSpeaker() {
        return this._settingsInstance.get_value("speaker").recursiveUnpack();
    }

    _getHeadphone() {
        return this._settingsInstance.get_value("headphone").recursiveUnpack();
    }
    _setSpeaker(speakerDataSet) {
        this._settingsInstance.set_value("speaker", new GLib.Variant("(iss)", speakerDataSet));
    }

    _setHeadphone(headphoneDataSet) {
        this._settingsInstance.set_value("headphone", new GLib.Variant("(iss)", headphoneDataSet));
    }

    _unpackSchemaDict(key) {
        return this._settingsInstance.get_value(key).recursiveUnpack();
    }

    _getOutputDevicesSchemaList() {
        return this._unpackSchemaDict("output-devices-available");
    }

    _storeInSchema(listToStore, key = "output-devices-available", format = "a{i(ss)}") {
        this._settingsInstance.set_value(key, new GLib.Variant(format, listToStore));
    }
}