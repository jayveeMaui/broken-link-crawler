"use strict";

var fse = require('fs-extra');
var path = require('path');
module.exports = class LinkReportGenerator{

    constructor(){
        this.default_path = 'link-reports';
        this.path = global.custom_args.report_path ? global.custom_args.report_path : this.default_path;
        this.file_dir = global.custom_args.report_path ? 'report' : global.custom_args.file_dir;
        this.complete_path = this.path + '/' + this.file_dir;

    }

    create(json) {
        //create a copy of tmp folder
        fse.copy('link-reports/tmp', this.complete_path)
            .then(() => {
                //create a json file
                fse.writeJson(this.complete_path+'/links.json', json)
                    .then(() => {
                        console.log('Report has been created, follow link:' +path.resolve(path.join(this.complete_path, 'index.html')) );
                    })
            })
            .catch(err => console.error(err))          
    }

}