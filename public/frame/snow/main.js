framePlugins.snow = {
    init: function () {
        return new Promise(function (resolve, reject) {
            Promise.all([
                loadShader('frame', 'snow', 'shaders.html', 'vertex'),
                loadShader('frame', 'snow', 'shaders.html', 'fragment')
            ]).then(function (results) {
                var plugin = framePlugins.snow;
                plugin._vertexShader = results[0];
                plugin._fragmentShader = results[1];
                plugin._program = plugin._screen.createProgram(
                        plugin._screen.compileShader(
                                Tma3DScreen.VERTEX_SHADER,
                                plugin._vertexShader),
                        plugin._screen.compileShader(
                                Tma3DScreen.FRAGMENT_SHADER,
                                plugin._fragmentShader));
                plugin._image = plugin._screen.createImage(512, 512);
                plugin._data = plugin._image.data;
                plugin._texture = plugin._screen.createTexture(
                        plugin._image, true, Tma3DScreen.FILTER_LINEAR);
                plugin.resize(plugin._screen.aspect);

                framePlugins.snow.ps = function () {
                    TmaParticle.apply(this, arguments);
                };
                framePlugins.snow.ps.prototype = new TmaParticle(null, 0);
                framePlugins.snow.ps.prototype.constructor =
                        framePlugins.snow.ps;
                framePlugins.snow.ps.GRAVITY = 1 / 1000;
                plugin._ps = new TmaParticle.Container(framePlugins.snow.ps);
                framePlugins.snow.ps.emit = function () {
                    var x = Math.random() * 512;
                    var vx = (Math.random() - 0.5) * 0.1;
                    var vy = Math.random() + 0.5;
                    framePlugins.snow._ps.add(x, vx, vy);
                };
                framePlugins.snow.ps.prototype.initialize =
                        function (x, vx, vy) {
                    this.y = 0;
                    this.x = x;
                    this.vx = vx;
                    this.vy = vy;
                };
                framePlugins.snow.ps.prototype.update = function () {
                    this.vy += framePlugins.snow.ps.GRAVITY;
                    this.vy *= 0.999;
                    this.y += this.vy;
                    if (this.y >= 512)
                        return false;
                    this.x += this.vx;
                    if (this.x < 0 || this.x >= 512)
                        return false;
                    framePlugins.snow._image.setPixel(
                            this.x|0, this.y|0, 0xff, 0xff, 0xff, 0xff);
                    return true;
                };

                resolve();
            }, function (error) { console.log(error); });
        });
    },
    
    resize: function (aspect) {
        this._aspect = aspect;
    },
    
    draw: function (delta) {
        var volume = 1.0;
        if (this._controller) {
            volume = this._controller.slider;
            if (volume == 0.0)
                return;
        }
        var i;
        var n = delta|0;
        if (n > 20)
            n = 20;
        for (i = 0; i < n; ++i)
            framePlugins.snow.ps.emit();
        var size = 512 * 512 * 4;
        for (i = 0; i < size; ++i)
            this._data[i] = 0;
        this._ps.update();
        this._texture.update(this._image);
        this._program.setAttributeArray('aCoord', this._coords, 0, 2, 0);
        this._program.setTexture('uTexture', this._texture);
        this._program.setUniformVector('uVolume', [volume]);
        this._program.setUniformVector('uAspect', [this._aspect]);
        this._program.drawArrays(Tma3DScreen.MODE_TRIANGLE_FAN, 0, 4);
    },

    attach: function (controller) {
        this._controller = controller;
    },
    
    detach: function () {
        this._controller = null;
    },
    
    _controller: null,
    _screen: screen,
    _vertexShader: '',
    _fragmentShader: '',
    _program: null,
    _texture: null,
    _image: null,
    _data: null,
    _aspect: 1.0,
    _ps: null,
    _coords: screen.createBuffer([0, 0, 0, 1, 1, 1, 1, 0])
};