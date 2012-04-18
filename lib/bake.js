var async = require('async'),
    getit = require('getit'),
    path = require('path'),
    rigger = require('rigger'),
    fs = require('fs'),
    out = require('out'),
    formatter = require('formatter'),
    Oven = require('./oven');
    
function _help() {
    var commands = [],
        files = fs.readdirSync(path.resolve(__dirname, 'commands')),
        actionHelp = formatter('    {{ 0|len:30 }}{{ 1 }}');
    
    // now iterate through the commands and provide some output
    out('  Available Actions:\n');
    
    (files || []).forEach(function(file) {
        commands.push({
            name: path.basename(file, '.js'),
            module: require('./commands/' + file)
        });
    });
    
    commands.forEach(function(command) {
        out(actionHelp(command.name, command.module.desc));
    });
    
    out(' ');
}

function _process(files, opts, callback) {
    var oven, writer, recipe;
        
    // remap args if required
    if (typeof opts == 'function') {
        callback = opts;
        opts = {};
    }
    
    // ensure we have opts
    opts = opts || {};

    // default the build type to oldschool
    opts.buildstyle = opts.buildstyle || 'oldschool';
    opts.output = opts.output || 'dist';
    
    // load the required writer
    try {
        writer = require('./writers/' + opts.buildstyle);
    }
    catch (e) {
        callback(new Error('Unable to load the writer for buildstyle: ' + opts.buildstyle));
        return;
    }
    
    // create the oven
    oven = new Oven(opts);
    
    // process each of the files specified
    async.forEach(
        files,
        
        function(targetFile, itemCallback) {
            out('!{grey}reading: !{grey,underline}{0}', targetFile);
            rigger(targetFile, 'utf8', function(err, data) {
                if (err) {
                    itemCallback(err);
                }
                else {
                    // tell the process what the base path is
                    oven.basePath = path.dirname(targetFile);
                    
                    // add the recipe
                    recipe = oven.addRecipe(data, path.basename(targetFile));
                    
                    // route events correctly
                    oven.on('done', function(recipes) {
                        // get the writer to write the files
                        writer(recipe.name, recipes, opts, function(err) {
                            // remove the item recipe
                            delete oven.recipes[recipe.name];
                            
                            // trigger the item callback
                            itemCallback(err);
                        });
                    });

                    oven.on('error', itemCallback);
                    oven.process();
                }
            });
            
        },
        
        callback
    );
    
}

exports = module.exports = function(args, program) {
    var action = typeof args == 'string' ? args : args[0];
    
    if (! action) {
        out(program ? program.helpInformation() : 'An action or file is required');
        return;
    }

    // use the local bakery path if one not provided
    program.bakery = program.bakery || path.resolve(__dirname, '../data/bakery');

    // if the action maps to a path, then process that path
    fs.stat(action, function(err, stats) {
        if ((! err) && (stats.isFile() || stats.isDirectory())) {
            var files = [action];
            
            // if the target path is a directory, then get the files from that directory
            if (stats.isDirectory()) {
                files = (fs.readdirSync(action) || []).map(function(file) {
                    return path.join(action, file);
                });
            }
            
            _process(files, program, function(err) {
                if (err) {
                    out.error(err);
                }
                else {
                    out('!{check,green} done');
                }
            }, stats.isDirectory());
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

exports.help = _help;
exports.process = _process;