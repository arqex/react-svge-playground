import React from 'react';
import SvgEditor from './react-svge/SvgEditor';
import ToolBar from './react-svge/components/ToolBar';
import PropertiesBar from './react-svge/components/PropertiesBar';
import kb from 'keyboardjs';
import historyManager from './react-svge/historyManager';

var App = React.createClass({
	componentWillMount: function(){
		this.freezer = SvgEditor.createSourceData();
	},
	render: function(){
		var mode = this.freezer.get().mode;
		return (
			<div>
				<ToolBar source={ this.freezer } mode={ mode } onSelectMode={ this.onModeChange } />
				<SvgEditor source={ this.freezer } ref="editor" mode={ mode } onChange={ this.onDataChange } />
				<PropertiesBar source={ this.freezer } />
			</div>
		);
	},
	onModeChange: function( mode ){
		this.setState({ mode: mode });
	},
	componentDidMount: function() {
		var hub = this.freezer.getEventHub(),
			me = this
		;

		hub.on('update', function(){
			me.forceUpdate();
		});

		kb.on('p', () => this.freezer.get().set({mode: 'path'}) );
		kb.on('v', () => this.freezer.get().set({mode: 'select'}) );
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

		historyManager.startHistory( this.freezer );
	},
	onDataChange( data ){

	}
});

module.exports = App;
