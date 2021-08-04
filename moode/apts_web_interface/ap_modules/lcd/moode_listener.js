/*
Module Moode listener 
By Olivier SCHWACH
version 1

** USAGE

const moode_listener = require("./moode_listener.js").moode_listener;
var moode = new moode_listener(host,refreshrate);
moode.on("moode_data", function(data){ console.log(data) });


** Defaults parameters if not specified : 
    @ host (string) : "127.0.0.1"
    @ refreshrate_ms (int) : 1000
*/



const http = require('http');
const EventEmitter = require('events').EventEmitter;
const inherits = require('util').inherits;
const cp = require('child_process');

function moode_listener(host,refreshrate_ms){
    this.cookie = "";
    this.host = host || '127.0.0.1';
    this.refreshrate_ms = refreshrate_ms || 1000;
    this.auth(true);
    this.ready = false;
    this.waiting = false;
}

inherits(moode_listener, EventEmitter);
exports.moode_listener = moode_listener;

moode_listener.prototype.send_req = function(path,callback){
    let self = this;
    let options = {
      host: this.host,
      path: '/'+path,
      headers : {
          "Connection": "keep-alive",
          "Pragma": "no-cache",
          "Cache-Control": "no-cache",
          "DNT": "1",
      }
    }
    if(this.cookie){
        options["headers"]["Cookie"] = this.cookie;
    }
    handle_response = function(response) {
      let str = ''
      response.on('data', function (chunk) {
        str += chunk;
      });
      response.on('end', function () {
        if(!self.cookie){
        try{
            self.cookie = response.headers['set-cookie'][0].replace(/;.*/,"");
            } catch(e){console.warn("Something went wrong with auth", e)}
        }
        if(typeof callback==="function"){
            callback(str);
        }
      });
    }
    let req = http.request(options, handle_response).end();
}

moode_listener.prototype.auth = function(start_lcd){
    this.send_req("/", ()=>{
        if(this.cookie){
            this.emit("ready");
            this.ready = true
            this.listen();
        }
    });
}


moode_listener.prototype.get_data = function(path,callback){
    let self = this;
    this.send_req(path, handle_response );
    function handle_response(data){
        try{
            data = JSON.parse(data);
            callback(data);
        }catch(e){console.warn("fatal error, cannot read data from moode", e)}
    }
}


moode_listener.prototype.listen = function(){
    setInterval(()=>{
        if(this.waiting) return;
        this.waiting = true;
        this.get_data("engine-mpd.php", (data)=>{
            this.waiting = false;
            this.emit("moode_data",data)
        });

    },1000);
}


