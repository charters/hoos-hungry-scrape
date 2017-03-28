var request = require('request');
var cheerio = require('cheerio');
var rp = require('request-promise');

function translateDateToNum(stringDay){
	var numberDay;
	switch(stringDay) {
		case 'Monday':
		numberDay = 0;
		break;
		case 'Tuesday':
		numberDay = 1;
		break;
		case 'Wednesday':
		numberDay = 2;
		break;
		case 'Thursday':
		numberDay = 3;
		break;
		case 'Friday':
		numberDay = 4;
		break;
		case 'Saturday':
		numberDay = 5;
		break;
		case 'Sunday':
		numberDay = 6;
		break;
	}
	return numberDay;
}

function convertHourToFloat(simpleTime) {
	if (simpleTime == 'Midnight') {
		return 24.00;
	}
	else {
		var timeWithColon = simpleTime.split(' ')[0];
		var timeNoColon = parseInt(timeWithColon.split(':')[0]) + (parseInt(timeWithColon.split(':')[1]) / 100);
		var meridiem = simpleTime.split(' ')[1];
		if(meridiem == 'am') {
			return timeNoColon;
		}
		else if (meridiem == 'pm') {
			return timeNoColon + 12.00;
		}
		else {
			console.log('Cannot understand this time: ' + simpleTime);
		}
	}
}

var getAllDiningUrls = function () {
	return new Promise(function(resolve, reject){

		var locationList = [];
		var baseUrl = 'http://virginia.campusdish.com';

		var options = {
			uri: 'http://virginia.campusdish.com/Locations.aspx',
			transform: function (body) {
				return cheerio.load(body);
			}
		};

		rp(options)
		.then(function ($) {

			$('#mainnavigation_0_RptNavigation_LnkItem_2').next().children().each(
				function(i, element){
					locationList.push({'url': baseUrl + $(this).children().attr('href'), 'id': i});
				});
			resolve(locationList);

		})
		.catch(function (err) {
			// Crawling failed or Cheerio choked...
			console.log(err);
		});
	});

}

var updateAllHoursOfOperation = function(urlList) {
	// Call getAllDiningUrls to get all of the URLs in an array
	// Add one to the index in the array to get the ID field for schema

	// For every item in the urlList
	for (k=0; k < urlList.length; k++) {

		var options = {
			uri: urlList[k].url,
			transform: function (body) {
				return cheerio.load(body);
			}
		};

		rp(options)
		.then(function ($) {
			// Process html like you would with jQuery...
			var location = $('head > title').text().toString().split('-')[0].trim();

			console.log("ALL HOURS FOR:" + location);
			console.log()
			$('.content-box').filter(function(i, elem){
				for (k = 0; k < elem.children.length; k++) {
					if (elem.children[k].type == 'text') {

						//EXAMPLE FORMATS
						//Monday-Thursday: 7:00 am - 8:00 pm
						//Friday: 7:00 am - 2:15 pm
						//Saturday: 10:00 am - 2:00 pm
						//Sunday: 10:00 am - 8:00 pm
						var dayHours = elem.children[k].data.trim();


						// If there is more than one hyphen in the string by comparing indices of "-"
						// Format: Monday-Friday: 8:00 am - 2:00 am

						if (dayHours.indexOf('-') != dayHours.lastIndexOf('-')){

							var multiDay = dayHours.split('-');
							// multiDay = ['firstDay', 'lastDay: 8:00am', '2:00 am']

							var firstDay = translateDateToNum(multiDay[0].trim());
							var lastDay = translateDateToNum(multiDay[1].split(":")[0].trim());



							if (! dayHours.includes('Closed')) {


								var hoursSplit = dayHours.split('-');
								var openTime = convertHourToFloat(hoursSplit[1].split(' ')[1] + ' ' + hoursSplit[1].split(' ')[2]);
								var closeTime = convertHourToFloat(hoursSplit[2].trim());

								// Back around list case; example Friday - Sunday

								if (lastDay == 0) {
									for (j=firstDay; j < 6; j++) {

										// Send to scaphold at this point?
										console.log("Dining Hall: " + location);
										console.log("Open Time: " + openTime);
										console.log("Closing Time: " + closeTime);
										console.log("Day of Week: " + j);
										console.log(" ");

										//sendToScaphold(j, openTime, closeTime, diningHallId, location);
										//jsonHours[j].push({ "name": location, "open": openTime, "close": closeTime});
									}
									console.log("Dining Hall: " + location);
									console.log("Open Time: " + openTime);
									console.log("Closing Time: " + closeTime);
									console.log("Day of Week: " + j);
									console.log(" ");
									//jsonHours[0].push({ "name": location, "open": openTime, "close": closeTime});

								}
								else {
									for (j=firstDay; j <= lastDay; j++){

										// send to scaphold at this point?
										console.log("Dining Hall: " + location);
										console.log("Open Time: " + openTime);
										console.log("Closing Time: " + closeTime);
										console.log("Day of Week: " + j);
										console.log(" ");
										//jsonHours[j].push({ "name": location, "open": openTime, "close": closeTime});

									}
								}
								// find the range of days and get open and close times
							}
							else {

								// don't add anything to our map?
							}
						}
						else {
							//String form: dayOfTheWeek: openTime (am/pm) - closeTime (am/pm)

							var daySplit = dayHours.split(':');

							// First element should be singular day of the week
							var dayOfTheWeek = daySplit[0];

							var dayNum = translateDateToNum(dayOfTheWeek);


							if (! dayHours.includes('Closed')) {
								var hoursSplit = dayHours.split('-');
								var openTime = hoursSplit[0].split(' ')[1] + ' ' + hoursSplit[0].split(' ')[2];
								var closeTime = hoursSplit[1].trim();

								//Send to scaphold at this point?
								//sendToScaphold()

								console.log("Dining Hall: " + location);
								console.log("Open Time: " + convertHourToFloat(openTime));
								console.log("Closing Time: " + convertHourToFloat(closeTime));
								console.log("Day of Week: " + dayNum);
								console.log(" ");

								//jsonHours[dayNum].push({ "name": location, "open": openTime, "close": closeTime});
							}
							else {
								// something for when a dining hall is closed
								console.log("It's closed");
							}
						}
					}
				}
			});

		})
		.catch(function (err) {
			// Crawling failed or Cheerio choked...
			console.log(err);
		});
	}
}

function parseDiningHours(hoursOfOperationRawString){

	// look at one hours listing line at a time

}

function sendToScaphold(dayOfWeek, openingHour, closingHour, diningHallId, diningHallName) {

	var options = {
    method: 'POST',
    uri: 'https://us-west-2.api.scaphold.io/graphql/hooshungry',
    body: {
			"query": "mutation CreateHoursOfOperation($input:CreateHoursOfOperationInput!){createHoursOfOperation(input: $input){changedEdge{node{id}}}}",
			"variables": {
				"input": {
			    "dayOfWeek": dayOfWeek,
			    "openingHour": openingHour,
			    "closingHour": closingHour,
			    "location": {
			      "id": diningHallId,
			      "name": diningHallName
	    		}
  			}
 			}
    },
    json: true // Automatically stringifies the body to JSON
	};

	rp(options)
	    .then(function (parsedBody) {
	        console.log("Made entry to " + diningHallName + "successfully.");
	    })
	    .catch(function (err) {
	        // POST failed...
	    });
}

getAllDiningUrls().then(updateAllHoursOfOperation);
