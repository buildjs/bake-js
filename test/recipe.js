var bake = require('../lib/bake'),
    Recipe = require('../lib/recipe'),
    path = require('path'),
    testBakery = path.resolve(__dirname, 'test-bakery'),
    expect = require('expect.js');

describe('recipe loading and parsing tests', function() {
    it('should be able to check for an alias (when not an aliased name)', function(done) {
        var recipe = new Recipe('underscore');
        
        recipe._checkAliases(testBakery, function() {
            expect(recipe.alias).to.not.be.ok();
            expect(recipe.name).to.equal('underscore');
            
            done();
        });
    });
    
    it('should be able to check for an alias (when it is an aliases)', function(done) {
        var recipe = new Recipe('_');
        
        recipe._checkAliases(testBakery, function() {
            expect(recipe.alias).to.equal('_');
            expect(recipe.name).to.equal('underscore');
            
            done();
        });
    });
    
    it('should be able to read the data for a known recipe', function(done) {
        var recipe = new Recipe('underscore');
        
        recipe._read(testBakery, function(err) {
            expect(err).to.not.be.ok();
            expect(recipe.data).to.be.ok();
            
            done(err);
        });
    });
    
    it('should return an error attempting to read data for an unknown recipe', function(done) {
        var recipe = new Recipe('unknown');
        
        recipe._read(testBakery, function(err) {
            expect(err).to.be.ok();
            done();
        });
    });
    
    it('should be able to parse a known recipe once loaded', function(done) {
        var recipe = new Recipe('underscore');
        
        recipe._read(testBakery, function(err) {
            expect(recipe.data).to.be.ok();
            
            recipe._parse(function() {
                expect(recipe.sections).to.be.ok();
                done();
            });
        });
    });
    
    it('should be able to load an known recipe', function(done) {
        var recipe = new Recipe('underscore');
        
        recipe.on('error', done);
        recipe.on('ready', function() {
            expect(recipe.sections).to.be.ok();
            expect(recipe.sections.core).to.be.ok();
            
            done();
        });
        
        recipe.load(testBakery);
    });
    
    it('should raise an error when attemping to load an unknown recipe', function(done) {
        var recipe = new Recipe('unknown');
        
        recipe.on('error', function(err) {
            expect(err).to.be.ok();
            
            done();
        });
        
        recipe.on('ready', function() {
            done(new Error('Recipe marked ready when it should not have loaded'));
        });
        
        recipe.load(testBakery);
    });
});