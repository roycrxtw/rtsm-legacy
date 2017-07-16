
/**
 * Real-time Traffic Speed Monitor of Motorways in Taiwan (RTSM)
 * A traffic data monitor for motorways in Taiwan.
 * author Roy Lu
 * July 2017
 */

'use strict';

const TIMEOUT = 3000;
var argCache = '-1';	// store query args
var isLoading = false;
var screenOffset = 0;

/**
 * Do the actual job that query data from the official site.
 * This function will send a XMLHttpReqeust to the RTSM api service to query data
 * from the official site. And the return data will be sent to a callback
 * function setSpeedData() for further process.
 * 
 * @param {string} mid The motorway id
 */
function doSubmit(mid) {
	if(isLoading){
		return;
	}
	isLoading = true;
	argCache = mid;		// save mid in cache for refresh
	
	// display loader icon and disable buttons
	document.getElementById('btn-search').textContent = 'loading...';
	document.getElementById('loader').style.display = 'block';
	
	var url = "https://rtsmapi.royvbtw.uk/data/" + mid;
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
		console.error("** An error occurred during the transaction");
		isLoading = false;
	};
	xhr.send();

}

/**
 * Refresh page with previous query to RTSM api.
 * The motorwayId of previous query saved in argCache.
 * This function simply send the cached motorwayId to doSubmit().
 * 
 * @returns {undefined} void
 */
function refreshPage(){
	if(argCache !== '-1'){
		screenOffset = $(document).scrollTop();
		doSubmit(argCache);
	}
}

// Setup every args that doSumit needs.
function submit() {
	let m = document.getElementById("menu-motorways");
	let mid = m.options[m.selectedIndex].value;
	screenOffset = $("#speedDataTable").offset().top;
	doSubmit(mid);
}


// #todo-roy: timeout handler
function menuTimeoutHandler(mid) {
	// #todo
}


/**
 * Set up the speed data table in the main page.
 * 
 * This function will format the raw data into html layout.
 * @param {string} argName the section name
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
 * This function will init the corresponding labels and information 
 * for the table.
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
	} else if (direction === 1) {
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
	let json = JSON.parse(result.responseText);
	initSpeedDataTable(mid, json.name, json.direction);	// reset speed data table
	
	let trafficData = json.traffic;		// it should be an array

	for (var i = 0; i < trafficData.length; i++) {
		let section = trafficData[i];
		printSpeedData(section.name, section.speedA, section.speedB);
	}

	setSpeedColor();
	
	// set screen position to table
	$("html body").animate({
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