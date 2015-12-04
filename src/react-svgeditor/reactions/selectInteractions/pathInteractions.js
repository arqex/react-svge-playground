var freezer;
module.exports = {
  init: function( f ){
    freezer = f;
  },
  click: function( stack, keys ){
    var path = stack[0],
      selection = { type: 'path', points: {}, path: path },
      data = freezer.get()
    ;

    if( !keys.shift ){
      var selected = {};
      selected[ path.id ] = selection;
      data.set({selected: selected});
    }
    else if( !data.selected[ path.id ] ){
      data.selected.set( path.id, selection );
    }
  },
  /**
   * Movement start and the element has been already selected.
   * @param  {function} element using element() always will have the updated
   *                            referenced to the element into the moving parameter
   * @param  {[type]} stack   [description]
   * @param  {[type]} pos     [description]
   * @param  {[type]} key     [description]
   * @return {[type]}         [description]
   */
  moveStart: function( element, stack, pos, key ){

  },
  move: function(){

  },
  moveEnd: function(){

  }
};
