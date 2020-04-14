
var isMapShowed = true;
var access_token = "pk.eyJ1IjoibGlua2hhIiwiYSI6ImNqYW1qMnZ0MTQza3gzN3FtZWc0YnVkcjAifQ.u9VeqQqwBkvkSoqTaKqfBQ"

//TODO responsive, buttom bar, legend

var southWest = L.latLng(-89.98155760646617, -180);
var northEast = L.latLng(89.99346179538875, 180);
var bounds = L.latLngBounds(southWest, northEast);

var geoDir = "../simplemap.json"
var dataDir = "../team_statistics.json"
var geoJson;
var info = document.getElementById("infoTest");
var zoom = 2;
var view = [25, 0]
var map = L.map('countryMap', { zoomControl: false }).setView(view, zoom);
var cercleMap = L.map('countryScale', { zoomControl: false, crs: L.CRS.Simple }).setView(view, 1);

disableZoon(cercleMap);
disableZoon(map);

var svg;
var label;

var feature;
var soocer;
var countries;

var mapContainer = document.getElementById("countryMap")
var slider = document.getElementById("myRange");
var output = document.getElementById("demo");
output.innerHTML = slider.value;
currentYear = slider.value;

var rect = document.getElementById('countryScale').getBoundingClientRect();

var margin = { top: 20, right: 100, bottom: 0, left: 20 };
var width = rect.width - margin.left - margin.right;
height = rect.height - margin.top - margin.bottom;


var selector = document.getElementById("selector");
var xSelector = document.getElementById("x-selector");
var ySelector = document.getElementById("y-selector");
selector.style.visibility = 'hidden';

var selectorFunc = { "Points": getPoints, "Goals": getGoals, "Yellow Cards": getYelloGards, "Goals Against": getGoalsAgainst, "Victories": getVictories, "Played Matches": getMatchesPlayed };

xfunction = getPoints;
yfunction = getGoals;

var currentTap = "Attendance";

var transform = d3.geoTransform({ point: projectPoint });
var path1 = d3.geoPath().projection(transform);


var transform2 = d3.geoTransform({ point: projectCercle });
var path2 = d3.geoPath().projection(transform2);

var inicialBox = {};
var dataSet;
var statistics;

var maxY = 80;
var maxX = 80;

var epsilon = 1

var yScale = d3.scaleLog()
	.domain([epsilon, 255])
	.range([rect.height, 40]);

var xScale = d3.scaleLog()
	.domain([epsilon, 250])
	.range([0, rect.width - 50]);

var attScale = d3.scaleSequential()
	.domain([0, 20])
	.interpolator(d3.interpolateRgb.gamma(2.2)("lightgreen", "green"));

var hostScale = d3.scaleThreshold()
	.domain(d3.range(0, 5))
	.range(d3.schemeBlues[4]);

var winnerScale = d3.scalePow(2)
	.domain([1, 5])
	.range([0.4, 1.2]);

var xOffset = 30;
var yOffset = -20;

xAxis = d3.axisBottom(xScale)
	.tickFormat(function (d) { return Math.round(d - 1); });

yAxis = d3.axisLeft(yScale)
	.tickFormat(function (d) { return Math.round(d - 1); });

d3.json(geoDir, function (data) {
	dataSet = data;
	console.log(dataSet);

	d3.json(dataDir, function (statData) {
		statistics = statData
		console.log(statistics);
		showMap(statistics);
	})
});

function disableZoon(map) {
	map.scrollWheelZoom.disable();
	map.dragging.disable();
	map.touchZoom.disable();
	map.doubleClickZoom.disable();
	map.scrollWheelZoom.disable();
	map.invalidateSize();

}


function axes(svg) {
	label = svg.append("g")
		.attr("class", "axis")
		.style("opacity", 0)
	label.append("g")
		.attr("class", "x-axis")
		.attr("transform", "translate(" + xOffset + "," + height + ")")
		.call(xAxis)

	// y-axis
	label.append("g")
		.attr("class", "y-axis")
		.attr("transform", "translate(" + xOffset + "," + yOffset + ")")
		.call(yAxis)
}

function onChangeX() {
	var currentvalue = xSelector.value;

	if (currentvalue in selectorFunc) {
		xfunction = selectorFunc[currentvalue];
		translateAll(centerBBox)
	}
}

function onChangeY() {
	var currentvalue = ySelector.value;

	if (currentvalue in selectorFunc) {
		yfunction = selectorFunc[currentvalue];
		translateAll(centerBBox)
	}
}

function onClick(event) {
	event.preventDefault();

	selected = document.getElementsByClassName("selected");
	var lasTab = selected[0].innerHTML;


	selected[0].className = selected[0].className.replace("selected", "back");
	event.currentTarget.className = "selected"
	currentTap = event.currentTarget.innerHTML;

	if (lasTab == 'Bubble' && currentTap != 'Bubble') {
		originalPosition();
	}

	else if (lasTab != 'Bubble' && currentTap == 'Bubble') {
		toBubbles();
	}

	else if (currentTap != lasTab) {
		toColors();
	}

}

function toColors() {
	feature.transition()
		.duration(1000)
		.style("fill", choropleth)
}

function toMap() {

	soocer.transition()
		.duration(2000)
		.attr("d", function (d, i) {
			return path1(tocountries(d.geometry))
		})
}

function played(id) {
	return id in statistics
}

function addAxis() {
	label.transition()
		.duration(1000)
		.style("opacity", 1)
	selector.style.visibility = "visible"
}

function deleteAxis() {
	label.transition()
		.duration(1000)
		.style("opacity", 0)
	selector.style.visibility = "hidden"
}

function toBubbles() {
	addAxis()
	hideBackMap();

	countries = feature
		.filter((d) => {
			return !played(d.id)
		})

	countries.transition()
		.duration(1000)
		.style("opacity", 0)
		.on("end", function () {
			this.style.visibility = "hidden"
		})

	soocer = feature
		.filter((d) => {
			cumPoints[d.id] = {}
			return played(d.id)
		})
		.style("fill", (d) => {
			var isoCode = statistics[d.id]['isoCode']
			return "url(#country-squared/" + isoCode + ")"
		})


	soocer.transition()
		.duration(1000)
		.attr("d", (d, i) => {
			var trans = path2(tocercles(d.geometry))
			return trans
		})
		.on("end", function (d) {
			var sel = d3.select(this);
			sel.transition()
				.duration(2000)
				.attr("transform", function (doom) {
					var elem = this.getBBox();
					return translate(d, elem, memBBox)
				})
		})
}

function wonMatch(teamCode, matches, matchesNumber) {
	return (matches.HomeScore[matchesNumber] > matches.AwayScore[matchesNumber]
		&& matches.HomeCode[matchesNumber] == teamCode)
		||
		(matches.HomeScore[matchesNumber] < matches.AwayScore[matchesNumber]
			&& matches.AwayCode[matchesNumber] == teamCode);
}

function getWinners(code, year) {
	var points = 0;
	var matches = year.matches;
	var len = matches.Description.length;

	if (matches.Description.includes("Final")) {
		var last = matches.AwayScore.length - 1;
		if (wonMatch(code, matches, last))
			points++;
	}

	else if (matches.Description[len - 1].startsWith("Final") && code == "URU") {
		points++;
	}

	return points;
}

function getGoalsAgainst(code, year) {
	var points = 0;
	var teamGoals = year.teamgoals;

	for (var i = 0; i < teamGoals.GoalsAgainst.length; i++) {
		points += teamGoals.GoalsAgainst[i]
	}

	return points;
}

function getVictories(code, year) {
	var points = 0;
	var matches = year.matches;
	for (var i = 0; i < matches.HomeScore.length; i++) {
		if (wonMatch(code, matches, i)) {
			points += 1
		}
	}
	return points;
}

function getMatchesPlayed(code, year) {
	var points = 0;
	var teams = year.teamcards;

	for (var i = 0; i < teams.MatchesPlayed.length; i++) {
		points += teams.MatchesPlayed[i]
	}
	return points
}

function getYelloGards(code, year) {
	var points = 0;
	var cards = year.teamcards;

	for (var i = 0; i < cards.YellowCards.length; i++) {
		points += cards.YellowCards.length;
	}

	return points;
}


function getGoals(code, year) {
	var totalGoals = year.teamgoals;
	var points = 0;
	for (var i = 0; i < totalGoals.Goals.length; i++) {
		points += totalGoals.Goals[i]
	}
	return points
}

function getPoints(code, year) {
	var points = 0;
	var matches = year.matches
	for (var i = 0; i < matches.HomeScore.length; i++) {
		if (matches.HomeScore[i] == matches.AwayScore[i]) {
			points += 1
		}
		else if (wonMatch(code, matches, i)) {
			points += 3
		}
	}
	return points
}


function pointforYear(country, code, getPoint) {
	var points = 0;
	for (var year in country) {
		if (year <= currentYear) {
			points += getPoint(code, country[year])
		}
	}
	return points
}

function goneTrans(d) {
	if (feature.properties.name.startsWith('U'))
		return d3.transition().duration(500).opacity(0);
}

function style(d, fillFunction) {
	update(d.properties);

	var style = {
		weight: 1,
		stroke: 'rgb(102, 102, 102)',
		color: 'rgb(102, 102, 102)',
		dashArray: '1',
		fillOpacity: 0.7,
		"stroke-width": 1,
	};

	if (currentTap != "Bubble")
		style["fill"] = choropleth(d)


	return style;
}

function highlightFeatureStyle(d) {
	var style = {
		"stroke": 'grey',
		"color": '#666',
		"width": 5,
		"opacity": 1,
		"fillOpacity": 1
	};
	if (currentTap != "Bubble")
		style["fill"] = "grey"

	else {
		style["stroke-width"] = 2
	}

	update(d.properties, d.id);
	return style;

}

function highlightFeature(e) {
	var layer = e.target;

	layer.setStyle(highlightFeatureStyle(layer.feature));

	if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
		layer.bringToFront();
	}
}

function changeMap(leafMap, staticMap) {
	staticMap.display = isMapShowed ? "block" : "none";
	leafMap.display = isMapShowed ? "none" : "block";
	isMapShowed = !isMapShowed;
}

function resetHighlight(e) {
	geoJson.resetStyle(e.target);
	update("")
}

function onEachFeature(feature, layer) {
	layer.on({
		mouseover: highlightFeature,
		mouseout: resetHighlight
	});
}

function bigCercle(coord, radius) {
	var coordinates = getCercle(coord, radius);

	p = { 'type': 'Polygon', 'coordinates': [coordinates] }
	return p;
}

function tocercles(coord) {
	var coordinates = getCercle(getMax(coord.coordinates));

	p = { 'type': 'Polygon', 'coordinates': [coordinates] }
	return p;
}

function tocountries(coord) {
	var coordinates = getMax(coord.coordinates)

	p = { 'type': 'Polygon', 'coordinates': [coordinates] }
	return p;
}

function togeo(coord) {
	return path(corrd)
}

function loadMap() {

}

attendance = {}

function getYears(years) {
	var count = 0;
	for (var i = 0; i < years.length; i++) {
		if (years[i] <= currentYear)
			count++;
	}
	return count;
}

function choropleth(d) {
	var choro = "rgb(214, 214, 214)"
	if (currentTap == "Attendance") {
		if (d.id in statistics) {
			var years = getYears(Object.keys(statistics[d.id].years));
			attendance[d.id] = years;
			if (years > 0)
				choro = attScale(years);
			// choro = winnerScale(years);
			// choro = hostScale(years);
		}
	}
	else if (currentTap == "Hosts") {
		if (d.id in statistics) {
			var hostYears = getYears(statistics[d.id].host);

			if (hostYears > 0) {
				choro = hostScale(hostYears);
			}
		}
	}
	return choro
}

function addLayers() {
	g = d3.select(".countries")

	flags = [];
	for (id in statistics) {
		flags.push(statistics[id].isoCode)
	}

	var dfs = g.append("defs")

	dfs.selectAll(".patterns")
		.data(flags, (d) => {
			return d
		})
		.enter().append("pattern")
		.attr("id", (d) => {
			return "country-squared/" + d
		})
		.attr("width", 1)
		.attr("height", 1)
		.append("svg:image")
		.attr("xlink:href", (d) => {
			return "./country-squared/" + d.toLowerCase() + ".svg";
		})
		.attr("width", 40)
		.attr("height", 40);

	feature = g.selectAll("path")
		.data(dataSet.features)
		.enter()
		.append("path")
		.attr("position", "relative")
		.styles((d) => {
			return style(d, choropleth)
		})
		.style("opacity", 0)

	feature.transition()
		.duration(3000)
		.style("opacity", 1);

	feature.attr("d", (d) => {
		return path1(tocountries(d.geometry))
	})

		.on("mouseover", (d, i) => {
			var selection = d3.select(this)
			selection.styles(function () { highlightFeatureStyle(d) });
		})
		.on("mouseout", (d, i) => {
			d3.select(this).styles(function () { style(d) });
		})
		.on("click", (d, i) => {

			// let iframeWindow = document.getElementById('stats_iframe').contentWindow;

			// if (d.id in statistics) {
			// 	iframeWindow.go(d.id, currentYear);
			// }

			// $('html, body').animate({scrollTop: $('#four').offset().top + 55}, 1000);

			var selection = d3.select(this)
			selection.styles(function () { highlightFeatureStyle(d) });
		});

}

function showMap(dataSet) {
	showBackMap();
	L.tileLayer('https://api.mapbox.com/styles/v1/linkha/' +
		'cjamltxvc16k22sn1ap20xzfl/tiles/256/{z}/{x}/{y}?' +
		'access_token=' + access_token, {
		id: 'mapbox://styles/linkha/cjamqpkv71b3s2sn1g0bov8xt',
		tileSize: 256,
		minZoom: 2,
		maxZoom: 2,
		maxBounds: bounds

	}).addTo(map);

	map.setMaxBounds(bounds);


	svg = d3.select("#countryScale")
		.append("svg")
		.attr("preserveAspectRatio", "xMinYMin meet")

	var g = svg.append("g")
		.attr("class", "countries");

	addLayers();
	axes(svg)

	slider.oninput = function () {
		// TODO
		// currentYear = ;
		// output.innerHTML = ;
		currentYear = slider.value;
		output.innerHTML = currentYear;
		if (currentTap == "Bubble")
			translateAll(centerBBox);
		else {
			toColors();
		}
	}
}

function centerBBox(d, elem) {
	var cx = elem.x + elem.width / 2;
	var cy = elem.y + elem.height / 2;

	return [cx, cy];
}

function memBBox(d, elem) {
	inicialBox[d.id] = elem;

	return centerBBox(d, elem)
}

var cumPoints = {};

function scalefunc(d) {
	var stat = statistics[d.id]["years"];
	var nbWins = pointforYear(stat, d.id, getWinners);
	var scale = winnerScale(nbWins + 1)
	cumPoints[d.id]["Win"] = nbWins;

	return scale
}

function translateAll(getBox) {
	soocer.transition()
		.duration(2000)
		.attr("transform", function (d, i) {
			var elem = this.getBBox();
			return translate(d, elem, centerBBox);
		})
}

function translate(d, elem, getBBox) {

	var pathx = rect.width / maxX;
	var pathy = rect.height / maxY;

	var country = statistics[d.id]['years'];

	var ypoints = pointforYear(country, d.id, yfunction);
	var xpoints = pointforYear(country, d.id, xfunction);

	cumPoints[d.id]["x"] = xpoints;
	cumPoints[d.id]["y"] = ypoints;

	var center = getBBox(d, elem)

	var rectX = 0;
	var rectY = rect.height;

	var xvalue = xScale(xpoints + 1);
	var yvalue = yScale(ypoints + 1);

	x = - center[0] + xvalue;
	y = - center[1] + yvalue;


	var scale = scalefunc(d)
	var scalex = scale, scaley = scale;

	var saclestr = scalex + ',' + scaley;
	var tx = -center[0] * (scalex - 1) + x + xOffset;
	var ty = -center[1] * (scaley - 1) + y + yOffset;

	return "translate(" + tx + "," + ty + "),scale(" + saclestr + ")"

}


function originalPosition() {
	soocer.transition()
		.duration(1000)
		.attr("transform", function (d, i) {
			box = inicialBox[d.id]

			var elem = this.getBBox();
			var cx = elem.x
			var cy = elem.y

			var x = box.x - cx
			var y = box.y - cy

			return "translate(" + x + "," + y + ")"
		}).transition()
		.duration(500)
		.style("fill-opacity", 0)

		.on("end", function () {
			//toMap();
			var selection = d3.select(this)
			selection.transition()
				.duration(1000)
				.attr("d", function (d, i) {
					return path1(tocountries(d.geometry))
				})
				.on("end", function (d) {
					var sel = d3.select(this)
					sel.transition()
						.duration(1000)
						.style("fill", choropleth)
						.style("fill-opacity", 1)
				})
		});

	countries
		.style("visibility", (d, i) => {
			return this.style.visibility = "visible"
		})
		.style("opacity", 0)
		.transition()
		.delay(3000)
		.duration(1000)
		.style("opacity", 1)
		.on("end", () => {
			showBackMap();
		});
	deleteAxis();
}

function projectPoint(x, y) {
	var point = map.latLngToLayerPoint(new L.LatLng(y, x));
	this.stream.point(point.x, point.y)
}

function projectCercle(x, y) {
	var point = cercleMap.latLngToLayerPoint(new L.LatLng(y, x));
	this.stream.point(point.x, point.y)
}

function update(props, id) {
	if (props && id) {
		//info.style.visibility = 'visible';
		info.innerHTML = '<h4>' + props.name + '</h4> '

		if (currentTap == "Bubble") {
			var xlabel = xSelector.value;
			var ylabel = ySelector.value;

			info.innerHTML += xlabel + ": " + cumPoints[id]["x"] +
				'<br>' + ylabel + ": " + cumPoints[id]["y"] +
				'<br>' + "win cups: " + cumPoints[id]["Win"]
		}

		else if (id in statistics) {
			var values;
			var presentation;
			if (currentTap == "Attendance") {
				value = Object.keys(statistics[id].years).length;
				info.innerHTML += '<b> Up to ' + currentYear + '</b>'
				info.innerHTML += '<b> Participated </b>' + attendance[id] + " times"
			}
			else {
				presentation = "World Cup Host up to " + currentYear + " in :"
				value = statistics[id].host;

				info.innerHTML += '<b>' + presentation + '</b>'
				for (v in value) {
					if (value[v] <= currentYear)
						info.innerHTML += '<p class=years>' + value[v] + '</p>'
				}
			}
		}
	}
	else {
		//info.visibility = 'hidden';
		info.innerHTML = '';
	}
};

function getMax(coord) {
	coordinates = coord
	circles = [];
	var max = 0;
	var maxCoords = [];

	for (var i = 0; i < coordinates.length; i++) {
		var coor = coordinates[i];
		if (coor.length == 1) {
			coor = coor[0];
		}
		if (max < coor.length) {
			maxCoords = coor;
			max = coor.length;
		}
	}

	//var p = {'type': 'Polygon', 'coordinates': [maxCoords] }
	return maxCoords;
}

function showBackMap() {
	mapContainer.classList.toggle("fadeIn");
	countryMap.style.visibility = 'visible'
}

function hideBackMap() {
	mapContainer.classList.toggle("fadeOut");
	countryMap.style.visibility = 'hidden'
}

function getCercle(coordinate, r) {
	var circle = [],
		length = 0,
		lengths = [length],
		polygon = coordinate,//[0],
		p0 = polygon[0],
		p1,
		x,
		y,
		i = 0,
		n = polygon.length;

	// Compute the distances of each coordinate.
	while (++i < n) {
		p1 = polygon[i];
		x = p1[0] - p0[0];
		y = p1[1] - p0[1];
		lengths.push(length += Math.sqrt(x * x + y * y));
		p0 = p1;
	}

	var radius = 5;
	var centroid = d3.polygonCentroid(polygon);
	var angleOffset = -2 * Math.PI;
	var angle = 0;
	var i = -1;
	var k = 2 * Math.PI / lengths[lengths.length - 1];

	// Compute points along the circle’s circumference at equivalent distances.
	for (i = 0; i < n; i++) {
		angle = angleOffset + lengths[i] * k;
		circle.push([
			centroid[0] + 2 * radius * Math.cos(angle),
			centroid[1] - 2 * radius * Math.sin(angle)
		]);
	}

	return circle;
}