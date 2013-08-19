module.exports = function() {

	var NWM = 'NWM'
		, GH_API = 'https://api.github.com/repos/'
		, NPM_API = 'http://registry.npmjs.org/'
		, CACHED_MODULES = []
	;

	var request = require('request')
		, moment = require('moment')
		, path = require('path')
		, url = require('url')
		, redis = require('./redis_connect')()
		, modules = require('./../modules.json')
	;

	return {
		update: function() {
			redis.flushdb(function(err, success) {
				if(err) console.log(err);
				if(success) console.log('Clear DB Keys');
				console.log('Clear Cache Memory');
				CACHED_MODULES = [];
			});
			
			console.log("Updating web modules...");

			for(var module_name in modules) {
				var gh_module_url = GH_API + modules[module_name];
				var npm_module_url = NPM_API + module_name + '/latest';

				request({url: gh_module_url, json:true}, function(err, res, grepo) {

					request({url: npm_module_url, json:true}, function(err, res, nrepo) {
					
						console.log("Receive: %j\n%j\n", grepo, nrepo);
						
						var data = JSON.stringify({
								name: nrepo.name
							, gh_url: grepo.html_url
							, npm_url: 'https://npmjs.org/package/' + nrepo.name
							, version: nrepo.version
							, image: 'images/' + grepo.name + '.png'
							, site: url.resolve('http://', grepo.homepage)
							, created_at: moment(grepo.created_at).fromNow()
							, author: nrepo.author.name
							, author_email: nrepo.author.email
							, contributors: nrepo.contributors && nrepo.contributors.length
							, forks: grepo.forks_count
							, watchers: grepo.watchers
							, issues: grepo.open_issues
							, description: nrepo.description
							, install: 'npm install ' + nrepo.name
						});
					
						redis.zadd(NWM, grepo.watchers, data, function() {
							console.log("%j\n-------------\n", data);
						});
					});
				});
			}
		},

		get: function(done) {
			if(CACHED_MODULES && CACHED_MODULES.length) {
				// Memory Render
				console.log('Memory render');
				return done(CACHED_MODULES)
			} else {
				redis.zrevrange(NWM, 0, -1, function(err, modules) {
					// Redis Render
					console.log('Redis render');
					var max = modules.length
					for(var i = 0; i < max; i++) {
						CACHED_MODULES[i] = JSON.parse(modules[i]);
					}
					return done(CACHED_MODULES);
				});	
			}
		}
	}
}