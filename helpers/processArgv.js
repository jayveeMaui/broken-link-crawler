const filnameSanitize = require('sanitize-filename');

module.exports = class ProcessArgv {
    constructor(args) {
        this.args = args;
    }

    processArgs() {
        const process_args = {}
        this.args.forEach((e, i) => {
            //check for url
            if(e == '--url')
                process_args.url = this.args[i+1];
            if(e == '--report-path')
                process_args.report_path = this.args[i+1];    
        });
        global.custom_args = process_args;
        global.custom_args.file_dir = filnameSanitize(process_args.url);
        return process_args;
    }

    processLinks(page) {
        const links =  page.evaluate(() => {
			const hrefs = Array.from(document.querySelectorAll('a'))
			return hrefs.filter(e => {
				if(e.href != '' && e.href.indexOf('javascript:void') == -1)
					return e.href;
			}).map(e => {
				return e.href;
			})
		});

		return links;       
    }

    processFrames(frame_head) {
        let resp = [], frames = [];

        const getFrames =  function(frame){
            frames.push(frame.url());  
            for (let child of frame.childFrames())
                getFrames(child);	
        } 

        resp = getFrames(frame_head)
        
        return frames;
    }
}