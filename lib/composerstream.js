var async = require('async'),
    Stream = require('stream').Stream,
    util = require('util'),
    out = require('out'),
    loader = require('./recipes/loader'),
    reRequire = /^\s*(?:\/\/|\#)\s*(?:req|dep)\:\s(.*)$/,
    reDelim = /\,\s*/;

function ComposerStream(opts) {
    Stream.call(this);
    
    opts = opts || {};
    
    this.readable = true;
    this.writable = true;
    this.input = '';
    this.output = '';
    this.requirements = [];
    this.out = opts.quiet ? function() {} : out;
}

util.inherits(ComposerStream, Stream);

ComposerStream.prototype._checkRecipes = function(callback) {
    // iterate through the requirements and load each of the recipes from the local data path
    loader.check(this.requirements, function(err, updatedRequirements) {
        if (! err) {
            this.requirements = updatedRequirements;
        }
        
        callback(err);
    });
};

ComposerStream.prototype._findRequires = function() {
    var output = [],
        // reset the requirements
        requirements = [];
    
    (this.input || '').split(/\n/).forEach(function(line) {
        var match = reRequire.exec(line);
        
        // if we have a match on this line, then add the requirements
        if (match) {
            requirements = requirements.concat(match[1].split(reDelim));
        }
        // otherwise, pass the line through to the output
        else {
            output[output.length] = line;
        }
    });
    
    // update member variables
    this.requirements = requirements;
    this.output = output.join('\n') + '\n';
};

ComposerStream.prototype._resolveRecipes = function(callback) {
    var stream = this;
    
    // resolve the requirements in order as they may well be order important
    // TODO: make this efficient (i.e. bring down libraries with no deps in parallel)
    async.forEachSeries(
        this.requirements,

        function(item, itemCallback) {
            stream.out('Resolving dependency: ' + item);
            
            // download the item
            loader.download(item, function(err, contents) {
                // if there was no error, then emit the contents
                if (! err) {
                    
                }
                // otherwise, emit an error comment
                else {
                    
                }
                
                itemCallback(err);
            });
        },

        callback
    );
};

ComposerStream.prototype.end = function(buffer) {
    var stream = this,
        recipeTasks = [
            this._checkRecipes.bind(this),
            this._resolveRecipes.bind(this)
        ];
    
    // parse the input data looking for requirements
    this.out('!{grey}parsing file');
    
    // find the requirements for this file
    this._findRequires();
    
    // process the recipe tasks
    async.series(recipeTasks, function(err) {
        if (err) {
            stream.emit('error', err);
        }
        else {
            // stream the resolved requirements
            stream.emit('data', '// some stuff goes here\n');

            // stream the original file with the req comments stripped
            stream.emit('data', stream.output);
            
            // end the stream
            stream.emit('end');
        }
    });
};

ComposerStream.prototype.write = function(buffer) {
    this.input += buffer.toString();
};

module.exports = ComposerStream;