var React = require('react');
var PropTypes = React.PropTypes;
var Three = require('three');
var ReactTHREE = require('react-three');

require('./svgLoader.js');

console.log(Three.SVGLoader);

var Scene = ReactTHREE.Scene,
  PerspectiveCamera = ReactTHREE.PerspectiveCamera,
  Cupcake = ReactTHREE.Cupcake
;

var StlCreator = React.createClass({
  getInitialState: function(){
    return { over: 0 };
  },

  render: function() {
    var className = 'three-canvas';
    if( this.state.over )
      className += ' over';

    var cameraProps = {
      fov: 75,
      aspect: 1,
      near: 1,
      far: 5000,
      position: new Three.Vector3(0,0,600),
      lookat: new Three.Vector3(0,0,0)
    }

    return (
      <div className="three-canvas"
        onDragOver={ (e) => e.preventDefault() }
        onDrop={ this.loadFile }
        onDragEnter={ () => this.setState({over:1}) }
        onDragLeave={ () => this.setState({over:0})}>
        <Scene width="300" height="300" camera="maincamera">
          <PerspectiveCamera name="maincamera" {...cameraProps} />
        </Scene>
      </div>
    );
  },

  componentDidMount: function(){
    /*
      var scene = new Three.Scene();
      var camera = new Three.PerspectiveCamera( 75, 1, 0.1 );
      var renderer = new Three.WebGLRenderer();
      renderer.setSize( 300, 300 );
    */
  },

  loadFile: function( e ){
    e.stopPropagation();
    e.preventDefault();

    var loader = new Three.SVGLoader();

    var reader = new FileReader();
    reader.onload = function(es){
      console.log( es.target.result );

      loader.load( es.target.result, function( result ){
        console.log( result );
      })
    };

    reader.readAsDataURL( e.dataTransfer.files[0] );
    console.log( e.dataTransfer );
  }
});

module.exports = StlCreator;
