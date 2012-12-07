// requestAnimationFrame Polyfill
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = 
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());


// ITN RFID Drawing
var monthHead = [],
	monthOrderMap = [1,2,3,4,5,6,7,8,9,10,11,12];

(function($) {
	var image = new Image(),
	imageWidth = 128,
	imageHeight = 128,
	backgroundImageSrc = 'img/map.svg';

	image.crossOrigin = ''; 
	image.src = 'img/marker.svg';


	var monthFromString = function(s) {
	  var bits = s.split(/[-T:]/g);

	  return bits[1];
	}

	// Marker class
	var RFIDMarker = function(eventToLoad, ctx) {
		var root = this;
		
		this.context = ctx;
		// this.maximumTotalPoints = 1000000;
		this.maximumTotalPoints = 973913;
		this.numBreakPoints = 9; // ignoring the first sprite which is used for zeroes
		this.alphaVal = 0;
		this.destroying = false;
		this.canBeDestroyed = false;
		this.monthOffset = 0;

		this.drawMarkerText = function(fontSize) {
			var letterSpacing = 1.5;
			root.context.textAlign = 'left';
			root.context.fillStyle = '#CD1D27'; 
			root.context.font = "bold "+ fontSize +"px 'bebas-neue', Helvetica, Arial, Verdana, sans-serif";
			
			// Remove everything that is not just the city name from LocationName
			var locationName = root.eventData.LocationName.split(',')[0].toUpperCase(),
				textXLocation = parseInt(root.eventData.LocationX) + 10,
				textYLocation = parseInt(root.eventData.LocationY) + (fontSize/2),
				textSize = root.context.measureText(locationName);


			// If text is going off screen, move it to the left of marker
			if( textSize.width + textXLocation > root.context.canvas.width ) {
				textXLocation -= textSize.width + 20;
			}

			// DOM DRAWING OPTION
				// var textDiv = document.createElement("div"),
				// 	locationText = document.createTextNode(locationName);;
				// textDiv.appendChild(locationText);

				// textDiv.setAttribute("class", "markerText");
				// textDiv.setAttribute("style", "position: absolute; left: " + textXLocation + "px;top: " + textYLocation + "px");

				// var mapDiv = document.getElementById('map');
				// mapDiv.appendChild(textDiv);
				
				// $(textDiv).css({position: 'absolute', left: textXLocation, top: textYLocation});
			// END DOM DRAWING
			

			// Check distance to other markers and move a bit if too close to others
			// for(var i=0; i<otherMarkers.length; i++) {
			// 	var markerVerticalDistance = parseInt(root.eventData.LocationY) - parseInt(otherMarkers[i].eventData.LocationY),
			// 		markerHorizontalDistance = parseInt(root.eventData.LocationX) - parseInt(otherMarkers[i].eventData.LocationX);

			// 	if(Math.abs(markerVerticalDistance) < 20 && Math.abs(markerHorizontalDistance) < 50) {
			// 		textXLocation -= textSize.width + 20;

			// 		if(markerVerticalDistance > 0) {
			// 			textYLocation -= 10;
			// 		}
			// 		else {
			// 			textYLocation += 10;
			// 		}
			// 	}
			// }

			// Letter spacing hack
	        var characters = String.split(locationName, ''),
	            index = 0,
	            current,
	            currentPosition = textXLocation,
	            align = 1;
	        
            var totalWidth = 0;

            for (var i = 0; i < characters.length; i++) {
                totalWidth += (root.context.measureText(characters[i]).width + letterSpacing);
            }
            
            currentPosition = textXLocation - (totalWidth / 2);
	        
	        while (index < locationName.length) {
	            current = characters[index++];
	            root.context.fillText(current, currentPosition, textYLocation);
	            currentPosition += (align * (root.context.measureText(current).width + letterSpacing));
	        }

			// Draw text
			// root.context.fillText(locationName, textXLocation, textYLocation);
			root.context.globalAlpha = 1;
		};

		// Private Methods
		var getSpriteOffsetX = function(totalTouchPoints) {
			var numTouchPoints = totalTouchPoints;

			// Creating breakpoints for offsets based on maximum amount and number of breakpoints. 
			// Scale the numPoints to 1, multiply up to amount of breakpoints, then round down to get breakpoint integer. 
			// Now multiply by the number of pixels in each sprite to create proper offset amount.
			var offsetSize = Math.floor( (numTouchPoints / root.maximumTotalPoints) * root.numBreakPoints) * imageWidth;
			offsetSize += (imageWidth * 1);
			// First image on the spritesheet is for special use
			return offsetSize;
		};

		var getSpriteOffsetY = function(currentStep) {
			var totalSteps = 9;

			return (currentStep * imageHeight) % (totalSteps * imageHeight);
		};

		// Public vars
		this.eventData = eventToLoad;

		this.currentAnimationStep = 0;
		this.spriteOffsetX = getSpriteOffsetX(root.eventData.TotalTouchPoints);
		this.spriteOffsetY = 0;

		// Public Methods
		this.animationStep = function() {
			this.spriteOffsetY = getSpriteOffsetY(root.currentAnimationStep);
			root.currentAnimationStep++;	
		};
		
		this.getAlphaVal = function() {
			var fadeSpeed = 0.1;
			var offsetLocation = (monthOrderMap[root.eventData.Month-1]) * 60 + 31;
			var offsetRange = 50;
			var currentOffset = $('#mapControls .scrollArea .scrollBar').position().left + $('#mapControls .scrollArea .scrollBar .scrollHandle').position().left;

			// SCALING FROM -1 to 1
			var alpha = ((currentOffset - (offsetLocation - offsetRange) ) / (offsetRange*2)) * 2 - 1;
			
			// LIMITS ARE -1 to 1
			if(alpha > 1) {
				alpha = 1;
			} else if(alpha < -1) {
				alpha = -1;
			}

			// FED INTO PARABOLIC FUNCTION (y = -x^2+1) centered around each month
			root.alphaVal = -Math.pow(alpha,2) + 1;

			return root.alphaVal;
		};
		
		this.draw = function(otherMarkers) {
			root.context.globalAlpha = root.getAlphaVal();
			
			if(root.context.globalAlpha == 0 && root.destroying) {
				root.canBeDestroyed = true;
			}

			if(this.alphaVal > 0) {
				root.context.drawImage(
					image, 
					root.spriteOffsetX, 
					root.spriteOffsetY,
					imageWidth,
					imageHeight,
					parseInt(root.eventData.LocationX) - (imageWidth / 2), 
					parseInt(root.eventData.LocationY) - (imageHeight / 2),
					imageWidth,
					imageHeight
				);
			}
			

			// Draw text on marker
			var fontSize = Math.floor( (root.eventData.TotalTouchPoints / root.maximumTotalPoints) * 3);
			switch(fontSize) {
				case 0:
					fontSize = 12;
					break;
				case 1:
					fontSize = 15;
					break;
				case 2:
					fontSize = 17;
					break;
				case 3:
					fontSize = 20;
					break;
				case 4:
					fontSize = 22;
					break;
				case 5:
					fontSize = 25;
					break;
				case 6:
					fontSize = 27;
					break;
				case 7:
					fontSize = 30;
					break;
				case 8:
					fontSize = 32;
					break;
				case 9:
					fontSize = 37;
					break;
			};

			root.drawMarkerText(fontSize);

		};

	};



	// Main class for map
	var RFIDMap = function() {
		this.WIDTH = 860;
		this.HEIGHT = 460;
		this.canvas = document.getElementById('RFIDMap');
		this.context = this.canvas.getContext('2d');

		this.markers = [];

		this.canvas.crossOrigin = ''; 
		this.canvas.width = this.WIDTH;  
		this.canvas.height = this.HEIGHT;

		this.backgroundImage = new Image();
		this.backgroundImage.src = backgroundImageSrc;

		// Immediately load in data from the server
		this.loadData(new Date().getMonth());
	};

	RFIDMap.prototype.draw = function() {
		this.context.clearRect(0,0, this.WIDTH, this.HEIGHT);
		this.context.drawImage(this.backgroundImage, 0,0);

		for(var i=0; i<this.markers.length; i++) {
			var marker = this.markers[i];

			if(marker.canBeDestroyed) {
				// Remove marker if it is marked for deletion
				this.markers.splice(i,1);
			} else {
				marker.draw(this.markers.slice(i,1));	
			}
			
		}
	};
	
	RFIDMap.prototype.changeMonth = function(month) {
		// clear up all the current markers by starting their 'removal' animation
		for(var i=0; i<this.markers.length; i++) {
			this.markers[i].destroying = true;
		}

		this.loadData(month);
	};

	RFIDMap.prototype.loadData = function(month) {
		var root = this,
			// http://www.bcard.net/services/itninttools.asmx/FetchStats?
			dataURL = 'serviceWrapper.php?service=months';
			root.markers = [];
			
		$.get(dataURL, function(data){
			var loadedEvents = $.xml2json(data).EventCount;

			for(var i=0; i<loadedEvents.length; i++) {
				loadedEvents[i].Month = monthFromString(loadedEvents[i].StartDate);

				root.markers.push( new RFIDMarker(loadedEvents[i], root.context) );
			}
		});

		// Load "total touch points"
		// http://www.bcard.net/services/itninttools.asmx/CurrentCount?
		dataURL = 'serviceWrapper.php?service=totalTouchPoints';
		$.get(dataURL, function(data){
			var totalTouchPoints = $.xml2json(data).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

			$('.totalTouchPoints p').text(totalTouchPoints);
		});
	};

	var map = new RFIDMap();

	// MAIN ANIMATION LOOP
	(function animloop(){
		window.requestAnimationFrame(animloop);
		map.draw();
	})();


	// CONTROLS
	
	var changeMonthDisplay = function(positionLeft){
		var scrollPositionLeft = positionLeft + $('#mapControls .scrollArea .scrollBar .scrollHandle').position().left;

		// Add selected month class (and adjacent months) dependent on the location of the scrollbar
		$.each($('#mapControls .months li'), function(i,month) {
			if(scrollPositionLeft > $(this).position().left && scrollPositionLeft < ($(this).position().left + $(this).width()) ) {
				if( !$(this).hasClass('selectedMonth') ) {
					$('#mapControls .months li').removeClass('selectedMonth');
					$('#mapControls .months li').removeClass('adjacentSelectedMonth');
					$('#mapControls .months li').removeClass('farAdjacentSelectedMonth');

					$(this).addClass('selectedMonth');
					$(this).prev('li').addClass('adjacentSelectedMonth');
					$(this).next('li').addClass('adjacentSelectedMonth');	
				}
			}
		});
	};


	$( "#mapControls .scrollArea .scrollBar" ).draggable({ 
		axis: "x", 
		cursor: "move",
		drag: function( event, ui ) {
			if(ui.position.left < -$('#mapControls .scrollArea .scrollBar .scrollHandle').position().left + 30) {
				ui.position.left = -$('#mapControls .scrollArea .scrollBar .scrollHandle').position().left + 30;
			}
			else if(ui.position.left > -17) {
				ui.position.left = -17;
			}

			changeMonthDisplay(ui.position.left);
		} });
	

	// Display of months in the control area
	var currentMonth = new Date().getMonth();

	$('#mapControls .months li').each(function(i){	
		var thisVal = $(this).val();

		if(thisVal == (currentMonth+1)) {
			$(this).text('NOW');
			$(this).addClass('selectedMonth');
			$('#mapControls .months').append('<p class="currentYear">' + new Date().getFullYear() + '</p>');

		} 
		else if(thisVal == currentMonth+2 || thisVal == currentMonth) {
			$(this).addClass('adjacentSelectedMonth');
		}
		
		if(thisVal > (currentMonth+1) ) {
			monthHead.push(this);
			$(this).remove();
		}
		if(thisVal == 12 && thisVal != currentMonth+1) {
			// Add the current year at year crossings
			var prevYear = new Date().getFullYear() - 1;
			$('#mapControls .months').append('<p class="prevYear">' + prevYear + '</p>');
		}
	});

	// Re-Order the months so 'NOW' is at the end.
	for(var i=(monthHead.length-1); i>=0; i--) {
		$('#mapControls .months').prepend(monthHead[i]);
	};

	$('#mapControls .months li').each(function(i){
		monthOrderMap[$(this).val()-1] = i;
	});

	// Position the previous year near the crossing AFTER it has been put in place (meaning, what happens above these lines)
	$('#mapControls .months .prevYear').css({left: $('.endYear').position().left + 50});
	console.log('posiiton: ', $('.endYear').position().left);

	$('#mapControls .months li').click(function(){
		$('#mapControls .months li').removeClass('selectedMonth');
		$('#mapControls .months li').removeClass('adjacentSelectedMonth');
		$('#mapControls .months li').removeClass('farAdjacentSelectedMonth');

		$(this).addClass('selectedMonth');
		$(this).prev('li').addClass('adjacentSelectedMonth');
		$(this).next('li').addClass('adjacentSelectedMonth');

		var positionLeft = $(this).position().left + 30 - $('#mapControls .scrollArea .scrollBar .scrollHandle').position().left;
		$('#mapControls .scrollArea .scrollBar').animate( {left: positionLeft }, {duration: 500} );
	});

})(jQuery);




