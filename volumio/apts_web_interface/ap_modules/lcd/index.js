exports.module_head = `<div class="content_name"><h2>LCD</h2><p>Configuration for LCD display</p></div>`
const WEBSOCKET_INTERFACE = require("./websocket_interface.js").ws_interface;
const websocket_interface = new WEBSOCKET_INTERFACE(4152);
const cp = require("child_process");
const os = require("os")
const io = require('socket.io-client');
var socket = io.connect('http://localhost:3000');
const fs = require("fs");
var api_state_waiting = false; 
var alsa_state_waiting = false; 
var filter_type = "?";

/*
	Get and broadcast data to the page used for the lcd display.
	Basically if you want to send additionnal data to the display, just 
	use in server (this file)
		  websocket_interface.broadcast({header:"mydata",arg : data});
	and in client (template.html)
		COM.addEventListener("mydata", (data)=>{console.log(data)});	  
 */
socket.on("pushState", function (data) {
    api_state_waiting = false;
    websocket_interface.broadcast({header:"pushState",arg : data});
});

// api call
setInterval(()=>{
    if(api_state_waiting) return;
    api_state_waiting = true;
    socket.emit("getState");
},1000);

// read active audio digital input
setInterval(()=>{
    if(alsa_state_waiting) return;
    alsa_state_waiting = true;
	cp.exec(`/bin/apessq2m get_input`,handle);
	function handle(rerr,data){
		alsa_state_waiting = false; 
		if(rerr){ 
			console.warn("ERROR reading alsa state:", path,"\n\t", rerr);
			return;
		}
		websocket_interface.broadcast({header:"input",arg : data});
	}
	
},1000);

// read local ip
setInterval(()=>{
    let ips = os.networkInterfaces(), ip = "";
    for(a in ips){
        if( ips[a][0]["address"] !== "127.0.0.1" ){
            ip = ips[a][0]["address"];
            break;
        }
    }
    websocket_interface.broadcast({header:"ip",arg : ip});
},2000);

// read dac current filter
function get_filter(){
    cp.exec(`/bin/apessq2m get_filter`,handle);
    function handle(rerr,data){
        if(rerr){ 
            console.warn("ERROR reading dac filter state:", path,"\n\t", rerr);
            return;
        }
        filter_type = data.replace("\n","");
        websocket_interface.broadcast({header:"filter_type",arg : filter_type});
    }
}
get_filter();

// tell the server we want to display something specific on this url
exports.url_catcher = ["ap-display"]
exports.catch_url = function(url,req,res){
	console.log(url)
	if(url[0] === "ap-display"){
		
		if(url.length <= 1){
			let path = __dirname+"/template/template.html"
			fs.access(path, fs.F_OK, function(err){
				if (err){
					res.writeHead(404, {"Content-Type": "text/html"});
					res.end(`file does not exist.`)
				}
				else{
					let fileStream = fs.createReadStream(path);
					res.writeHead(200, {"Content-Type": "text/html"});
					res.write(`<script type="application/javascript">${websocket_interface.ws_client()}</script>`);
					res.write(`<script type="application/javascript">var filter_type="${filter_type}"</script>`);
					fileStream.pipe(res);
				}
			});
		}
		else{
			if(url[1] === "switch_view"){
				console.log("view")
				websocket_interface.broadcast({header:"switch_view",arg : null});
				res.end(`OK`)
			}
			if(url[1] === "filter_change"){
                filter_type =  (url[2])?url[2].replace(/_/g," "):"?";
                websocket_interface.broadcast({header:"filter_type",arg : filter_type});
				res.end(`OK`)
			}
		}
	}
}


// part to display in homepage of 4150
exports.make_html = function(){
    return(`
    <form id ="lcd" action="/" method="post"> 
        <button type="submit">Auto-configure</button><br>
        <input type = "hidden" name="target_module" value="${module.exports.title}" >
        <input type = "hidden" name="target_command" value="auto_reconfigure" >
    </form>
    <form id ="lcd" action="/" method="post"> 
        <button type="submit">Reinstall LCD driver</button><br>
        <input type = "hidden" name="target_module" value="${module.exports.title}" >
        <input type = "hidden" name="target_command" value="reinstall_driver" >
    </form>
	`)
}





// methods for responding to user actions in index of volumio:4150 ------

// reconfigure kiosk so it will display our custom page instead of volumio homepage (mainly used to fix things if user reinstalled touchdisplay plugin)
exports.auto_reconfigure = function (params,callback){
	const path = "/data/configuration/plugins.json";
	fs.readFile(path,handle);

	function handle(rerr,data){
		if(rerr){ 
			console.warn("ERROR OPENING PLUGINS FILE :", path,"\n\t", rerr);
			callback ( "ERROR OPENING PLUGINS FILE : " +  path +" \n\t " + rerr);
			return
		}
		let touch_installed_ok = false;
		try{
			let pdata = JSON.parse(data);
			if( pdata["miscellanea"]["touch_display"] ){
				cp.exec(`sudo /bin/sh ${__dirname}/kiosk_autoconfig.sh`,handle);
				
				function handle(e,stdout,stderr){
					if(e){callback(false,e);return}
					 callback ( "LCD plugin has been configured" );
				}
			}
			else{
				 callback ( "You need to install Volumio Touch Display Plugin before you can configure LCD display. \n Install it from /plugin-manager in your regular Volumio web-interface." );
			}
		}
		catch(e){
			console.warn("ERROR READING PLUGINS FILE :", path,"\n\t", e);
			callback ( "ERROR READING PLUGINS FILE : " +  path +" \n\t " + e);
		}
	}
}

// Reinstall lcd driver. Only works if lcd driver has already been installed once.
exports.reinstall_driver = function (params,callback){
	cp.exec(`sudo aplcdi`,handle);
	function handle(e,stdout,stderr){
		if(e){callback(false,e);return}
		console.log(stdout,stderr)
		callback ( "LCD driver has been reinstalled." );
	}
}

