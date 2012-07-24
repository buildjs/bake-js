var path = require('path'),
    fs = require('fs'),
    _existsSync = fs.existsSync || path.existsSync;
    
exports.getPath = function(opts, preferLocal) {
    var bakeryPath = '';
    
    if (preferLocal) {
        if (_existsSync(path.resolve('recipes'))) {
            bakeryPath = process.cwd();
        }
        else if (_existsSync(path.resolve('../recipes'))) {
            bakeryPath = path.resolve('../');
        }
    }
    
    return bakeryPath || opts.bakery;
};