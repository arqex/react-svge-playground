var utils = require('../utils');

module.exports = function( freezer ){
  freezer.on( 'moveElement', function( e ){
    var data = freezer.get(),
      elements = Object.keys( data.moving )
    ;

    elements.forEach( function( elementId ){
			var element = freezer.get().moving[ elementId ],
        difference = {}
      ;

      if( element.type == 'path' ){
  			element.selectedOrigin.set({
  				x: element.selectedOriginPoint.x + e.canvasX - element.moveOrigin.x,
  				y: element.selectedOriginPoint.y + e.canvasY - element.moveOrigin.y
  			});
      }
      else if( element.type == 'point' ){
        element.selectedOrigin.set({
  				x: element.selectedOriginPoint.x + e.canvasX - element.moveOrigin.x,
  				y: element.selectedOriginPoint.y + e.canvasY - element.moveOrigin.y
  			});

        if( element.nextPoint && element.nextPoint.x != 'end' ){
          element = freezer.get().moving[ elementId ];
          element.nextPoint.set({
    				x: element.nextPointOrigin.x - e.canvasX + element.moveOrigin.x,
    				y: element.nextPointOrigin.y - e.canvasY + element.moveOrigin.y
          });
        }
      }
		});
  });
};
