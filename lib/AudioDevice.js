export  class AudioDevice {

    _outputDeviceList = null;
    _getterCaller = null;
    _setterCaller = null;


    constructor(outputDeviceList, setterCaller, getterCaller) {
        this._outputDeviceList = outputDeviceList;
        console.debug("Setter:" + setterCaller);
        console.debug("Getter:" + getterCaller);
        this._getterCaller = getterCaller;
        this._setterCaller = setterCaller;
        this.listenToChanges();
    }

    listenToChanges() {
        this._outputDeviceList.subscribeOnChange(
            (element, indexOld, indexNew) => {
                // console.debug(`Listening for changes: Element ${element}, 
                //              index old: ${indexOld}, 
                //              index new: ${indexNew}`);
                let audioDataset = this._getterCaller();
                console.debug(`
                                caller:
                                    getter: ${this._getterCaller}
                                    setter: ${this._setterCaller}
                                element:
                                    index old: ${indexOld}, 
                                    index new: ${indexNew}
                                    element: ${element}
                                audioDataset: 
                                    ${audioDataset}
                                    name audioset: ${audioDataset[2]}
                                    name element: ${element[1]}
                `);
                if (indexNew == undefined) {
                    // DELETE
                    console.log(`Entering delete State of audio device`);
                    audioDataset[0] = -1;
                    this._setterCaller(audioDataset);
                } else if (element[1] === audioDataset[2]) {
                    audioDataset[0] = indexNew;
                    console.log(`Updating dataset for ${audioDataset[2]} : ${audioDataset[0]} -> ${indexNew}`);
                    this._setterCaller(audioDataset);
                }
            }
        );
    }
}

export class Speaker extends AudioDevice {
    constructor(outPutDeviceList, settingProvider) {
        super(outPutDeviceList, (s) => settingProvider.setSpeaker(s), () => settingProvider.getSpeaker())
    }
}
export class Headphone extends AudioDevice {
    constructor(outPutDeviceList, settingProvider) {
        super(outPutDeviceList, (s) => settingProvider.setHeadphone(s), () => settingProvider.getHeadphone())
    }
}
export class RemoteHeadphone extends AudioDevice {
    constructor(outPutDeviceList, settingProvider) {
        super(outPutDeviceList, (s) => settingProvider.setRemoteHeadphone(s), () => settingProvider.getRemoteHeadphone())
    }
}