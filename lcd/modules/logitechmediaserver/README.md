# Node LMS-single_device


This is a fork from [node-logitechmediaserver by Mozz100](https://github.com/mozz100/node-logitechmediaserver). Please credit him if this works and blame me if it doesn't. 

Minors modifications have been made to both the squeezeplayer.js (squeeze client communication) and index.js (LMS server communication) to help make this work under the assumption that **both LMS and Squeezelite are running in the same device**.  

The goal of this is repo is to provide handles for our nodejs scripts handling playback display on various OLED / LCD devices within advanced Raspberry Pi distributions (namely piCorePlayer, but this should work on other systems such as DietPi or Max2Play).

# Basic usage 
```
const LMS = require('logitechmediaserver'),
lms = new LMS('127.0.0.1',9090);

lms.on("registration_finished", ()=>{
	
	let players = Object.keys(lms.players),
	let mac = get_mac_squeeze(players),
	lms_player;
	
	if(!mac){
		console.log("Squeezelite not found on this LMS server... Nothing will happen");
	}
	else{ console.log("Squeezelite instance found running on "+mac) }
	lms_player = lms.players[mac];
	
	// then hook to the regular event framework 
	lms_player.on("time", (t)=> { 
		// Do something when seek changes
	});	
	
	lms_player.on("volume", (v)=> {
		// Do something when volume changes
	});	
	
	lms_player.on("mode", (m)=> {
		// Do something when status (play/pause/stop) changes
	});	
	
	lms_player.on("status_change", (changes)=> { 
		// Do something when playback status changes
		let data  = {}
		for(label of changes){ data[label] = lms_player[label];} // changes holds only the labels of what changed in the dataset, so this is used to get an object referencing changes & new status
	});	
	
});

lms.on("lms_not_found", ()=>{ 
	// By default the LMS class will try to reconnect every 5 seconds if telnet failed and this will be emitted.
	console.log("lms not found !");
});


// Helper function to make sure we are talking to the right LMS / Squeezelite if multiple instances are to be found on the network
function get_mac_squeeze(mac_range){
	let macs = os.networkInterfaces(),k = Object.keys(macs),  mac = null;
	try{
		for(a of k){
			if( mac_range.includes(macs[a][0]["mac"] ) ){
				mac = macs[a][0]["mac"];
				break;
			}
		}
	}
	catch(e){}
	return mac;
}


// Helper functions if you want to format the seek data into mm:ss format 

function pad_zero(n){
    if(!n) return("00");
    n = n.toString(); 
    (n.toString().length === 1) && (n = "0"+n);
    return n;
}

lms_seek_format = function (seek,duration){
    let s_string =  pad_zero(parseInt(seek/60)) + ":" + pad_zero(parseInt(seek%60)),
        d_string =  pad_zero(parseInt(duration/60)) + ":" + pad_zero(parseInt(duration%60)),
		seek_string = s_string + " / " + d_string,
	return (seek_string);
}

```


Licence
-------

<a rel="license" href="http://creativecommons.org/licenses/by-sa/2.0/uk/">
<img alt="Creative Commons License" style="border-width:0" src="http://i.creativecommons.org/l/by-sa/2.0/uk/88x31.png" />
</a><br />
Original code by <span xmlns:cc="http://creativecommons.org/ns#" property="cc:attributionName">Richard Morrison</span>
is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-sa/2.0/uk/">Creative Commons Attribution-ShareAlike 2.0 UK: England &amp; Wales License</a>.
<br />
Based on a work at <a xmlns:dct="http://purl.org/dc/terms/" href="https://github.com/mozz100/node-logitechmediaserver" rel="dct:source">github.com</a>.

Forked by Audiophonics

