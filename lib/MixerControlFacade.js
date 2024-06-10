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
 * 
 * 
 * Thx to 
 */
import Gvc from 'gi://Gvc';
import SettingProvider from './SettingProvider.js';



export default class MixerControlFacade {
    _outputAudioDeviceMap = null;
    _mixerControl = null;
    _signalsHandler = null;
    _settingConnectHandler = null;
    _sessionName = null;
    _isReady = false;


    constructor(sessionName, settingsInstance) {

        console.log(`Initializing MixerControlFacade`);
        this._sessionName = sessionName;
        this._outputAudioDeviceMap = new Map();
        this._signalsHandler = [];
        this._settingConnectHandler = [];
        this._settingProvider = new SettingProvider(settingsInstance);

        this._mixerControl = Gvc.MixerControl.new(this._sessionName);
        this._addSignals();
        this._mixerControl.open();
        this._sync_default_output();
    }


    // async _waitForMixerToBeReady(mixerControl) {
    //     while (mixerControl.get_state() === Gvc.MixerControlState.CONNECTING) {
    //         await new Promise(r => setTimeout(r, 2000));
    //         console.debug("Connecting...");
    //     }
    //     const state = mixerControl.get_state();
    //     if (state === Gvc.MixerControlState.FAILED) {
    //         throw new Error("MixerControl is in a failed state");
    //     }
    //     else if (state === Gvc.MixerControlState.READY) {
    //         console.debug("Connected! Moving on.");
    //     }
    //     else if (state === Gvc.MixerControlState.CLOSED) {
    //         throw new Error("MixerControl is in a closed state");
    //     }
    // }


    

    _sync_default_output() {
        // this._waitForMixerToBeReady(this._mixerControl).then( () => {
            console.debug("CONNECTED; SETTING HEADPHONE ON");
            this._applyChanges("headphone-on");
        // }).catch(e => console.error(`Cant connect to mixer`, e));
        this._settingConnectHandler.push(
            this._settingProvider.onHeadphoneStatusChanged((_, k) => {
            this._applyChanges(k)
        }));

        // this._settingProvider.settingInstance.connect("changed::headphone-on", (_, k) => {
        //     this._applyChanges(k)
        // });
    }

    _applyChanges(key) {
        let v = this._settingProvider.settingInstance.get_boolean(key);
        console.log("Change detected!: key is now " + v);
        if (v) {
            // toggle to headphone
            let headphone_id = this._settingProvider.getHeadphone()[0];
            console.log("H Runtime id: " + headphone_id);
            this._setDefaultAudioOutput(headphone_id);
        } else {
            // toggle back to speaker
            let speaker_id = this._settingProvider.getSpeaker()[0];
            console.log("S Runtime id: " + speaker_id);
            this._setDefaultAudioOutput(speaker_id);
        }
    }

    _addSignals() {
        // this._signalsHandler.push(this._mixerControl.connect("state-changed", (mixerControl, id) => this._mixerDeviceAdded(id)))
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
                        headphone: ${this._settingProvider.getHeadphone().join(" / ")}
                        speaker: ${this._settingProvider.getSpeaker().join(" / ")}
                        output-schema-list: ${this._printBeautyArray(this._settingProvider.getOutputDevicesSchemaList())}
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
        // this._waitForMixerToBeReady(this._mixerControl).then( () => {
            console.log("CONNECTED; SETTING DEFAULT AUDIO OUTPUT");
            let device = this._mixerControl.lookup_output_id(runtime_id);
            if (device) {
                this._mixerControl.change_output(device);
                console.debug(`Default Audio Output changed for ${runtime_id}`);
            } else {
                console.error(`Could not change Audio Output Device. Runtime id is not valid`);
                console.error(`${this._printBeautyArray(this._settingProvider.getOutputDevicesSchemaList())} and id: ${runtime_id}`);
            }
        // }).catch(e => console.error(`Cant connect to mixer`, e));
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
        console.debug(`Device added with id ${id}`);
        // get old list 
        let currentOutputDeviceSchemaList = this._settingProvider.getOutputDevicesSchemaList();
        // add newDevice
        let newOutputDeviceSchemaList = this._addNewDeviceEntry(currentOutputDeviceSchemaList, id);
        this._settingProvider.storeInSchema(newOutputDeviceSchemaList);

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

    /**
      * MixerControl signal handler for removing a device
      * 
      * @param id output runtime id 
    */
    _mixerDeviceRemoved(id) {
        console.debug(`Device added with id ${id}`);
        // get old list 
        let currentOutputDeviceSchemaList = this._settingProvider.getOutputDevicesSchemaList();
        // remove DeviceEntry
        let newOutputDeviceSchemaList = this._removeDeviceEntry(currentOutputDeviceSchemaList, id);
        this._settingProvider.storeInSchema(newOutputDeviceSchemaList);
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
        let headphoneSet = this._settingProvider.getHeadphone();
        let speakerSet = this._settingProvider.getSpeaker();
        console.debug(`Entering loop`);
        [headphoneSet, speakerSet].map((currentSet, index) => {
            console.debug(`Entering map: ${oldRuntimeId} / ${newRuntimeId}; index:${index}; set: ${currentSet.join(" / ")}`);
            if (currentSet[0] == oldRuntimeId) {
                console.log(`Found oldid in set. Update ${oldRuntimeId} => ${newRuntimeId} for ${currentSet.join(" / ")}`);
                currentSet[0] = newRuntimeId;
                if (index == 0) {
                    this._settingProvider.setHeadphone(currentSet);
                } else {
                    this._settingProvider.setSpeaker(currentSet);
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
        this._settingConnectHandler.forEach((signal) => this._settingProvider.settingInstance.disconnect(signal));
        this._outputAudioDeviceMap = null;
        this._mixerControl = null;
        this._signalsHandler = null;
        this._settingConnectHandler = null;
        this._sessionName = null;
        this._settingsInstance = null;
    }


}