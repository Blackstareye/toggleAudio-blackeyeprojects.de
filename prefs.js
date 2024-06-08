import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';


import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';


export default class ExamplePreferences extends ExtensionPreferences {

    _settingsInstance = null;
    _outputDeviceMap = null;
    _reverseLookUpDeviceMap = new Map();

    unpackSettings() {
        this._settingsInstance = this.getSettings();
        // FIXME parse wirft error
        this._outputDeviceMap = this._settingsInstance.get_value("output-devices-available").recursiveUnpack();
        console.log(this._outputDeviceMap);
        console.log(typeof(this._outputDeviceMap));
    }

    create_ui(window) {
        this.unpackSettings();
        

        
        //TODO sync with gsetting instead append 
        
        console.log(`I AM HERE`);
        console.log(`${this._outputDeviceMap}`);
        for (let key in this._outputDeviceMap) {
            // // es-lint no-prototype-builtins fix
            if (Object.prototype.hasOwnProperty.call(this._outputDeviceMap, key)) {
                console.log("KEY:VALUE:");
                console.log(key, this._outputDeviceMap[key]);
                this._reverseLookUpDeviceMap.set(this._outputDeviceMap[key][0], key);
            }
        }

        // TODO maybe check one value
        // let beautyPrint="";
        // for (const [key, value] of this._reverseLookUpDeviceMap) {
        //     beautyPrint +=`Device ${key} - ${value}` + "\n";
        // }
        // interesting, the device list works 
        // console.log(`Look up String Link:\n` + beautyPrint);
        
        const deviceList = new Gtk.StringList();
        // we need a array and need to put all in the device list
        [ ...this._reverseLookUpDeviceMap.keys()].map(e => {
                deviceList.append(e);
            }
        );
        // Create a preferences page, with a single group
        const page = new Adw.PreferencesPage({
            title: _('Preferences'),
            icon_name: 'dialog-information-symbolic',
            description: 'This will be refreshed'
        });
        window.add(page);

        const group = new Adw.PreferencesGroup({
            title: _('Devices'),
            description: _('Select your Speaker and Headphone Device'),
        });
        page.add(group);

        // Create a new preferences speaker

        const speaker = new Adw.ComboRow({
            title: _('Speaker'),
            subtitle: _('Whether to show the panel indicator'),
            model: deviceList,
            selected: 0,
        });


        const headphone = new Adw.ComboRow({
            title: _('Headphone'),
            subtitle: _('Whether to show the panel indicator'),
            model: deviceList,
            selected: 0,
        });


        const debugWindow = new Adw.Banner({
            title: _('Debug-Window'),
            revealed: true,
        });

        group.add(speaker);
        group.add(headphone);
        group.add(debugWindow);

        // bind the settings
        
        let storeSelectedDevice = function (key, origin, this_ref) {
            let item = Object.assign(origin.selected_item, Gtk.StringObject);
            let text = item.get_string();
            console.log(`selected: ${text}`);
            console.log(this_ref._reverseLookUpDeviceMap.has(text));
            // lookup reverse
            // TODO meta_data necessary ?
            let id = this_ref._reverseLookUpDeviceMap.get(text);
            let meta_data = this_ref._outputDeviceMap[id][1];
            this_ref._settingsInstance.set_value(key, new GLib.Variant("(iss)", [id,text, meta_data]));
        };

        // TODO disabling/disconnecting necessary 
        headphone.connect(`notify::selected-item`, () => {
            storeSelectedDevice('headphone', headphone, this);
        });
        speaker.connect(`notify::selected-item`, () => {
            storeSelectedDevice('speaker', speaker, this);
        });
    }

    fillPreferencesWindow(window) {
        this.create_ui(window)
    }
}


// handleComboBoxChange(row) {
//     row.connect("notify::selected", () => {
//         const rowIndex = row.get_index();
//         const labelListKeys = Object.keys(LabelTypes);
//         const labelKey = labelListKeys[row.selected];
//         this.labels.splice(rowIndex, 1, labelKey);
//         this.notify("labels");
//         this.addElements();
//     });
// }