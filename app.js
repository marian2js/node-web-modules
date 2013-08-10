global.NWM = 'NWM';
global.MODULES = [];

const PORT = (process.env.PORT || 3000)
		, VIEWS = __dirname + '/views'
		, PUBLIC = __dirname + '/public'
		, STYLUS = __dirname + '/stylus'
		, MAXAGE = {maxAge: 60 * 60 * 1000}
		, GZIP = {level: 9, memLevel: 9}

var express = require('express')
	, site = require('./config.json')
	, redis = require('./lib/redis_connect')()
	, cron = require('./lib/cron_task')()
	//, github = require('./lib/github_api')()
	, app = module.exports = express()
;

app.use(express.logger('dev'));
app.set('views', VIEWS);
app.set('view engine', 'ejs');
app.use(express.compress(GZIP));
app.use(app.router);
app.use(express.static(PUBLIC, MAXAGE));

app.get('/', function(req, res) {
	var domain = (req.protocol+'://'+req.host);
	if(MODULES && MODULES.length) {
		// Memory Render
		console.log('Memory render');
		var params = {site: site, modules: MODULES, domain: domain};
		return res.render('application', params);
	} else {
		redis.zrevrange(NWM, 0, -1, function(err, modules) {
			// Redis Render
			console.log('Redis render');
			var max = modules.length
			for(var i = 0; i < max; i++) {
				MODULES[i] = JSON.parse(modules[i]);
			}
			var params = {site: site, modules: MODULES, domain: domain};
			return res.render('application', params);
		});	
	}
});

app.listen(PORT, function() {
	console.log('Node web module running on port %d', PORT);
});