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
});