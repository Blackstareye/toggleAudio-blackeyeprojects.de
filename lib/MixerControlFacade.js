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
import OutputDeviceList from './OutputDeviceList.js';
import { Headphone, Speaker, RemoteHeadphone } from './AudioDevice.js';
import CommandQueue from './CommandQueue.js';



export default class MixerControlFacade {
    _outputAudioDeviceMap = null;
    _mixerControl = null;
    _signalsHandler = null;
    _settingConnectHandler = null;
    _sessionName = null;
    _isReady = false;

    _audioDeviceSpeaker = null;
    _audioDeviceHeadphone = null;
    _audioDeviceRemoteHeadphone = null;


    _commandQueueInstance = null;

    _timeOutHandler = null;


    constructor(sessionName, settingsInstance) {

        console.log(`Initializing MixerControlFacade`);
        this._sessionName = sessionName;
        this._signalsHandler = [];
        this._settingConnectHandler = [];
        this._timeOutHandler = [];
        this._settingProvider = new SettingProvider(settingsInstance);


        // Devicelist , Headphone Device and SpeakerDevice
        // Speaker and Header run time id will be updated if device list changes
        this._outputAudioDeviceMap = new OutputDeviceList(this._settingProvider);
        this._audioDeviceHeadphone = new Headphone(this._outputAudioDeviceMap, this._settingProvider);
        this._audioDeviceSpeaker = new Speaker(this._outputAudioDeviceMap, this._settingProvider);
        this._audioDeviceRemoteHeadphone = new RemoteHeadphone(this._outputAudioDeviceMap, this._settingProvider);

        // used for commands that can be executed, because MixerControl is not up yet
        this._commandQueueInstance = CommandQueue.create();
        console.debug(this._commandQueueInstance.printQueue());

        // define mixercontrol, add signals and open
        this._mixerControl = Gvc.MixerControl.new(this._sessionName);
        this._addSignals();
        this._mixerControl.open();

        this._sync_default_output();

        this._settingProvider.onFlagForUseRemoteHeadphone(
            () => {
                console.log("OMG SETTING CHANGED HAHAH");
                this._activateDevice();
            }
        );
    }

    /**
     * sets the flag isReady as soon as the MixerControl is accessible
     */
    _on_state_change() {
        let currentState = this._mixerControl.get_state();

        if (currentState === Gvc.MixerControlState.FAILED) {
            this._isReady = false;
            throw new Error("MixerControl is in a failed state");
        }
        else if (currentState === Gvc.MixerControlState.READY) {
            console.debug("=========Connected! Moving on.=====");
            this._isReady = true;
        }
        else if (currentState === Gvc.MixerControlState.CLOSED) {
            this._isReady = false;
            this._reopen();
        }
    }

    /**
     *  if the connection is closed, it will be tried to reconnect
     */
    _reopen() {
        if (!this._isReady && this._mixerControl.get_state() === Gvc.MixerControlState.CLOSED) {
            this.destroySignals();
            this._addSignals();
            this._mixerControl.open();
            console.log(`Reopened Mixer..`);
        } else {
            console.warn(`Tried to reconnect but session is not closed!`);
        }
    }

    /**
     * syncs the headphone-toggle state to the default output device
     */
    _sync_default_output() {

        console.debug("connected; setting headphone on");
        // wait 500 miliseconds after start before changing device
        this._timeOutHandler.push(setTimeout(() => this._activateDevice(), 500));

        this._settingConnectHandler.push(
            this._settingProvider.onHeadphoneStatusChanged(() => {
                this._activateDevice()
            }));
    }


    //TODO this needs to be altered
    /**
     * activates speaker or headphone depending on headphonetogglebutton state
     */
    _activateDevice() {
        let isHeadphoneOn = this._settingProvider.getHeadPhoneOnStatus();
        console.log("Change detected!: key is now " + isHeadphoneOn);
        if (isHeadphoneOn) {
            // toggle to headphone
            // let is_remote_on = this._settingProvider.getFlagForUseRemoteHeadphone();
            // let is_remote_headphone_feature_on = this._settingProvider.getEnabledToggleRemoteHeadphone();
            let is_remote_on = this._settingProvider.getRemoteHeadphoneStatus();
            let headphone_id = (is_remote_on) ? this._settingProvider.getRemoteHeadphone()[0] : this._settingProvider.getHeadphone()[0];
            console.log("H Runtime id: " + headphone_id);
            if (this._isReady) {
                this._setDefaultAudioOutput(headphone_id);
            } else {
                console.debug(`Not ready yet`);
                this._commandQueueInstance.addToQueue("HEADPHONE_CHANGE", () => this._setDefaultAudioOutput(headphone_id));
            }
        } else {
            // toggle back to speaker
            let speaker_id = this._settingProvider.getSpeaker()[0];
            console.debug("S Runtime id: " + speaker_id);
            if (this._isReady) {
                this._setDefaultAudioOutput(speaker_id);
            } else {
                console.debug(`Not ready yet`);
                this._timeOutHandler.push(setTimeout(() => this._commandQueueInstance.addToQueue("SPEAKER_CHANGE", () => this._setDefaultAudioOutput(this._settingProvider.getSpeaker()[0])), 200));
            }
        }
    }

    _addSignals() {
        this._signalsHandler.push(this._mixerControl.connect("state-changed", () => this._on_state_change()));
        this._signalsHandler.push(this._mixerControl.connect("output-added", (mixerControl, id) => this._mixerDeviceAdded(id)));
        this._signalsHandler.push(this._mixerControl.connect("output-removed", (mixerControl, id) => this._mixerDeviceRemoved(id)));
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
            console.error(`${this._outputAudioDeviceMap.printSchema()} and id: ${runtime_id}`);
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

        let mixerUiDevice = this._mixerControl.lookup_output_id(id);
        this._outputAudioDeviceMap.add(id, mixerUiDevice);
    }

    /**
      * MixerControl signal handler for removing a device
      * 
      * @param id output runtime id 
    */
    _mixerDeviceRemoved(id) {
        console.debug(`Device added with id ${id}`);
        this._outputAudioDeviceMap.delete(id);
    }

    /**
     * print infos of this Facade
     */
    printInfos(log_function = console.log) {
        log_function(`
                Debugging-Log:
                    Instance ${this._sessionName}
                        Sessionname: ${this._sessionName}
                        Mixer-Signals: ${this._signalsHandler.join(";")}
                        Timeout-Handler: ${this._timeOutHandler.join(";")}
                        Setting-ConnectHandler: ${this._settingConnectHandler.join(";")}
                        Mixerinstance: ${this._mixerControl}
                        Map: ${this._outputAudioDeviceMap.printData()}
                        Default-Audio-Output: ${this._getDefaultAudioOutput().join(" / ")}
                        Default-Audio-Input: ${this._getDefaultAudioInput().join(" / ")}
                        ConsumeQueue: ${this._commandQueueInstance.printQueue()}
                        Gnome-Settings:
                            headphone: ${this._settingProvider.getHeadphone().join(" / ")}
                            speaker: ${this._settingProvider.getSpeaker().join(" / ")}
                            remote-headphone: ${this._settingProvider.getRemoteHeadphone().join(" / ")}
                            output-schema-list: ${this._outputAudioDeviceMap.printSchema()}
            `);
    }

    destroyMixerSignals() {
        this._signalsHandler.forEach((signal) => this._mixerControl.disconnect(signal));
        this._signalsHandler = null;
    }

    destroySignals() {
        this.destroyMixerSignals();
        this._settingConnectHandler.forEach((signal) => this._settingProvider.settingInstance.disconnect(signal));
        this._settingConnectHandler = null;
    }

    

    destroy() {
        console.log(`Destroying Mixer Control Facade`);
        this.destroySignals();

        if (this._commandQueueInstance) {
            this._commandQueueInstance.destroy();
            this._commandQueueInstance = null;
        }

        this._timeOutHandler.forEach((timeout) => clearTimeout(timeout));
        this._timeOutHandler = null;

        this._outputAudioDeviceMap = null;
        this._mixerControl = null;


        this._settingConnectHandler = null;
        this._sessionName = null;
        this._settingsInstance = null;
    }


}