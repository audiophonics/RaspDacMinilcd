// Restart Wizard
const fs = require('fs');
const path = "/data/configuration/system_controller/system/config.json";


fs.readFile(path,handle);

function handle(rerr,data){
	if(rerr){
		console.log("ERROR READING CONFIG FILE :", path,"\n\t", rerr);
		return
	}
	try{
		let pdata = JSON.parse(data);
		pdata.show_wizard = {
			"type": "boolean",
			"value": true
		  }

		fs.writeFile(path, JSON.stringify(pdata), (werr) => {
		  if (werr) throw err;
		  console.log('SUCCESS : wizard enabled');
		});
	}
	catch(e){
		console.log("ERROR WRITING INTO CONFIG FILE :", path,"\n\t", e);

	}
}