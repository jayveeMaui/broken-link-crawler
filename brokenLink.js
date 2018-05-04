"use strict";

const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const validUrl = require('valid-url'); 
const ProcessArgv = require('./helpers/processArgv.js');
const generateReport = require('./helpers/linkReportGenerator.js');

const Processor = new ProcessArgv(process.argv);
const data = Processor.processArgs();

const report = new generateReport();

(async () => {
	const browser_frame = await puppeteer.launch();
	const page_frame = await browser_frame.newPage();
	let main_links = {}
	let link_collection, main_frame_links, tmp_links, link_collection_status = [];

	const scrapeLinks = async function(url) {
		let links = [], frames = [];
		try{
			await page_frame.goto(url, {timeout: 15000});
			console.log(url +" : success! ");
		} catch(ex) {
			console.log(url +" : failed! ");

			return {links: links, frames: frames};
		}

		//get main frame
		frames = Processor.processFrames(page_frame.mainFrame());
		//get all links
		links = await Processor.processLinks(page_frame);

		return {links: links, frames: frames};
	}

	// accept scrapeLinks() value
	const mainFrameLinks = function(links) {
		let temp_arr = [];

		//add mainframe url
		temp_arr.push(links.frames[0]);
		//loop through links
		for(var i = 0; i < links.links.length; i++) {
			//check if not third party and unique
			if(links.links[i].indexOf(data.url) == 0 && temp_arr.indexOf(links.links[i]) == -1) {
				temp_arr.push(links.links[i]);
			}
		}
		return temp_arr;
	}

	const checkLinks = async function(links) {
		let temp_arr = [];
		let prom = [];
		for(const i of links) {
			prom = await fetch(i);
			
			if(prom.status != 200)
				console.error(prom.url + ' '+prom.status);
			else
				console.log(prom.url + ' '+prom.status);	

			temp_arr.push({url:prom.url, status: prom.status})
		}

		return temp_arr;
	}

	//1.get main frame frames and links(hrefs)
	main_links = await scrapeLinks(data.url);
	//2.get first level links
	main_frame_links = mainFrameLinks(main_links);
	//3. combine links and filter redundant links
	tmp_links = main_links.links.filter(function(i){
		return (validUrl.isHttpUri(i) || validUrl.isHttpsUri(i));
	}).concat(
		main_links.frames.filter( function(i){
			return (validUrl.isHttpUri(i) || validUrl.isHttpsUri(i)) && main_links.links.indexOf(i) < 0;
		})
	);
	link_collection = Array.from(new Set(tmp_links));
	//4. do step 1 and step 3 on main_frame_links
	for(var i = 0; i < main_frame_links.length; i++) {
		main_links = await scrapeLinks(main_frame_links[i]);
		tmp_links = main_links.links.concat(main_links.frames);
		link_collection = link_collection.concat(
			tmp_links.filter( function(i){
				return (validUrl.isHttpUri(i) || validUrl.isHttpsUri(i)) && link_collection.indexOf(i) < 0 ;
			})
		);
		link_collection = Array.from(new Set(link_collection));
	}

	await browser_frame.close().then( async function(){
		//5. save and check links
		link_collection_status = await checkLinks(link_collection);

		await report.create(link_collection_status);

	});

})();
