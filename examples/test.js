// dep: interact

var myApp = (function() {
    eve.on('interact.pointer.down', function() {
        alert('hello');
    });
})();