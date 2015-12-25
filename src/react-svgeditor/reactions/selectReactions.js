var utils = require('../utils');
var victor = require('victor');
var interactions = require('./selectInteractions/interactions');

module.exports = function( freezer ){
  interactions.init( freezer );

  freezer.on( 'select:hit', function( stack, pos, keys ){
    if( !stack.length )
      return freezer.get().set({selected: {}});

    var typeInteractions = interactions.get( stack[0].type );
    if( !typeInteractions || !typeInteractions.hit ) return;

    typeInteractions.hit( stack, pos, keys );
  });

  freezer.on( 'select:moveStart', function( stack, pos, keys ){
    var data = freezer.get(),
      elements = Object.keys( data.selected ),
      moving = {}
    ;

    if( elements.length ){
      elements.forEach( function( id ){
        var el = freezer.get().selected[id],
          type = el.type,
          typeInteractions = interactions.get( type )
        ;

        if( !typeInteractions || !typeInteractions.moveStart ) return;

        moving[ id ] = typeInteractions.moveStart( el, stack, pos, keys );
      });
    }

    data.set({moving: moving});
  });

  freezer.on( 'select:move', function( e ){
    var data = freezer.get(),
      elements = Object.keys( data.moving ),
      pos = {x: e.canvasX, y: e.canvasY }
    ;

    elements.forEach( function( elementId ){
			var element = freezer.get().moving[ elementId ],
        typeInteractions = interactions.get( element.type ),
        newPos
      ;

      if( !typeInteractions || !typeInteractions.move ) return;

      return typeInteractions.move( element, pos );
		});
  });
  freezer.on( 'select:moveEnd', function( e ){
    var data = freezer.get(),
      elements = Object.keys( data.moving ),
      pos = {x: e.canvasX, y: e.canvasY }
    ;

    elements.forEach( function( elementId ){
			var element = freezer.get().moving[ elementId ],
        typeInteractions = interactions.get( element.type ),
        newPos
      ;

      if( !typeInteractions || !typeInteractions.moveEnd ) return;

      typeInteractions.moveEnd( element, pos );
    });

    freezer.get().remove('moving');
  });
};
