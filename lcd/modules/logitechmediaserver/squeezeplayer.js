var util = require('util');
var EventEmitter = require('events').EventEmitter;

function startsWith(search, s) {
    return s.substr(0,search.length) == search;
}

function SqueezePlayer(telnet) {
	var self = this;
	this.telnet = telnet;
	this.volume = 0;

	this.status_items = [
		"current_title", 
		"title", 
		"remote", 
		"time", 
		"rate", 
		"playlist repeat", 
		"playlist shuffle", 
		"duration", 
		"remote_title", 
		"samplerate", 
		"bitrate", 
		"album", 
		"artist", 
	];

  setInterval(function() {
    self.runTelnetCmd("time ?");  
  }, 1 * 1000);
}
util.inherits(SqueezePlayer, EventEmitter);

SqueezePlayer.prototype.runTelnetCmd = function(cmdstring) {
    this.telnet.writeln(this.id + " " + cmdstring);
}

SqueezePlayer.prototype.handleServerData = function(strEvent, raw_buffer) {
    var self = this;
    if (startsWith("mixer volume", strEvent)) {
        var v = strEvent.match(/^mixer volume\s(.*?)$/)[1];
        // incremental change
        if (startsWith("+", v) || startsWith("-", v)) {
            self.volume += parseInt(v);
        }
        // explicit value
        else {
            self.volume = parseInt(v);
        }
		if(self.volume<0) self.volume = 0;
		if(self.volume>100) self.volume = 100;
        this.emit("volume",self.volume);
    } 
	
    if (startsWith("status ", strEvent)) {
		let data = raw_buffer.split(" "), filtered_data = [];
		for(d in data){
			data[d] = decodeURIComponent(data[d]).split(":");
			if(data[d][0] && this.status_items.includes(data[d][0])  ){ 
				this.setProperty(data[d][0],data[d][1],false);
				filtered_data.push(data[d][0]);
			};
		}
		if(filtered_data.length) this.emit("status_change", filtered_data);
    }
	else {
        this.emit("logitech_event", strEvent);
    }
}

SqueezePlayer.prototype.switchOff = function() {
    this.runTelnetCmd("power 0");
}

/*START EDIT Olivier*/
SqueezePlayer.prototype.getTime = function() {
    this.runTelnetCmd("time ?");
}

SqueezePlayer.prototype.statusSubscribe = function() {
    this.runTelnetCmd("status - 1 tags:adlNTxr subscribe:0");
}

SqueezePlayer.prototype.playlistSubscribe = function() {
    this.runTelnetCmd("subscribe playlist");
}

/*END EDIT Olivier*/
SqueezePlayer.prototype.switchOn = function() {
    this.runTelnetCmd("power 1");
}

SqueezePlayer.prototype.setProperty = function(property, state,noevent) {
    this[property] = state;
    if(!noevent) this.emit(property, state);
}

SqueezePlayer.prototype.getNoiseLevel = function() {
    var nl = this.volume;
    if (this.mode == "stop" || this.mode == "pause" || this.mode == "off" || this.power == 0) {
        nl = 0;
    }
    return nl;
}

SqueezePlayer.prototype.inspect = function() {
    // Convenience method for debugging/logging.
    // Return self but without certain lengthy sub-objects.
    var self = this;
    var x = {};
    Object.keys(self).forEach(function(k) {
        if (["telnet", "_events"].indexOf(k) == -1) {
            x[k] = self[k];
        }
    });
    x.noise_level = self.getNoiseLevel();
    return x;
}

module.exports = SqueezePlayer;

