var mongoose = require('mongoose');

// Data Schema
var DataSchema = mongoose.Schema({
	fileId: {
		type: String,
		index: true
	},
  name: {
		type: String
	},
	email: {
		type: String
	},
	number: {
		type: String
	},
  location: {
		type: String
	}
});

var Data = module.exports = mongoose.model('Data', DataSchema);

module.exports.saveData = function(data, callback){
  Data.collection.insert(data, {}, callback);
};

module.exports.getDataByFileId = function(fileId, callback){
	var query = Data.find({fileId: fileId});
  query.exec(callback);
};
