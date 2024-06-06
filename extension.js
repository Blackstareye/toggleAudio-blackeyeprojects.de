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


// TODO Audio devices get added again, after disabling and enabling

/**
 * Audiodevices in Preferences are only visible if 
 */

// imports
import GObject from 'gi://GObject';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import {QuickSettingsItem, QuickToggle, SystemIndicator} from 'resource:///org/gnome/shell/ui/quickSettings.js';
import MixerControlFacade from './lib/MixerControl.js';


const DEBUG=true
const CLEAR_SCHEMA_ON_START= false;

/**
 * GObject Class for audio switch via toggle
 */
const AudioOutputToggle = GObject.registerClass(
class AudioOutputToggle extends QuickToggle {
    constructor() {
        super({
            title: _('Switch Headphone'),
            iconName: 'audio-headphones',
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
    constructor(mixerControlFacade) {
        super();

        this._indicator = this._addIndicator();
        this._indicator.iconName = 'audio-headphones';

        const toggle = new AudioOutputToggle();
        toggle.bind_property('checked',
            this._indicator, 'visible',
            GObject.BindingFlags.SYNC_CREATE);
        this.quickSettingsItems.push(toggle);

        // for debug purpose, there is an print output button 
        if (DEBUG) {
            this.quickSettingsItems.push(new DebugButton(mixerControlFacade));
        }
    }

});

export default class QuickSettingsExampleExtension extends Extension {

    _mixerControlFacade = null;
    _settingsInstance = null;
    enable() {
        this._settingsInstance = this.getSettings();
        if (CLEAR_SCHEMA_ON_START) {
            this._settingsInstance.reset("output-devices-available");
        }
        this._mixerControlFacade = new MixerControlFacade(this.metadata.name, this._settingsInstance);
        this._indicator = new AudioOutputToggleIndicator(this._mixerControlFacade);
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
    }

    disable() {
        if (DEBUG) {
            console.log(`Disabling Extension`);
        }
        this._mixerControlFacade.destroy();
        this._settingsInstance.reset("output-devices-available");
        this._settingsInstance = null;

        this._indicator.quickSettingsItems.forEach(item => item.destroy());
        this._indicator.quickSettingsItems = null;
        this._indicator.destroy();
        this._indicator = null;
    }
}
