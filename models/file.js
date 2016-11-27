var mongoose = require('mongoose');

// Files Schema
var FileSchema = mongoose.Schema({
	userId: {
		type: String,
		index: true
	},
	fileName: {
		type: String
	},
  originalFileName: {
		type: String
	},
	fields: {}
});

var File = module.exports = mongoose.model('File', FileSchema);

module.exports.saveData = function(newData, callback){
  File.collection.insert([newData], {}, callback);
};

module.exports.getFileNames = function(userId ,callback){
  var query = File.find({userId: userId}).select({
		"originalFileName": 1,
		"fileName": 1,
		"fields": 1,
	});
  query.exec(callback);
};

module.exports.getFileByFileId = function(fileId ,callback){
  var query = File.findById(fileId);
  query.exec(callback);
};
