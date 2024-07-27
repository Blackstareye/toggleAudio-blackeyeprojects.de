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


// imports
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {DEBUG} from './lib/util/Constants.js';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import {QuickSettingsItem, QuickToggle, SystemIndicator} from 'resource:///org/gnome/shell/ui/quickSettings.js';
import MixerControlFacade from './lib/MixerControlFacade.js';
import Keybinder from './lib/util/Keybinder.js';
import SettingProvider from './lib/SettingProvider.js';



/**
 * GObject Class for audio switch via toggle
 */
const AudioOutputToggle = GObject.registerClass(
class AudioOutputToggle extends QuickToggle {
    constructor(icon) {
        super({
            title: _('Switch Headphone'),
            iconName: icon,
            toggleMode: true,
        });
    }
});

/**
 * GObject Class for Debug Infos via Button Press
 */
const DebugButton = GObject.registerClass(
    class DebugButton extends QuickSettingsItem {

        _init(mixerControl) {
            super._init({
                style_class: 'icon-button',
                can_focus: true,
                icon_name: 'dialog-information',
                accessible_name: _('show debug infos'),
            });
            // connect to debug button
            this.connect('clicked', () => mixerControl.printInfos());
        }
    });
        


/**
 * GObject Class for Indicator
 * 
 * this is the place where the ui widgets will be added
 */
const AudioOutputToggleIndicator = GObject.registerClass(
class AudioOutputToggleIndicator extends SystemIndicator {
    _keybinder = null;
    _toggle = null;

    constructor(mixerControlFacade, settings) {
        super();

        let provider = new SettingProvider(settings);
        let icon = provider.getSystemTrayIcon();
        this._indicator = this._addIndicator();
        this._indicator.iconName = icon;
        this._indicator.visible = settings.get_boolean("show-indicator");
        
        
        this._toggle = new AudioOutputToggle(provider.getQuickSettingIcon());
        provider.onSettingIconChanged( () => {
            let provider = new SettingProvider(settings);
            this._toggle.iconName = provider.getQuickSettingIcon();
        }
        );

        this._keybinder = new Keybinder(settings);
        
        this.initKeybindingStateCheck(settings, this._toggle, this._keybinder);
        this.addKeybindingOnChangeEvents(settings,this._toggle, this._keybinder);
        
        //TODO either use provider or direct contacts - right now it's a mix in this file
        settings.bind('headphone-on', this._toggle, 'checked', Gio.SettingsBindFlags.DEFAULT);
        
        provider.onSystemTrayIconChanged( (_,k) => {
            let provider = new SettingProvider(settings);
            this._indicator.iconName = provider.getSystemTrayIcon();
        });
        
        // todo in future: can be refactored after testing
        settings.connect("changed::headphone-on", (_,k) => {
            let provider = new SettingProvider(settings);
            let v = settings.get_boolean(k);
            let use_monochrome = provider.getUseMonochromeIconOnSystemtray();
            if(v) {
                // toggle to headphone
                this._indicator.iconName = provider.getHeadphoneIcon(use_monochrome);
            } else {
                this._indicator.iconName = provider.getSpeakerIcon(use_monochrome);
            }
        });

        // connect system-tray to toggle change


        //show icon if toggle in pref is true
        settings.connect("changed::show-indicator", (_,k) => {
            let v = settings.get_boolean(k);
            this._indicator.visible = v;
        });
        
        this.quickSettingsItems.push(this._toggle);
        // for debug purpose, there is an print output button 
        if (DEBUG) {
            this.quickSettingsItems.push(new DebugButton(mixerControlFacade));
        }

        provider = null;
    }

    addKeybindingOnChangeEvents(settings, toggle, keybinder) {
       
        settings.connect("changed::enable-toggle-headphone-key", (_,k) => {
            let v = settings.get_boolean(k);
            if(v) {
                keybinder.bindToggleKey(() => this._toggleState(toggle,null));
            } else {
                keybinder.unbindToggleKey();
            }
        });
        settings.connect("changed::enable-select-speaker-key", (_,k) => {
            let v = settings.get_boolean(k);
            if(v) {
                keybinder.bindSpeakerKey(() => this._toggleState(toggle,false));
            } else {
                keybinder.unbindSpeakerKey();
            }
        });
        settings.connect("changed::enable-select-headphone-key", (_,k) => {
            let v = settings.get_boolean(k);
            if(v) {
                keybinder.bindHeadphoneKey(() => this._toggleState(toggle,true));
            } else {
                keybinder.unbindHeadphoneKey();
            }
        });
    }
    initKeybindingStateCheck(settings, toggle, keybinder) {
        let enabled_t = settings.get_boolean("enable-toggle-headphone-key");
        let enabled_s = settings.get_boolean("enable-select-speaker-key");
        let enabled_h =settings.get_boolean("enable-select-headphone-key");
        if (enabled_t) {
            keybinder.bindToggleKey(
                () => {
                    toggle.checked = !toggle.checked;
                }
            )
        }
        if (enabled_s) {
        keybinder.bindSpeakerKey(
            () => {
                toggle.checked = false;
            }
        )
        }
        if (enabled_h) {
            keybinder.bindHeadphoneKey(
                () => {
                    toggle.checked = true;
                }
            );
        }
    }

    _toggleState(toggle,state=null) {
        console.debug(`KEYBINDER ACTIVATED - ${state}`)
        toggle.checked = state === null ? !toggle.checked : state ;
    }

    
    destroy() {
        this._keybinder.destroy();
        this._keybinder = null;
        super.destroy();
    }

});

/**
 * This extension toggles between 2 pre-defined output audio sources
 */
export default class ToggleAudioExtension extends Extension {

    _mixerControlFacade = null;
    _settingsInstance = null;
    
    enable() {
        this._settingsInstance = this.getSettings();
        this._mixerControlFacade = new MixerControlFacade(this.metadata.name, this._settingsInstance);
        this._indicator = new AudioOutputToggleIndicator(this._mixerControlFacade, this._settingsInstance);
        
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
    }

    disable() {
        if (DEBUG) {
            console.debug(`Disabling Extension`);
        }
        // destroy MixerFacade
        this._mixerControlFacade.destroy();
        this._mixerControlFacade = null;

        this._settingsInstance = null;
        this._indicator.quickSettingsItems.forEach(item => item.destroy());
        this._indicator.quickSettingsItems = null;

        this._indicator.destroy();
        this._indicator = null;
    }
}
