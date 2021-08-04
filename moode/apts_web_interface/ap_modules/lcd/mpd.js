/*
Module mpd 
By Olivier SCHWACH
version 1

** USAGE

const MPD = require("./mpd.js").mpd;
const mpd = new MPD(6600);

mpd.on("mpd_data", function(data){
   console.log(data);
})
 
mpd.write("command_list_begin\n")
mpd.write("status\n")
mpd.write("currentsong\n")
mpd.write("command_list_end\n")


** Parameters for MPD constructor 
    @ port (int) : mpd server port

*/



const net = require("net");
const EventEmitter = require('events').EventEmitter
const inherits = require('util').inherits
inherits(mpd, EventEmitter);

exports.mpd = mpd;


function mpd(socket_addr){
    this.socket_addr = socket_addr;
    this.socket_connect();
    this.listen();
}

mpd.prototype.socket_connect = function(){
	let self = this;
	if(this.socket_addr){
        console.log("connecting to mpd on port "+this.socket_addr)
		this.client = net.createConnection(this.socket_addr);
		this.client.once('exit',function(){
			console.log('lost communication with socket.')
		});
		this.client.on("error", function(e) {
			console.warn('something went wrong in client socket communication :',e);
		});
		this.client.once("connect", function(){console.log("connected")}); 
	}
	else{
		console.warn('trying to connect to mpd without a socket path : stopping');
	}
}

mpd.prototype.listen = function(client){
	let self = this;
	if(this.client){
		this.client.on("data",(data)=>{self.handle_data(data)});
	}
	else{
		console.warn("trying to listen to socket but no socket is available.")
	}
}

mpd.prototype.handle_data = function(data){
    try{
        data = data.toString().split("\n");
        data.pop();
        if(data[data.length-1] !== "OK"){
            console.warn("mpd error", data);
            return;
        }
        let parser = {};
        data.forEach(function(a){
            a = a.split(": ");
            if(a.length > 1){
                let c = a[0];
                a.shift();
                parser[c] = a.join(": ");
            }
        })
        this.emit("mpd_data",parser);
    }
    catch(e){console.warn(e)}
    
}

// method for safe writing 
mpd.prototype.write = function(buf){
    this.stack = this.stack || [], 
    filter = false, 
    self = this;
    
    if( buf.length >= this.client.writableHighWaterMark){ // can (and should) do way better than this 
        filter = true;
    }
    
    if(!filter){
        this.stack.push(buf);
    }
    else{
        console.warn('Cannot send message (too big) :\n',buf);
    }
    
    if(!this.writing){
        let cb = function(){
            if(self.stack.length){
                self.write_bufs(cb); //if there is still job to do
            }
            else{
                self.writing = false;
            }
        }
        this.write_bufs(cb);
    }
}


mpd.prototype.write_bufs = function(callback) {
    this.writing = true;
    let self = this;
    write();
    function write(){
        let ok = true;
        while (self.stack.length && ok)
        {
            if (self.stack.length === 1) {
                self.client.write(self.stack.shift(), null, callback);
            } 
            else {
                ok = self.client.write(self.stack.shift(), null);
            }
        }
        if(self.stack.length) {
            self.client.once('drain', write);
        }
    }
}


