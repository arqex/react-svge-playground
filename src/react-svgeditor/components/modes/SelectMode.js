var React = require('react');
var DataCanvas = require('../DataCanvas');
var utils = require('../../utils');
var victor = require('victor');

var SelectMode = React.createClass({
	statics: {
		beforeIn: function( data ){
			data.set({dataElements: data.canvas.elements.slice(0)});
		}
	},
	render: function() {
		var data = this.props.data;

		return (
			<DataCanvas
				elements={ data.dataElements || [] }
				canvas={ data.canvas }
				selected={ data.selected || {} }
				onHit={ this.onHit }
				onMoveStart={ this.onMoveStart }
				onMove={ this.onMove }
				onMoveEnd={ this.onMoveEnd } />
		);
	},

	onHit: function( stack ){
		var selected = {};
		if( stack.length ){
			if( stack[0].type == 'path' ){
		    selected[ stack[0].id ] = { type: 'path', points: {}, path: stack[0] };
		  }
			else if( stack[0].type == 'point' ){
				var element = stack[1],
					points = {},
					sel
				;
				points[ stack[0].id ] = 1;
				sel = utils.selectPoints( element, points );
				sel.type = element.type;
				sel.path = element;
				selected[ element.id ] = sel;
			}
			else {
				selected = this.props.data.selected;
			}
		}
		return this.props.data.set({ selected: selected });
	},

	onMoveStart: function( stack, pos ){
		var data = this.onHit( stack ),
			elements = Object.keys( data.selected ),
			moving = {}
		;

		if( elements.length ){
			elements.forEach( function( elementId ){
				var el = data.selected[ elementId ],
					point
				;

				if( stack[0].type == 'path' ){
					point = el.path.points[0];
					moving[ elementId ] = {
						type: 'path',
						selectedOrigin: point,
						selectedOriginPoint: { x: point.x, y: point.y },
						moveOrigin: pos
					};
				}
				else if( stack[0].type == 'point' ){
					point = stack[0];
					moving[ elementId ] = {
						type: 'point',
						path: stack[1],
						selectedOrigin: point,
						selectedOriginPoint: { x: point.x, y: point.y },
						moveOrigin: pos,
						nextPoint: utils.getNextPoint( stack[1], point.id )
					};

					if( moving[ elementId ].nextPoint ){
						moving[elementId].nextPointOrigin = {
							x: moving[ elementId ].nextPoint.x,
							y: moving[ elementId ].nextPoint.y
						};
					}
				}
				else if( stack[0].type == 'bender' ) {
					moving[ elementId ] = {
						type: 'bender',
						path: stack[2],
						selectedOrigin: stack[0],
						selectedOriginPoint: {x: stack[0].x, y: stack[0].y},
						moveOrigin: pos,
						point: stack[1]
					}

					if( stack[1].lockedBenders ){
						moving[ elementId ].opposite = stack[1].benders[0] == stack[0] ? stack[1].benders[1] : stack[1].benders[0];
					}
				}
			});

			data.set({moving: moving});
		}
	},

	onMove: function( e ){
		var data = this.props.data;

		if( !data.moving )
			return;

		return this.props.hub.trigger('moveElement', e );

		var elements = Object.keys( data.moving );

		elements.forEach( function( elementId ){
			var element = data.moving[ elementId ];

			element.selectedOrigin.set({
				x: element.selectedOriginPoint.x + e.canvasX - element.moveOrigin.x,
				y: element.selectedOriginPoint.y + e.canvasY - element.moveOrigin.y
			});
		});
	},

	onMoveEnd: function(){
		this.props.data.remove('moving');
	}
});

module.exports = SelectMode;
