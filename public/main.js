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
    screen = new TmaScreen(512, 512, TmaScreen.MODE_3D);
    screen.setAlphaMode(true, screen.gl.SRC_ALPHA, screen.gl.ONE);
    screen.attachTo(TmaScreen.BODY);
    screen.aspect = 1;
    window.onresize = function() {
        screen.canvas.style.width = window.innerWidth + 'px';
        screen.canvas.style.height = window.innerHeight + 'px';
        screen.aspect = screen.canvas.clientWidth / screen.canvas.clientHeight;
        console.log('resize: ' +
                screen.canvas.clientWidth + 'x' + screen.canvas.clientHeight);
        if (!pluginReady)
            return;
        for (var frame in framePlugins)
            framePlugins[frame].resize(screen.aspect);
        for (var effect in effectPlugins)
            effectPlugins[effect].resize(screen.aspect);
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
        var fbo = screen.createFrameBuffer(screen.width, screen.height);

        var loop = function (time) {
            var delta = time - startTime;
            startTime = time;
            player.update();
            fbo.bind();
            screen.fillColor(0.0, 0.0, 0.0, 1.0);
            framePlugins['wired'].draw(delta);
            framePlugins['crlogo'].draw(delta);

            screen.bind();
            screen.fillColor(0.0, 0.0, 0.0, 1.0);
            effectPlugins['glow'].draw(delta, fbo.texture);
            framePlugins['snow'].draw(delta);
            screen.flush();

            requestAnimationFrame(loop, screen.canvas);
        };
        var startTime = window.mozAnimationStartTime || Date.now();
        startTime -= 0.1;
        loop(startTime + 0.1);
    }, function (error) { console.log(error); });
};
