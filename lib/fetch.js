var async = require('async'),
    getit = require('getit'),
    path = require('path'),
    _ = require('underscore');
    
function _load(reporter, recipe, callback) {
    var results = [],
        itemCount = 0,
        getItOpts = {
            cachePath: path.resolve(__dirname, '../data/_cache')
        };
        
    // get each of the items in the data
    async.forEach(
        (recipe.data || '').split(/\n/),
        
        function(item, itemCallback) {
            var index = itemCount++;

            if (item) {
                reporter('<= {0}: \t!{underline}{1}', recipe.name, item);

                // get the item and check the cache directory
                getit(item, getItOpts, function(err, data) {
                    results[index] = data;

                    // if we have received an error, then make it meaningful
                    if (err) {
                        err = new Error('Unable to fetch recipe "' + recipe.name + '" contents');
                    }

                    itemCallback(err);
                });
            }
            else {
                itemCallback();
            }
        },
        
        function(err) {
            // clear the data
            recipe.data = '';
            
            // if we didn't have an error, then join the results
            if (! err) {
                recipe.data = results.join('\n') + ';\n';
            }
            
            callback(err);
        }
    );
}
    
module.exports = function(recipes, reporter, callback) {
    var loader = _load.bind(null, reporter);
    
    // sort the recipes in priority order
    // TODO: improve this algorithm
    recipes = _.sortBy(recipes, function(item) {
        return item.requirements.length;
    });
    
    // fetch each of the recipes
    async.forEach(recipes, loader, function(err) {
        callback(err, recipes);
    });
};