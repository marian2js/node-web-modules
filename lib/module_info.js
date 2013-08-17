module.exports = function() {

	const NWM = 'NWM';
	const GH_API = 'https://api.github.com/repos/';

	var request = require('request')
		, moment = require('moment')
		, path = require('path')
		, url = require('url')
		, redis = require('./redis_connect')()
		, modules = require('./../modules.json')
		, CACHED_MODULES = [];	
	;

	return {
		updateSources: function() {
			redis.flushdb(function(err, success) {
				if(err) console.log(err);
				if(success) console.log('Flush DB keys...');
				console.log('Clear Memory Render');
				MODULES = [];
			});
			
			console.log("Running github api consumer...");

			for(var m in modules) {
				var gh_module_url = GH_API + modules[m];

				request({url: gh_module_url, json:true}, function(err, res, repo) {
					
					console.log("Receive: %j\n", repo);
					
					var data = JSON.stringify({
							name: repo.name
						, url: repo.html_url
						, image: 'images/' + repo.name + '.png'
						, site: url.resolve('http://', repo.homepage)
						, created_at: moment(repo.created_at).fromNow()
						, author: repo.owner.login
						, author_url: repo.owner.html_url
						, author_image: repo.owner.avatar_url
						, forks: repo.forks_count
						, watchers: repo.watchers
						, issues: repo.open_issues
						, description: repo.description
					});
					
					redis.zadd(NWM, repo.watchers, data, function() {
						console.log("Storing: %j\n-------------\n", data);
					});
				});
			}
		},

		renderSources: function(done) {
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