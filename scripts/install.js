var exec = require('child_process').exec,
  Path = require('path')
;

exec( 'git submodule init', function(){
  exec( 'git submodule update', function(){
    exec( 'npm install', {cwd: Path.join(__dirname__, 'src/react-svge')}, function(){
      console.log( 'Todo bien' );
    });
  });
});
