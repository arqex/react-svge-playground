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
      frame: 0,
      size: 12,
      height: 0.8,
      thickness: 0.7,
      crop: false
    }
  },
  componentWillMount: function() {
    this.width = 400;
    this.height = 400;
  },
  render: function() {
    var cameraProps = {
      fov: 75,
      aspect: 1,
      near: 1,
      far: 5000,
      position: new THREE.Vector3(0,0,600),
      lookat: new THREE.Vector3(0,0,0)
    }

    return (
      <div className="stlCreator">
      <div className="three-canvas" ref="scene" style={{width: this.width, height: this.height}}
        onDragOver={ (e) => e.preventDefault() }
        onDrop={ this.loadFile }
        onDragEnter={ () => this.refs.scene.classList.add('over') }
        onDragLeave={ () => this.refs.scene.classList.remove() } />
      <div className="controls">
        <div>
          <label><input type="checkbox" defaultValue={ this.state.frame } name="frame" onChange={this.inputChange } /> Añadir marco</label>
          <label><input type="checkbox" defaultValue={ this.state.crop } name="crop" onChange={this.inputChange } /> Recortar</label>
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
    update[ e.target.name ] = e.target.value;
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

  get3DPoints: function( points, limits ){
    return points.map( p => new THREE.Vector3( p.x - limits.minX, p.y - limits.minY, 0) );
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
      limits
    ;

    Array.prototype.forEach.call( svg.querySelectorAll('path'), p => {
      var d = p.getAttribute('d'),
        stroke = p.getAttribute('stroke')
      ;

      if( !d || d.length < 2 ){
        return;
      }

      var closed = d[ d.length - 1 ].toLowerCase() == 'z',
        shape = pathToShape( d ),
        bounds = shape.getBoundingBox()
      ;

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

      if( stroke && stroke != '#000000' && stroke != 'black' )
        bindings.push( shape );
      else
        shapes.push( shape );
    });

    this.shapes = shapes;
    this.bindings = bindings;
    this.limits = limits;
    console.log( limits );
  },

  renderModel: function(){
    var limits = this.limits,
      size = parseInt( this.state.size ),
      current = Math.max( limits.maxX - limits.minX, limits.maxY - limits.minY ),
      factor = size / current,
      height = parseFloat( this.state.height ) / factor ,
      thickness = parseFloat( this.state.thickness ) * 0.1 / factor,
      rect = new THREE.Shape(),
      smallRect = new THREE.Shape(),
      group = new THREE.Object3D()
    ;

    if( this.model )
      this.scene.remove( this.model );


    rect.moveTo(0, 0);
    rect.lineTo( 0, thickness );
    rect.lineTo( height, thickness );
    rect.lineTo( height, 0 );
    rect.lineTo( 0, 0 ); // closePath

    smallRect.moveTo(0, 0);
    smallRect.lineTo( 0, thickness );
    smallRect.lineTo( height * 0.6, thickness );
    smallRect.lineTo( height * 0.6, 0 );
    smallRect.lineTo( 0, 0 ); // closePath

    var single = new THREE.Geometry();
    this.shapes.forEach( shape => {
      var points = this.get3DPoints( shape.getPoints(130), limits ),
        spline = shape.closed ? new THREE.ClosedSplineCurve3( points ) : new THREE.CatmullRomCurve3( points )
      ;

      console.log( spline.points.length );
      if( spline.points.length < 2 ){
        return;
      }

      var extrudeSettings = {steps: points.length, extrudePath: spline, bevelEnabled: false},
        g = new THREE.ExtrudeGeometry( rect, extrudeSettings )
      ;

      single.merge(g);
    });

    if( false ) // this.state.frame )
      bindings.push( this.getFrame( limits.minX, limits.minY, Math.max(limits.maxX, limits.maxY) ) );

    this.bindings.forEach( shape => {
      var points = this.get3DPoints( shape.getPoints(140), limits ),
        spline = shape.closed ? new THREE.ClosedSplineCurve3( points ) : new THREE.CatmullRomCurve3( points )
      ;

      console.log( spline.points.length );
      if( spline.points.length < 2 ){
        return;
      }

      var extrudeSettings = {steps: points.length, extrudePath: spline, bevelEnabled: false},
        g = new THREE.ExtrudeGeometry( smallRect, extrudeSettings )
      ;

      single.merge(g);
    });

    // group.add( this.getCube() );





    // this.scene.add( group );

    single.mergeVertices();
    single = new THREE.Mesh( single, this.material );
    single = this.crop( single );

    single.rotation.set(Math.PI, 0, 0);
    single.scale.set(factor * 10, factor * 10, factor * 10);
    single.position.set(-size / .2, -size / .2, 0);

    this.scene.add( single );

    this.model = single;
  },

  getFrame( x, y, max ){
    var rect = new THREE.Shape();
    rect.moveTo(x, y);
    rect.lineTo( x, max );
    rect.lineTo( max, max );
    rect.lineTo( max, y );
    rect.lineTo( x, y ); // closePath
    rect.closed = true;
    return rect;
  },

  getCube(){
    var g = new THREE.CubeGeometry( this.size.x + this.state.thickness*6, this.size.y + this.state.thickness*6, 60 ),
      cube = new THREE.Mesh( g )
    ;

    cube.position.set(
      this.size.x/2 + this.state.thickness * 2 - this.limits.minX,
      this.size.y/2 + this.state.thickness * 2 - this.limits.minY,
      -30
    );

    return cube;
  },

  crop( mesh ){
    var cube = this.getCube(),
      cubeCSG = new csg( cube ),
      meshCSG = new csg( mesh ),
      intersection = meshCSG.intersect( cubeCSG )
    ;

    console.log( 'crop' );
    return intersection.toMesh( this.material );
  }
});

module.exports = StlCreator;
