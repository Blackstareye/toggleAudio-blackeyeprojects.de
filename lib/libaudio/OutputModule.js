import DeviceList from './DeviceList.js';
import { Headphone, Speaker } from './AudioDevice.js';
import CommandQueue from '../CommandQueue.js';


export default class OutputModule {
    _timeOutHandler = null;
    _settingConnectHandler = null;
    _settingProvider  = null;
    _commandQueueInstance = null;
    _outputAudioDeviceMap = null;

    _audioDeviceSpeaker = null;
    _audioDeviceHeadphone = null;

    constructor(settingProvider) {
        this._settingProvider = settingProvider;
        
        this._timeOutHandler = [];
        this._settingConnectHandler = [];

        // used for commands that can be executed, because MixerControl is not up yet
        this._commandQueueInstance = CommandQueue.create();
        console.debug(this._commandQueueInstance.printQueue());

        // Devicelist , Headphone Device and SpeakerDevice
        // Speaker and Header run time id will be updated if device list changes
        this._outputAudioDeviceMap = new DeviceList(this._settingProvider);
        this._audioDeviceHeadphone = new Headphone(this._outputAudioDeviceMap, this._settingProvider);
        this._audioDeviceSpeaker = new Speaker(this._outputAudioDeviceMap, this._settingProvider);
    }

    addSignals(signalHandler, aMixerControl) {
        signalHandler.push(aMixerControl.connect("output-added", (mixerControl, id) => this._mixerDeviceAdded(id)));
        signalHandler.push(aMixerControl.connect("output-removed", (mixerControl, id) => this._mixerDeviceRemoved(id)));
    }

 // MARK 1
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

    // MARK 2
    /**
     * activates speaker or headphone depending on headphonetogglebutton state
     */
    _activateDevice() {
        let isHeadphoneOn = this._settingProvider.getHeadPhoneOnStatus();
        console.debug("Change detected!: key is now " + isHeadphoneOn);
        if (isHeadphoneOn) {
            // toggle to headphone
            let headphone_id = this._settingProvider.getHeadphone()[0];
            console.debug("H Runtime id: " + headphone_id);
            if (this._isReady) {
                this._setDefaultAudioOutput(headphone_id);
            } else {
                console.debug(`Not ready yet`);
                this._commandQueueInstance.addToQueue("HEADPHONE_CHANGE", () => this._setDefaultAudioOutput(this._settingProvider.getHeadphone()[0]));
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

     // MARK 3
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

    // MARK 4
    _getDefaultAudioOutput() {
        let mixerStream = this._mixerControl.get_default_sink();
        return [mixerStream.get_description(), mixerStream.get_name()];
    }

        // MARK 6
    /**
      * MixerControl signal handler for adding a device
    */
    _mixerDeviceAdded(id) {
        console.debug(`Device added with id ${id}`);

        let mixerUiDevice = this._mixerControl.lookup_output_id(id);
        this._outputAudioDeviceMap.add(id, mixerUiDevice);
    }


    //MARK 7
    /**
      * MixerControl signal handler for removing a device
      * 
      * @param id output runtime id 
    */
    _mixerDeviceRemoved(id) {
        console.debug(`Device added with id ${id}`);
        this._outputAudioDeviceMap.delete(id);
    }

    // MARK 5
    _getDefaultAudioInput() {
        let mixerStream = this._mixerControl.get_default_source();
        return [mixerStream.get_description(), mixerStream.get_name()];
    }

    destroy() {
        this._timeOutHandler.forEach((timeout) => clearTimeout(timeout));
        this._timeOutHandler = null;

        this._settingConnectHandler.forEach((signal) => this._settingProvider.settingInstance.disconnect(signal));
        this._settingConnectHandler = null;

        this._settingConnectHandler = null;
        this._settingProvider  = null;

        if (this._commandQueueInstance) {
            this._commandQueueInstance.destroy();
            this._commandQueueInstance = null;
        }

        this._outputAudioDeviceMap = null;
    }
}
