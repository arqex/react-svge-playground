var React = require('react'),
	Freezer = require('freezer-js'),
	SvgCanvas = require('./components/SvgCanvas'),
	PathMode = require('./components/modes/PathMode'),
	SelectMode = require('./components/modes/SelectMode'),
	pathReactions = require('./reactions/pathReactions'),
	selectReactions = require('./reactions/selectReactions')
;

var SvgEditor = React.createClass({
	getInitialState: function() {
		window.fstore = new Freezer({
			canvas: {
				type: 'canvas',
				elements: [],
				width: this.props.width || 500,
				height: this.props.height || 500
			},
			dataElements: [],
			selected: []
		}, {live:true});

		this.switchingMode = false;

		pathReactions( fstore );
		selectReactions( fstore );

		return fstore;
	},
	render: function() {
		var C = this.getModeComponent( this.props.mode ),
			state = this.state.get()
		;

		return (
			<div className="svgCanvas" style={{position:'relative'}}>
				<SvgCanvas canvas={ state.canvas } hub={ this.state }  />
				<C ref="mode" data={ state } hub={ this.state } />
			</div>
		)
	},
	componentDidMount: function() {
		var me = this;
		this.state.on('update', function(){
			me.forceUpdate();
		})
	},
	getModeComponent: function( mode ){
		if( mode === 'select' )
			return SelectMode;
		return PathMode;
	},
	componentWillReceiveProps: function( nextProps ){
		if( this.props.mode != nextProps.mode ){
			var next = this.getModeComponent(nextProps.mode),
				current = this.refs.mode
			;

			if( current && current.beforeOut )
				current.beforeOut();
			if( next && next.beforeIn )
				next.beforeIn( this.state.get() );
		}
	}
});

module.exports = SvgEditor;
