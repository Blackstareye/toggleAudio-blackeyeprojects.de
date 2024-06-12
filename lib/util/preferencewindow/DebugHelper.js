import Adw from 'gi://Adw';

export default class DebugHelper {


    static createDebugBanner(parent, label=``) {
        let model = new Adw.Banner({
            title: `tmp`,
            button_label: label,
            revealed: true,
        });
        parent.add(model);
        return model;
    }

    
}