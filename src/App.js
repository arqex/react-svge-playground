import React from 'react';
import SvgEditor from './react-svgeditor/SvgEditor';
import ToolBar from './react-svgeditor/components/ToolBar';
import PropertiesBar from './react-svgeditor/components/PropertiesBar';
import kb from 'keyboardjs';
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
				<PropertiesBar />
			</div>
		);
	},
	onModeChange: function( mode ){
		this.setState({ mode: mode });
	},
	componentDidMount: function() {
		kb.on('p', () => this.setState({mode: 'path'}) );
		kb.on('v', () => this.setState({mode: 'select'}) );
	},
});

module.exports = App;
