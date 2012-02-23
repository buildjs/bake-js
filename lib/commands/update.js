var out = require('out');

module.exports = function() {
    var composer = this.composer;
    
    return function(done) {
        composer.updateRecipes(function() {
            out('recipes updated');
            done();
        });
    };
};