var forever = require('forever-monitor');
var Monitor = forever.Monitor;

var child = new Monitor('app.js', {
  max: 10,
  silent: false,
  killTree: true
});

child.on('exit', function () {
  console.log('Server foi finalizado.');
});

child.start();