const 	MODULE_NAME = 'WEBSOCKET_INTERFACE';
const EventEmitter = require('events');
const WebSocket = require('ws');	

function noop() {}

function heartbeat() {
  this.isAlive = true;
}


exports.ws_interface = websocket_to_events;

// server -----------------------------------------

function websocket_to_events(port){
	if(!port)return;
    this.port = port;
	let self = this;
	
	let Emitter = new EventEmitter();
	this.Emitter = Emitter;
	this.on = function(){Emitter.on(...arguments);};
	this.once = function(){Emitter.once(...arguments);};
	this.off = function(){Emitter.off(...arguments);};	
	this._noclients = true;
	let wss = new WebSocket.Server({ port: port });
	this.wss = wss;
	wss.on('connection', WS_connection)

	function WS_connection(ws){
		console.log('user connected through WS (port : '+port+')');
		
		if(self._noclients){
			Emitter.emit("wss_has_clients");
			self._noclients = false;
		}
		
		ws.on('message', emit_ws_event);
		ws.on('close', check_if_room_empty);
		ws.on('error', ()=>{console.warn("mild issue with ws communication")});
        ws.isAlive = true;
        ws.on('pong', heartbeat);
	}
	
	function emit_ws_event(data){
			let msg = JSONParseOrReturnFalse(data);
		if(!msg || !msg.header){
			// maybe send back something to client to let him know his command won't do anything
			console.warn("invalid message from ws client",data);
			return;
		}
		try{
			if(msg.arg && msg.arg[Symbol.iterator]){
				Emitter.emit(msg.header,this,...msg.arg)
			}else{
				Emitter.emit(msg.header,this,msg.arg)
			}
		}
		catch(e){
			console.warn("invalid command from ws client",msg,e);
		}
	}	
	
	function check_if_room_empty(){
		if(!self.wss.clients.length){
			self._noclients = true;
			Emitter.emit("wss_empty");
		}
	}
	
    const interval = setInterval(function ping() {
        self.wss.clients.forEach(function each(ws) {
            if (ws.isAlive === false) return ws.terminate();
            ws.isAlive = false;
            ws.ping(noop);
        });
    }, 10000);
    
    this.on('check_alive',function(ws){
        ws.send(JSON.stringify({header : "server_alive"}))
    });
    
    self.wss.on('close', function close() {
      clearInterval(interval);
    });
    
}

websocket_to_events.prototype.broadcast = function(msg){
	try{
		let jmsg = JSON.stringify(msg)
		let clients = this.wss.clients;
		clients.forEach(function each(client) {
		   client.send(jmsg);
		});
	}
	catch(e){
		console.warn("something went wrong while sending msg to clients (broadcast)",msg,e)
	}
}


// HELPER FUNCTIONS
websocket_to_events.prototype.GNI_JSON_send = function(target,header,arg){
	if(!header){
		console.warn("GNI_JSON_send must have a header property");
		return
	}
	if(arg){
		target.send(JSON.stringify({header : header,arg : arg}) );
	}
	else{
		target.send(JSON.stringify({header : header}) );
	}
}

function JSONParseOrReturnFalse(str){
	try{
		str = JSON.parse(str);
	}
	catch(e){
		str = false;
	}
	return(str);
}


// client -----------------------------------------

websocket_to_events.prototype.ws_client = function(){
    return `
    function socket_handler(){
        let self = this;
        let socket = new WebSocket("ws://"+location.hostname+":"+${this.port}\);
        this.last_alive = new Date();
        this.alive_timeout = 5000; //ms
        
        socket.onmessage = (msg)=>{
            let pmsg = JSONParseOrReturnFalse(msg.data);
            if(!pmsg || !pmsg.header){
                console.log("headless msg received, discarding", msg)
                return;
            }
            this._Emit(pmsg.header,pmsg.arg)
        }	
        
        socket.onopen = ()=>{
            this._Emit('open');
        }
        this.send = function(){socket.send(parse_cmd(...arguments))}
        
        let EventListener = {};
        
        this.addEventListener = function(event_name,callback){
            if(typeof event_name !== "string" && typeof callback !== "function")
            {
                throw new Error("socket_handler.addEventListener requires a string (event name) and a callback function as parameters.")
            }
            
            if(EventListener[event_name]){
                EventListener[event_name].push(callback);
            }
            else{
                EventListener[event_name] = [callback];
            }
        }
        
        this.removeEventListener = function(event_name,fn){
            if(EventListener[event_name] && EventListener[event_name].includes(fn)){
                EventListener[event_name].splice(EventListener[event_name].indexOf(fn),1);
            }
        }
        
        this._Emit = function(event_name,args){
            if(EventListener[event_name]){
                let parameters = []
                if(args && args[Symbol.iterator] && typeof args !== "string"){
                    parameters = [...args];
                }
                else{
                    parameters = [args];
                }						
        
                for(let i in EventListener[event_name]){
                    EventListener[event_name][i](...parameters);
                }
            }
        }
        
        this.addEventListener("server_alive", ()=>{
            this.last_alive = new Date();
        });
        this.alive_interval = setInterval( check_alive, 2000 );
        function check_alive(){
            if(self.alive_timeout + self.last_alive.getTime()  <= new Date().getTime() ){
                self._Emit("connection_lost");
                console.log("connection_lost");
                clearInterval(self.alive_interval);
                return;
                
            }
            self.send("check_alive");
        }
                
    }

    function parse_cmd(){
        let a = [...arguments];
        return(JSON.stringify({
            header : a.shift(),
            arg : a
        }));
    }

    function JSONParseOrReturnFalse(str){
        try{
            str = JSON.parse(str);
        }
        catch(e){
            str = false;
        }
        return(str);
    }
    `
}