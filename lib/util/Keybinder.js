import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import {wm} from 'resource:///org/gnome/shell/ui/main.js';

/**
 *  
 */


const SETTING_KEY_TOGGLE_OUTPUTDEVICE = 'toggle-headphone-key';
const SETTING_KEY_SELECT_HEADPHONE = 'select-headphone-key';
const SETTING_KEY_SELECT_SPEAKER = 'select-speaker-key';

export default class Keybinder {

    _settingsInstance = null;
    _handlers = null;

    /**
     * settingInstance : actual Settinginstance not a setting provider
     */
    constructor(settingInstance) {
        this._settingsInstance = settingInstance;
        this._handlers = [];
    }

    _bind(key,fn) {
        wm.addKeybinding(
            key,
            this._settingsInstance,
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.ALL,
            fn
        );
        this._handlers.push(key);
        return this;
    }

    bindToggleKey(fn) {
        return this._bind(SETTING_KEY_TOGGLE_OUTPUTDEVICE, fn);
    }
    bindSpeakerKey(fn) {
        return this._bind(SETTING_KEY_SELECT_SPEAKER, fn);
    }
    bindHeadphoneKey(fn) {
        return this._bind(SETTING_KEY_SELECT_HEADPHONE, fn);
    }

    destroy() {
        this._settingsInstance = null;
        this._handlers.forEach(key => {
            wm.removeKeybinding(key);
        });
        this._handlers = null;
    }

   
}