var bake = require('..'),
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
            expect(oven.resolved.underscore).to.be.ok();
            done();
        });
    });

    it('should be able to extract a multiple recipes from a single line comment', function(done) {
        load('multi.js', function(err, oven) {
            expect(oven.resolved.underscore).to.be.ok();
            expect(oven.resolved.eve).to.be.ok();
            done();
        });
    });

    it('should be able to extract a multiple recipes from multiple comments', function(done) {
        load('multi-multiline.js', function(err, oven) {
            expect(oven.resolved.underscore).to.be.ok();
            expect(oven.resolved.eve).to.be.ok();
            done();
        });
    });

    it('should be able to extract a versioned requirement', function(done) {
        load('versioned.js', function(err, oven) {
            expect(oven.resolved.underscore).to.be.ok();
            expect(oven.resolved.underscore.name).to.equal('underscore');
            expect(oven.resolved.underscore.version).to.equal('1.3.3');
            done();
        });
    });

    it('should be able to extract additional modules (single mod, single comment)', function(done) {
        load('mods-single.js', function(err, oven) {
            expect(oven.resolved.mapcontrols).to.be.ok();
            expect(oven.resolved.mapcontrols.name).to.equal('mapcontrols');
            expect(oven.resolved.mapcontrols.mods).to.contain('core');
            expect(oven.resolved.mapcontrols.mods).to.contain('zoom');

            done();
        });
    });

    it('should be able to extract additional modules (multiple mods, single comment, comma separated)', function(done) {
        load('mods-multiple-comma.js', function(err, oven) {
            expect(oven.resolved.mapcontrols).to.be.ok();
            expect(oven.resolved.mapcontrols.name).to.equal('mapcontrols');
            expect(oven.resolved.mapcontrols.mods).to.contain('core');
            expect(oven.resolved.mapcontrols.mods).to.contain('zoom');
            expect(oven.resolved.mapcontrols.mods).to.contain('scale');

            done();
        });
    });

    it('should be able to extract additional modules (multiple mods, single comment, space separated)', function(done) {
        load('mods-multiple-space.js', function(err, oven) {
            expect(oven.resolved.mapcontrols).to.be.ok();
            expect(oven.resolved.mapcontrols.name).to.equal('mapcontrols');
            expect(oven.resolved.mapcontrols.mods).to.contain('core');
            expect(oven.resolved.mapcontrols.mods).to.contain('zoom');
            expect(oven.resolved.mapcontrols.mods).to.contain('scale');

            done();
        });
    });

    it('should be able to extract additional modules (multiple mods, single comment, commaspace separated)', function(done) {
        load('mods-multiple-commaspace.js', function(err, oven) {
            expect(oven.resolved.mapcontrols).to.be.ok();
            expect(oven.resolved.mapcontrols.name).to.equal('mapcontrols');
            expect(oven.resolved.mapcontrols.mods).to.contain('core');
            expect(oven.resolved.mapcontrols.mods).to.contain('zoom');
            expect(oven.resolved.mapcontrols.mods).to.contain('scale');

            done();
        });
    });

    it('should be able to extract additional modules (multiple mods, multiple comments)', function(done) {
        load('mods-separated.js', function(err, oven) {
            expect(oven.resolved.mapcontrols).to.be.ok();
            expect(oven.resolved.mapcontrols.name).to.equal('mapcontrols');
            expect(oven.resolved.mapcontrols.mods).to.contain('core');
            expect(oven.resolved.mapcontrols.mods).to.contain('zoom');
            expect(oven.resolved.mapcontrols.mods).to.contain('scale');

            done();
        });
    });
});
