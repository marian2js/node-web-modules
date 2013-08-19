module.exports = function() {
	var cronJob = require('cron').CronJob
		, wms = require('./web_modules_scrap')()
	;
		
	var job = new cronJob({
		// update is once per hour
			cronTime: '00 00 * * * *'
		, onTick: function() {
				wms.update();
		  }
		,	start: false
	});
	
	job.start();
}