var seed = Math.floor(Math.random() * 100000);
module.exports = {
	id: function(){
		var id = (seed++).toString(36);
		return id;
	},
	last: function( target ){
		return target && target[target.length - 1];
	},
	selectPoints: function( path, ids ){
		var i = 0,
			points = {},
			pathPoints = path.points,
			modifier, prev, currentId, last
		;

		while( i < pathPoints.length ){
			if( pathPoints[i].x != 'end' ){
				currentId = pathPoints[ i ].id;
				if( ids[ currentId ] ){
					points[ currentId ] = 'selected';

					if( prev ){
						if( points[ prev ] === 'first ')
							points[ prev ] = 'both';
						else if( !points[ prev ] )
							points[ prev ] = 'second';
					}
					// If there is no prev we are in the first point
					// Check the last point of closed paths
					else if( this.last(pathPoints).x == 'end' ){
						last = pathPoints[ pathPoints.length - 2 ];
						if( last ){
							points[ last.id ] = 'second';
						}
					}

					// next point
					if( pathPoints[ i+1 ] ){
						currentId = pathPoints[ i+1 ].x == 'end' ? pathPoints[0].id : pathPoints[ i+1 ].id;
						modifier = points[currentId];

						if( modifier == 'second' ){
							points[currentId] = 'both';
						}
						else if( !modifier ){
							points[currentId] = 'first';
						}
					}
				}
				prev = currentId;
			}
			i++;
		}

		return {points: points};
	},
	getNextPoint: function( path, id ){
		var points = path.points,
			i = 0
		;

		while( i < points.length ){
			if( points[i].id == id )
				return points[i+1];
			i++;
		}		
	}
};
