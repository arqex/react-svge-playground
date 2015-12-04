var utils = require('../utils');
var victor = require('victor');

module.exports = function( freezer ){
  freezer.on( 'moveElement', function( e ){
    var data = freezer.get(),
      elements = Object.keys( data.moving )
    ;

    elements.forEach( function( elementId ){
			var element = freezer.get().moving[ elementId ],
        newPos
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
      else if( element.type == 'bender' ){
        newPos = {
  				x: element.selectedOriginPoint.x + e.canvasX - element.moveOrigin.x,
  				y: element.selectedOriginPoint.y + e.canvasY - element.moveOrigin.y,
          lockedBenders: !!element.opposite
        };

        element.selectedOrigin.set( newPos );
        if( element.opposite ){
          var v = victor.fromObject( newPos ),
            opposite = victor.fromObject( element.opposite )
          ;

          opposite.rotateTo( v.invert().angle() );

          freezer.get().moving[ elementId ].opposite.set({
            x: opposite.x,
            y: opposite.y
          });
        }
      }
		});
  });
};
