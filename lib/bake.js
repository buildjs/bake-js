var getit = require('getit'),
    path = require('path'),
    fs = require('fs'),
    out = require('out'),
    BakeStream = require('./bakestream');

function _process(targetFile, opts) {
    var input = fs.createReadStream(targetFile),
        processor = new BakeStream(opts);
        
    if (! opts.quiet) {
        out('!{grey}reading: !{grey,underline}{0}', targetFile);
    }
    
    // tell the process what the base path is
    processor.basePath = path.dirname(targetFile);
        
    // pipe the input stream to the processor
    return input.pipe(processor);
}

exports = module.exports = function(args, program) {
    var action = typeof args == 'string' ? args : args[0];
    
    if (! action) {
        out(program ? program.helpInformation() : 'An action or file is required');
        return;
    }

    // if the action maps to a path, then process that path
    fs.stat(action, function(err, stats) {
        if ((! err) && stats.isFile()) {
            _process(action, program)
                // handle errors
                .on('error', out.bind(null, '!{red}{0}'))
                
                // direct the output accordingly
                .on('end', out.bind(null, '!{check,green} done'))
                .pipe(program.out ? fs.createWriteStream(program.out) : process.stdout);
        }
        else {
            var handler;
            
            try {
                handler = require('./commands/' + action);
            }
            catch (e) {
            }
            
            if (typeof handler == 'function') {
                handler.apply(null, args.slice(1).concat(program));
            }
        }
    });
};

exports.process = _process;
exports.Stream = BakeStream;