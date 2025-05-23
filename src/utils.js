/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: t -*- */
/* Olaf Leidinger <oleid@mescharet.de>
   Thomas Liebetraut <thomas@tommie-lie.de>
*/

import Gst from 'gi://Gst';

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
	let seconds = Math.floor(sec_num - (hours * 3600) - (minutes * 60));

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

let _player = null;
let _playBus = null;

export function playSound(uri) {

	debug("Playing " + uri);

	if (_player == null) {
		Gst.init(null);
		_player = Gst.ElementFactory.make("playbin", "player");
		_playBus = _player.get_bus();
		_playBus.add_signal_watch();
		_playBus.connect("message",
			function (playBus, message) {
				if (message != null) {
					// IMPORTANT: to reuse the player, set state to READY
					let t = message.type;
					if (t == Gst.MessageType.EOS || t == Gst.MessageType.ERROR) {
						_player.set_state(Gst.State.READY);
					}
				} // message handler
			}.bind(this));
	} // if undefined
	_player.set_property('uri', uri);
	_player.set_state(Gst.State.PLAYING);
}

export function setCairoColorFromClutter(cr, c) {
	let s = 1.0 / 255;
	cr.setSourceRGBA(s * c.red, s * c.green, s * c.blue, s * c.alpha);
}

export function isType(value, typename) {
	return typeof value == typename;
}

export function parseTime(customTime, allowAbsolute = true) {
	let seconds = 0;
	let match = customTime.match(/^[@Tt]?(?:(\d+):(?=\d*:\d*))?(\d*)(?::(\d{0,2}))?$/) // [h:]m[:s]
	let addMissingSeconds = 1; // absolute means h or h:m rather than relative m:s or s
	if (!match) {
		match = customTime.match(/^:(\d+)$/) // only seconds
	}
	if (!match) { // 1h1m1s format
		match = customTime.match(/^[@Tt]?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
	}
	if (match) {
		let factor = 1;
		for (var i = match.length - 1; i > 0; i--) {
			let isMissing = match[i] === undefined
			let s = isMissing ? "" : match[i].replace(/^0+/, ''); // fix for elder GNOME <= 3.10 which don't like leading zeros
			if (s.match(/^\d+$/)) { // only if something left
				seconds += factor * parseInt(s);
			} else if (isMissing && factor > 1) {
				addMissingSeconds *= 60;
			}
			factor *= 60;
		}
		if (customTime.match(/^[@Tt].*/) && allowAbsolute) {
			// absolute time
			seconds *= addMissingSeconds;
			let now = new Date()
			let current = ((now.getHours() * 60) + now.getMinutes()) * 60 + now.getSeconds();
			if (current >= seconds) {
				seconds = seconds - current + 60 * 60 * 24
			} else {
				seconds = seconds - current
			}
		}
	}
	return seconds;
}
