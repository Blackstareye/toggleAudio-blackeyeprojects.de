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
    //TODO GSettings
    // TODO Use name instead of id for the list?
    _outputAudioDeviceMap = null;
    _mixerControl = null;
    _signalsHandler = null;
    _sessionName = null;


    constructor (sessionName, settingsInstance) {

        console.log(`Initializing MixerControlFacade`);
        this._sessionName = sessionName;
        this._outputAudioDeviceMap = new Map();
        this._signalsHandler = [];
        this._settingsInstance = settingsInstance;

        this._mixerControl = Gvc.MixerControl.new(this._sessionName);
        this._mixerControl.open();
        this._addSignals();
        // TODO detect changes in stream
        //gObject._signals.push(this._mixerControl.connect("active-" + direction + "put-update", (mixerControl, id) => this._activeStreamChanged(id)))
    }


    _addSignals() {
        this._signalsHandler.push(this._mixerControl.connect("output-added", (mixerControl, id) => this._mixerDeviceAdded(id)))
        this._signalsHandler.push(this._mixerControl.connect("output-removed", (mixerControl, id) => this._mixerDeviceRemoved(id)))
        // this._signalsHandler.push(this._mixerControl.connect("active-output-update", (mixerControl, id) => this._activeStreamChanged(id)))
    }

    printInfos(log_function=console.log) {
        log_function(`
            Debugging-Log:
                Instance ${this._sessionName}
                    Sessionname: ${this._sessionName}
                    Signals: ${this._signalsHandler.join(";")}
                    Mixerinstance: ${this._mixerControl}
                    Map: ${this._printBeautyMap()}
                    Gnome-Settings:
                        headphone: ${this._settingsInstance.get_string("headphone")}
                        speaker: ${this._settingsInstance.get_string("speaker")}
                        output-schema-list: ${this._printBeautyArray(this._getOutputDevicesSchemaList())}
        `);
    }

    _printBeautyArray (variantObject) {
        return JSON.stringify(variantObject,null, 2);
    }

    _printBeautyMap() {
        let beautyPrint="";
        for (const [key, value] of this._outputAudioDeviceMap) {
            beautyPrint +=`Device ${key} - ${value}` + "\n";
        }
        return beautyPrint;
    }

    /**
      * MixerControl signal handler
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
     * MixerControl signal handler
     */
    _mixerDeviceRemoved(id) {
        console.log(`Device added with id ${id}`);
        // get old list 
        let currentOutputDeviceSchemaList = this._getOutputDevicesSchemaList();

        // remove DeviceEntry
        let newOutputDeviceSchemaList = this._removeDeviceEntry(currentOutputDeviceSchemaList, id);

        this._storeInSchema(newOutputDeviceSchemaList);
    }

    _lookupMixerUiDevice(id) {
        console.log(`lookup for ${id}`);
        if (this._direction === "in") {
            return this._mixerControl.lookup_input_id(id);
        } else {
            return this._mixerControl.lookup_output_id(id);
        }
    }

    /**
   * MixerControl signal handler
   */
    _activeStreamChanged(id) {
        // this.label.set_text(this._menuItemMap.get(id));

        // if (!this._isInitialized) {
        //     this._updateMenu();
        //     this._isInitialized = true;
        // }
        console.log(`id changed for ${id}`);
    }

    _buildDeviceString(mixerUiDevice) {
        let description = mixerUiDevice.get_description();
        let origin = mixerUiDevice.get_origin();
        description += (origin) ? " - " + origin  : "";
        return description;
    }

    _addNewDeviceEntry(currentOutputDeviceSchemaList, id) {

        if (Object.hasOwn(currentOutputDeviceSchemaList, id)) {
            // Id is already in list
            return;
        }

        let mixerUiDevice = this._lookupMixerUiDevice(id);

        return  {
            ...currentOutputDeviceSchemaList,
            [id] : this._buildDeviceString(mixerUiDevice)
        };
    }
    _removeDeviceEntry(currentOutputDeviceSchemaList, id) {

        if (! Object.hasOwn(currentOutputDeviceSchemaList, id)) {
            // Id is not in list
            return;
        }
        delete currentOutputDeviceSchemaList[id];

        return  currentOutputDeviceSchemaList;
    }



    destroy () {

        console.log(`Destroying Mixer Control Facade`);
        this._signalsHandler.forEach((signal) => this._mixerControl.disconnect(signal));
        this._outputAudioDeviceMap = null;
        this._mixerControl = null;
        this._signalsHandler = null;
        this._sessionName = null;
        this._settingsInstance = null;
    }

    // Can be modularized

    _unpackSchemaDict(key) {
        //TODO maybe unpack to hashmap instead object
        return this._settingsInstance.get_value(key).recursiveUnpack();
    }

    _getOutputDevicesSchemaList() {
        return this._unpackSchemaDict("output-devices-available");
    }

    _storeInSchema(listToStore, key="output-devices-available", format="a{is}") {
            this._settingsInstance.set_value(key, new GLib.Variant(format, listToStore));

            // // Create a settings object and bind the speaker to the `show-indicator` key
            // window._settings = this.getSettings();
            // window._settings.bind('speaker', speaker, 'active',
            //     Gio.SettingsBindFlags.DEFAULT);
            // window._settings.bind('headphone', headphone, 'active',
            //     Gio.SettingsBindFlags.DEFAULT);
    }
}