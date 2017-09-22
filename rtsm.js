
/**
 * Real-time Traffic Speed Monitor of Motorways in Taiwan (RTSM)
 * A traffic data monitor for motorways in Taiwan.
 * @author Roy Lu
 * July 2017
 */

'use strict';

const TIMEOUT = 3000;
var midCache = null;		// Cache the mid argument
var isLoading = false;
var screenOffset = 0;


/**
 * Do the actual job that query data from the RTSM API service.
 * 
 * This function will send an old school XMLHttpReqeust to the RTSM API service to query data
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
	midCache = mid;		// save mid in cache for refresh
	
	// Display loading spinner and loading message
	document.getElementById('btnSearch').textContent = 'loading...';
	document.getElementById('loader').style.display = 'block';
	
	var url = "https://rtsmapi.royvbtw.uk/data/" + mid;
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.timeout = TIMEOUT;
	xhr.onload = function () {
		document.getElementById('btnSearch').textContent = 'search';
		document.getElementById('loader').style.display = 'none';
		isLoading = false;
		setSpeedData(mid, xhr);
	};
	xhr.ontimeout = function () {
		document.getElementById('btnSearch').textContent = 'search';
		document.getElementById('loader').style.display = 'none';
		isLoading = false;
		queryTimeoutHandler(mid);
	};
	xhr.onerror = function(){
		document.getElementById('btnSearch').textContent = 'search';
		document.getElementById('loader').style.display = 'none';
		isLoading = false;
		console.error("** An error occurred during the transaction");
	};
	xhr.send();
}


/**
 * Refresh page with previous query to RTSM api.
 * The motorwayId of previous query saved in midCache.
 * This function simply send the cached motorwayId to doSubmit().
 */
function refreshPage(){
	if(midCache){
		screenOffset = $(document).scrollTop();
		doSubmit(midCache);
	}
}


// A wrapper function for doSubmit()
function submit() {
	let m = document.getElementById("menu-motorways");
	let mid = m.options[m.selectedIndex].value;
	screenOffset = $("#trafficTable").offset().top;
	doSubmit(mid);
}


/**
 * Set up the speed data table in the main page.
 * 
 * This function will format the raw data into html layout.
 * @param {string} argName the section name
 * @param {string} argSpeedA SpeedA, this direction will be set in initTrafficTable().
 * @param {string} argSpeedB SpeedB, this direction will be set in initTrafficTable().
 */
function printSpeedData(argName, argSpeedA, argSpeedB) {
	const name = "<div class='d-name'>" + argName + "</div>";
	const speedA = "<div class='d-speed' data-value='" + argSpeedA + "'>" + argSpeedA + "</div>";
	const speedB = "<div class='d-speed' data-value='" + argSpeedB + "'>" + argSpeedB + "</div>";
	const row = "<div class='d-row'>" + name + speedA + speedB + "</div>";

	document.getElementById("trafficTable").innerHTML += row;
}


/**
 * Init the traffic table by motorway id and name
 * 
 * This function will init the corresponding labels and information for the table.
 * @param {string} mid Motorway ID.
 * @param {string} name Motorway name.
 * @param {string} direction The direction of the motorway
 */
function initTrafficTable(mid, name, direction) {
	const table = document.getElementById("trafficTable");
	table.innerHTML = '';

	// set page created time
	table.innerHTML += "<div class='time'>查詢時間:" + Date() + '<br/>'
			+ '<span class="motorwayName">' + name + '</span></div>';

	if (mid === undefined) {
		console.error("initTrafficTable(): mid is undefined.");
		table.innerHTML = "<div>請重新查詢. Please re-submit.</div>";
		return;
	}

	var row = "<div class='d-row'>";
	const nameElement = "<span class='d-name'>路段</span>";
	row += nameElement;
	if (direction === 0) {		// 0: N-S direction, 1: E-W direction.
		row += "<span class='direction-label'>南向</span><span class='direction-label'>北向</span>";
	} else if (direction === 1) {
		row += "<span class='direction-label'>東向</span><span class='direction-label'>西向</span>";
	} else {
		console.error("initTrafficTable(): An error happened when set the direction.");
	}
	row += '</div>';

	table.innerHTML += row;
}


/**
 * 
 * @param {string} mid The motorway id
 * @param {object} result A json data received from RTSM api
 */
function setSpeedData(mid, result) {
	const json = JSON.parse(result.responseText);
	initTrafficTable(mid, json.name, json.direction);	// reset speed data table
	
	const trafficData = json.traffic;		// it should be an array

	for (var i = 0; i < trafficData.length; i++) {
		let section = trafficData[i];
		printSpeedData(section.name, section.speedA, section.speedB);
	}

	setSpeedColor();
	
	// Scroll screen position to the table
	$("html body").animate({
		scrollTop: screenOffset
	}, 1000);
}


function setSpeedColor() {
	Array.from(document.getElementsByClassName("d-speed")).forEach(item => {
		if (item.dataset.value > 80) {
			item.classList.add("goodSpeed");
		} else if (item.dataset.value < 50) {
			item.classList.add("badSpeed");
		} else {
			item.classList.add("mediumSpeed");
		}
	});
}


// **Event listenters**
document.getElementById("btnRefresh").addEventListener("click", function () {
	refreshPage();
});

$('.tile-shortcut').click(function(){
	let mid = $(this).data('mid');
	screenOffset = $("#trafficTable").offset().top;
	doSubmit(mid);
});