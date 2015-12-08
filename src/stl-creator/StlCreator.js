var React = require('react');
var PropTypes = React.PropTypes;
window.THREE = require('three');
var pathToShape = require('./pathToShape');

require('./svgLoader');
require('./trackballControls');

var StlCreator = React.createClass({
  componentWillMount: function() {
    this.width = 300;
    this.height = 300;
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
      <div className="three-canvas" ref="scene" style={{width: this.width, height: this.height}}
        onDragOver={ (e) => e.preventDefault() }
        onDrop={ this.loadFile }
        onDragEnter={ () => this.refs.scene.classList.add('over') }
        onDragLeave={ () => this.refs.scene.classList.remove() } />
    );
  },

  refresh: function(){
    this.renderer.render(this.scene, this.camera);
  },

  componentDidMount: function(){
      var scene = new THREE.Scene();

      var camera = new THREE.PerspectiveCamera( 75, this.width/this.height, 0.1, 1000 );
      camera.position.set(0, 0, 10);

      var renderer = new THREE.WebGLRenderer();
      renderer.setSize( this.height, this.width );
      this.refs.scene.appendChild( renderer.domElement );

      var light1 = new THREE.DirectionalLight( 0xffffff, 1 );
      light1.position.set( 8, 5, 10 );
      scene.add( light1 );

      var light2 = new THREE.DirectionalLight( 0xffffff, .8 );
      light2.position.set( -8, -5, -10 );
      scene.add( light2 );

      var grid = new THREE.GridHelper( 20, .5 );
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

      var geometry = new THREE.BoxGeometry(3,3,3);
      var material = new THREE.MeshPhongMaterial({
        color: 0xffffaa,
        side: THREE.DoubleSide
      });
      var cube = new THREE.Mesh(geometry, material);

      this.material = material;
      this.cube = cube;

      //scene.add( cube );
      this.refresh();

      window.model = this;
  },

  addMouseControls: function(){
    var controls = new THREE.TrackballControls( this.camera );

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

      loader.load( es.target.result, function( result ){
        console.log( result );

        me.scene.add( me.parseSVG( result ) );
        return me.refresh();

        var path = result.querySelector('path');
        var d = path.getAttribute('d');
        /*
        if( d[ d.length - 1].toLowerCase() != 'z' )
          d += 'z';
        */
        var shape = pathToShape( d );
        var extrudeSettings = {
          amount: -4,
          bevelEnabled	: false,
          steps: 20,
          curveSegments: 20
        };

        var rect = new THREE.Shape();
        rect.moveTo(0, 0);
        rect.lineTo( 0, 3 );
        rect.lineTo( 1, 3 );
        rect.lineTo( 1, 0 );
        rect.lineTo( 0, 0 ); // closePath

        console.log(shape.getPoints(10).length);
        console.log(shape.getPoints(100).length);
        console.log(shape.getPoints(300).length);

        var spline = new THREE.ClosedSplineCurve3( me.get3DPoints(shape.getPoints(100)) );
        var cubeExtrude = {
          steps: 400,
          extrudePath: spline,
          bevelEnabled: false
        };

        var points = shape.createPointsGeometry();
        var g = new THREE.ExtrudeGeometry( shape, extrudeSettings );
        var m = new THREE.Mesh( g, me.material );
        var l = new THREE.Line( points, new THREE.LineBasicMaterial({ color: 0xffffaa, linewidth: 1 }))
        var weno = new THREE.ExtrudeGeometry( rect, cubeExtrude );
        var wenoweno = new THREE.Mesh( weno, me.material );

        var group = new THREE.Object3D();
        group.add( wenoweno );

        group.rotation.set(Math.PI, 0, 0);
        group.position.set(-1,-1,0);
        group.scale.set(.01, .01, .1);
        window.m = m;

        l.position.set(-1,-1,0);
        l.scale.set(.01, .01, .01);
        l.rotation.set(Math.PI, 0, 0);
        me.scene.add( group );
        me.refresh();
      })
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

    var rect = new THREE.Shape(),
      smallRect = new THREE.Shape(),
      group = new THREE.Object3D(),
      shapes = [],
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

    var size = 12,
      current = Math.max( limits.maxX - limits.minX, limits.maxY - limits.minY ),
      factor = size / current,
      height = 1 / factor ,
      thickness = 0.07 / factor
    ;

    console.log( limits );

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

    shapes.forEach( shape => {
      var points = this.get3DPoints( shape.getPoints(130), limits ),
        spline = closed ? new THREE.ClosedSplineCurve3( points ) : new THREE.CatmullRomCurve3( points )
      ;

      console.log( spline.points.length );
      if( spline.points.length < 2 ){
        return;
      }

      var extrudeSettings = {steps: points.length, extrudePath: spline, bevelEnabled: false},
        g = new THREE.ExtrudeGeometry( rect, extrudeSettings ),
        m = new THREE.Mesh( g, this.material )
      ;

      group.add( m );
    });

    bindings.forEach( shape => {
      var points = this.get3DPoints( shape.getPoints(130), limits ),
        spline = closed ? new THREE.ClosedSplineCurve3( points ) : new THREE.CatmullRomCurve3( points )
      ;

      console.log( spline.points.length );
      if( spline.points.length < 2 ){
        return;
      }

      var extrudeSettings = {steps: points.length, extrudePath: spline, bevelEnabled: false},
        g = new THREE.ExtrudeGeometry( smallRect, extrudeSettings ),
        m = new THREE.Mesh( g, this.material )
      ;

      group.add( m );
    });

    group.rotation.set(Math.PI, 0, 0);
    group.scale.set(factor, factor, factor);
    group.position.set(-size / 2, -size / 2, 0);

    return group;
  }
});

module.exports = StlCreator;
