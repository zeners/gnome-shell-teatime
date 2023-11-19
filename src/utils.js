/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: t -*- */
/* Olaf Leidinger <oleid@mescharet.de>
   Thomas Liebetraut <thomas@tommie-lie.de>
*/

import Gst from 'gi://Gst';
import Gio from 'gi://Gio';

const ENABLE_LOGGING = false;

export function debug(text) {
	if (ENABLE_LOGGING)
		console.debug("**TeaTime >: " + text);
}

export function GetConfigKeys() {
	return {
		steep_times: 'steep-times',
		graphical_countdown: 'graphical-countdown',
		use_alarm_sound: 'use-alarm-sound',
		alarm_sound: 'alarm-sound-file',
		running_timer: 'running-timer',
		remember_running_timer: 'remember-running-timer'
	};
}

export function formatTime(sec_num) {
	/* toLocaleFormat would be nicer, however it doesn't work with
	   Debian Wheezy and some later gnome versions */

	// based on code from
	//  http://stackoverflow.com/questions/6312993/javascript-seconds-to-time-with-format-hhmmss

	let hours = Math.floor(sec_num / 3600);
	let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
	let seconds = Math.round(sec_num - (hours * 3600) - (minutes * 60));

	if (hours < 10) {
		hours = "0" + hours;
	}
	if (minutes < 10) {
		minutes = "0" + minutes;
	}
	if (seconds < 10) {
		seconds = "0" + seconds;
	}

	return ((hours == "00") ? "" : hours + ':') + minutes + ':' + seconds;
}

export function playSound(uri, _) {

	debug("Playing " + uri);
	let player = global.display.get_sound_player();
	let file = Gio.File.new_for_uri(uri);
	player.play_from_file(file, _("Your tea is ready!"), null);

}

export function setCairoColorFromClutter(cr, c) {
	let s = 1.0 / 255;
	cr.setSourceRGBA(s * c.red, s * c.green, s * c.blue, s * c.alpha);
}

export function isType(value, typename) {
	return typeof value == typename;
}
