const cp = require("child_process");
const options = ["Africa/Abidjan", "Africa/Accra", "Africa/Algiers", "Africa/Bissau", "Africa/Cairo", "Africa/Casablanca", "Africa/Ceuta", "Africa/El_Aaiun", "Africa/Johannesburg", "Africa/Juba", "Africa/Khartoum", "Africa/Lagos", "Africa/Maputo", "Africa/Monrovia", "Africa/Nairobi", "Africa/Ndjamena", "Africa/Tripoli", "Africa/Tunis", "Africa/Windhoek", "America/Adak", "America/Anchorage", "America/Araguaina", "America/Argentina/Buenos_Aires", "America/Argentina/Catamarca", "America/Argentina/Cordoba", "America/Argentina/Jujuy", "America/Argentina/La_Rioja", "America/Argentina/Mendoza", "America/Argentina/Rio_Gallegos", "America/Argentina/Salta", "America/Argentina/San_Juan", "America/Argentina/San_Luis", "America/Argentina/Tucuman", "America/Argentina/Ushuaia", "America/Asuncion", "America/Atikokan", "America/Bahia", "America/Bahia_Banderas", "America/Barbados", "America/Belem", "America/Belize", "America/Blanc-Sablon", "America/Boa_Vista", "America/Bogota", "America/Boise", "America/Cambridge_Bay", "America/Campo_Grande", "America/Cancun", "America/Caracas", "America/Cayenne", "America/Chicago", "America/Chihuahua", "America/Costa_Rica", "America/Creston", "America/Cuiaba", "America/Curacao", "America/Danmarkshavn", "America/Dawson", "America/Dawson_Creek", "America/Denver", "America/Detroit", "America/Edmonton", "America/Eirunepe", "America/El_Salvador", "America/Fort_Nelson", "America/Fortaleza", "America/Glace_Bay", "America/Godthab", "America/Goose_Bay", "America/Grand_Turk", "America/Guatemala", "America/Guayaquil", "America/Guyana", "America/Halifax", "America/Havana", "America/Hermosillo", "America/Indiana/Indianapolis", "America/Indiana/Knox", "America/Indiana/Marengo", "America/Indiana/Petersburg", "America/Indiana/Tell_City", "America/Indiana/Vevay", "America/Indiana/Vincennes", "America/Indiana/Winamac", "America/Inuvik", "America/Iqaluit", "America/Jamaica", "America/Juneau", "America/Kentucky/Louisville", "America/Kentucky/Monticello", "America/La_Paz", "America/Lima", "America/Los_Angeles", "America/Maceio", "America/Managua", "America/Manaus", "America/Martinique", "America/Matamoros", "America/Mazatlan", "America/Menominee", "America/Merida", "America/Metlakatla", "America/Mexico_City", "America/Miquelon", "America/Moncton", "America/Monterrey", "America/Montevideo", "America/Nassau", "America/New_York", "America/Nipigon", "America/Nome", "America/Noronha", "America/North_Dakota/Beulah", "America/North_Dakota/Center", "America/North_Dakota/New_Salem", "America/Ojinaga", "America/Panama", "America/Pangnirtung", "America/Paramaribo", "America/Phoenix", "America/Port_of_Spain", "America/Port-au-Prince", "America/Porto_Velho", "America/Puerto_Rico", "America/Punta_Arenas", "America/Rainy_River", "America/Rankin_Inlet", "America/Recife", "America/Regina", "America/Resolute", "America/Rio_Branco", "America/Santarem", "America/Santiago", "America/Santo_Domingo", "America/Sao_Paulo", "America/Scoresbysund", "America/Sitka", "America/St_Johns", "America/Swift_Current", "America/Tegucigalpa", "America/Thule", "America/Thunder_Bay", "America/Tijuana", "America/Toronto", "America/Vancouver", "America/Whitehorse", "America/Winnipeg", "America/Yakutat", "America/Yellowknife", "Antarctica/Casey", "Antarctica/Davis", "Antarctica/DumontDUrville", "Antarctica/Macquarie", "Antarctica/Mawson", "Antarctica/Palmer", "Antarctica/Rothera", "Antarctica/Syowa", "Antarctica/Troll", "Antarctica/Vostok", "Asia/Almaty", "Asia/Amman", "Asia/Anadyr", "Asia/Aqtau", "Asia/Aqtobe", "Asia/Ashgabat", "Asia/Atyrau", "Asia/Baghdad", "Asia/Baku", "Asia/Bangkok", "Asia/Barnaul", "Asia/Beirut", "Asia/Bishkek", "Asia/Brunei", "Asia/Chita", "Asia/Choibalsan", "Asia/Colombo", "Asia/Damascus", "Asia/Dhaka", "Asia/Dili", "Asia/Dubai", "Asia/Dushanbe", "Asia/Famagusta", "Asia/Gaza", "Asia/Hebron", "Asia/Ho_Chi_Minh", "Asia/Hong_Kong", "Asia/Hovd", "Asia/Irkutsk", "Asia/Jakarta", "Asia/Jayapura", "Asia/Jerusalem", "Asia/Kabul", "Asia/Kamchatka", "Asia/Karachi", "Asia/Kathmandu", "Asia/Khandyga", "Asia/Kolkata", "Asia/Krasnoyarsk", "Asia/Kuala_Lumpur", "Asia/Kuching", "Asia/Macau", "Asia/Magadan", "Asia/Makassar", "Asia/Manila", "Asia/Nicosia", "Asia/Novokuznetsk", "Asia/Novosibirsk", "Asia/Omsk", "Asia/Oral", "Asia/Pontianak", "Asia/Pyongyang", "Asia/Qatar", "Asia/Qyzylorda", "Asia/Riyadh", "Asia/Sakhalin", "Asia/Samarkand", "Asia/Seoul", "Asia/Shanghai", "Asia/Singapore", "Asia/Srednekolymsk", "Asia/Taipei", "Asia/Tashkent", "Asia/Tbilisi", "Asia/Tehran", "Asia/Thimphu", "Asia/Tokyo", "Asia/Tomsk", "Asia/Ulaanbaatar", "Asia/Urumqi", "Asia/Ust-Nera", "Asia/Vladivostok", "Asia/Yakutsk", "Asia/Yangon", "Asia/Yekaterinburg", "Asia/Yerevan", "Atlantic/Azores", "Atlantic/Bermuda", "Atlantic/Canary", "Atlantic/Cape_Verde", "Atlantic/Faroe", "Atlantic/Madeira", "Atlantic/Reykjavik", "Atlantic/South_Georgia", "Atlantic/Stanley", "Australia/Adelaide", "Australia/Brisbane", "Australia/Broken_Hill", "Australia/Currie", "Australia/Darwin", "Australia/Eucla", "Australia/Hobart", "Australia/Lindeman", "Australia/Lord_Howe", "Australia/Melbourne", "Australia/Perth", "Australia/Sydney", "Europe/Amsterdam", "Europe/Andorra", "Europe/Astrakhan", "Europe/Athens", "Europe/Belgrade", "Europe/Berlin", "Europe/Brussels", "Europe/Bucharest", "Europe/Budapest", "Europe/Chisinau", "Europe/Copenhagen", "Europe/Dublin", "Europe/Gibraltar", "Europe/Helsinki", "Europe/Istanbul", "Europe/Kaliningrad", "Europe/Kiev", "Europe/Kirov", "Europe/Lisbon", "Europe/London", "Europe/Luxembourg", "Europe/Madrid", "Europe/Malta", "Europe/Minsk", "Europe/Monaco", "Europe/Moscow", "Europe/Oslo", "Europe/Paris", "Europe/Prague", "Europe/Riga", "Europe/Rome", "Europe/Samara", "Europe/Sarajevo", "Europe/Saratov", "Europe/Simferopol", "Europe/Sofia", "Europe/Stockholm", "Europe/Tallinn", "Europe/Tirane", "Europe/Ulyanovsk", "Europe/Uzhgorod", "Europe/Vienna", "Europe/Vilnius", "Europe/Volgograd", "Europe/Warsaw", "Europe/Zaporozhye", "Europe/Zurich", "Indian/Chagos", "Indian/Christmas", "Indian/Cocos", "Indian/Kerguelen", "Indian/Mahe", "Indian/Maldives", "Indian/Mauritius", "Indian/Reunion", "Pacific/Apia", "Pacific/Auckland", "Pacific/Bougainville", "Pacific/Chatham", "Pacific/Chuuk", "Pacific/Easter", "Pacific/Efate", "Pacific/Enderbury", "Pacific/Fakaofo", "Pacific/Fiji", "Pacific/Funafuti", "Pacific/Galapagos", "Pacific/Gambier", "Pacific/Guadalcanal", "Pacific/Guam", "Pacific/Honolulu", "Pacific/Kiritimati", "Pacific/Kosrae", "Pacific/Kwajalein", "Pacific/Majuro", "Pacific/Marquesas", "Pacific/Nauru", "Pacific/Niue", "Pacific/Norfolk", "Pacific/Noumea", "Pacific/Pago_Pago", "Pacific/Palau", "Pacific/Pitcairn", "Pacific/Pohnpei", "Pacific/Port_Moresby", "Pacific/Rarotonga", "Pacific/Tahiti", "Pacific/Tarawa", "Pacific/Tongatapu", "Pacific/Wake", "Pacific/Wallis"];
exports.module_head = `<div class="content_name">
                <h2>TimeZone</h2>
                <p>Configure your system timezone!</p>
            </div>`





var current_timezone = {
	area : null,
	zone : null
};

get_current_timezone();

exports.change_timezone = function (params,callback){
    if(params['area']&&params['zone']&&options.includes(`${params['area']}/${params['zone']}`)){
        set_timezone(`${params['area']}/${params['zone']}`,(success,proc_data)=>{
            let response = (success)?`Timezone is now : ${params['area']}/${params['zone']}`:proc_data.toString();
            callback ( response )
        })
    }else{
        callback(JSON.stringify(params) + "is not a valid timezone");	
    }
}

function parse_tz(s){
	let z = s.replace(/\s/g,"").split("/");
	return({area :z[0],zone :z[z.length-1]});
}

function get_current_timezone(){
	cp.exec("cat /etc/timezone", (e,stdout,stderr)=>{
		if(e){
			current_timezone = {area :"N/A (error)",zone :"N/A (error)"};
		}
		else{
			current_timezone = parse_tz(stdout);
		}
	});
}

function set_timezone(tz,cb){
	cp.exec(`sudo /bin/sh ${__dirname}/settime.sh ${tz}`,handle);
	function handle(e,stdout,stderr){
		let regtest = new RegExp(tz,"i");
		if(e){cb(false,e)}
		else if(regtest.test(stderr)){
			current_timezone = parse_tz(tz);
			cb(true,stderr)
		}
		else{
			cb(false,"Error : failed to set Timezone to " + tz + "\n( "+stdout+" )")
		}
	}
}

exports.make_html = make_html;
function make_html(){
    return `
    
    <form id ="tz" action="/" method="post"> 
        <button type="submit">Set</button><br>
        <input type = "hidden" name="target_module" value="${module.exports.title}" >
        <input type = "hidden" name="target_command" value="change_timezone" >
    </form>
    
    <script>
    (function(){
        
        current_timezone = ${JSON.stringify(current_timezone)};
        const options = ${JSON.stringify(options)};
        
        let list = tz_list();
        let select_global = document.createElement("div");
        select_global.classList.add("total_select");
        let zone_global = document.createElement("div");
        zone_global.classList.add("global_select");
        

        let zone_label = document.createElement("label"); zone_label.innerText = "Zone :"; zone_label.for = "zone"
        let zone_selector = document.createElement("select");
        let zone_div = document.createElement("div");
        zone_global.append(zone_label, zone_div);
        zone_div.classList.add("select")
        zone_div.append(zone_selector);
        zone_selector.name = "zone";
        
        let area_global = document.createElement("div");
        area_global.classList.add("global_select");
        let area_label = document.createElement("label"); area_label.innerText = "Area :"; area_label.for = "area"
        let area_selector = document.createElement("select");
        let area_div = document.createElement("div");
        area_global.append(area_label, area_div);
        select_global.append(area_global, zone_global);
        area_div.classList.add("select")
        area_selector.name = "area";
        area_selector.onchange = pop_zone;
        area_div.append(area_selector);
        document.getElementById("tz").prepend(select_global);
        for(let i in list){
            let option = document.createElement("option");
            option.value = option.innerText = i ;
            area_selector.append(option);
            if(list[i].selected){
                area_selector.value = i;
            }
        }
        pop_zone();
        
        function pop_zone(){
            zone_selector.innerHTML = "";
            let a = list[area_selector.value]["zones"];
            for( let i in a){
                let option = document.createElement("option");
                option.value = option.innerText = i ;
                zone_selector.append(option)
                if(a[i]){
                    zone_selector.value = i;
                }
            }
        }
        
        function tz_list() {
            let areas = {};
                while (options.length) {
                    let o = options.shift().split("/"),
                    c_zone = (o[o.length - 1]),
                    c_area = o[0];
                    if (areas[c_area]) {
                        areas[c_area].zones[c_zone] = (c_zone == current_timezone.zone);
                    } else {
                        areas[c_area] = {
                            selected: (c_area == current_timezone.area),
                            zones: {}
                        }
                        areas[c_area].zones[c_zone] = (c_zone == current_timezone.zone);
                    }
                }
            return (areas);
        }
    })()
    </script>
`
}