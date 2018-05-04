const puppeteer = require('puppeteer');
const ProcessArgv = require('./helpers/processArgv.js');
const request = require('request');
const fs = require('fs');

const Processor = new ProcessArgv(process.argv);
const data = Processor.processArgs();

(async () => {
	const browser_frame = await puppeteer.launch();
	const page_frame = await browser_frame.newPage();
	let page_response = await page_frame.goto(data.url);
	let links = [], frames = [];

	//get main frame
	frames = Processor.processFrames(page_frame.mainFrame());

	//get all links
	links = await Processor.processLinks(page_frame);

	//sample link traversal 
	for (var i=0; i<links.length; i++) {
		// await page_frame._client.send('Page.setDownloadBehavior', {
		// 	behavior: 'allow',
		// 	downloadPath: './'
		// });		
		// page_response = await page_frame.goto(frames[i], {waitUntil: 'networkidle0'});
		// console.log(frames[i] + ' : '+page_response._status);
		await request(links[i], function(err, resp, html) {
			console.log(resp.request.uri.href + ' : ' +resp.statusCode);
			return;
		})
	}

	await browser_frame.close().then( () => {
		// let data = JSON.stringify(iframes, null, 2);	
		// fs.writeFile('json/links.json', data, (err) => {  
		// 		if (err) throw err;
		// 		console.log('Data written to file');
		// });	
	})

})();
