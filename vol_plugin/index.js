'use strict';

const 	libQ 		= require('kew'),
		{ exec, spawn } 	= require('child_process'),
		http 		= require('http');
		
	
		
module.exports = audiophonicsRDMLCD;

function audiophonicsRDMLCD(context) {
	this.context 		= context;
	this.commandRouter 	= this.context.coreCommand;
	this.logger 		= this.context.logger;
	this.configManager	= this.context.configManager;
	this.translate 		= this.commandRouter.getI18nString; // Short alias for lisibility 
}

audiophonicsRDMLCD.prototype.onVolumioStart = function(){
	const configFile = this.commandRouter.pluginManager.getConfigurationFile( this.context, 'config.json' );
    this.config	= new (require('v-conf'))();
    this.config.loadFile(configFile);
    return libQ.resolve();
}

audiophonicsRDMLCD.prototype.onStart = function(){
	const 	defer = libQ.defer(),
			self = this;
	
	this.logger.info( "RDMLCD : Starting Plugin" );	
	this.configSoftLinks([`${__dirname}/apps/rdmlcd`])
		.then( x=> 	this.systemctl('daemon-reload')  )
		.then( x=> 	this.startServiceIfActive("lcd_active","rdmlcd")  )
		.then( x=>  this.systemctl('restart rdmlcdfb.service')  )
		.then( x=> 	this.setRemoteActive( this.config.get("remote_active") )  )
		.then( x=>	defer.resolve() )
		.then( x=>	console.log("RDMLCD STARTED") )
		.fail( x=>	console.log("RDMLCD ERROR " + x) )
	return defer.promise;
};

audiophonicsRDMLCD.prototype.onStop = function (){
	const 	defer = libQ.defer();
	this.systemctl('stop rdmlcd.service')
	.then( x=> this.systemctl('stop rdmlcdfb.service') )
	.then( x=> this.systemctl('stop rdm_remote.service') )
	.then( x=> this.systemctl('stop rdm_irexec.service') )
	.then( x=> defer.resolve() )
	.fail( x=> defer.reject() );
	return defer.promise;
};

audiophonicsRDMLCD.prototype.onRestart = function(){
	this.logger.info( "RDMLCD : REStarting Plugin" );	
	const 	defer = libQ.defer();
	this.systemctl('restart rdmlcd.service')
	.then( x=> this.systemctl('restart rdmlcdfb.service') )
	.then( x=> this.systemctl('restart rdm_remote.service') )
	.then( x=> this.systemctl('restart rdm_irexec.service') )
	.then( x=> defer.resolve() )
	.fail( x=> defer.reject() );
	return defer.promise;
};

audiophonicsRDMLCD.prototype.restartLCD = function(){
	const 	defer = libQ.defer();
	this.systemctl('restart rdmlcd.service')
	.then( x=> defer.resolve() )
	.fail( x=> defer.reject() );
	return defer.promise;
};

// Configuration Methods -----------------------------------------------------------------------------

audiophonicsRDMLCD.prototype.startServiceIfActive = function(config,service){
	const 	defer = libQ.defer();
	if( this.config.get(config) ) this.systemctl(`restart ${service}.service`).then( ()=>{ defer.resolve() }).fail(  x=> defer.reject() );
	else{ return libQ.resolve(); }
	return defer.promise;
};


audiophonicsRDMLCD.prototype.getUIConfig = function(){
    const 	defer 					= libQ.defer(), 
			lang_code 				= this.commandRouter.sharedVars.get('language_code'),
			target_lang_path 		= `${__dirname}/i18n/strings_${lang_code}.json`, 
			fallback_lang_path		= `${__dirname}/i18n/strings_en.json`, 
			config_template_path 	= `${__dirname}/UIConfig.json`;
			
    this.commandRouter.i18nJson( target_lang_path, fallback_lang_path, config_template_path )
		.then( (uiconf )=>{
			uiconf.sections[0].content[0].value = this.config.get('lcd_active');		
			
			uiconf.sections[0].content[1].value = parseInt(this.config.get('sleep_after'));
			uiconf.sections[0].content[1].attributes  = [{min:1}]; 
			
			uiconf.sections[1].content[0].value = this.config.get('remote_active');
			defer.resolve(uiconf);
		})
        .fail( x=> defer.reject() );
    return defer.promise;
};

audiophonicsRDMLCD.prototype.getUIConfigOnPlugin = audiophonicsRDMLCD.prototype.getUIConfig; // not sure which one is used, seen both in doc so I guess this'll have to do for now

audiophonicsRDMLCD.prototype.getConfigurationFiles = function(){ return ['config.json'] }

audiophonicsRDMLCD.prototype.updateLCDConfig = function(data){
	const defer = libQ.defer();
	this.config_changes = {};
	this.config_errors = [];
	
	this.validateAndUpdateConfigItem( data, "lcd_active" );
	this.validateAndUpdateConfigItem( data,	"sleep_after",	x=>x>=0 );
	
	if(!Object.keys(this.config_changes).length) this.commandRouter.pushToastMessage('info', "RDMLCD : ", "Nothing changed in new LCD configuration.");
	else this.commandRouter.pushToastMessage('success', "RDMLCD : ", "Configuration updated.");
	
	
	let returnValue = null;
	// async tasks needed ? 
	if( "lcd_active" in this.config_changes ){
		returnValue = defer;
		if(this.config.get("lcd_active") ){
			this.systemctl("restart rdmlcd.service")
			.then( x=> defer.resolve() )
			.fail( x=> defer.reject() );
		}
		else{
			this.systemctl("stop rdmlcd.service")
			.then( x=> defer.resolve() )
			.fail( x=> defer.reject() );
		}
		delete this.config_changes["lcd_active"];
	}
	else returnValue = defer.resolve();
	
	for( let err of this.config_errors  ) this.commandRouter.pushToastMessage('error', "RDMLCD : ", err);
	for( let key in this.config_changes ){  // some configs options can be updated in real time without restarting display script with a basic http call.
		if (key in ["sleep_after" ]){ 
			try{http.get(`http://127.0.0.1:4153/${key}=${this.config_changes[key]}`)}
			catch(e){}
		}
	} 
	
	this.logger.info('RDMLCD configuration updated from UI.');
	
	return returnValue;
}

audiophonicsRDMLCD.prototype.updateRemoteConfig = function(data){
	const 	defer 	= libQ.defer();
	
	this.config_changes = {};
	this.config_errors = [];
	this.validateAndUpdateConfigItem( data, "remote_active" );
	
	for( let err of this.config_errors  ) this.commandRouter.pushToastMessage('error', "RDMLCD : ", err);
	
	if(!Object.keys(this.config_changes).length){
		this.commandRouter.pushToastMessage('info', "RDMLCD : ", "Nothing changed in new remote configuration.");
		return defer.resolve();
	}
	else{
		// sync tasks
		if( "remote_active" in this.config_changes ){
			this.setRemoteActive( this.config.get("remote_active")) ;
		}
		this.logger.info('RDMLCD : Remote configuration updated from UI.');
		this.commandRouter.pushToastMessage('success', "RDMLCD : ", "Configuration updated.");
		return defer.resolve();
	}
	return defer.promise;
}

audiophonicsRDMLCD.prototype.validateAndUpdateConfigItem = function(obj, key, validation_rule){
	// check dataset, key, value exists and that it is different from current value.
	if ( obj && key && obj[key] !== undefined && obj[key] != this.config.get(key) ) {
		// also make sure new value is valid according to the provided validation method (if any)
		if ( !validation_rule || validation_rule( obj[key] ) ){
			this.config.set(key, obj[key]);
			this.config_changes[key] = obj[key];
		}
		else{
			this.config_errors.push(`RDMLCD : invalid config value ${key} ${obj[key]}. `)
		}
	};
}

audiophonicsRDMLCD.prototype.configSoftLinks = function(targets){
		
		// Display app needs to read from config.json when starting.
		// This creates a symlink of the config.json file into __dirname/apps/rdmlcd dir. 
		// config.filePath seems dynamically attributed and using its data to 
		// renew the link every time volumio starts sounds like the most robust solution at this time.
		
	// targets is an array of destination paths where the config should be symlinked 
	if(!targets || !targets.length) return libQ.resolve();	
	
	const 	defer = libQ.defer(),
			todo = [];
			
	for(let target of targets){
		todo.push(
			new Promise((resolve, reject) => { 
				exec(`/bin/ln -s -f ${this.config.filePath} ${target}`, { uid: 1000, gid: 1000 }, (err)=>{ err && reject(err) || resolve() } );
			})
		);
	}
	Promise.all(todo).then(x=>defer.resolve()).catch(x=>defer.reject());
	return defer.promise;
}

audiophonicsRDMLCD.prototype.diagnoseRemote = function(){
	this.checkRemoteService()
	.then( ( remote_status )=>{
		this.commandRouter.broadcastMessage("openModal",{
			title: 'System Information',
			message: remote_status,
			size: 'lg',
			buttons: [{
				name: 'Close',
				class: 'btn btn-warning',
				emit: 'closeModals',
				payload: ''
			}]
		});	
	});
	return libQ.resolve();
};

audiophonicsRDMLCD.prototype.checkRemoteService = function (){
	
	if( !this.config.get("remote_active") ){ 
		return libQ.resolve("You must enable the remote service before you can query whether it is working properly.");
	}
	
	const defer = libQ.defer(),
	query_service_active = function(service){  
		return new Promise((resolve, reject) => {
			exec(`systemctl is-active ${service}.service`, (err,stdout,stderr)=>{
				if(err) return reject(err);
				return resolve( stdout === "active\n" );
			});
		});
	}, 
	query_lirc_remote = new Promise((resolve, reject) => {
		exec("journalctl -u rdm_remote.service --no-pager", (err,stdout,stderr)=>{
			if(err) return reject(err);
			let current_remote,
			reg_res,
			test_str = stdout.toString(),
			reg = /Info: Using remote:[\s]+(?<remote_name>.*?)\./g;
			while( reg_res = reg.exec(test_str) ) current_remote = reg_res.groups.remote_name;
			return resolve( current_remote );
		});
	});
	
	Promise.all([query_service_active("rdm_remote"), query_service_active("rdm_irexec"), query_lirc_remote])
	.then((values)=>{
		let lircd_systemd_active = values[0],
		irexec_systemd_active = values[1],
		current_remote = values[2],
		right_target_remote = (current_remote === "ApEvo"),
		all_ok = (lircd_systemd_active && irexec_systemd_active && right_target_remote)?"Configuration OK.":"Something is wrong in your remote configuration. You may want to reboot your Device to see if problem persists. If so simply reinstall this plugin and make sure there is no other plugin using the lirc remote configuration.";
		
		let html = `
			<ul>
				<li>LIRC daemon : ${lircd_systemd_active?"OK":"ERROR"}</li>
				<li>IREXEC daemon : ${irexec_systemd_active?"OK":"ERROR"}</li>
				<li>LIRC is using ApEvo remote : ${right_target_remote?"OK":"ERROR"} (${current_remote})</li>
			</ul>
			<p>${all_ok}</p>
		`;
		defer.resolve(html);
	})
	.catch((error)=>{
			this.commandRouter.pushToastMessage('error', "EVO SABRE : ", "Fatal error with remote service. Please reboot your Evo Sabre and reinstall this plugin if you see this message again.");
	});

	return defer.promise;
};


audiophonicsRDMLCD.prototype.setUIConfig = function(data){};
audiophonicsRDMLCD.prototype.getConf = function(varName){};
audiophonicsRDMLCD.prototype.setConf = function(varName, varValue){};

// System Helpers -----------------------------------------------------------------------------

audiophonicsRDMLCD.prototype.setRemoteActive = function(status){
	const 	defer = libQ.defer(),
			self = this;
			
	if(!status){
		this.systemctl('stop rdm_remote.service')
		.then( x=> this.systemctl('stop rdm_irexec.service') )
		.then( x=> defer.resolve() )
		.fail( x=> defer.reject() )
	}
	else{
		this.systemctl('restart rdm_remote.service')
		.then( x=> this.systemctl("restart rdm_irexec.service")  )
		.then( x=> defer.resolve() )
		.fail( x=> defer.reject() )
	}
	return defer.promise;
};

	
audiophonicsRDMLCD.prototype.systemctl = function (cmd){
	const defer = libQ.defer(), 
	handle = (err, stdout, stderr)=>{
		if (err) {
			this.logger.error(`RDMLCD : systemd failed cmd ${cmd} : ${err}`);
			this.commandRouter.pushToastMessage('error', "RDMLCD :", `Systemd command failed : ${cmd} : ${err}.`);
			defer.reject();
			return;
		} 
		this.logger.info(`RDMLCD : systemd cmd ${cmd} : success`);
		defer.resolve();
	};
	exec('/usr/bin/sudo /bin/systemctl ' + cmd, { uid: 1000, gid: 1000 }, handle);
	return defer.promise;
};

