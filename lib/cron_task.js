module.exports = function() {
	var cronJob = require('cron').CronJob
		, moduleInfo = require('./module_info')
	;
		
	var job = new cronJob({
			cronTime: '00 00 01 * * *'
		, onTick: function() {
				moduleInfo();
		  }
		,	start: false
	});
	
	job.start();
}