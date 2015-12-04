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

	onHit: function( stack, keys ){
		var current = this.props.data.selected,
			selected, selection
		;

		if( stack.length ){
			if( stack[0].type == 'path' ){
				selection = { type: 'path', points: {}, path: stack[0] };
				if( !keys.shift ){
					selected = {};
		    	selected[ stack[0].id ] = selection;
					this.props.data.set({ selected: selected });
				}
				else if( !current[ stack[0].id ] ){
					this.props.data.selected.set( stack[0].id, selection );
				}
		  }
			else if( stack[0].type == 'point' ){
				var element = stack[1],
					points = {}
				;

				if( !keys.shift ){
					selected = {};
					points[ stack[0].id ] = 1;
					selection = utils.selectPoints( element, points );
					selection.type = element.type;
					selection.path = element;
					selected[ element.id ] = selection;
					this.props.data.set({ selected: selected });
				}
				else if( !current[ stack[0].id ] ){
					this.props.data.selected.set( stack[0].id, selection );
					selection = utils.selectPoints( element, points );
					selection.type = element.type;
					selection.path = element;
					this.props.data.selected.set( element.id, selection );
				}
			}
		}
		else {
			this.props.data.set({ selected: {}});
		}
	},

	onMoveStart: function( stack, pos, keys ){
		var data = this.onHit( stack, keys ),
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

					if( stack[1].lockedBenders && !keys.alt ){
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
