var exec = require('child_process').exec,
  Path = require('path')
;

exec( 'git submodule init', function(){
  exec( 'git submodule update', function(){
    exec( 'npm install', {cwd: Path.join(__dirname, 'src/react-svge')}, function( err ){
      if( err )
        console.log( err );
      else
        console.log( 'Todo bien' );
    });
  });
});
