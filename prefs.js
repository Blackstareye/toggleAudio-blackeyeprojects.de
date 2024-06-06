import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';


import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';


export default class ExamplePreferences extends ExtensionPreferences {

    _settingsInstance = null;
    _outputDeviceMap = null;

    unpackSettings() {
        this._settingsInstance = this.getSettings();
        // FIXME parse wirft error
        this._outputDeviceMap = JSON.parse(this._settingsInstance.get_value("output-devices-available").recursiveUnpack());
        
        console.log(this._outputDeviceMap);
    }

    create_ui(window) {
        this.unpackSettings();
        

        const deviceList = new Gtk.StringList();

        //TODO sync with gsetting instead append 

        //  for (const k of this._outputDeviceMap) {
        //     deviceList.append(this._outputDeviceMap[k]);
        //  }
        // speakerList.append('Automatic');
        // speakerList.append('A');
        // speakerList.append('B');
        // headphoneList.append('Automatic');
        // headphoneList.append('C');
        // headphoneList.append('D');
        // for (let i = 1; i < Constants.Markets.length; i++) {
        //     const regionName = regionNameInLocale.of(Constants.Markets[i].split('-')[1]);
        //     const regionLanguage = languageInLocale.of(Constants.Markets[i].split('-')[0]);
        //     speakerList.append(`${regionName}: ${regionLanguage}`);
        // }

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

        // Create a settings object and bind the speaker to the `show-indicator` key
        window._settings = this.getSettings();
        window._settings.bind('speaker', speaker, 'active',
            Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('headphone', headphone, 'active',
            Gio.SettingsBindFlags.DEFAULT);
    }

    fillPreferencesWindow(window) {
        this.create_ui(window)
    }
}