var Stream = require('stream').Stream,
    util = require('util');

function ComposerStream() {
    Stream.call(this);
    
    this.readable = true;
    this.writable = true;
    this.input = '';
}

util.inherits(ComposerStream, Stream);

ComposerStream.prototype.end = function(buffer) {
    this.emit('data', this.input + '\n');
    this.emit('end');
};

ComposerStream.prototype.write = function(buffer) {
    this.input += buffer.toString();
};

module.exports = ComposerStream;