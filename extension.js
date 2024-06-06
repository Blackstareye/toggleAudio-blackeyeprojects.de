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
import Gvc from 'gi://Gvc';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import {QuickSettingsItem, QuickToggle, SystemIndicator} from 'resource:///org/gnome/shell/ui/quickSettings.js';
import MixerControlFacade from './lib/MixerControl.js';




const ExampleToggle = GObject.registerClass(
class ExampleToggle extends QuickToggle {
    constructor() {
        super({
            title: _('Switch Headphone'),
            iconName: 'audio-headphones',
            toggleMode: true,
        });
    }
});

const ExampleButton = GObject.registerClass(
    class ExampleButton extends QuickSettingsItem {
        _init(extensionMetadata) {
            super._init({
                style_class: 'icon-button',
                can_focus: true,
                icon_name: 'dialog-information',
                accessible_name: _('Example Action'),
            });
            
            console.log(extensionMetadata);
            //init MixerController
            const mixerControl = new MixerControlFacade(extensionMetadata.name);

            // connect to debug button
            this.connect('clicked', () => mixerControl.printInfos());
        }
    });

const ExampleIndicator = GObject.registerClass(
class ExampleIndicator extends SystemIndicator {
    constructor(extensionMetadata) {
        super();

        this._indicator = this._addIndicator();
        this._indicator.iconName = 'audio-headphones';

        const toggle = new ExampleToggle();
        toggle.bind_property('checked',
            this._indicator, 'visible',
            GObject.BindingFlags.SYNC_CREATE);
        this.quickSettingsItems.push(toggle);


        this.quickSettingsItems.push(new ExampleButton(extensionMetadata));
    }
});

export default class QuickSettingsExampleExtension extends Extension {
    enable() {
        this._indicator = new ExampleIndicator(this.metadata);
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
    }

    disable() {
        this._indicator.quickSettingsItems.forEach(item => item.destroy());
        this._indicator.destroy();
    }
}
