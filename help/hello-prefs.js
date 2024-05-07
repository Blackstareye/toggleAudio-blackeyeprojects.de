
// export default class ExamplePreferences extends ExtensionPreferences {
//     fillPreferencesWindow(window) {
//         // Create a preferences page, with a single group
//         const page = new Adw.PreferencesPage({
//             title: _('General'),
//             icon_name: 'dialog-information-symbolic',
//         });
//         const page2 = new Adw.PreferencesPage({
//             title: _('General2'),
//             icon_name: 'dialog-information-symbolic',
//         });
//         window.add(page);
//         window.add(page2);

//         const group = new Adw.PreferencesGroup({
//             title: _('Speaker'),
//             description: _('Select your Speaker Device'),
//         });
//         const group2 = new Adw.PreferencesGroup({
//             title: _('Headphone'),
//             description: _('Select your Headphone Device'),
//         });
//         page.add(group);
//         page2.add(group2);

//         // Create a new preferences row
//         const row = new Adw.SwitchRow({
//             title: _('Speaker'),
//             subtitle: _('Whether to show the panel indicator'),
//         });
//         const row2 = new Adw.SwitchRow({
//             title: _('Headphone'),
//             subtitle: _('Whether to show the panel indicator'),
//         });
//         group.add(row);
//         group2.add(row2);

//         // Create a settings object and bind the row to the `show-indicator` key
//         window._settings = this.getSettings();
//         window._settings.bind('speaker', row, 'active',
//             Gio.SettingsBindFlags.DEFAULT);
//         window._settings.bind('headphone', row2, 'active',
//             Gio.SettingsBindFlags.DEFAULT);
//     }
// }