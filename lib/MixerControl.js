import Gvc from 'gi://Gvc';
export default class MixerControlFacade {
    //TODO better name than this
    _inputOutputMixerMap = new Map();
    _mixerControl = null;
    _signalsHandler = [];
    _sessionName = null;


    // TODO Disable and cleanup?
    constructor (sessionName) {
        this._sessionName = sessionName;
        // The signal "output-added" is called after connect for each available output device 
        // before signal "active-output-update" - Used to initialize the popup menu
        this._mixerControl = Gvc.MixerControl.new(this._sessionName);
        this._mixerControl.open();
        // for the start only output
        
        // TODO detect changes in stream
        //gObject._signals.push(this._mixerControl.connect("active-" + direction + "put-update", (mixerControl, id) => this._activeStreamChanged(id)))
    }

    _addSignals() {
        this._signalsHandler.push(this._mixerControl.connect("output-added", (mixerControl, id) => this._mixerDeviceAdded(id)))
        this._signalsHandler.push(this._mixerControl.connect("output-removed", (mixerControl, id) => this._mixerDeviceRemoved(id)))
    }

    printInfos() {
        console.log(`
            Debugging-Log:
                Instance ${this._sessionName}
                    Sessionname: ${this._sessionName}
                    Signals: ${this._signalsHandler.join(";")}
                    Mixerinstance: ${this._mixerControl}
                    Map: ${this._printBeautyMap()}

        `);
    }

    _printBeautyMap() {
        let beautyPrint="";
        
        for (const [key, value] of this._inputOutputMixerMap) {
            beautyPrint +=`Device ${key} - ${value}` + "\n";
        }
        return beautyPrint;
    }




    /**
      * MixerControl signal handler
    */
    _mixerDeviceAdded(id) {
        console.log(`Device added with id ${id}`);
        let mixerUiDevice = this._lookupMixerUiDevice(id);

        if (mixerUiDevice.get_origin()) {
            this._inputOutputMixerMap.set(id, mixerUiDevice.get_description() + " - " + mixerUiDevice.get_origin());
        } else {
            this._inputOutputMixerMap.set(id, mixerUiDevice.get_description());
        }

        // if (this._isInitialized) {
        //     this._updateMenu();
        // }
    }

    /**
     * MixerControl signal handler
     */
    _mixerDeviceRemoved(id) {
        this._inputOutputMixerMap.delete(id);
        console.log(`id deleted ${id}`);
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
}