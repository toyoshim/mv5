framePlugins.wired = {
    init: function () {
        return new Promise(function (resolve, reject) {
            Promise.all([
                loadShader('frame', 'wired', 'shaders.html', 'vertex'),
                loadShader('frame', 'wired', 'shaders.html', 'fragment')
            ]).then(function (shaders) {
                var plugin = framePlugins.wired;
                plugin._vertexShader = shaders[0];
                plugin._fragmentShader = shaders[1];
                plugin._program = plugin._screen.createProgram(
                        plugin._screen.compileShader(
                                Tma3DScreen.VERTEX_SHADER,
                                plugin._vertexShader),
                        plugin._screen.compileShader(
                                Tma3DScreen.FRAGMENT_SHADER,
                                plugin._fragmentShader));
                plugin._lines = plugin._screen.createBuffer(function () {
                    var i = 0;
                    var lines = new Array()
                    for (var z = -900; z <= 900; z += 100) {
                        for (var x = -900; x <= 900; x += 100) {
                            lines[i + 0] = x;
                            lines[i + 1] = -900;
                            lines[i + 2] = z;
                            lines[i + 3] = x;
                            lines[i + 4] = 900;
                            lines[i + 5] = z;
                            i += 6;
                        }
                        for (var y = -900; y <= 900; y += 100) {
                            lines[i + 0] = -900;
                            lines[i + 1] = y;
                            lines[i + 2] = z;
                            lines[i + 3] = 900;
                            lines[i + 4] = y;
                            lines[i + 5] = z;
                            i += 6;
                        }
                    }
                    for (var x = -900; x <= 900; x += 100) {
                        for (var y = -900; y <= 900; y += 100) {
                            lines[i + 0] = x;
                            lines[i + 1] = y;
                            lines[i + 2] = -900;
                            lines[i + 3] = x;
                            lines[i + 4] = y;
                            lines[i + 5] = 900;
                            i += 6;
                        }
                    }
                    return lines;
                } ());
                plugin._lines.items = 1944;
                
                plugin._pMatrix = mat4.create();
                plugin.resize(plugin._screen.aspect);

                resolve();
            }, function (error) { console.log(error); });
        });
    },
    
    resize: function (aspect) {
        mat4.perspective(45, aspect, 0.1, 1000.0, this._pMatrix);
        mat4.translate(this._pMatrix, [ 0.0, 0.0, -250.0 ]);
        mat4.rotate(this._pMatrix, this._rotate, [ 0.1, 0.2, 0.0 ]);
    },
    
    draw: function (delta) {
        var rotate = 0.002 * delta;
        if (this._controller)
            rotate = rotate * (0.5 + this._controller.slider * 1.5);
        this._rotate += rotate;
        mat4.rotate(this._pMatrix, rotate, [ 0.1, 0.2, 0.0 ]);
        this._program.setUniformMatrix('uPMatrix', this._pMatrix);
        this._program.setAttributeArray(
                'aVertexPosition', this._lines, 0, 3, 0);
        this._program.drawArrays(Tma3DScreen.MODE_LINES, 0, this._lines.items);
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
    _program: null,
    _lines: null,
    _pMatrix: null,
    _rotate: 0.0
};