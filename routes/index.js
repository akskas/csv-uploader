var express = require('express');
var util = require('util');
var router = express.Router();

var File = require('../models/file');

// Get Homepage
router.get('/', ensureAuthenticated, function(req, res){
	File.getFileNames(req.user.id, function(err, data) {
		// console.log('response: ', util.inspect(data, false, null, true));
		res.render('index', {
			data: data
		});
	});
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		//req.flash('error_msg','You are not logged in');
		res.redirect('/users/login');
	}
}

module.exports = router;
