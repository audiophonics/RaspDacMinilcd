const http = require("http");
const title = "RaspDacMini LCD";
const fs = require("fs");
const MODULE_PATH = "./ap_modules";
const MAX_POST_BODY_LENGTH = 5000;
const _MODULES = {};
fs.readdir(MODULE_PATH,(err,data)=>{import_modules(err,data,start_server)});

function start_server(){
    http.createServer(server).listen(4150);
};

function server(req,res){
	if (req.method === 'POST'){
        let postdata = ""; 
		req.on('data', (data) =>{ 
			if(data.length < MAX_POST_BODY_LENGTH && data.length + postdata.length < MAX_POST_BODY_LENGTH){	
				postdata+=(data);
			} 
			else{
				req.pause();
				res.status = 500;
				res.end("Error : post too long.");
				req.destroy();
			}
		})
		req.on('end', () =>{		
			let parsed = {};
            try{parsed = JSON.parse(postdata)}
            catch(e){
                data = postdata.toString().split('&');
                for(p of data){
                    pp = p.split("=");
                    parsed[pp[0]] = pp[1];
                };
            }
            if( parsed.target_module && _MODULES[parsed.target_module] && typeof _MODULES[parsed.target_module]["handle_post"] === "function"){
                _MODULES[parsed.target_module]["handle_post"](parsed, (module_response)=>{ 
                    _MODULES[parsed.target_module].module_response = module_response
                    if(parsed["response_type"] != "JSON"){
                        res.end(make_page())
                    }
                    else res.end(JSON.stringify(module_response))
                }) 
            }
		})
	}
	else{
        // check if a module is asking to use this url for custom display
        let url = req.url.split("/"); 
        url.shift();
        let url_catched = false;
        for( let i in _MODULES){
            if(_MODULES[i].url_catcher && _MODULES[i].url_catcher.includes(url[0]) ){
                console.log("match");
                url_catched = true;
                _MODULES[i].catch_url(url,req,res)
                break;              
            }
        }
        
        // else serve default index page
        if(!url_catched){
            res.writeHead(200, {"Content-Type": "text/html"});
            res.end(make_page());
        }
	}
}

function make_page(){

    let _MODULES_HTML = "";
    for(let i in _MODULES){
        try{
			
            _MODULES_HTML += `<section class="module_section" id="${_MODULES[i].title}">
			${_MODULES[i].module_head ? _MODULES[i].module_head: ""}
			
            <div class="module_response">${_MODULES[i].module_response}</div>
            ${_MODULES[i].make_html()}</section>`
            _MODULES[i].module_response = "";
        }
        catch(e){console.warn("error while parsing html section for module",e, _MODULES[i]) }
        
    }
    
	let html = `
<html>
	<head>
        <link rel="icon" href="data:;base64,iVBORw0KGgo=">
        <style>
            /* NORMALIZE CSS */
            html {
              line-height: 1.15; /* 1 */
              -webkit-text-size-adjust: 100%; /* 2 */
            }
            body {
              margin: 0;
            }
            main {
              display: block;
            }
            h1 {
              font-size: 2em;
              margin: 0;
            }
            h2 {
                font-size: 1.8em;
                margin: 0;
            }
            h3 {
                font-size: 1.6em;
                margin: 0;
            }
            hr {
              box-sizing: content-box; /* 1 */
              height: 0; /* 1 */
              overflow: visible; /* 2 */
            }
            pre {
              font-family: monospace, monospace; /* 1 */
              font-size: 1em; /* 2 */
            }
            a {
              background-color: transparent;
            }
            abbr[title] {
              border-bottom: none; /* 1 */
              text-decoration: underline; /* 2 */
              text-decoration: underline dotted; /* 2 */
            }
            b,strong {
              font-weight: bolder;
            }
            code, kbd, samp {
              font-family: monospace, monospace; /* 1 */
              font-size: 1em; /* 2 */
            }
            small {
              font-size: 80%;
            }
            sub,sup {
              font-size: 75%;
              line-height: 0;
              position: relative;
              vertical-align: baseline;
            }
            sub {
              bottom: -0.25em;
            }
            sup {
              top: -0.5em;
            }
            img {
              border-style: none;
            }
            button, input, optgroup, select, textarea {
              font-family: inherit; /* 1 */
              font-size: 100%; /* 1 */
              line-height: 1.15; /* 1 */
              margin: 0; /* 2 */
            }
            button, input { /* 1 */
              overflow: visible;
            }
            button, select { /* 1 */
              text-transform: none;
            }
            button, [type="button"], [type="reset"], [type="submit"] {
              -webkit-appearance: button;
            }
            button::-moz-focus-inner, [type="button"]::-moz-focus-inner, [type="reset"]::-moz-focus-inner, [type="submit"]::-moz-focus-inner {
              border-style: none;
              padding: 0;
            }
            button:-moz-focusring, [type="button"]:-moz-focusring, [type="reset"]:-moz-focusring, [type="submit"]:-moz-focusring {
              outline: 1px dotted ButtonText;
            }
            fieldset {
              padding: 0.35em 0.75em 0.625em;
            }
            legend {
              box-sizing: border-box; /* 1 */
              color: inherit; /* 2 */
              display: table; /* 1 */
              max-width: 100%; /* 1 */
              padding: 0; /* 3 */
              white-space: normal; /* 1 */
            }
            progress {
              vertical-align: baseline;
            }
            textarea {
              overflow: auto;
            }
            [type="checkbox"], [type="radio"] {
              box-sizing: border-box; /* 1 */
              padding: 0; /* 2 */
            }
            [type="number"]::-webkit-inner-spin-button, [type="number"]::-webkit-outer-spin-button {
              height: auto;
            }
            [type="search"] {
              -webkit-appearance: textfield; /* 1 */
              outline-offset: -2px; /* 2 */
            }
            [type="search"]::-webkit-search-decoration {
              -webkit-appearance: none;
            }
            ::-webkit-file-upload-button {
              -webkit-appearance: button; /* 1 */
              font: inherit; /* 2 */
            }
            details {
              display: block;
            }
            summary {
              display: list-item;
            }
            template {
              display: none;
            }
            [hidden] {
              display: none;
            }

            /* GENERAL */
            body{
                font-family: sans-serif; 
            }

            .content_wrap{
                padding: 10px 5px;
            }

            section{
                width: 100vw;
            }

            label{
              font-weight: 600;
            }

            input[type="number"], select{
              padding: 10px;
              background: #eeeeee;
              border: 0;
            }

            .ok_btn{
              padding: 15px 30px;
              background: #58af22;
              border: 0;
              border-radius: 2px;
              color: #ffffff;
              font-weight: 600;
            }

            .alt_btn{
              padding: 15px 30px;
              background: #676767;
              border: 0;
              border-radius: 2px;
              color: #ffffff;
              font-weight: 600;
            }

            /* HEADER */
            header{
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
                width: 100vw;
                padding: 15px 10px;
                margin-bottom: 4vh;
                background: #212121;
                color: #ffffff;
            }

            header .ap_logo{
				margin-bottom:20px;
				text-align:center;
            }
			
			svg{
				max-width:300px;
			}

            header h1{
                font-family: helvetica, sans-serif;
                text-align: center;
                font-size: 1.8rem;
            }

            /* TOP TITLE */
            .content_name{
                text-align: center;
                margin-bottom: 40px;
            }

            .content_name p{
                color: #888888;
            }

            .content_name:after{
                content: "";
                height: 2px;
                background: #444;
                width: 50px;
                display: inline-block;
            }

			form{
				text-align:center;
			}


            /* TIMEZONE */
            #tz{
              display: flex;
              flex-flow: row wrap;
              justify-content: center;
              align-items: center;
            }

            #tz label{
              margin-right: 10px;
            }

            #tz select:first-of-type{
              margin-right: 50px;
            }

            /* LOGO */
            .logo_settings{
              text-align: center;
            }

            .logo_settings h3{
              margin-bottom: 15px;
            }

            .logo_settings canvas{
              margin-bottom: 15px;
            }

            .logo_size{
              display: flex;
              flex-flow: row wrap;
              justify-content: center;
            }

            .logo_setting{
              margin: 5px 10px;
            }

        </style> 
        
    </head>
	<body>
        <header>
            <div class="ap_logo">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 40" style="fill: white;"><path d="M129.9 9.7h2.7s.1-.1.1.1l-2.6 5.2h7.5c.1 0 .2 0 .2-.1l2.5-5 .1-.1h2.7s.1-.1.1.1l-1.6 3.1-3.9 7.8c-.3.6-.6 1.3-1 1.9 0 .1-.1.1-.2.1h-2.6c-.2 0-.1 0-.1-.1l2.6-5.1c.1-.2.1-.2-.1-.2h-7.4c-.1 0-.2 0-.2.1l-2.6 5.1c-.1.1-.1.2-.3.2h-2.6c-.1 0-.2 0-.1-.1l4.5-8.9 1.9-3.8c.3-.2.3-.2.4-.3zm-71.8 0H61l-1.1 2.1-3.2 5.9a1.93 1.93 0 0 0-.3 1c0 .5.2.9.7 1.2.4.3.8.4 1.3.4 1.1.1 2.2.1 3.3-.2 1.2-.3 2.2-1 3-2 .3-.5.6-1 .8-1.5l3.7-6.8s0-.1.1-.1h2.9l-4.4 8.2c-.8 1.6-2.1 2.7-3.7 3.5-1.2.6-2.5 1-3.9 1.2-1.2.2-2.4.2-3.6.1-.9-.1-1.7-.3-2.4-.8-.9-.6-1.2-1.4-1-2.5.1-.6.3-1.1.6-1.5l4.3-8c-.1-.1-.1-.1 0-.2zm32.7 0h2.8c.1 0 .2 0 .1.1l-1.6 3.1-5.1 9.7c0 .1-.1.1-.2.1h-2.9c.2-.3.3-.7.5-1l5.5-10.5.7-1.3c.1-.1.2-.1.2-.2zm117.5 0h8.7l-.8 1.8c-.1.1-.1.3-.2.4 0 .1-.1.1-.2.1h-8.6c-1 0-1.8.5-2.4 1.3-.1.1-.2.3-.2.5-.1.5.1.9.5 1.1.3.1.5.1.8.1h4.8c.8 0 1.5.1 2.3.4.4.2.8.4 1.1.8.3.5.4 1 .2 1.5-.3 1.3-1 2.4-2 3.3-1 .8-2.2 1.3-3.4 1.5l-2.3.2h-8.3c.1-.2.2-.4.3-.7.2-.5.5-1 .7-1.5 0-.1.1-.1.2-.1h8.9c1.1 0 2.2-.8 2.6-1.7.3-.7-.1-1.3-.8-1.4h-5.1c-.8 0-1.5-.1-2.2-.4-.6-.2-1-.6-1.3-1.2a2.48 2.48 0 0 1 0-1.7c.4-1.3 1.3-2.4 2.5-3.1 1.2-.8 2.6-1.2 4-1.2h.2zm-13.2 0h6.5l-1 2.2c0 .1-.1.1-.2.1h-6.7c-2.1 0-3.7.9-4.9 2.5a8.47 8.47 0 0 0-1.5 3c-.1.4-.2.8-.1 1.3.1.7.4 1.1 1.1 1.4.5.2.9.2 1.4.2h6.7c.2 0 .2 0 .1.2l-.9 2c0 .1-.1.1-.2.1h-6c-1 0-2-.1-3-.4-.5-.2-1-.4-1.4-.7-.7-.6-.9-1.3-.9-2.2 0-.8.2-1.5.5-2.2.4-1.1 1-2.1 1.7-3.1 1.6-2.2 3.8-3.6 6.5-4.2.6-.1 1.4-.1 2.3-.2zm-12.1 0h2.9l-1.2 2.5-4.7 9.9c-.1.2-.2.4-.3.5 0 .1-.1.1-.2.1h-2.7c-.1 0-.1 0-.1-.1l2.6-5.4 3.3-6.9c.1-.2.2-.4.4-.6zM51 10c-.3-.1-.6-.2-.9-.2h-1.2c-.4 0-.7.1-1.1.2-1.1.3-2 .9-2.8 1.7l-11 11c-.1.1-.1.1-.1.2h3c.1 0 .2 0 .3-.1l1.7-1.7c.1-.1.1-.1.2-.1h8.6c.1 0 .1 0 .1.1 0 .5-.1 1.1-.1 1.6 0 .1 0 .1.1.1h2.9c.1 0 .1 0 .1-.1l.3-3.9.3-3.8.3-3.7c.1-.6-.1-1-.7-1.3zm-2.8 7.1c0 .4-.1.9-.1 1.3 0 .1 0 .1-.1.1h-6.6s-.1 0 0 0l6.1-6.1c.1-.1.3-.3.5-.4s.4-.1.6-.1.3.1.3.4zm37.3-6.3c-.5-.4-1-.6-1.5-.8-.8-.2-1.5-.3-2.3-.3h-7.3s0 .1-.1.1l-3.7 7-3.1 5.8c0 .1-.1.2.1.2h7c1.1 0 2.1-.1 3.1-.4 2.4-.6 4.4-1.8 5.9-3.7.7-.9 1.4-1.9 1.9-2.9.4-.8.7-1.7.8-2.6.1-1-.1-1.8-.8-2.4zm-2.9 4.8c-.5 1-1.1 2-1.9 2.9-.9 1-2 1.6-3.4 1.9-.4.1-.7.1-1.1.1h-4.8l.9-1.7 3.5-6.6c0-.1.1-.1.2-.1h4.6c.5 0 1 .1 1.4.2.7.3 1 .8.9 1.5.2.6 0 1.2-.3 1.8zm25.7-5.2l-.9-.3c-.8-.2-1.5-.3-2.3-.3h-2.2c-.7 0-1.3.1-2 .2-2.6.4-4.8 1.5-6.5 3.5-.9 1-1.6 2.2-2.2 3.4-.4.8-.7 1.7-.8 2.6-.1 1.2.4 2.2 1.5 2.7.8.4 1.6.5 2.5.6.8.1 1.6.1 2.5.1 1 0 2-.1 3-.3 2.3-.4 4.2-1.4 5.8-3.1 1-1 1.8-2.2 2.4-3.6.4-.8.7-1.7.8-2.6.1-1.4-.5-2.4-1.6-2.9zm-2 5c-.4 1.1-1 2.1-1.8 2.9-.9 1.1-2.1 1.8-3.5 2.1-.4.1-.7.1-1.1.1h-3.5c-.4 0-.8-.1-1.1-.3-.5-.3-.8-.7-.8-1.2s.1-1 .3-1.5c.5-1.4 1.3-2.7 2.4-3.7 1-1 2.2-1.5 3.7-1.6 1.1-.1 2.2 0 3.4 0 .3 0 .7 0 1 .1l.8.3c.4.3.6.7.7 1.2-.1.4-.3 1-.5 1.6zm52.3-4.7c-.5-.4-1-.6-1.6-.7-.7-.2-1.5-.2-2.2-.3h-2.2c-.9 0-1.7.1-2.5.3-2.4.5-4.4 1.6-6 3.5-.8 1-1.5 2-2 3.2-.4.8-.6 1.6-.7 2.5-.1 1.5.5 2.5 1.9 3.1.7.3 1.4.4 2.1.5 1 .1 1.9.1 2.9 0 .9 0 1.7-.1 2.6-.3 1.8-.3 3.4-1 4.8-2.2a12.84 12.84 0 0 0 3.4-4.6c.3-.8.6-1.6.7-2.5-.2-1-.5-1.9-1.2-2.5zm-2.4 4.5c-.5 1.3-1.1 2.4-2.1 3.4-.9 1-2.1 1.6-3.4 1.8-.4.1-.9.1-1.3.1h-3.1c-.4 0-.8-.1-1.1-.3-.5-.3-.7-.7-.8-1.2 0-.7.1-1.3.4-1.9.5-1.2 1.1-2.3 2-3.2 1-1.1 2.3-1.7 3.8-1.8 1.2-.1 2.5 0 3.7 0 .3 0 .6 0 .8.1.2 0 .3.1.5.2.6.3.9.7.9 1.4 0 .4-.2.9-.3 1.4zm-30.3-4.4c-.3-.5-.8-.7-1.4-.9-.5-.2-1.1-.2-1.6-.2h-8.7c0 .1-.1.1-.1.2l-1.3 2.6-4.8 9.3c-.2.3-.3.7-.5 1h2.8c.1 0 .1-.1.2-.1l2.7-5.2c0-.1.1-.1.2-.1h5.3c.9 0 1.9-.1 2.8-.4 1.3-.4 2.5-1.1 3.4-2.1.6-.7 1.1-1.5 1.2-2.4.2-.7.2-1.2-.2-1.7zm-2.9 2.7c-.3.6-.8 1-1.4 1.3-.4.2-.9.3-1.4.3h-5.7c.2-.5.5-.9.7-1.4.3-.5.5-1 .8-1.5 0-.1.1-.1.2-.1h5.7c.2 0 .4 0 .6.1.5.1.7.7.5 1.3z M180.6 9.8l-1.6 3.3-2.3 4.8-.9 1.8c-.5.9-1.2 1.6-2.1 2.1-1.1.6-2.2 1-3.5 1h-.5c-.6 0-1.1-.1-1.6-.4-.6-.4-.9-.9-.9-1.7l.3-3.8.3-3.7c0-.2.1-.5 0-.7a.47.47 0 0 0-.5-.5c-.8-.1-1.5.3-1.9 1.1l-2.6 5.2-2.1 4.3c0 .1-.1.1-.2.1h-2.9c-.2 0-.1 0-.1-.1l4.7-9.4c.7-1.4 1.7-2.3 3.1-2.9.6-.3 1.3-.4 2-.5h1.8c.7.1 1.3.4 1.7.9.2.2.2.5.2.8 0 .5-.1.9-.1 1.4 0 .4 0 .8-.1 1.2 0 .5-.1 1.1-.1 1.6 0 .4 0 .7-.1 1.1 0 .5-.1 1.1-.1 1.6s-.1 1-.1 1.5c0 .4.2.5.5.5.8 0 1.4-.3 1.7-1l1.8-3.7 1.3-2.7 1.5-3.2c0-.1.1-.2.2-.2h2.9c.2.1.3.1.3.2z M33.7 38.1c-.3 0-.5-.1-.8-.1-1.2-.2-2.4-.6-3.5-1-2.4-1-4.7-2.3-6.8-3.8-3.9-2.8-7.4-6-10.6-9.6-1.9-2.1-3.6-4.4-5.1-6.8-1.1-1.7-2-3.4-2.7-5.2-.5-1.2-.9-2.4-1-3.7 0-.2 0-.4-.1-.6v-.8c0-.1 0-.3.1-.4.2-1.7 1.3-2.9 3-3.2.2 0 .3-.1.5-.1h1.1c.2 0 .4 0 .6.1 1.2.2 2.3.5 3.4.9 1.9.7 3.7 1.7 5.4 2.8 2.4 1.5 4.7 3.3 6.9 5.2.1 0 .1.1.2.1h-.1c-.3.1-.5.1-.8.2s-.4 0-.6-.1c-1.7-1.5-3.6-2.8-5.5-3.9-1.4-.8-2.8-1.5-4.4-1.9-.8-.2-1.6-.3-2.3-.2-1.2.1-2.1.7-2.2 2.1a5.24 5.24 0 0 0 .3 2.5c.4 1.5 1.1 2.8 1.8 4.2 1.3 2.3 3 4.5 4.7 6.5 2.4 2.8 5.1 5.3 8 7.5 1.7 1.3 3.5 2.4 5.5 3.3.9.4 1.9.8 2.9 1 .7.1 1.4.2 2 0 1-.3 1.6-1 1.7-2.1.1-.9-.1-1.8-.3-2.6a27.49 27.49 0 0 0-1.5-3.6c-1.1-2-2.5-3.9-3.9-5.7-.1-.1-.1-.2-.1-.3.1-.3.1-.6.2-.9v-.1s.1.1.1.2c2.1 2.4 4 4.9 5.6 7.7 1 1.8 1.9 3.6 2.5 5.6.3 1.1.5 2.1.4 3.3-.1 1-.4 2-1.2 2.7-.6.5-1.3.8-2 .9-.1 0-.3 0-.4.1-.3-.2-.6-.2-1-.2zm-13-.8c-.3-.1-.5-.1-.8-.2-.4-.1-.8-.2-1.2-.4-.6-.2-1.1-.5-1.7-.8l-1.5-.9-1.9-1.3c-.6-.4-1.1-.9-1.7-1.4-.9-.7-1.6-1.5-2.4-2.3l-1.4-1.5c-.3-.4-.7-.8-1-1.2-.3-.3-.5-.7-.8-1l-.7-1c-.6-.9-1.1-1.8-1.6-2.8-.4-.7-.7-1.5-.9-2.3v-.1s.1 0 .1-.1l2-2c.3-.3.6-.6.8-.9.2.4.4.9.7 1.3 0 0 0 .1.1.1l-.1.1c-.3.3-.5.6-.6 1 0 .3 0 .7.1 1 .2.8.5 1.5.9 2.1s.7 1.3 1.1 1.9.8 1.1 1.3 1.7c.3.4.6.7.9 1 .5.6 1 1.2 1.6 1.7.5.5 1.1 1 1.7 1.5a32.57 32.57 0 0 0 2.2 1.7c.6.4 1.1.8 1.8 1.1l1.2.6c.3.1.7.2 1.1.3.5.1 1.1.1 1.5-.2.1-.1.2-.2.4-.3.2.1.4.3.6.4l.9.6s0 .1-.1.1l-1.7 1.7c-.3.3-.6.5-.9.8z M23.7 14s-4.3-4.1-8.5-5.2-4 2.2-4 2.4 0 4.4 6.8 11.4 12.5 7.8 13.6 6.2.4-5.7-4.6-11.3l-.2.7s4.8 5.8 3.2 7.9-8.2-2.5-11.1-5.8-5.8-7.4-4.3-9.3c1.3-1.5 6.5 1.7 8.2 3.4l.9-.4zm-6.4 3s2.6 3.7 6.9 6.7c0 0 2.1-4.3-.2-6.6s-6.5-.2-6.7-.1z"/></svg>
            </div>
            <h1>${title}</h1>
        </header>
        <div class="content_wrap">
           
            <div id = "modules">${_MODULES_HTML}</div>
        </div>
    </body>
</html>`;

	return(html);
}

function import_modules(err,data,callback){
    if(err) {
        console.warn("Error : cannot open ap_module directory (pointed at)",MODULE_PATH,err)
        return
    }
    
    let todo_list = 0;    
    if (data.length){
        for(let i in data){  
            todo_list ++
            fs.readdir(MODULE_PATH+"/"+data[i],(err,pdata)=>{import_module(err,pdata,data[i])})
        }
    }
    else if (typeof callback === "function") callback();
    
    function import_module(err,data,current_module){
        todo_list --
        if(err || !data.includes("index.js") ) {
            console.warn("Error : cannot open module",current_module,err)
            return;
        }
        let mod = require(MODULE_PATH+"/"+current_module+"/"+"index.js");
        mod.title = current_module;                
        mod.handle_post = handle_post;
        mod.module_response = "";
        _MODULES[current_module] = mod;    
        if(todo_list === 0 && typeof callback === "function" ){callback()}
    }
    
    function handle_post(data,callback){
        if(!data["target_command"]) callback("error : no command specified");
        else if(typeof this[data["target_command"]] !== "function" ) callback("error : command does not exist in module " + this.title);
        else{
            try{
               this[data["target_command"]](data,callback);
            }
            catch(e){
                callback("Error, module command returned error : " + e)
            }
        }
    }
}



