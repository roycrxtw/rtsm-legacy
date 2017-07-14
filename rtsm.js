// author: Roy Lu.
// date: 20170110

'use strict';

const TIMEOUT = 3000;
const SITE = "http://1968.freeway.gov.tw/";
var retries = 4;
var queryRetries = 4;
var argCache = [-1, -1, -1];	// store query args
var isLoading = false;
var count = 0;
var screenOffset = 0;

var motorways = {
	// mid, nameTw, nameEn, direction(0:N-S, 1:E-W)
	"10010": {nameTw: "國道1號", nameEn: "M1 Motorway", direction: 0},
	"10019": {nameTw: "國1高架", nameEn: "M1 Elevated Motorway", direction: 0},
	"10020": {nameTw: "國道2號", nameEn: "M2 Motorway", direction: 1},
	"10030": {nameTw: "國道3號", nameEn: "M3 Motorway", direction: 0},
	"10031": {nameTw: "國道3甲", nameEn: "M3A Motorway", direction: 1},
	"10038": {nameTw: "港西聯外道路", nameEn: "PH2F", direction: 0},
	"10039": {nameTw: "南港聯絡道", nameEn: "Nangang Junction", direction: 0},
	"10040": {nameTw: "國道4號", nameEn: "M4 Motorway", direction: 1},
	"10050": {nameTw: "國道5號", nameEn: "M5 Motorway", direction: 0},
	"10060": {nameTw: "國道6號", nameEn: "M6 Motorway", direction: 1},
	"10080": {nameTw: "國道8號", nameEn: "M8 Motorway", direction: 1},
	"10100": {nameTw: "國道10號", nameEn: "M10 Motorway", direction: 1},
	"20620": {nameTw: "快速公路62號", nameEn: "PH62 Expressway", direction: 1},
	"20640": {nameTw: "快速公路64號", nameEn: "PH64 Expressway", direction: 1},
	"20660": {nameTw: "快速公路66號", nameEn: "PH66 Expressway", direction: 1},
	"20680": {nameTw: "快速公路68號", nameEn: "PH68 Expressway", direction: 1},
	"20720": {nameTw: "快速公路72號", nameEn: "PH72 Expressway", direction: 1},
	"20740": {nameTw: "快速公路74號", nameEn: "PH74 Expressway", direction: 1},
	"20760": {nameTw: "快速公路76號", nameEn: "PH76 Expressway", direction: 1},
	"20780": {nameTw: "快速公路78號", nameEn: "PH78 Expressway", direction: 1},
	"20820": {nameTw: "快速公路82號", nameEn: "PH82 Expressway", direction: 1},
	"20840": {nameTw: "快速公路84號", nameEn: "PH84 Expressway", direction: 1},
	"20860": {nameTw: "快速公路86號", nameEn: "PH86 Expressway", direction: 1},
	"20880": {nameTw: "快速公路88號", nameEn: "PH88 Expressway", direction: 1}
};

/**
 * Do the actual job that query data from the official site.
 * This function will send a XMLHttpReqeust to the YQL service to query data
 * from the official site. And the return data will be sent to a callback
 * function setSpeedData() for further process.
 * 
 * @param {string} mid The motorway id
 * @returns {undefined} void
 */
function doSubmit(mid) {
	if(isLoading){
		return;
	}
	isLoading = true;
	console.log('count=', ++count);
	argCache[0] = mid;		// save arg to argCache
	
	// display loader icon and disable buttons
	document.getElementById('btn-search').textContent = 'loading...';
	document.getElementById('loader').style.display = 'block';
	
	var url = "http://royvbtw.uk:3003/data/" + mid;
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.timeout = TIMEOUT;
	xhr.onload = function () {
		document.getElementById('btn-search').textContent = 'search';
		document.getElementById('loader').style.display = 'none';
		isLoading = false;
		setSpeedData(mid, xhr);
	};
	xhr.ontimeout = function () {
		document.getElementById('btn-search').textContent = 'search';
		document.getElementById('loader').style.display = 'none';
		isLoading = false;
		queryTimeoutHandler(mid);
	};
	xhr.onerror = function(){
		document.getElementById('btn-search').textContent = 'search';
		document.getElementById('loader').style.display = 'none';
		console.log("** An error occurred during the transaction");
		isLoading = false;
	};
	xhr.send();

}

/**
 * Refresh page with previous query to YQL.
 * The arguments of previous query are saved in argCache array.
 * This function simply send the argCache array to doSubmit().
 * 
 * @returns {undefined} void
 */
function refreshPage(){
	if(argCache[0] !== -1){
		screenOffset = $(document).scrollTop();
		doSubmit(argCache[0]);
	}
}

// Setup every args that doSumit needs.
function submit() {
	queryRetries = 4;
	let m = document.getElementById("menu-motorways");
	let mid = m.options[m.selectedIndex].value;
	console.log("submit(): mid=" + mid);
	screenOffset = $("#speedDataTable").offset().top;
	doSubmit(mid);
}


// #todo-roy: timeout handler
function menuTimeoutHandler(mid) {
	//console.log("menuTimeoutHandler");
	retries--;
	if (retries > 0) {
		// #todo-roy
	} else {
		console.error("bye bye.");
	}
}


/**
 * Set up the speed data table in the main page.
 * 
 * This function will format the raw data into html layout.
 * @param {string} argName Junction name
 * @param {string} argSpeedA SpeedA, this direction will be set in
 *	initSpeedDataTable().
 * @param {string} argSpeedB SpeedB, this direction will be set in
 *	initSpeedDataTable().
 * @returns {undefined} void
 */
function printSpeedData(argName, argSpeedA, argSpeedB) {
	var name = "<div class='d-name'>" + argName + "</div>";
	var speedA = "<div class='d-speed' data-value='" + argSpeedA + "'>" + argSpeedA + "</div>";
	var speedB = "<div class='d-speed' data-value='" + argSpeedB + "'>" + argSpeedB + "</div>";
	var row = "<div class='d-row'>" + name + speedA + speedB + "</div>";

	document.getElementById("speedDataTable").innerHTML += row;
}


/**
 * Init the speed data table by motorway id(mid)
 * 
 * This function will search the motorways object and set the corresponding
 * information to the table by the given mid.
 * @param {string} mid Motorway ID.
 * @param {string} name Motorway name.
 * @param {string} direction The direction of the motorway
 * @returns {undefined} void
 */
function initSpeedDataTable(mid, name, direction) {
	var table = document.getElementById("speedDataTable");
	table.innerHTML = '';

	// set page created time
	table.innerHTML += "<div class='time'>查詢時間:" + Date() + '<br/>'
			+ '<span class="motorwayName">' + name + '</span></div>';

	if (mid === undefined) {
		console.error("setTableDirection(): mid is undefined.");
		table.innerHTML = "<div>請重新查詢. Please re-submit.</div>";
		return;
	}

	var row = "<div class='d-row'>";
	var nameElement = "<span class='d-name'>路段</span>";
	row += nameElement;
	if (direction === 0) {		// 0: N-S direction, 1: E-W direction.
		row += "<span class='direction-label'>南向</span><span class='direction-label'>北向</span>";
	} else if (motorways[mid].direction === 1) {
		row += "<span class='direction-label'>東向</span><span class='direction-label'>西向</span>";
	} else {
		console.error("setTableDirection(): An error happened when set the direction.");
	}
	row += "</div>";

	table.innerHTML += row;
}

/**
 * 
 * @param {type} mid The motorway id
 * @param {type} result A json data received from RTSM api
 * @return {undefined}
 */
function setSpeedData(mid, result) {
	console.log("setSpeedData()");
	//console.log("rText.length=" + rText.length + ", rText=" + rText);
	
	let json = JSON.parse(result.responseText);
	console.log('json=', json);
	// #todo-roy: add result.direction to api
	initSpeedDataTable(mid, json.name, 0);	// reset speed data table
	
	let trafficData = json.traffic;		// it should be an array
	console.log("trafficData.length=" + trafficData.length);

	for (var i = 0; i < trafficData.length; i++) {
		let section = trafficData[i];
		printSpeedData(section.name, section.speedA, section.speedB);
	}

	setSpeedColor();
	//console.log("Trying to show data table.");
	//document.querySelector("#speedDataTable").scrollIntoView({ behavior: 'smooth' });
	
	// set screen position to table
	console.log('screenOffset', screenOffset);
	$("html body").animate({
		//scrollTop: $("#speedDataTable").offset().top
		scrollTop: screenOffset
	}, 1000);
}

function setSpeedColor() {
	Array.from(document.getElementsByClassName("d-speed")).forEach(function (item) {
		if (item.dataset.value > 80) {
			item.classList.add("goodSpeed");
		} else if (item.dataset.value < 50) {
			item.classList.add("badSpeed");
		} else {
			item.classList.add("mediumSpeed");
		}
	});
}

// event listenters
document.getElementById("btnRefresh").addEventListener("click", function () {
	refreshPage();
});

$('.tile-shortcut').click(function(){
	let mid = $(this).data('mid');
	screenOffset = $("#speedDataTable").offset().top;
	doSubmit(mid);
});