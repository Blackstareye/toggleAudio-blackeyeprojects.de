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


/**
gnome-extensions create --interactive
cd ~/.local/share/gnome-shell/extensions
ls

go to `extensions` software to enable your extension

alt+f2 + r to reload if no syntax error
sudo journalctl /usr/bin/gnome-shell | grep 'screendarker'
logout to reload if has syntax error

doc: https://gjs-docs.gnome.org/appindicator301~0.1_api/appindicator3.indicator
gnome built-in icons: https://archlinux.org/packages/extra/any/gnome-icon-theme-symbolic/files/


https://github.com/yingshaoxo/gnome-shell-screen-darker
https://github.com/GNOME/gjs
https://gjs-docs.gnome.org/glib20~2.66.1/
https://gjs-docs.gnome.org/glib20~2.66.1/glib.spawn_command_line_sync
https://gjs.guide/guides/gtk/3/15-saving-data.html#converting-data
https://extensions.gnome.org/extension/1276/night-light-slider/
https://codeberg.org/kiyui/gnome-shell-night-light-slider-extension/src/branch/main/src/extension.js
 
https://gjs.guide/extensions/development/creating.html
https://gitlab.gnome.org/GNOME/gnome-shell/blob/main/js/ui/status/nightLight.js


Reference: https://gjs-docs.gnome.org/
Video: https://www.youtube.com/watch?v=Y6zpDF_Ug50

https://github.com/maoschanz/gnome-extension-development-utility

https://github.com/hs65/Gnome-Shell-Extension-Audio-Selector

https://gjs-docs.gnome.org/gvc10~1.0/gvc.mixercontrol
*/
import GObject from 'gi://GObject';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import {QuickToggle, SystemIndicator} from 'resource:///org/gnome/shell/ui/quickSettings.js';

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

const ExampleIndicator = GObject.registerClass(
class ExampleIndicator extends SystemIndicator {
    constructor() {
        super();

        this._indicator = this._addIndicator();
        this._indicator.iconName = 'audio-headphones';

        const toggle = new ExampleToggle();
        toggle.bind_property('checked',
            this._indicator, 'visible',
            GObject.BindingFlags.SYNC_CREATE);
        this.quickSettingsItems.push(toggle);
    }
});

export default class QuickSettingsExampleExtension extends Extension {
    enable() {
        this._indicator = new ExampleIndicator();
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
    }

    disable() {
        this._indicator.quickSettingsItems.forEach(item => item.destroy());
        this._indicator.destroy();
    }
}
