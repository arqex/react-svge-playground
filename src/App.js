import React from 'react';
import SvgEditor from './react-svgeditor/SvgEditor';
import ToolBar from './react-svgeditor/components/ToolBar';
import PropertiesBar from './react-svgeditor/components/PropertiesBar';
import kb from 'keyboardjs';
import historyManager from './react-svgeditor/historyManager';
import StlCreator from './stl-creator/StlCreator';

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
				{ /* <ToolBar mode={ mode } onSelectMode={ this.onModeChange } /> */}
				{ /* <SvgEditor ref="editor" mode={ mode } /> */ }
				{ /* <PropertiesBar /> */ }
				<StlCreator />
			</div>
		);
	},
	onModeChange: function( mode ){
		this.setState({ mode: mode });
	},
	componentDidMountOld: function() {
		var hub = this.refs.editor.getHub();

		kb.on('p', () => this.setState({mode: 'path'}) );
		kb.on('v', () => this.setState({mode: 'select'}) );
		kb.withContext('select', () => {
			kb.on('del', e => {
				e.preventDefault();
				console.log('aqui borramos');
				hub.trigger('select:delete');
			});
		});
		kb.on('del', () => console.log('Suprimir'));
		kb.on('backspace', (e) => console.log('Del', e));
		document.body.addEventListener('keydown', e => {
			e.preventDefault();
			// console.log( e.which );
		});

		hub.on('mode:updated', function( mode ){
			kb.setContext( mode );
		})

		historyManager.startHistory( this.refs.editor );
	},
});

module.exports = App;
