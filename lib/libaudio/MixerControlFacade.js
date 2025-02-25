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
import SettingProvider from '../SettingProvider.js';

export default class MixerControlFacade {
    _mixerControl = null;
    _signalsHandler = null;
    _sessionName = null;
    _isReady = false;


    constructor(sessionName, settingsInstance) {

        console.log(`Initializing MixerControlFacade`);
        this._sessionName = sessionName;
        this._signalsHandler = [];
        this._settingProvider = new SettingProvider(settingsInstance);


        // define mixercontrol, add signals and open
        this._mixerControl = Gvc.MixerControl.new(this._sessionName);
        this._addSignals();
        this._mixerControl.open();

        this._outputModule = new OutputModule(this._settingProvider);
        this._outputModule._sync_default_output();
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

   
    _addSignals() {
        this._signalsHandler.push(this._mixerControl.connect("state-changed", () => this._on_state_change()));
        this._outputModule.addSignals(this._signalsHandler, this._mixerControl);
        // Inputmodule
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
                        Timeout-Handler: ${this._outputModule._timeOutHandler.join(";")}
                        Setting-ConnectHandler: ${this._outputModule._settingConnectHandler.join(";")}
                        Mixerinstance: ${this._mixerControl}
                        Map: ${this._outputModule._outputAudioDeviceMap.printData()}
                        Default-Audio-Output: ${this._outputModule._getDefaultAudioOutput().join(" / ")}
                        Default-Audio-Input: ${this._getDefaultAudioInput().join(" / ")}
                        ConsumeQueue: ${this._outputModule._commandQueueInstance.printQueue()}
                        Gnome-Settings:
                            headphone: ${this._settingProvider.getHeadphone().join(" / ")}
                            speaker: ${this._settingProvider.getSpeaker().join(" / ")}
                            output-schema-list: ${this._outputModule._outputAudioDeviceMap.printSchema()}
            `);
    }

    destroyMixerSignals() {
        this._signalsHandler.forEach((signal) => this._mixerControl.disconnect(signal));
        this._signalsHandler = null;
    }

    destroySignals() {
        this.destroyMixerSignals();
    }

    
    //  if output = true destroy output etc..
    destroy() {
        console.log(`Destroying Mixer Control Facade`);
        this.destroySignals();

        if(this._outputModule) {
            this._outputModule.destroy();
            this._outputModule = null;
        }

        this._mixerControl = null;

        this._sessionName = null;
        this._settingsInstance = null;
    }


}