

const os = require("os");

if(os.arch() === "arm64"){
	var rpio = require("./rpio64");
}
else{
	var rpio = require("./rpio32");
}





const fastwrite = b => rpio.spiWrite(b,b.length);

module.exports.ILI9341 = ILI9341;
	
function ILI9341(options){
	
	let parse_options = (key,default_val) =>  this[key] = ( options && options[key] )?options[key] : default_val;
	
	// set the ILI9341 controller parameters
	parse_options( "width"			, 320 );
	parse_options( "height"			, 240 );
	
	// target the correct GPIO pins 
	parse_options( "GPIO_dcpin"		, 27 );
	parse_options( "GPIO_rstpin"	, 24 );
	
	parse_options( "rpioCS"			, 0 );
	parse_options( "rpioClock"		, 30 );
	parse_options( "rpioCloseOnExit", true );
	
	rpio.init({
		gpiomem: false,
		mapping: 'gpio',
		mock: undefined,
		close_on_exit: this.rpioCloseOnExit,
	});
	
	rpio.open(this.GPIO_rstpin, rpio.OUTPUT);
    rpio.open(this.GPIO_dcpin,  rpio.OUTPUT);
    rpio.spiBegin();
    rpio.spiSetClockDivider(this.rpioClock);	
	
}


ILI9341.prototype.init = function(){
	this._reset();
	this.command(0x01);
	
	this.command(0xf6,
		0b01101000, 
		0b00000000
	);
	
	this.command(0xcf,0x00,0xc1,0x30);
	this.command(0xed,0x64,0x03,0x12,0x81);
	this.command(0xe8,0x85,0x00,0x79);
	this.command(0xcb,0x39,0x2c,0x00,0x34,0x02);
	this.command(0xea,0x00,0x00);
	this.command(0xf7,0x30);
	this.command(0xc0,0x23,);
	this.command(0xc1,0x10);
	this.command(0xc5,0x3e,0x28);
	this.command(0xc7,0x86);
	this.command(0x3a,0x55);
	this.command(0x36,0x48 ^ 0xC0);
	this.command(0xb1,0x00,0x1F);
	this.command(0xb6,0x08,0x82, 0x27);
	this.command(0x20);
	this.command(0xf2,0x02);
	this.command(0x26,0x01);
	this.command(0xe0,0x0f,0x22,0x1c,0x1b,0x08,0x0f,0x48,0xb8,0x34,0x05,0x0c,0x09,0x0f,0x07,0x00);
	this.command(0xe1,0x00,0x23,0x24,0x07,0x10,0x07,0x38,0x47,0x4b,0x0a,0x13,0x06,0x30,0x38,0x0f);
	this.command(0x11);
	this.command(0x29);
	this.setDrawingBox(0, this.width, 0, this.height);	
	this.clear();
}

ILI9341.prototype._reset = function(){
	rpio.write(this.GPIO_rstpin, rpio.HIGH);
	rpio.msleep(1);
	rpio.write(this.GPIO_rstpin, rpio.LOW);
	rpio.msleep(1);
	rpio.write(this.GPIO_rstpin, rpio.HIGH);
}

ILI9341.prototype.setDrawingBox = function(xa,xb,ya,yb) {
	//set the X coordinates
	this.command(0x2a, 
		xa >> 8, 
		xa & 0xff,
		xb >> 8,
		(xb - 1) & 0xff
	);
	//set the Y coordinates
	this.command(0x2b, 
		ya >> 8, 
		ya & 0xff,
		yb >> 8,
		(yb - 1) & 0xff
	);
	this.command(0x2c);
}

ILI9341.prototype.pushBuffer = function(buffer) {
	this.setDrawingBox(0, this.width, 0, this.height);	
    rpio.write(this.GPIO_dcpin, rpio.HIGH);
	fastwrite(buffer);
}

ILI9341.prototype.clear = function() {
    const buffer = Buffer.alloc(this.width * this.height *2, 0x00);
    this.pushBuffer(buffer);
}

ILI9341.prototype.command = function( cmd, ...data ){
	rpio.write( this.GPIO_dcpin, rpio.LOW );
	fastwrite(Buffer.from([cmd]));
	//console.log(cmd.toString(16), data)
	if(data.length)
	rpio.write( this.GPIO_dcpin, rpio.HIGH );
	fastwrite(Buffer.from(data));
}