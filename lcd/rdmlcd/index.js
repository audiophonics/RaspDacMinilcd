/*
	RaspDacMini LCD affichage écran.
	Version : 0.9
	Auteur : Olivier Schwach

*/
/*
const SegfaultHandler = require('segfault-handler');
SegfaultHandler.registerHandler('crash.log');
*/
// Vérifier qu'on est bien dans une distrib connue.
const distro = process.argv[2],
supported_distributions = ["moode", "volumio"];
if(!distro || !supported_distributions.includes(distro) ){
	console.warn("Unknown target distribution : ",distro, "\nHere are the supported distributions : ", supported_distributions.join() );
	process.exit();
}
 
var targetBuffer = process.argv[3];
if(!targetBuffer) targetBuffer = "/dev/fb0";


// On écoute les données de lecture correspondantes à la distro actuelle
var streamer;
switch(distro){
	case("moode"):
		const { moode_listener } = require("./utils/moodelistener.js");
		streamer = new moode_listener();
	break;
	case("volumio"):
		const { volumio_listener } = require("./utils/volumiolistener.js");
		streamer = new volumio_listener();
	break;
}

const fs = require("fs"); 
const cp = require("child_process");
const os = require("os");
const http = require("http");

if(os.arch() === "arm64"){
	var { Image, createCanvas, loadImage, DOMMatrix, ImageData  } = require('./utils/canvas64');
}
else{
	var { Image, createCanvas, loadImage, DOMMatrix, ImageData  } = require('./utils/canvas32');
}

const canvas = createCanvas(320, 240 );
const ctx = canvas.getContext("2d" );	

const scene = createCanvas(320, 455 );
const scene_ctx = scene.getContext("2d" );

// second canvas pour stocker l'image de la jaquette + le filtre flou (évite de recalculer le blur à chaque cycle)
const StackBlur = require('stackblur-canvas'); 
const tempcanvas = createCanvas(320, 240);
const tempctx = tempcanvas.getContext("2d" );


const { panicMeter } = require('./utils/panicmeter.js');
const panicmeter = new panicMeter();

const framebuffer = fs.openSync(targetBuffer, "w"); 

const base_refresh_track = 80;
// Serveur HTTP pour répondre aux commandes externes 

// Etats variables
var main_text_width = 0;
var should_scroll = false;
var main_text = "";
var cachedRasterizedMainText = null;
var textScrollerX = 0;
var refresh_track = 0;
var cover = {
	imageData : new ImageData(320,240),
	height : null,
	width : null,
	src : null
};
var mainMatrix =  new DOMMatrix([1,0,0,1,0,0]);
var busy = false;
var last_ip = "";
var clear_ip = function(){};
var clear_clock = function(){};
var dacInput = "";
var dacFilter = "?";


var TIME_BEFORE_DEEPSLEEP = 900000; // in ms
var UPDATE_INTERVAL = 20; // in ms
var SCROLLTIME = 1600; // in ms

const { scrollAnimation  } = require('./utils/scroll_animation.js');
const scroll_animation = new scrollAnimation();
scroll_animation.plotScrollEase(SCROLLTIME / UPDATE_INTERVAL, 0, -215, 0.8);

function leadingZero(a,b){
	if(!a){
		let r = "";
		while (b--) r+="0"
		return r;
	}
	return([1e15]+a).slice(-b)
}

// Methodes de dessin
function updateCover(img,src){
	
	/* si la cover précédente est longue à charger, il est possible que ce bout de code s'exécute alors que la piste a déjà changée, on ne met pas à jour si c'est le cas */
	if(src && src !== cover.src) return;
	
	let vratio = canvas.height / img.height, 
	canvasBoxData = [0, 0 ,canvas.width, canvas.height]; // pour éviter de tout réecrire à chaque fois. 
	
	cover.width = img.width * vratio;
	cover.height = canvas.height;
	cover.x = ( canvas.width - cover.width )/2;
	cover.y = ( canvas.height - cover.height )/2;
	tempctx.clearRect(0,0,320,240);
	tempctx.drawImage(img,...canvasBoxData); // On dessine l'image étirée dans toute la largeur du canvas secondaire
	let blur_imgdata = tempctx.getImageData(...canvasBoxData);	// On capture l'image étirée
	blur_imgdata = StackBlur.imageDataRGBA(blur_imgdata, ...canvasBoxData , 50); // On floute l'image étirée
	tempctx.putImageData(blur_imgdata, 0, 0 );	// On réinjecte l'image étirée floutée dans le canvas secondaire
	tempctx.drawImage(img, cover.x,cover.y, cover.width, cover.height);	// On dessine l'image de base (non-floutée) au centre par dessus
	cover.imageData = tempctx.getImageData(...canvasBoxData); // On capture l'ensemble 

	
}

// à utiliser pour fournir son propre objet image indépendant de ce que le streamer trouve dans son implémentation native
function directUpdateCover(imageObject){
	cover.imageData = new ImageData(320,240);
	cover.src = null;
	if(!imageObject) return;
	let canvasImage =  new Image();
	if( imageObject && imageObject.data ) canvasImage.src = imageObject.data;
	updateCover( canvasImage, false );
}


function updateVolumeIcon(ctx, x,y,w,h, level ){
	ctx.clearRect(x-2,y-4,w+6,h+6);
	
	ctx.strokeStyle = "white";
	ctx.fillStyle = "white";
	//ctx.fillStyle = "pink";
	//ctx.fillRect(x-2,y-4,w+6,h+6);
	
	
	

	let y_grid = h/4,
		x_grid = w/20,
		px = (n)=>{ return x + x_grid*n },
		py = (n)=>{ return y + y_grid*n }
	
	// logo du Haut-parleur
	
	ctx.beginPath();
	ctx.moveTo( px(0) 	, py(1) );
	ctx.lineTo( px(0) 	, py(3) );
	ctx.lineTo( px(3) 	, py(3) );
	ctx.lineTo( px(8) 	, py(4) );
	ctx.lineTo( px(8)	, py(0) );
	ctx.lineTo( px(3)	, py(1) );
	ctx.closePath();
	ctx.fill();
	ctx.beginPath();
	// on dessine des petites ondes sonores en fonction du volume (interface + sympa) 
	
	ctx.lineWidth = 2;
	
	if( !parseInt(level)  ){ // pas de volume : petite croix
		ctx.moveTo( px(12) 	, py(0.5) );
		ctx.lineTo( px(19) 	, py(3.5) );
		ctx.moveTo( px(12) 	, py(3.5) );
		ctx.lineTo( px(19) 	, py(0.5) );
		ctx.stroke();
		return;
	}
	
	ctx.beginPath();
	ctx.moveTo( px(10) 	, py(3) );
	ctx.bezierCurveTo(	
		px(13)	, py(2.5), 
		px(13)	, py(1.5),
		px(10)	, py(1)
	);
	if( level > 33  ){ 
		ctx.moveTo( px(14) 	, py(3.5) );
		ctx.bezierCurveTo(	
			px(17)	, py(2.5), 
			px(17)	, py(1.5),
			px(14)	, py(0.5)
		);
	}
	if( level > 66  ){ 
		ctx.moveTo( px(19) 	, py(4) );
		ctx.bezierCurveTo(	
			px(20)	, py(2.5), 
			px(20)	, py(1.5),
			px(19)	, py(0)
		);
	}
	ctx.stroke();
}

function updateStateIcon(ctx, x,y,w,h, state ){
	ctx.clearRect(x,y,w,h);
	ctx.fillStyle = "white";
	ctx.strokeStyle = "white";
	
	if(state === "play"){
		// play : un triangle
		ctx.beginPath();
		ctx.moveTo(x,y);
		ctx.lineTo(x,y+h);
		ctx.lineTo(x+w,(y+h)/2);
		ctx.closePath();
		ctx.fill();
		return;
	}	
	if(state === "pause"){
		// pause : deux rectangles
		ctx.clearRect(x,y,w,h);
		ctx.fillRect(x,y,w/3,h);
		ctx.fillRect(x,y,w/3,h);
		ctx.fillRect(x+w/1.5,y,w/3,h);
		return;
	}
		// default : stop ( carré )
	ctx.fillRect(x,y,w,h);
	
}

function updateMetaDataText(txt, x, y ,h){
	scene_ctx.fillStyle = "white";
	scene_ctx.font = `${h}px sans-serif`;
	scene_ctx.clearRect(x,y-h,320,h+4);
	scene_ctx.fillText( txt, x, y );
}


streamer.on("volumeChange", (data)=>{
	updateVolumeIcon(scene_ctx, 260,2, 20, 12, data);
	scene_ctx.clearRect(285, 0 , 320-285, 16);
	scene_ctx.fillStyle = "white";
	scene_ctx.font = "14px sans-serif";
	scene_ctx.fillText( leadingZero(streamer.data.volume, 3), 285, 14 );
});
streamer.on("stateChange", (data)=>{  updateStateIcon(scene_ctx, 4,4, 10, 10, data) } );
streamer.on("line0", (data)=>{	updateMetaDataText(data, 7, 270, 20) } );
streamer.on("line1", (data)=>{	updateMetaDataText(data, 7, 295, 20) } );
streamer.on("line2", (data)=>{	updateMetaDataText(data, 7, 320, 20) } );
streamer.on("line3", (data)=>{	updateMetaDataText(data, 7, 345, 20) } );
streamer.on("line4", (data)=>{	updateMetaDataText(data, 7, 370, 20) } );
streamer.on("line5", (data)=>{	updateMetaDataText(data, 7, 395, 20) } );
streamer.on("line6", (data)=>{	updateMetaDataText(data, 7, 420, 20) } );
streamer.on("coverChange", (data)=>{
	if(data === cover.src) return; // ne pas recharger l'image actuelle
	cover.imageData = new ImageData(320,240);
	cover.src = data;
	loadImage( data ).then((img)=>{updateCover(img,data)})
	.catch(	err => { console.warn('Erreur lors du chargement de la couverture.', err)	} ); // il faudrait un fallback cover ici
});
streamer.on("directCoverChange", directUpdateCover);
streamer.on("trackChange", (data)=>{
	should_scroll = false;
	main_text = streamer.formatedMainString;
	ctx.font = "25px arial";
	main_text_width = ctx.measureText( main_text + " - " ).width;
	
	//  est-ce que le texte est assez court pour tenir dans toute la largeur de l'écran ? 
	if( main_text_width <= canvas.width ){
		should_scroll = false;
		
		scene_ctx.clearRect(0, 210 ,320, 30);
		scene_ctx.fillStyle = "rgba(0,0,0,0.7)";
		scene_ctx.fillRect(0, 210 ,320, 30);
		scene_ctx.fillStyle = "white";
		scene_ctx.font = "25px arial";
		scene_ctx.textAlign = 'center';
		scene_ctx.fillText( main_text, 320/2, 210+25 );
		scene_ctx.textAlign = 'left';
	}
	else{
		should_scroll = true;
		main_text = main_text + " - " + main_text + " - "; // On double le texte pour que le début du texte sorte déjà du bord droit alors que la fin sort encore du bord gauche
	
		scene_ctx.clearRect(0, 210 ,320, 30); // au cas où il reste un morceau de texte statique sur le canvas scene
			
		// On fill le canvas prévu pour le text avec un raster corespondant au texte doublé
	
		let double_text_width = ctx.measureText( main_text ).width;
		delete cachedRasterizedMainText;
		cachedRasterizedMainText = createCanvas(double_text_width, 30);
		cached_ctx = cachedRasterizedMainText.getContext("2d" );
		
		// petit arrière-plan noir semi-transparent pour la lisibilité
		cached_ctx.fillStyle = "rgba(0,0,0,0.7)";
		cached_ctx.fillRect(0, 0 ,double_text_width, 30);
		
		cached_ctx.fillStyle = "white";
		cached_ctx.font = "25px arial";
		cached_ctx.fillText( main_text, 0, 25 );
		
		textScrollerX = 0;
		refresh_track = base_refresh_track;
	}
});
streamer.on("seekChange", (data)=>{
	scene_ctx.fillStyle="#a74a0c";
	scene_ctx.clearRect(0,207,320,3);
	scene_ctx.fillRect(0,207, parseInt( 320 * data.ratiobar ) ,3);
});
/*
ctx.fillStyle = "black";
ctx.fillRect(0, 0 ,320, 240);
*/

function get_filter(){
    cp.exec(`apessq2m get_filter`,handle);
    function handle(rerr,data){
        if(rerr){ 
            return;
        }
        let _dacFilter = data.replace("\n","").replace("minimum","min");
		if(dacFilter === _dacFilter) return;
		dacFilter = _dacFilter;
		updateMetaDataText("DAC : " + dacFilter, 7, 445, 20);
    }
}
get_filter();
setInterval(get_filter, 2000);

function get_input(){
    cp.exec(`apessq2m get_input`,handle);
    function handle(rerr,_dacInput){
        if(rerr){ 
            return;
        }
		if(dacInput === _dacInput) return;
		dacInput = _dacInput;
	
		if(dacInput === "SPDIF\n"){
			let fontsize = 100;
			ctx.clearRect(0,0,320,240);
			ctx.fillStyle = "white";
			ctx.font = `${fontsize}px arial`;
			ctx.textAlign = 'center';
			ctx.fillText( "SPDIF", 320/2, (fontsize + 240)/2 );
			ctx.textAlign = 'left';
		}
		else {
			scroll_animation.reset();
			textScrollerX = 0;
			refresh_track = base_refresh_track;
		}
		
    }
}
get_input();
setInterval(get_input, 2000);

function monitor_ip(){
	let current_ipv4 = "",
	fontsize = 14,
	x = 21, 
	y = 15,
	width = 0;
	
	try{
		let ips = os.networkInterfaces(), ip = "No network.";
		for(a in ips){
			if( ips[a][0]["address"] !== "127.0.0.1" && /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ips[a][0]["address"]) ){
				ip = ips[a][0]["address"];
				break;
			}
		}
		current_ipv4 = ip;
	}
	catch(e){current_ipv4 =  "No network.";}
	if(last_ip === current_ipv4 ) return;
	last_ip = current_ipv4;
	
	scene_ctx.fillStyle = "white";
	scene_ctx.font = `${fontsize}px sans-serif`;
	clear_ip();
	scene_ctx.fillText( current_ipv4, x, y );
	width = scene_ctx.measureText( current_ipv4 ).width;
	clear_ip=()=>{ 	scene_ctx.clearRect(x,y,width,-1*fontsize); }
}
monitor_ip();
setInterval(monitor_ip, 2000);

function monitor_clock(){
	let date = new Date(), 
	current_clock = "",
	fontsize = 14,
	x = 165, 
	y = 15,
	width = 0;
	
	current_clock = leadingZero( date.getHours(), 2 ) + ":" + leadingZero( date.getMinutes(), 2 );
	scene_ctx.fillStyle = "white";	
	scene_ctx.font = `${fontsize}px sans-serif`;
	clear_clock();
	scene_ctx.fillText( current_clock, x, y );
	width = scene_ctx.measureText( current_clock ).width;
	clear_clock =()=>{	scene_ctx.clearRect(x,y,width,-1*fontsize);	}
}
setInterval(monitor_clock, 1000);


http.createServer(server).listen(4153);
function server( req,res ){
	let url = req.url.split("/")[1],
	_url = url.split("="),	
	cmd = _url[0],
	param = _url[1] || "?";
	param = decodeURIComponent(param);
	switch(cmd){
		case("switch_view"): 
			scroll_animation.toggle();	
			res.end(`OK`)
		break;
		case("filter_change"): 
			 dacFilter = param.replace("minimum","min");
			 updateMetaDataText("DAC : " + dacFilter, 7, 445, 20);
			 res.end(`OK`)
		break;
		case("input"): 
			 dacInput = param;
			 
			 res.end(`OK`)
		break;
	}
}	




// Composition finale de l'image
function Vdraw(){
	//console.time("draw");
	let verticalOffset = 0;
	if(dacInput !== "SPDIF\n"){ // Si SPDIF actif, on affiche un texte fixe au milieu donc on évite de tout redessiner 
		verticalOffset = scroll_animation.cycle();
		ctx.setTransform( new DOMMatrix([1,0,0,1,0,verticalOffset]) );
		
		// titre album scroll
		if( should_scroll ){ 
			if(textScrollerX + main_text_width  <= 0 ) textScrollerX = 0;
			if(cover.imageData){
				ctx.clearRect(0,0,320, 18);
				ctx.clearRect(0,210,320,30);
				ctx.putImageData(cover.imageData, 0, 0); 
			}
			// Si le texte doit défiler, on l'a dessiné préalablement dans un canvas de largeur variable 
			// et c'est ce canvas en question qu'on fait défiler.
			ctx.drawImage( cachedRasterizedMainText, -textScrollerX, 0, 320, 30, 0, 210, 320, 30  );
			
			if( refresh_track ) refresh_track--; // ne pas updater le curseur de scroll avant d'avoir écoulé les frames statiques (juste après un changement de morceau)
			else textScrollerX--;
		}
		else{
			// si le texte est assez court pour être affiché statiquement on l'a déjà dessiné dans le canvas "scene"
			if(cover.imageData){
				ctx.clearRect(0,0,320, 18);
				ctx.putImageData(cover.imageData, 0, 0); 
			}
		}

		// Barre du haut de l'écran	s
		// petit arrière-plan noir semi-transparent pour la lisibilité
		ctx.fillStyle = "rgba(0,0,0,0.5)";			
		ctx.fillRect(0,0,320, 18);

		// page 2
		ctx.fillStyle = "rgba(0,0,0,0.7)";
		ctx.fillRect(0, 240 ,320, 240);

		ctx.setTransform(mainMatrix);
		ctx.drawImage(scene, 0, 0-verticalOffset , 320 , 240, 0, 0 , 320,240);

	}	
	else{
		// Barre du haut de l'écran	
		// petit arrière-plan noir semi-transparent pour la lisibilité
		ctx.fillStyle = "rgba(0,0,0,0.5)";			
		ctx.fillRect(0,0,320, 18);
				
		ctx.setTransform(mainMatrix);
		ctx.drawImage(scene, 0, 0 , 320 , 18, 0, 0 , 320,18);
	}

	
	//console.timeEnd("draw");
}


function updateFB(){
	if(busy) {
		panicmeter.registerError();
		return
	}
	busy = true;
	Vdraw();
	const buff = canvas.toBuffer("raw");
	fs.write(framebuffer, buff, 0, buff.byteLength, 0, fbcb);
}

function fbcb(err,data){
	busy = false;
	if ( err ) console.warn( err, data );
}



fs.readFile("config.json",(err,data)=>{
	if(err) console.log("Cannot read config file. Using default settings instead.");
	else{
		try { 
			data = JSON.parse( data.toString() );
			TIME_BEFORE_DEEPSLEEP = (data && data.sleep_after.value) ? data.sleep_after.value  * 1000 : TIME_BEFORE_DEEPSLEEP
		
		} catch(e){
			console.log("Cannot read config file. Using default settings instead.");
		}
	}
	
	streamer.watchIdleState(TIME_BEFORE_DEEPSLEEP);
	var bufwrite_interval = setInterval(updateFB, UPDATE_INTERVAL)

	streamer.on("iddleStart", function(){
		clearInterval(bufwrite_interval);
		const {byteLength} = canvas.toBuffer("raw"),
		buff = Buffer.alloc(byteLength);
		buff.fill(0x00);
		fs.write(framebuffer, buff, 0, byteLength, 0, fbcb);
	});
	streamer.on("iddleStop", function(){
		clearInterval(bufwrite_interval);
		bufwrite_interval = setInterval(updateFB, UPDATE_INTERVAL)
	});


});









