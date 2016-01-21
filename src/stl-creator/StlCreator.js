var React = require('react');
var PropTypes = React.PropTypes;
window.THREE = require('three');
var pathToShape = require('./pathToShape');
var FileSaver = require('./FileSaver');
var csg = require('./threeCSG');

require('./STLExporter');
require('./svgLoader');
require('./trackballControls');

var StlCreator = React.createClass({
  getInitialState: function(){
    return {
      frame: true,
      size: 12,
      height: 0.8,
      thickness: 0.7,
      crop: true,
      progress: 0
    }
  },
  componentWillMount: function() {
    this.width = 400;
    this.height = 400;
  },
  render: function() {
    var className = 'stlCreator';
    if( this.state.progress ){
      className += ' loading';
    }

    return (
      <div className={className}>
      <div className="three-canvas" ref="scene" style={{width: this.width, height: this.height}}
        onDragOver={ (e) => e.preventDefault() }
        onDrop={ this.loadFile }
        onDragEnter={ () => this.refs.scene.classList.add('over') }
        onDragLeave={ () => this.refs.scene.classList.remove() } />
      <div className="progress" style={{width: this.width}}>
        <div className="bar" style={{ height: 5, width: this.state.progress + '%' }} />
      </div>
      <div className="controls">
        <div>
          <label><input type="checkbox" defaultChecked={ this.state.frame } name="frame" onChange={this.inputChange } /> Añadir marco</label>
          <label><input type="checkbox" defaultChecked={ this.state.crop } name="crop" onChange={this.inputChange } /> Recortar</label>
        </div>
        <div>Tamaño: <select name="size" onChange={this.inputChange } defaultValue={ this.state.size }>
            <option>12</option>
            <option>15</option>
            <option>20</option>
          </select> cms
        </div>
        <div>Altura: <select name="height" onChange={this.inputChange } defaultValue={ this.state.height }>
            <option>0.7</option>
            <option>0.8</option>
            <option>1</option>
            <option>1.2</option>
          </select> cms
        </div>
        <div>Grosor: <select name="thickness" onChange={this.inputChange } defaultValue={ this.state.thickness }>
            <option>0.5</option>
            <option>0.6</option>
            <option value="0.7">0.7</option>
            <option>0.8</option>
            <option>0.9</option>
            <option>1.0</option>
          </select> mms
        </div>
      </div>
      <button onClick={ this.save }>Guardar</button>
      </div>
    );
  },

  inputChange: function( e ){
    var update = {};
    update[ e.target.name ] = e.target.type == 'checkbox' ? e.target.checked : e.target.value;
    this.setState( update, () => {
      if( this.model ){
        this.renderModel();
        this.refresh();
      }
    });
  },

  save: function(){
    if( !this.model )
      return;

    var exporter = new THREE.STLExporter(),
      contents = exporter.parse( this.scene ),
      blob = new Blob([contents], {type: 'text/plain'})
    ;

    FileSaver.saveAs(blob, 'model.stl');
  },

  refresh: function(){
    this.renderer.render(this.scene, this.camera);
    this.setState({progress: 0});
  },

  componentDidMount: function(){
      var scene = new THREE.Scene();

      var camera = new THREE.PerspectiveCamera( 75, this.width/this.height, 0.1, 1000 );
      camera.position.set(0, 0, 100);

      var renderer = new THREE.WebGLRenderer();
      renderer.setSize( this.height, this.width );
      this.refs.scene.appendChild( renderer.domElement );

      var light1 = new THREE.DirectionalLight( 0xffffff, 1 );
      light1.position.set( 8, 5, 10 );
      scene.add( light1 );

      var light2 = new THREE.DirectionalLight( 0xffffff, .8 );
      light2.position.set( -8, -5, -10 );
      scene.add( light2 );

      var grid = new THREE.GridHelper( 220, 10 );
      grid.rotateX( Math.PI / 2 );
      scene.add( grid );

      this.container = this.refs;
      this.scene = scene;
      this.camera = camera;
      this.renderer = renderer;
      this.light1 = light1;
      this.light2 = light2;
      this.grid = grid;

      this.addMouseControls();

      var material = new THREE.MeshPhongMaterial({
        color: 0xffffaa,
        side: THREE.DoubleSide
      });

      this.material = material;
      this.bindingMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide
      });

      this.cylinderMaterial = new THREE.MeshPhongMaterial({
        color: 0x0000ff,
        side: THREE.DoubleSide
      });

      //scene.add( cube );
      this.refresh();

      window.model = this;
  },

  addMouseControls: function(){
    var controls = new THREE.TrackballControls( this.camera, this.renderer.domElement );

		controls.rotateSpeed = 3.0;
		controls.zoomSpeed = 1.4;
		controls.panSpeed = 2;

		controls.noZoom = false;
		controls.noPan = false;

		controls.staticMoving = true;
		controls.dynamicDampingFactor = 0.3;

		controls.keys = [ 65, 83, 68 ];

		controls.addEventListener( 'change', this.refresh );

    function animate(){
      requestAnimationFrame( animate );
      controls.update();
    }

    animate();

    window.controls = controls;
  },

  loadFile: function( e ){
    e.stopPropagation();
    e.preventDefault();

    var loader = new THREE.SVGLoader();

    var reader = new FileReader();
    var me = this;

    reader.onload = function(es){
      console.log( es.target.result );

      loader.load( es.target.result, function( svg ){
        me.parseSVG( svg );
        me.renderModel();
        return me.refresh();
      });
    };

    reader.readAsDataURL( e.dataTransfer.files[0] );
    console.log( e.dataTransfer );
  },

  shouldComponentUpdate: function(){
    return false;
  },

  get3DPoints: function( points, height ){
    return points.map( p => new THREE.Vector3( p.x, p.y, height / 2) );
  },

  parseSVG: function( svg ){
    if(!svg || !svg.querySelectorAll )
      return [];

    var size = {
      x: svg.width.baseVal.value,
      y: svg.height.baseVal.value
    };

    this.size = size;

    console.log( size );

    var shapes = [],
      bindings = [],
      points = [],
      limits
    ;

    Array.prototype.forEach.call( svg.querySelectorAll('path'), p => {
      var d = p.getAttribute('d'),
        stroke = p.getAttribute('stroke'),
        isBinding = stroke && stroke != '#000000' && stroke != 'black'
      ;

      if( !d || d.length < 2 ){
        return;
      }

      var closed = d[ d.length - 1 ].toLowerCase() == 'z',
        shape = pathToShape( d ),
        bounds = shape.getBoundingBox(),
        nextPoints = this.calculateCornerPoints( d, isBinding ),
        last = {x: 0, y: 0}
      ;

      console.log( 'Next points', nextPoints );

      points = points.concat( nextPoints );

      shape.closed = closed;

      if( !limits ){
        limits = bounds;
      }
      else {
        limits.minX = Math.min( limits.minX, bounds.minX);
        limits.minY = Math.min( limits.minY, bounds.minY);
        limits.maxX = Math.max( limits.maxX, bounds.maxX);
        limits.maxY = Math.max( limits.maxY, bounds.maxY);
      }

      if( isBinding )
        bindings.push( shape );
      else
        shapes.push( shape );
    });

    console.log( 'Corner points', points );
    this.points = points;
    this.shapes = shapes;
    this.bindings = bindings;
    this.limits = limits;
    console.log( limits );
  },

  renderModel: function(){
    var limits = this.limits,
      size = parseInt( this.state.size ),
      current = Math.max( this.size.x, this.size.y ),
      factor = size / (current + 1), // this + 1 will make the template slightly smaller to fit
      height = parseFloat( this.state.height ) / factor ,
      thickness = parseFloat( this.state.thickness ) * 0.1 / factor,
      rect = this.createRect( thickness, height),
      bindingFactor = 0.6,
      smallRect = this.createRect( thickness, height * bindingFactor ),
      group = new THREE.Object3D()
    ;

    if( this.model )
      this.scene.remove( this.model );

    var model = new THREE.Geometry(),
      bindings = new THREE.Geometry(),
      cylinders = new THREE.Geometry()
    ;

    this.shapes.forEach( shape => {
      var points = this.get3DPoints( shape.getPoints(50), height ),
        spline = shape.closed ? new THREE.ClosedSplineCurve3( points ) : new THREE.CatmullRomCurve3( points )
      ;

      console.log( spline.points.length );
      if( spline.points.length < 2 ){
        return;
      }

      var extrudeSettings = {steps: points.length, extrudePath: spline, bevelEnabled: false},
        g = new THREE.ExtrudeGeometry( rect, extrudeSettings )
      ;

      this.addProgress('path');

      model.merge(g);
    });

    this.bindings.forEach( shape => {
      var points = this.get3DPoints( shape.getPoints(50), height * bindingFactor ),
        spline = shape.closed ? new THREE.ClosedSplineCurve3( points ) : new THREE.CatmullRomCurve3( points )
      ;

      console.log( spline.points.length );
      if( spline.points.length < 2 ){
        return;
      }

      var extrudeSettings = {steps: points.length, extrudePath: spline, bevelEnabled: false},
        g = new THREE.ExtrudeGeometry( smallRect, extrudeSettings )
      ;

      this.addProgress('path');

      bindings.merge(g);
    });

    var radius = thickness / 2,
      min = 0 + radius,
      maxX = this.size.x - radius,
      maxY = this.size.y - radius
    ;

    this.points.forEach( p => {
      if( p.x < min || p.y < min || p.x > maxX || p.y > maxY )
        return;

      var h = p.isBinding ? height * bindingFactor : height,
        c = new THREE.CylinderGeometry(radius, radius, h )
      ;

      c.rotateX( Math.PI / 2 );
      c.translate( p.x, p.y, h/2);
      cylinders.merge( c );
    })

    console.log( 'merge' );
    model.mergeVertices();
    bindings.mergeVertices();
    console.log( 'merged' );

    console.log( 'mesh' );
    bindings = new THREE.Mesh( bindings, this.bindingMaterial );
    model = new THREE.Mesh( model, this.material );
    cylinders = new THREE.Mesh( cylinders, this.cylinderMaterial );

    console.log( 'meshed' );

    if( this.state.crop ){
      // single = this.crop( single, height );
      if( this.bindings.length )
        bindings = this.crop( bindings, height, true );

      model = this.crop( model, height );
      // cylinders = this.crop( cylinders, height, true );
    }

    console.log( 'add' );
    group.add( model );
    group.add( bindings );
    group.add( cylinders );
    console.log( 'added' );

    if( this.state.frame )
      group.add( this.getFrame( height, thickness ) );
    // group.add( this.getCube( height ) );
    //
    // group.add( this.getCropFrame( height ) );

    console.log( 'transform' );
    // group.rotation.set(Math.PI, 0, 0);
    group.scale.set(factor * 10, factor * 10, factor * 10);
    // group.position.set(-size / .2, -size / .2, 0);
    console.log( 'transformed' );


    //this.scene.add( this.getFrame(height, thickness) );

    this.scene.add( group );

    this.model = group;
  },

  createRect( width, height ){
    var rect = new THREE.Shape(),
      halfWidth = width / 2,
      halfHeight = height / 2
    ;

    rect.moveTo( halfHeight, -halfWidth );
    rect.lineTo( halfHeight, halfWidth );
    rect.lineTo( -halfHeight, halfWidth );
    rect.lineTo( -halfHeight, -halfWidth );
    rect.lineTo( halfHeight, -halfWidth ); // closePath

    return rect;
  },

  addProgress( type ){
    var current = this.state.progress,
      increment
    ;

    if( type == 'path' ){
      increment = 50 / (this.shapes.length + this.bindings.length);
    }
    else if( type == 'cropped' ){
      increment = 25;
    }
    else if( type == 'merge' ){
      increment = this.state.crop ? 12.5 : 25;
    }
    else if( type == 'transform' ){
      increment = this.state.crop ? 12.5 : 25;
    }

    this.setState( {progress: current + increment} );

  },

  getFrame( height, thickness ){
    var h = height * 0.6,
      frame = new THREE.CubeGeometry( this.size.x, this.size.y, h ),
      sub = new THREE.CubeGeometry( this.size.x - (2 * thickness), this.size.y - (2 * thickness), h )
    ;

    frame = new THREE.Mesh( frame );
    sub = new THREE.Mesh( sub );

    frame.position.set( this.size.x / 2, this.size.y / 2, (h/2) );
    sub.position.set( this.size.x / 2, this.size.y / 2, (h/2) );

    var frameCSG = new csg( frame );

    frame = frameCSG.subtract( new csg( sub ) );

    return frame.toMesh( this.bindingMaterial );
  },


  getCropFrame( height ){
    var frame = new THREE.CubeGeometry( this.size.x * 2, this.size.y * 2, height * 2 ),
      sub = new THREE.CubeGeometry( this.size.x, this.size.y, height * 2 )
    ;

    frame = new csg( frame );
    frame = frame.subtract( new csg( sub ) );
    frame = frame.toMesh();

    frame.position.set( this.size.x / 2, this.size.y / 2, height );
    return frame;
  },

  getCube( height ){
    var g = new THREE.CubeGeometry( this.size.x, this.size.y, height ),
      cube = new THREE.Mesh( g )
    ;

    cube.position.set(this.size.x / 2, this.size.y / 2, height / 2 );

    return cube;
  },

  crop( mesh, height, intersect ){
    var cube = intersect ? this.getCube( height ) : this.getCropFrame( height ),
      cubeCSG = new csg( cube ),
      meshCSG = new csg( mesh ),
      intersection
    ;

    console.log( 'crop' );
    intersection = intersect ? meshCSG.intersect( cubeCSG ) : meshCSG.subtract( cubeCSG );
    intersection = intersection.toMesh( this.material );
    console.log( 'cropped' );

    return intersection;
  },

  calculateCornerPoints( d, isBinding ){
    console.log( d );
    var x = 0, y = 0,
      points = []
    ;

    d.match(/[mclvhqaz][\d\s,.\-]+/ig).forEach( path => {
      var parts = path.trim().match(/-?[\d\.]+|[a-z]+/ig),
        last = points[points.length-1],
        move, bender, p
      ;

      console.log('Parts', parts);

      for (var i = 1; i < parts.length; i++) {
        parts[i] = parseFloat( parts[i] );
      }

      switch( parts[0] ){
        case 'm':
          points.push({x: x + parts[1], y: y + parts[2]});
          move = {x: x + parts[1], y: y + parts[2] };
          break;
        case 'M':
          points.push({x: parts[1], y: parts[2]});
          move = {x: parts[1], y: parts[2] };
          break;
        case 'l':
          points.push({ x: parts[1], y: parts[2] });
          move = {x: x + parts[1], y: y + parts[2] };
          break;
        case 'L':
          points.push({ x: parts[1] - x , y: parts[2] - y });
          move = {x: parts[1] - x, y: parts[2] - y};
          break;
        case 'h':
          points.push({ x: parts[1], y: 0 });
          move = {x: parts[1], y: 0};
          break;
        case 'H':
          points.push({ x: parts[1] - x, y: 0});
          move = {x: parts[1] - x, y: 0};
          break;
        case 'v':
          points.push({ x: 0, y: parts[1] });
          move = {x: 0, y: parts[1] };
        case 'V':
          points.push({x: 0, y: parts[1] - y});
          move = {x:0, y: parts[1] - y};
          break;
        case 'H':
          points.push({ x: 0, y: parts[1] - y});
          move = { x: 0, y: parts[1] - y };
          break;
        case 'c':
          p = { x: parts[5], y: parts[6], benders:[{x: parts[3], y: parts[4]}, {x: 0, y: 0}] };
          p.angle = parts[3] / parts[4];
          points.push( p );
          bender = {x: parts[1], y: parts[2]};
          if( last.benders ){
            last.benders[1] = bender;
          }
          else{
            last.benders = [{x:0,y:0}, bender];
          }

          last.angle = (last.benders[0].x / last.benders[0].y) +  (bender.x / bender.y);
          move = {x: parts[5], y: parts[6] };
          break;
        case 'C':
          p = { x: parts[5] - x, y: parts[6] - y, benders:[{x: parts[3] - parts[5], y: parts[4] - parts[6]}, {x: 0, y: 0}] };
          p.angle = (p.benders[0].x / p.benders[0].y );
          points.push( p );
          bender = {x: parts[1] - x, y: parts[2] - y};
          if( last.benders ){
            last.benders[1] = bender;
          }
          else {
            last.benders = [{x:0,y:0}, bender];
          }
          last.angle = (last.benders[0].x / last.benders[0].y ) - (last.benders[1].x / last.benders[1].y);
          move = {x: parts[5] - x, y: parts[6] - y};
          break;
        case 'z':
        case 'Z':
          p = {x: 'end'};
          break;
      }

      if( last && last.benders ){
        last.lockedBenders = Math.abs(last.angle) < 0.01 ||
          isNaN( last.angle ) && !isNaN( last.benders[0].x / last.benders[0].y) && !isNaN( last.benders[1].x / last.benders[1].y);
        // delete last.angle;
      }
      if( points[points.length - 1].x != 'end' ){
        x += move.x;
        y += move.y;
      }
    });

    console.log( 'Points', points );
    var cornerPoints = [], last = {x:0, y:0};
    points.forEach( p => {
      if( !p.lockedBenders ){
        cornerPoints.push({x: last.x + p.x, y: last.y + p.y, isBinding: isBinding});
      }
      last.x = p.x + last.x;
      last.y = p.y + last.y;
    });
    return cornerPoints;
  }
});

module.exports = StlCreator;
