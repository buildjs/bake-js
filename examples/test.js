// dep: backbone, eve, streamlike

var myApp = (function() {
    eve.on('interact.pointer.down', function() {
        alert('hello');
    });
})();