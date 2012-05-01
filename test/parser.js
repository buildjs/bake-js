var bake = require('../lib/bake'),
    path = require('path'),
    pathSamples = path.resolve(__dirname, 'parser-samples'),
    expect = require('expect.js'),
    bakeOpts = {
        dummyRun: true,
        quiet: true
    };
    
function load(recipe, callback) {
    var oven = bake.process(path.join(pathSamples, recipe), bakeOpts);
    
    oven.on('error', callback);
    oven.on('done', function() {
        callback(null, oven);
    });
}

describe('parser tests', function() {
    it('should be able to extract a single recipe', function(done) {
        load('simple.js', function(err, oven) {
            expect(oven.recipes.underscore).to.be.ok();
            done();
        });
    });
    
    it('should be able to extract a multiple recipes from a single line comment', function(done) {
        load('multi.js', function(err, oven) {
            expect(oven.recipes.underscore).to.be.ok();
            expect(oven.recipes.eve).to.be.ok();
            done();
        });
    });
});