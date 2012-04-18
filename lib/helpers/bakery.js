var path = require('path'),
    fs = require('fs');
    
exports.getPath = function(opts, preferLocal) {
    var bakeryPath = '';
    
    if (preferLocal) {
        if (path.existsSync(path.resolve('recipes'))) {
            bakeryPath = process.cwd();
        }
        else if (path.existsSync(path.resolve('../recipes'))) {
            bakeryPath = path.resolve('../');
        }
    }
    
    return bakeryPath || opts.bakery;
};