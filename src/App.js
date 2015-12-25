import React from 'react';
import SvgEditor from './react-svgeditor/SvgEditor';
import ToolBar from './react-svgeditor/components/ToolBar';
//import StlCreator from './stl-creator/StlCreator';

var App = React.createClass({
	getInitialState: function() {
		return {
			mode: 'path'
		};
	},
	render: function(){
		var mode = this.state.mode;
		// add to activate 3D
		// <StlCreator />
		return (
			<div>
				<ToolBar mode={ mode } onSelectMode={ this.onModeChange } />
				<SvgEditor mode={ mode } />
			</div>
		);
	},
	onModeChange: function( mode ){
		this.setState({ mode: mode });
	}
});

module.exports = App;
