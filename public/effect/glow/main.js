effectPlugins.glow = {
    init: function () {
        return new Promise(function (resolve, reject) {
            Promise.all([
                loadShader('effect', 'glow', 'shaders.html', 'vertex'),
                loadShader('effect', 'glow', 'shaders.html', 'fragment'),
                loadShader('effect', 'glow', 'shaders.html', 'noEffectFragment')
            ]).then(function (shaders) {
                var plugin = effectPlugins.glow;
                plugin._vertexShader = shaders[0];
                plugin._fragmentShader = shaders[1];
                plugin._noEffectFragmentShader = shaders[2];
                plugin._program = plugin._screen.createProgram(
                        plugin._screen.compileShader(
                                Tma3DScreen.VERTEX_SHADER,
                                plugin._vertexShader),
                        plugin._screen.compileShader(
                                Tma3DScreen.FRAGMENT_SHADER,
                                plugin._fragmentShader));
                plugin._noEffect = plugin._screen.createProgram(
                        plugin._screen.compileShader(
                                Tma3DScreen.VERTEX_SHADER,
                                plugin._vertexShader),
                        plugin._screen.compileShader(
                                Tma3DScreen.FRAGMENT_SHADER,
                                plugin._noEffectFragmentShader));
                resolve();
            }, function (error) { console.log(error); });
        });
    },

    resize: function (aspect) {
    },
    
    draw: function (delta, texture) {
        var volume = 1.0;
        if (this._controller)
            volume = 3.0 * this._controller.slider;
        var t = 0.0;
        if (this._controller)
            t = this._controller.knob;
        if (volume != 0.0) {
            this._program.setAttributeArray('aCoord', this._coords, 0, 2, 0);
            this._program.setTexture('uTexture', texture);
            this._program.setUniformVector('uVolume', [volume]);
            this._program.setUniformVector('uT', [t]);
            this._program.drawArrays(Tma3DScreen.MODE_TRIANGLE_FAN, 0, 4);
        } else {
            /*
            this._noEffect.setAttributeArray('aCoord', this._coords, 0, 2, 0);
            this._noEffect.setTexture('uTexture', texture);
            this._noEffect.drawArrays(Tma3DScreen.MODE_TRIANGLE_FAN, 0, 4);
            */
        }
    },
    
    attach: function (controller) {
        this._controller = controller;
    },
    
    detach: function () {
        this._controller = null;
    },
    
    _controller: null,
    _screen: tmaScreen,
    _vertexShader: '',
    _fragmentShader: '',
    _noEffectFragmentShader: '',
    _program: null,
    _noEffect: null,
    _coords: tmaScreen.createBuffer([0, 0, 0, 1, 1, 1, 1, 0])
};