var utils = require('../utils');

module.exports = function( freezer ){

  freezer.on('createPath', function( path ){
    var data = freezer.get(),
      selected = {},
      modifier = {points: {}}
    ;

    modifier.points[ path.points[0].id ] = 'selected';
    selected[ path.id ] = modifier;

    data = data.set({
        dataElements: [path],
        selected: selected
    });

    data.canvas.elements.push( path );
  });

  freezer.on('addPoint', function( previous, pos ){
    var data = freezer.get(),
      path = data.dataElements[0],
      ids = {}
    ;

    data.canvas.elements.set( data.canvas.elements.length - 1, data.dataElements[0].toJS() );

    data = freezer.get();
    data.dataElements[0].set({points: addPoint( path, previous, pos )});

    data = freezer.get();
    ids[utils.last(path.points).id] = 1;
    data.selected[path.id].set({points: utils.selectPoints( data.dataElements[0], ids )});
  });

  freezer.on( 'closePath', function(){
    var data = freezer.get(),
      path = data.dataElements[0]
    ;
    utils.last(path.points).set({x: 'end', temp: false});

    data = freezer.get();
    data.canvas.elements.set( data.canvas.elements.length -1, data.dataElements[0] );
    freezer.get().selected.set( path.id, {points:{}, path: data.dataElements[0], type: 'path'} );
  });
};

function getRelativePos( previous, pos ){
  return {
    x: pos.x - previous.x,
    y: pos.y - previous.y
  };
}

function addPoint( path, previous, pos ){
  var pointId = path.id + '_pp' + utils.id(),
    points = path.points.toJS(),
    lastPoint = utils.last(points),
    relativePos = getRelativePos( previous, pos ),
    ids = {}
  ;

  delete lastPoint.temp;
  lastPoint.x = relativePos.x;
  lastPoint.y = relativePos.y;

  points.push({
    type: 'point',
    id: pointId,
    temp: true,
    x: 0,
    y: 0
  });

  return points;
}
