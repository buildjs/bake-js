var getit = require('getit'),
    path = require('path'),
    fs = require('fs'),
    zlib = require('zlib'),
    tar = require('tar'),
    mkdirp = require('mkdirp'),
    rimraf = require('rimraf'),
    fstream = require('fstream'),
    when = require('when'),
    reLibrary = /.*?\/library\/(.*)$/i,
    out = require('out'),
    ComposerStream = require('./composerstream'),
    composer;

function Composer() {
}

Composer.prototype.build = function(targetPath, callback) {
    // check whether we are dealing with a path or a directory
    fs.stat(targetPath, function(err, stats) {
       console.log(stats); 
    });
};

Composer.prototype.update = function(callback) {
    
    var datapath = path.resolve(__dirname, '../data/recipes.local'),
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

    out('!{grey}retrieving recipes from remote server...');
    getit('https://github.com/DamonOehlman/compose-js/tarball/master')
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

// create a new composer
composer = new Composer();

function _process(targetFile, hideOutput) {
    var input = fs.createReadStream(targetFile),
        processor = new ComposerStream();
        
    if (hideOutput) {
        out = function() {};
    }
        
    out('!{grey}reading: !{grey,underline}{0}', action);
        
    // pipe the input stream to the processor
    input
        .on('end', out.bind(null, '!{grey}writing output'))
        .pipe(processor);
        
    // return the processor for piping
    return processor;
    
}

exports = module.exports = function(args, program) {
    var action = typeof args == 'string' ? args : args[0],
        handler = composer[action];

    // if the action maps to a path, then process that path
    fs.stat(action, function(err, stats) {
        if ((! err) && stats.isFile()) {
            _process(action)
                // direct the output accordingly
                .on('end', out.bind(null, '!{check,green} done'))
                .pipe(program.out ? fs.createWriteStream(program.out) : process.stdout);
        }
        else if (typeof handler == 'function') {
            // perform the specified action on the file
            handler.call(composer, args.slice(1));
        }
    });
    
    return composer;
};

exports.process = _process;
exports.composer = composer;