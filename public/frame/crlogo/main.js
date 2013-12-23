framePlugins.crlogo = {
    init: function () {
        return new Promise(function (resolve, reject) {
            var createLogo = function (name, path) {
                return new Promise(function (resolve, reject) {
                    loadImage('frame', 'crlogo', path).then(function (image) {
                        console.log('generating ' + name + ' logo from ' +
                                image.width + 'x' + image.height + ' image.');
                        var canvas = document.createElement('canvas');
                        canvas.width = image.width;
                        canvas.height = image.height;
                        var context = canvas.getContext('2d');
                        context.drawImage(
                                image, 0, 0, image.width, image.height);

                        var bitmap = context.getImageData(
                                0, 0, image.width, image.height).data;
                        var getPixel = function (x, y) {
                            var ix = x|0;
                            var iy = y|0;
                            if (ix < 0 || iy < 0 ||
                                    ix >= canvas.width || iy >= canvas.height)
                                return [0.0, 0.0, 0.0, 0.0];
                            var index = iy * image.width + ix;
                            var base = index * 4;
                            return [bitmap[base + 0] / 255,
                                    bitmap[base + 1] / 255,
                                    bitmap[base + 2] / 255,
                                    bitmap[base + 3] / 255];
                        };

                        var size = Math.max(image.width, image.height);
                        var offset_x = (image.width - size) / 2;
                        var offset_y = (image.height - size) / 2;
                        var resolution = 48;
                        var zoom = 4;
                        var step = size / resolution;

                        var y = offset_y;
                        for (var index_y = 0; index_y < resolution; ++index_y) {
                            var x = offset_x;
                            for (var index_x = 0; index_x < resolution;
                                    ++index_x) {
                                var c = getPixel(x, y);
                                x += step;
                                var px = index_x - resolution / 2 - 0.5;
                                var py = resolution / 2 - index_y - 0.5;
                                px *= zoom;
                                py *= zoom;
                                if ((c[0] > 0.7 && c[1] > 0.7 && c[2] > 0.7) ||
                                        (c[0] < 0.2 && c[1] < 0.2 &&
                                                c[2] < 0.2) ||
                                        c[3] < 0.3) {
                                    framePlugins.crlogo._data[name].raw.push(
                                            [px, py, 1.0, 1.0, 1.0, 0.0]);
                                } else {
                                    framePlugins.crlogo._data[name].raw.push(
                                            [px, py, c[0], c[1], c[2], c[3]]);
                                }
                            }
                            y += step;
                        }
                        resolve();
                    }, function (error) { console.log(error); });
                })
            };
            Promise.all([
                loadShader('frame', 'crlogo', 'shaders.html', 'vertex'),
                loadShader('frame', 'crlogo', 'shaders.html', 'fragment'),
                createLogo('chrome', 'chrome.png'),
                createLogo('drive', 'drive.png'),
                createLogo('droid', 'droid.png'),
                createLogo('html5', 'html5.png'),
                createLogo('map', 'map.png'),
                createLogo('mozc', 'mozc.png'),
                createLogo('play', 'play.png'),
                createLogo('search', 'search.png'),
                createLogo('youtube', 'youtube.png'),
                createLogo('intel', 'intel.jpg')
            ]).then(function (shaders) {
                var i;
                var plugin = framePlugins.crlogo;
                plugin._vertexShader = shaders[0];
                plugin._fragmentShader = shaders[1];
                plugin._program = plugin._screen.createProgram(
                        plugin._screen.compileShader(
                                Tma3DScreen.VERTEX_SHADER,
                                plugin._vertexShader),
                        plugin._screen.compileShader(
                                Tma3DScreen.FRAGMENT_SHADER,
                                plugin._fragmentShader));

                plugin._pMatrix = mat4.create();
                plugin._mvMatrix = mat4.create();
                plugin.resize(plugin._screen.aspect);
                mat4.identity(plugin._mvMatrix);

                var circle = [];
                for (i = 0; i < plugin._resolution; ++i) {
                    circle = circle.concat([0.0, 0.0, 0.0]);
                    var w = 2.0 * Math.PI * i / plugin._resolution;
                    circle = circle.concat([Math.cos(w), Math.sin(w), 0.0]);
                    w = 2.0 * Math.PI * (i + 1) / plugin._resolution;
                    circle = circle.concat([Math.cos(w), Math.sin(w), 0.0]);
                }
                var createVertices = function (data) {
                    var length = circle.length * data.length;
                    var vertices = new Array(length);
                    for (var i = 0; i < length; i += circle.length) {
                        for (var j = 0; j < circle.length; ++j)
                            vertices[i + j] = circle[j];
                    }
                    return vertices;
                };
                var createOffsets = function (data) {
                    var points = plugin._resolution * 3;
                    var length = data.length * 3 * points;
                    var offsets = new Array(length);
                    for (var i = 0; i < data.length; i++) {
                        var point = data[i];
                        var base = i * 3 * points;
                        for (var j = 0; j < 3 * points; j += 3) {
                            offsets[base + j + 0] = point[0];
                            offsets[base + j + 1] = point[1];
                            offsets[base + j + 2] = 0.0;
                        }
                    }
                    return offsets;
                };
                var createColors = function (data) {
                    var points = plugin._resolution * 3;
                    var length = data.length * 4 * points;
                    var offsets = new Array(length);
                    for (var i = 0; i < data.length; i++) {
                        var point = data[i];
                        var base = i * 4 * points;
                        for (var j = 0; j < 4 * points; j += 4) {
                            offsets[base + j + 0] = point[2];
                            offsets[base + j + 1] = point[3];
                            offsets[base + j + 2] = point[4];
                            offsets[base + j + 3] = point[5];
                        }
                    }
                    return offsets;
                };

                // Load logo.
                for (var i = 0; i < plugin._logos.length; ++i) {
                    var name = plugin._logos[i];
                    console.log('loading ' + name + ' logo');
                    var length = plugin._data[name].raw.length;
                    plugin._data[name].vertices =
                            createVertices(plugin._data.chrome.raw);
                    plugin._data[name].items =
                            plugin._resolution * 3 * length;
                    plugin._data[name].offsets =
                            createOffsets(plugin._data[name].raw);
                    plugin._data[name].colors =
                            createColors(plugin._data[name].raw);
                    console.log('done ' + length + ' vertices');
                }

                // Set chrome logo as active logo.
                name = 'chrome';
                plugin._vertices = plugin._screen.createBuffer(
                        plugin._data[name].vertices);
                plugin._vertices.items = plugin._data[name].items;
                plugin._offsets = plugin._screen.createBuffer(
                        plugin._data[name].offsets);
                plugin._colors = plugin._screen.createBuffer(
                        plugin._data[name].colors);
                plugin._psInit();
                plugin._ps = new framePlugins.crlogo.ParticleSystem(
                        plugin, plugin._data[name].raw);

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
        this._program.setUniformMatrix('uMVMatrix', this._mvMatrix);
        var rotate = 0.002 * delta;
        if (this._controller)
            rotate = rotate * (0.5 + this._controller.slider * 1.5);
        this._rotate += rotate;
        mat4.rotate(this._pMatrix, rotate, [ 0.1, 0.2, 0.0 ]);

        this._program.setUniformMatrix('uPMatrix', this._pMatrix);
        this._program.setAttributeArray(
                'aVertexPosition', this._vertices, 0, 3, 0);
        this._program.setAttributeArray(
                'aVertexOffset', this._offsets, 0, 3, 0);
        this._program.setAttributeArray(
                'aColor', this._colors, 0, 4, 0);
        this._program.drawArrays(Tma3DScreen.MODE_TRIANGLES, 0,
                this._vertices.items);
        this._ps.update(delta);
    },
    
    attach: function (controller) {
        this._controller = controller;
        this._controller.onsolo = function (on) {
            if (!on)
                return;
            this.crash();
        }.bind(this._ps);
        this._controller.onmute = function (on) {
            if (!on)
                return;
            this._mode = 1;
        }.bind(this._ps);
        this._controller.onrecord = function (on) {
            if (!on)
                return;
            if (this._morphDst == this._parent._data.intel.colors) {
                this._morphDst = this._parent._data[
                        this._parent._logos[this._morphIndex]].colors;
                this._morphSrc = this._parent._data.intel.colors;
            } else {
                this._morphSrc = this._parent._data[
                        this._parent._logos[this._morphIndex]].colors;
                this._morphDst = this._parent._data.intel.colors;
            }
            this._morphSpeed = 0.3;
            this._morph = true;
        }.bind(this._ps);
    },
    
    detach: function () {
        this._controller = null;
    },
    
    _psInit: function () {
        framePlugins.crlogo.ParticleSystem = function(parent, data) {
            this._random = Math.random;
            this._PI = Math.PI;
            this._sin = Math.sin;
            this._cos = Math.cos;
            this._pow = Math.pow;
            this._parent = parent;
            this._mode = 0;
            this._autoCount = 0;
            this._morph = false;
            this._morphSrc = null;
            this._morphDst = null;
            this._morphSpeed = 0.0;
            this._morphCount = 0.0;
            this._morphIndex = 0;
            this.length = data.length;
            this._x = new Float32Array(this.length);
            this._y = new Float32Array(this.length);
            this._z = new Float32Array(this.length);
            this._bx = new Float32Array(this.length);
            this._by = new Float32Array(this.length);
            this._bz = new Float32Array(this.length);
            this._vx = new Float32Array(this.length);
            this._vy = new Float32Array(this.length);
            this._vz = new Float32Array(this.length);
            this._gx = 0.0;
            this._gy = 0.0;
            this._gz = 0.0;
            this._rx = 0.0;
            this._ry = 0.0;
            for (var i = 0; i < this.length; ++i) {
                var p = data[i];
                this._x[i] = p[0];
                this._y[i] = p[1];
                this._z[i] = 0.0;
                this._bx[i] = p[0];
                this._by[i] = p[1];
                this._bz[i] = 0.0;
                this._vx[i] = 0.0;
                this._vy[i] = 0.0;
                this._vz[i] = 0.0;
            }
        };
        framePlugins.crlogo.ParticleSystem.prototype.crash = function () {
            this._mode = 0;
            for (var i = 0; i < this.length; ++i) {
                this._vx[i] = this._random() * 100 - 50;
                this._vy[i] = this._random() * 100 - 50;
                this._vz[i] = this._random() * 100 - 50;
            }
        };
        framePlugins.crlogo.ParticleSystem.prototype.pilot = function () {
            if (this._autoCount > 0) {
                this._autoCount--;
                return;
            }
            var timeout = Math.random() * 100;
            if (this._parent._controller)
                timeout = timeout / (this._parent._controller.knob * 2.2 + 0.2);

            this._mode = Math.floor(Math.random() * 4);
            if (this._mode == 0)
                timeout *= 1.6;
            this._autoCount = Math.floor(timeout);
            if (this._mode == 2)
                this.crash();
            if (this._mode == 3)
                this.autoMorph(false);
        };
        framePlugins.crlogo.ParticleSystem.prototype.autoMorph =
                function (force) {
            if (!force && Math.random() > 0.1) {
                this._mode = 0;
                return;
            }
            if (this._morph)
                return;
            var src = this._morphIndex;
            this._morphIndex++;
            if (this._morphIndex == (this._parent._logos.length - 1))
                this._morphIndex = 0;
            var dst = this._morphIndex;
            this.morph(this._parent._data[this._parent._logos[src]].colors,
                    this._parent._data[this._parent._logos[dst]].colors,
                    0.3);
            this._mode = 0;
        };
        framePlugins.crlogo.ParticleSystem.prototype.morph =
                function (src, dst, speed) {
            if (src.length != dst.length) {
                console.log('image size is different');
                return;
            }
            this._morphSrc = src;
            this._morphDst = dst;
            this._morphCount = 0;
            this._morphSpeed = speed;
            this._morph = true;
        };
        framePlugins.crlogo.ParticleSystem.prototype.update = function (delta) {
            this.pilot();
            
            if (this._morph) {
                this._morphCount += this._morphSpeed * delta;
                var ratio = this._morphCount / 1000;
                if (ratio >= 1.0) {
                    ratio = 1.0;
                    this._morph = false;
                }
                var colors = this._parent._colors.buffer();
                var sr = 1.0 - ratio;
                var dr = ratio;
                var length = this._morphSrc.length;
                for (var i = 0; i < length; ++i)
                    colors[i] = this._morphSrc[i] * sr + this._morphDst[i] * dr;
                this._parent._colors.update();
            }

            var buffer = this._parent._offsets.buffer();
            var points = this._parent._resolution * 3;
            var i;
            this._rx += 0.0002 * delta;
            this._ry += 0.0004 * delta;
            var radx = 2.0 * this._PI * this._rx / 360;
            var rady = 2.0 * this._PI * this._ry / 360;
            this._gx = this._sin(radx) * this._sin(rady);
            this._gy = this._cos(radx);
            this._gz = -this._sin(radx) * this._cos(rady);
            if (this._mode == 0) {
                var t1 = this._pow(0.9, delta / 30);
                var t2 = 0.01 *  delta / 30;
                for (i = 0; i < this.length; ++i) {
                    this._vx[i] *= t1;
                    this._vy[i] *= t1;
                    this._vz[i] *= t1;
                    this._vx[i] += (this._bx[i] - this._x[i]) * t2;
                    this._vy[i] += (this._by[i] - this._y[i]) * t2;
                    this._vz[i] += (this._bz[i] - this._z[i]) * t2;
                }
            } else {
                var gx = this._gx * delta / 30;
                var gy = this._gy * delta / 30;
                var gz = this._gz * delta / 30;
                var range = 100.0;
                for (i = 0; i < this.length; ++i) {
                    if (this._x[i] < -range || range < this._x[i])
                        this._vx[i] *= -1.0;
                    else
                        this._vx[i] += gx;
                    if (this._y[i] < -range || range < this._y[i])
                        this._vy[i] *= -1.0;
                    else
                        this._vy[i] += gy;
                    if (this._z[i] < -range || range < this._z[i])
                        this._vz[i] *= -1.0;
                    else
                        this._vz[i] += gz;
                }
            }
            var dst = 0;
            var zoom = 1.0;
            if (player)
                zoom = 1.0 + (player.average / 10.0);
            for (i = 0; i < this.length; ++i) {
                this._x[i] += this._vx[i];
                this._y[i] += this._vy[i];
                this._z[i] += this._vz[i];
                for (var point = 0; point < points; point++) {
                    buffer[dst + 0] = this._x[i] * zoom;
                    buffer[dst + 1] = this._y[i] * zoom;
                    buffer[dst + 2] = this._z[i] * zoom;
                    dst += 3;
                }
            }
            this._parent._offsets.update();
        };
    },
    
    _controller: null,
    _screen: tmaScreen,
    _vertexShader: '',
    _fragmentShader: '',
    _program: null,
    _pMatrix: null,
    _mvMatrix: null,
    _resolution: 4,
    _logos: [ 'chrome', 'drive', 'droid', 'html5', 'map', 'mozc', 'play',
            'search', 'youtube', 'intel'],
    _data: {
        // Note: Only colors are different.
        chrome: { raw: [], vertices: [], items: 0, offsets: [], colors: [] },
        drive: { raw: [], vertices: [], items: 0, offsets: [], colors: [] },
        droid: { raw: [], vertices: [], items: 0, offsets: [], colors: [] },
        html5: { raw: [], vertices: [], items: 0, offsets: [], colors: [] },
        map: { raw: [], vertices: [], items: 0, offsets: [], colors: [] },
        mozc: { raw: [], vertices: [], items: 0, offsets: [], colors: [] },
        play: { raw: [], vertices: [], items: 0, offsets: [], colors: [] },
        search: { raw: [], vertices: [], items: 0, offsets: [], colors: [] },
        youtube: { raw: [], vertices: [], items: 0, offsets: [], colors: [] },
        intel: { raw: [], vertices: [], items: 0, offsets: [], colors: [] }
    },
    _vertices: null,
    _offsets: null,
    _colors: null,
    _rotate: 0.0,
    _ps: null,

    ParticleSystem: null
};