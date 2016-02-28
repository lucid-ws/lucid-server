exports.merge = function(obj, defaults){
	obj = obj || {};

	for(var key in defaults){
		if(!obj.hasOwnProperty(key))
			obj[key] = defaults[key];
	}

	return obj;
}