var path = require('path'),
    getit = require('getit'),
    zlib = require('zlib'),
    tar = require('tar'),
    mkdirp = require('mkdirp'),
    when = require('when'),
    fstream = require('fstream'),
    out = require('out'),
    reLibrary = /.*?\/library\/(.*)$/i;

module.exports = function(opts) {
    var datapath = opts.bakery,
        promises = [], target;
        
    function extractEntry(entry) {
        var realPath = path.join(datapath, entry.path.replace(reLibrary, '$1')),
            deferred = when.defer(), writer;
        
        // create the directory, synchronous feels dirty but oh well...
        mkdirp.sync(path.dirname(realPath));
        
        // create the writer
        writer = fstream.Writer({ path: realPath });
        
        // pipe the entry to the file
        entry
            .on('end', deferred.resolve.bind(deferred))
            .pipe(writer);
        
        return deferred;
    }
    
    // ensure we have options
    opts = opts || {};
    opts.repository = opts.repository || 'DamonOehlman';
    
    // initialise the target
    target = 'https://github.com/' + opts.repository + '/bake-js/tarball/master';
    
    out('!{grey}retrieving recipes from !{grey,underline}{0}', target);
    getit(target)
        .on('end', out.bind(null, '!{grey}extracting recipes'))
        .pipe(zlib.Gunzip())
        .pipe(tar.Parse({ path: opts.bakery }))
        .on('entry', function(entry) {
            if (reLibrary.test(entry.path) && entry.type == 'File') {
                promises.push(extractEntry(entry));
            }
        })
        .on('end', function() {
            when.all(promises, function() {
                out('!{check,green} done');
                if (callback) {
                    callback();
                }
            });
        });
};