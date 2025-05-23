/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: t -*- */
/* Olaf Leidinger <oleid@mescharet.de>
   Thomas Liebetraut <thomas@tommie-lie.de>
*/

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';

import {
	ExtensionPreferences,
	gettext as _
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import * as Utils from './utils.js';
import Adw from 'gi://Adw';

/*
    GTK documentation: https://docs.gtk.org/
    GJS documentation: https://gjs-docs.gnome.org/
*/

const Columns = {
	TEA_NAME: 0,
	STEEP_TIME: 1,
	ADJUSTMENT: 2,
	ROW: 3
}

var TeaTimePrefsGroup = GObject.registerClass(
	class TeaTimePrefsGroup extends Adw.PreferencesGroup {
		_init(settings, parentWindow) {
			super._init({
				title: _('Appearance Options')
			});

			this.config_keys = Utils.GetConfigKeys();
			this.parentWindow = parentWindow;

			this._settings = settings;
			this._settings.connect("changed", this._refresh.bind(this));
			this._initWindow();
			this._inhibitUpdate = false;
			this._refresh();
		}

		_initWindow() {

			this.graphicalCountdownSwitch = new Gtk.Switch({
				valign: Gtk.Align.CENTER
			});
			this.graphicalCountdownSwitch.connect("notify::active", this._saveGraphicalCountdown.bind(this));
			const graphicalCountdownRow = new Adw.ActionRow({
				title: _("Graphical Countdown"),
				activatable_widget: this.graphicalCountdownSwitch,
				focusable: false
			});
			graphicalCountdownRow.add_suffix(this.graphicalCountdownSwitch)

			// alarm sound file chooser
			this.alarmSoundSwitch = new Gtk.Switch({
				valign: Gtk.Align.CENTER
			});
			this.alarmSoundSwitch.connect("notify::active", this._saveUseAlarm.bind(this));

			this.alarmSoundFileFilter = new Gtk.FileFilter();
			this.alarmSoundFileFilter.add_mime_type("audio/*");

			this.alarmSoundFileButton = new Gtk.Button({
				label: _("Select alarm sound file")
			});
			const alarmSoundRow = new Adw.ActionRow({
				title: _("Alarm sound"),
				activatable_widget: this.alarmSoundSwitch,
				focusable: false
			});
			alarmSoundRow.add_suffix(this.alarmSoundFileButton);
			alarmSoundRow.add_suffix(this.alarmSoundSwitch);

			this.alarmSoundFileButton.connect("clicked", this._selectAlarmSoundFile.bind(this));

			this.rememberRunningCounterSwitch = new Gtk.Switch({
				valign: Gtk.Align.CENTER
			});
			this.rememberRunningCounterSwitch.connect("notify::active", this._saveRememberRunningCounter.bind(this));
			const rememberRunningCounterRow = new Adw.ActionRow({
				title: _("Remember running Timer"),
				activatable_widget: this.rememberRunningCounterSwitch,
				focusable: false
			});
			rememberRunningCounterRow.add_suffix(this.rememberRunningCounterSwitch);

            this.alarmSoundError = new Gtk.Label({
                                   				label: '',
                                   				hexpand: true
                                   				});


			this.add(graphicalCountdownRow);
			this.add(alarmSoundRow);
			this.add(rememberRunningCounterRow);

			this.add(this.alarmSoundError);
		}

		_selectAlarmSoundFile() {
		    // https://gjs-docs.gnome.org/gtk40~4.0/gtk.filedialog
			// FileDialog should be changed from Gtk.FileChooserNative (deprecated) to Gtk.FileDialog
			try {
                this.alarmSoundError.label = '';
                let filters = new Gio.ListStore(GObject.type_from_name('GtkFileFilter'));
                filters.append(this.alarmSoundFileFilter);
                let file = Gio.File.new_for_uri(this.alarmSoundFileFile);
                this.alarmSoundFile = new Gtk.FileDialog({
                        title: _("Select alarm sound file"),
                        filters: filters,
                        'default-filter': null,
                        'initial-file': file,
                        'initial-name': file.get_basename(), // don't work :(
                        modal: true
                });
                this.alarmSoundFile.open(this.parentWindow, null, this._saveSoundFile.bind(this));
                this.alarmSoundError.label = 'Dialog open with ' + this.alarmSoundFileFile;
            } catch (e) {
                this.alarmSoundError.label = e.message
            }
		}

		_refresh() {
			// don't update the model if someone else is messing with the backend
			if (this._inhibitUpdate)
				return;

			this.graphicalCountdownSwitch.active = this._settings.get_boolean(this.config_keys.graphical_countdown)
			this.alarmSoundSwitch.active = this._settings.get_boolean(this.config_keys.use_alarm_sound)
			this.alarmSoundFileFile = this._settings.get_string(this.config_keys.alarm_sound);
			this.alarmSoundFileButton.label = Gio.File.new_for_uri(this.alarmSoundFileFile).get_basename();
			this.rememberRunningCounterSwitch.active = this._settings.get_boolean(this.config_keys.remember_running_timer);

		}

		_saveGraphicalCountdown(sw, data) {
			// don't update the backend if someone else is messing with the model
			if (this._inhibitUpdate)
				return;
			this._inhibitUpdate = true;
			this._settings.set_boolean(this.config_keys.graphical_countdown,
				sw.active);
			this._inhibitUpdate = false;
		}

		_saveUseAlarm(sw, data) {
			// don't update the backend if someone else is messing with the model
			if (this._inhibitUpdate)
				return;
			this._inhibitUpdate = true;
			this._settings.set_boolean(this.config_keys.use_alarm_sound,
				sw.active);
			this._inhibitUpdate = false;
		}

		_saveRememberRunningCounter(sw, data) {
			// don't update the backend if someone else is messing with the model
			if (this._inhibitUpdate)
				return;
			this._inhibitUpdate = true;
			this._settings.set_boolean(this.config_keys.remember_running_timer,
				sw.active);
			this._inhibitUpdate = false;
		}

		_saveSoundFile(src, response_id, data) {
		    this.alarmSoundError.label = '';
		    let file = null
            try {
                file = this.alarmSoundFile.open_finish(response_id);
            } catch (e) {
			    this.alarmSoundError.label = e.message;
			    return;
            }

			// don't update the backend if someone else is messing with the model or not accept new file
			if (this._inhibitUpdate || file == null) {
				return;
			}
			let alarm_sound = file.get_uri();
			Utils.debug(this._settings.get_string(this.config_keys.alarm_sound) + "-->" + alarm_sound);

			let have_value = Utils.isType(alarm_sound, "string");
			let setting_is_different =
				this._settings.get_string(this.config_keys.alarm_sound) != alarm_sound;
			if (have_value && setting_is_different) {
				this._inhibitUpdate = true;

				Utils.playSound(alarm_sound, _, null);
				this._settings.set_string(this.config_keys.alarm_sound, alarm_sound);
				this._inhibitUpdate = false;
				this.alarmSoundFileFile = alarm_sound;
				this.alarmSoundFileButton.label = Gio.File.new_for_uri(this.alarmSoundFileFile).get_basename();
			}
		}
	});

var TeaTimeTimersGroup = GObject.registerClass(
	class TeaTimeTimersGroup extends Adw.PreferencesGroup {
		_init(settings, window) {
			super._init({
				title: _("Timers")
			});

			this.config_keys = Utils.GetConfigKeys();
			this._parentWindow = window;

			this._tealist = new Gtk.ListStore();
			this._tealist.set_column_types([
				GObject.TYPE_STRING,
				GObject.TYPE_INT,
				Gtk.Adjustment,
				Adw.ActionRow
			]);

			this._settings = settings;
			this._inhibitUpdate = true;
			this._settings.connect("changed", this._refresh.bind(this));

			this._initWindow();
			this._inhibitUpdate = false;
			this._refresh();
			this._tealist.connect("row-changed", this._save.bind(this));
			this._tealist.connect("row-deleted", this._save.bind(this));
		}

		_initWindow() {
			const addButton = Gtk.Button.new_from_icon_name("list-add-symbolic");
			addButton.connect("clicked", this._addTea.bind(this));
			// this.header_suffix = this.addButton;

			this.addButtonRow = new Adw.ActionRow({
				focusable: false
			});
			this.addButtonRow.add_prefix(addButton);


			this.teeColumnNamesRow = new Adw.ActionRow({
				subtitle: _("Tea"),
				focusable: false
			});

			this.teeColumnNamesRow.add_suffix(new Gtk.Label({
				label: _("Steep time in seconds"),
				cssClasses: ["subtitle"]
			}));

			this.teeColumnNamesRow.add_suffix(new Gtk.Label({
				label: "   " + _("remove"),
				cssClasses: ["subtitle"]
			}));

			this.add(this.teeColumnNamesRow);

		}

		_addTeaEntry(store, path, iter) {
			let lastInput = ""; // remember last input value to restore from reset on output
			const teeItemActionRow = store.get_value(iter, Columns.ROW);
			const nameEntry = new Gtk.Entry({
				valign: Gtk.Align.CENTER,
				hexpand: true,
				halign: Gtk.Align.FILL,
				text: store.get_value(iter, Columns.TEA_NAME),
				placeholder_text: _("Tea")
			});

			nameEntry.connect('changed', () => {
				store.set_value(iter, Columns.TEA_NAME, nameEntry.text);
			});
			teeItemActionRow.add_prefix(nameEntry);

			const spinButton = new Gtk.SpinButton({
				orientation: Gtk.Orientation.HORIZONTAL,
				adjustment: store.get_value(iter, Columns.ADJUSTMENT),
				digits: 0,
				valign: Gtk.Align.CENTER,
				xalign: 1,
				width_request: 140
			});
			spinButton.value = store.get_value(iter, Columns.STEEP_TIME);

			spinButton.connect('input', newValue => {
				let oldValue = spinButton.adjustment.value
				let src = spinButton.text;
				let newVal = Utils.parseTime(spinButton.text, false);
				store.set_value(iter, Columns.STEEP_TIME, newVal)
				newValue = newVal * 1.0;
				let newTime = Utils.formatTime(newVal);
				spinButton.text = newTime;
				lastInput = newTime;
				return true;
			});

			spinButton.connect('output', () => {
				let old = spinButton.text;
				let src = spinButton.adjustment.value;
				// lost focus and mouse-up on Spin reset value to 1 -> ignore this update!
				if (lastInput == old && src == 1) {
					src = Utils.parseTime(lastInput);
					spinButton.adjustment.value = src;
				}
				let result = Utils.formatTime(src);
				spinButton.text = result;
				store.set_value(iter, Columns.STEEP_TIME, src)
				lastInput = "";
				return true;
			});

			this.removeButton = Gtk.Button.new_from_icon_name("user-trash-symbolic");
			this.removeButton.valign = Gtk.Align.CENTER;
			this.removeButton.halign = Gtk.Align.CENTER;
			this.removeButton.connect("clicked", () => this._removeSelectedTea(store, path, iter));

			teeItemActionRow.add_suffix(spinButton);
			teeItemActionRow.add_suffix(this.removeButton);

			this.add(teeItemActionRow);
			// move addBottonRow to the bottom
			this.remove(this.addButtonRow);
			this.add(this.addButtonRow);

			if (!this._inhibitUpdate) {
				nameEntry.grab_focus();
				this._save(store, path, iter);
			}

		}

		_refresh() {
			// don't update the model if someone else is messing with the backend
			if (this._inhibitUpdate)
				return;

			let list = this._settings.get_value(this.config_keys.steep_times).unpack();

			// stop everyone from reacting to the changes we are about to produce
			// in the model
			this._inhibitUpdate = true;

			this.add(this.teeColumnNamesRow);
			this.add(this.addButtonRow);

			this._tealist.clear();
			for (let teaname in list) {
				let time = list[teaname].get_uint32();

				let adj = new Gtk.Adjustment({
					lower: 1,
					step_increment: 1,
					upper: 65535,
					value: time
				});
				let item = this._tealist.append();
				this._tealist.set(item, [Columns.TEA_NAME, Columns.STEEP_TIME, Columns.ADJUSTMENT, Columns.ROW], [_(teaname), time, adj, new Adw.ActionRow({
					focusable: false
				})]);
				this._addTeaEntry(this._tealist, "", item);
			}

			this._inhibitUpdate = false;
		}

		_addTea() {
			let adj = new Gtk.Adjustment({
				lower: 1,
				step_increment: 1,
				upper: 65535,
				value: 60
			});
			const iter = this._tealist.append();
			this._tealist.set(iter, [Columns.TEA_NAME, Columns.STEEP_TIME, Columns.ADJUSTMENT, Columns.ROW], ["", 300, adj, new Adw.ActionRow({
				focusable: false
			})]);
			this._addTeaEntry(this._tealist, "", iter);
		}

		_removeSelectedTea(store, path, iter) {
			this.remove(store.get_value(iter, Columns.ROW));
			store.remove(iter);
		}

		_save(store, path_, iter_) {
			// don't update the backend if someone else is messing with the model
			if (this._inhibitUpdate)
				return;

			let values = [];
			this._tealist.foreach(function (store, path, iter) {
				values.push(GLib.Variant.new_dict_entry(
					GLib.Variant.new_string(store.get_value(iter, Columns.TEA_NAME)),
					GLib.Variant.new_uint32(store.get_value(iter, Columns.STEEP_TIME))))
			});
			let settingsValue = GLib.Variant.new_array(GLib.VariantType.new("{su}"), values);

			// all changes have happened through the UI, we can safely
			// disable updating it here to avoid an infinite loop
			this._inhibitUpdate = true;

			this._settings.set_value(this.config_keys.steep_times, settingsValue);

			this._inhibitUpdate = false;
		}
	});

export default class TeaTimePreferences extends ExtensionPreferences {
	fillPreferencesWindow(window) {
		const settings = this.getSettings();
		window._settings = settings;

		const page = new Adw.PreferencesPage();

		const appearanceGroup = new TeaTimePrefsGroup(settings, window);
		const timersGroup = new TeaTimeTimersGroup(settings, window);

		page.add(appearanceGroup);
		page.add(timersGroup);

		window.add(page);
		page.scroll_to_focus = true;
	}
}
