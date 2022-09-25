tma.extlibs = [ 'ext/gl-matrix.js' ];
tma.onload = function () {
    // Global utility functions.
    var createPath = function(type, name, path) {
        return type + '/' + name + '/' + path;
    }
    loadShader = function (type, name, html, id) {
        return tma.loadShader(createPath(type, name, html), id);
    };
    loadScript = function (type, name, src) {
        return tma.load(createPath(type, name, src));
    }
    loadPlugin = function (type, name) {
        return new Promise(function (resolve, reject) {
            loadScript(type, name, 'main.js').then(function () {
                var plugins = (type == 'frame') ? framePlugins : effectPlugins;
                plugins[name].init().then(
                        function () { resolve(); },
                        function (error) { console.log(error); });
            }, function (error) { console.log(error); });
        });
    };
    loadImage = function (type, name, path) {
        return new Promise(function (resolve, reject) {
            var image = new Image();
            image.onload = function () { resolve(this); };
            image.src = createPath(type, name, path);
        });
    }
    loadMovie = function (type, name, path) {
        return new Promise(function (resolve, reject) {
            var video = document.createElement('video');
            video.src = createPath(type, name, path);
            video.style.setProperty('display', 'none');
            video.addEventListener('canplay', function () {
                resolve(this);
            }, false);
            document.head.appendChild(video);
        });
    }
    framePlugins = {};
    effectPlugins = {};
    controller = null;
    player = null;
    var pluginReady = false;

    // Create main screen.
    tmaScreen = new TmaScreen(512, 512, TmaScreen.MODE_3D);
    tmaScreen.setAlphaMode(true, tmaScreen.gl.SRC_ALPHA, tmaScreen.gl.ONE);
    tmaScreen.attachTo(TmaScreen.BODY);
    tmaScreen.aspect = 1;
    window.onresize = function() {
        tmaScreen.canvas.style.width = window.innerWidth + 'px';
        tmaScreen.canvas.style.height = window.innerHeight + 'px';
        tmaScreen.aspect =
                tmaScreen.canvas.clientWidth / tmaScreen.canvas.clientHeight;
        console.log('resize: ' + tmaScreen.canvas.clientWidth + 'x' +
                tmaScreen.canvas.clientHeight);
        if (!pluginReady)
            return;
        for (var frame in framePlugins)
            framePlugins[frame].resize(tmaScreen.aspect);
        for (var effect in effectPlugins)
            effectPlugins[effect].resize(tmaScreen.aspect);
    };
    window.onresize();

    // Load all plugins asynchronously.
    Promise.all([
        loadPlugin('frame', 'crlogo'),
        loadPlugin('frame', 'wired'),
        loadPlugin('frame', 'snow'),
        loadPlugin('effect', 'glow'),
        tma.load('controller.js'),
        tma.load('player.js')
    ]).then(function () {
        pluginReady = true;
        console.log('all plugins are loaded');

        framePlugins['wired'].attach(controller.channels[0]);
        controller.channels[1].knob = 0.5;
        framePlugins['crlogo'].attach(controller.channels[1]);
        controller.channels[2].slider = 0.7;
        framePlugins['snow'].attach(controller.channels[2]);
        controller.channels[3].slider = 1.0;
        effectPlugins['glow'].attach(controller.channels[3]);
        controller.channels[7].knob = 0.3;
        controller.channels[7].slider = 1.0;

        // Start.
        player.init();
        player.play();
        var requestAnimationFrame = window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame;
        var fbo =
                tmaScreen.createFrameBuffer(tmaScreen.width, tmaScreen.height);

        var loop = function (time) {
            var delta = time - startTime;
            startTime = time;
            player.update();
            fbo.bind();
            tmaScreen.fillColor(0.0, 0.0, 0.0, 1.0);
            framePlugins['wired'].draw(delta);
            framePlugins['crlogo'].draw(delta);

            tmaScreen.bind();
            tmaScreen.fillColor(0.0, 0.0, 0.0, 1.0);
            effectPlugins['glow'].draw(delta, fbo.texture);
            framePlugins['snow'].draw(delta);
            tmaScreen.flush();

            requestAnimationFrame(loop, tmaScreen.canvas);
        };
        var startTime = window.mozAnimationStartTime || Date.now();
        startTime -= 0.1;
        loop(startTime + 0.1);
    }, function (error) { console.log(error); });
};
