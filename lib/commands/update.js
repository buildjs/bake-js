var path = require('path'),
    getit = require('getit'),
    zlib = require('zlib'),
    tar = require('tar'),
    mkdirp = require('mkdirp'),
    when = require('when'),
    fstream = require('fstream'),
    out = require('out'),
    reLibrary = /.*?\/library\/(.*)$/i;

module.exports = function(repository) {
    var datapath = path.resolve(__dirname, '../../data/recipes.local'),
        promises = [];
    
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
    
    // ensure a repository is specified
    repository = repository || 'DamonOehlman';
    
    out('!{grey}retrieving recipes from remote server...');
    getit('https://github.com/' + repository + '/bake-js/tarball/master')
        .on('end', out.bind(null, '!{grey}extracting recipes'))
        .pipe(zlib.Gunzip())
        .pipe(tar.Parse({ path: path.resolve(__dirname, '../data/recipes.local' ) }))
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