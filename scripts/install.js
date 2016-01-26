var exec = require('child_process').exec,
  Path = require('path')
;

exec( 'git submodule init', function(){
  console.log("Importing react-svge...");
  exec( 'git submodule update', function(){
    console.log("react-svge imported. Installing dependencies...");
    exec( 'npm install', {cwd: Path.join(__dirname, '../src/react-svge')}, function( err ){
      if( err )
        console.log( err );
      else
        console.log( 'OK' );
    });
  });
});
