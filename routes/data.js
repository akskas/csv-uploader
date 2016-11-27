var express = require('express');
var router = express.Router();
var multer = require('multer');
var _ = require('underscore');
var Converter = require("csvtojson").Converter;
var path = require('path');
var util = require('util');
var fs = require('fs');
  __parentDir = path.dirname(process.mainModule.filename);

var csvFileStorage = multer.diskStorage({
   destination: function(req, file, cb) {
      cb(null, './temp/');
   },
   filename: function(req, file, cb) {
      var extenstion =
         file.originalname.split('.')[file.originalname.split('.').length - 1];

			var filename = file.fieldname + '-' + Date.now() + '.' + extenstion;
      cb(null, filename);
   }
});
var csvFileDefaultLocation = multer({ storage: csvFileStorage });

var Data = require('../models/data');
var File = require('../models/file');

// Data
router.get('/new', function(req, res){
	res.render('new');
});

router.get('/upload', function(req, res){
	res.render('upload');
});

router.get('/:fileId', function(req, res){
  File.getFileByFileId(req.params.fileId, function(err, file) {
    console.log('file: ', util.inspect(file, false, null, true));
    var columns = [];
    if(file.fields && file.fields.email)
      columns.push({isEmail: true});
    if(file.fields && file.fields.email)
      columns.push({isEmail: true});

    Data.getDataByFileId(req.params.fileId, function(err, data) {
      // console.log('response: ', util.inspect(data, false, null, true));
      _.each(data, function(row) {
        row.fields = file.fields;
      });
      res.render('file', {
        data: data,
        file: file
      });
    });
  });
});

router.post('/new', csvFileDefaultLocation.single('thumbnail'),
	function(req, res){
    var converter = new Converter({});
		var reqFile = req.file;
		var reqBody = req.body;
    var filePath = __parentDir + '/' + reqFile.path;
		var extenstion =
			reqFile.originalname.split('.')[reqFile.originalname.split('.').length - 1];
		var isCSV = extenstion === 'csv';
		if (!reqFile) {
      fs.unlinkSync(filePath);
			res.render('new',{
				error: 'Please provide a csv file'
			});
		} else {
			if (!isCSV) {
        fs.unlinkSync(filePath);
				res.render('new', {
					error: 'This file is not a valid file'
				});
			} else {
				converter.fromFile(filePath, function(err,result){
					if (err) {
            fs.unlinkSync(filePath);
						res.render('new', {
							error: 'Invalid CSV'
						});
					} else {
						var first = _.first(result);
						var fields = _.keys(first);
            console.log('fields: ', fields);
						var csvHeaders = [];
						_.each(fields, function(column) {
							if (/mail/.test(column.toLowerCase()))
								csvHeaders.push({
									name: column,
									isChecked: true
								});
							else
								csvHeaders.push({
									name: column,
									isChecked: null
								});
						});

						res.render('upload', {
							csvFileName: reqBody.fileName || reqFile.originalname,
							csvFilePath: reqFile.filename,
							csvHeaders: csvHeaders
						});
					}
				});
			}
		}
	}
);

router.post('/upload', function(req, res) {
  var converter = new Converter({});
	var reqBody = req.body;
	var filePath = __parentDir + '/temp/' + reqBody.csvFilePath;

	converter.fromFile(filePath, function(err, result) {
    // console.log('result: ', util.inspect(result, false, null, true));
    console.log('reqBody: ', util.inspect(reqBody, false, null, true));
		var selectedHeaders = {};
    var fields = {};
		var reqKeys = _.keys(_.omit(reqBody, ['csvFilePath', 'csvFileName']));
		_.each(reqKeys, function (key) {
      if (/mail/.test(key.toLowerCase())) {
				selectedHeaders.email = true;
        fields.email = key;
      }
			if (/name/.test(key.toLowerCase())) {
				selectedHeaders.name = true;
        fields.name = key;
      }
			if (/number/.test(key.toLowerCase())) {
				selectedHeaders.number = true;
        fields.number = key;
      }
			if (/location/.test(key.toLowerCase())) {
				selectedHeaders.location = true;
        fields.location = key;
      }
		});

    var file = {
      userId: req.user.id,
      fileName: reqBody.csvFilePath,
      originalFileName: reqBody.csvFileName,
      fields: fields
    };
    File.saveData(file, function(err, savedFile){
      if(err) {
        fs.unlinkSync(filePath);
        res.render('new', {
          error: 'Error in saving file'
        });
      } else {
        var data = [];
    		_.each(result , function(singleRow) {
    			var row = {
    				fileId: (_.first(savedFile.insertedIds)).toString(),
    				email: singleRow[fields.email]
    				};

    			if (selectedHeaders.name)
    				row.name = singleRow[fields.name];
    			if (selectedHeaders.number)
    				row.number = singleRow[fields.number];
    			if (selectedHeaders.location)
    				row.location = singleRow[fields.location];
    			data.push(row);
    		});
    		// console.log('data: ', util.inspect(data, false, null, true));

        if (!_.isEmpty(data)) {
    		  Data.saveData(data, function(err, user){
    			  if(err) {
              fs.unlinkSync(filePath);
              res.render('new', {
      					error: 'Error in saving file'
      				});
            } else {
              fs.unlinkSync(filePath);
              res.render('new', {
                success_msg: 'file successfully saved'
              });
            }
    		  });
        } else {
          fs.unlinkSync(filePath);
          res.render('new', {
            error: 'Error in saving file'
          });
        }
      }
    });
	});
});

module.exports = router;
