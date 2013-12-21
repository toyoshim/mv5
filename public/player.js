player = (function() {
    var context = new webkitAudioContext();
    var list = [
        [
            'songs/05 Pure Snows.mp3',
            'songs/2. Canal.mp3',
        ]
    ];
    var shotList = [];

    var load = function (n, path) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', path, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
            if (!this.response)
               return;
            player._context.decodeAudioData(this.response, function(buffer) {
                this._shots[n] = buffer;
                this._shotSources[n] = null;
                console.log('shot ' + n + ' loaded: ' + path);
            }.bind(player), function (error) { console.log(error); });
        }
        xhr.send();
    };
    for (var i = 0; i < shotList.length; ++i)
        load(i, shotList[i]);

    return {
        init: function () {
            this._delay = this._context.createDelay();
            this._delay.delayTime.value = 0.2;
            this._delay.connect(this._context.destination);
            this._gain = this._context.createGain();
            this._gain.connect(this._delay);
            this._analyser = this._context.createAnalyser();
            this._analyser.smoothingTimeConstant = 0.1;
            this._fft = new Float32Array(this._analyser.frequencyBinCount);
            controller.onstop = function (on) {
                if (!on)
                    return;
                player.stop();
            };
            controller.onnext = function (on) {
                if (!on)
                    return;
                player.next();
            };
            controller.onprev = function (on) {
                if (!on)
                    return;
                player.prev();
            };
            controller.onrecord = function (on) {
                if (!on)
                    return;
                player._set = 2;
                player._index = 0;
                player.play();
            };
            controller.ontrackprev = function (on) {
                if (!on)
                    return;
                player._set = 0;
                player._index = 0;
                player.play();
            };
            controller.ontracknext = function (on) {
                if (!on)
                    return;
                player._set = 1;
                player._index = 0;
                player.play();
            };
            var shot = function (n, on) {
                if (!on) {
                    player._shotSources[n].stop();
                    player._shotSources[n] = null;
                    return;
                }
                player._shotSources[n] = player._context.createBufferSource();
                player._shotSources[n].buffer = player._shots[n];
                player._shotSources[n].connect(player._gain);
                player._shotSources[n].start(0);
                console.log('shot ' + n);
            };
            controller.onset = function (on) { shot(0, on); }
            controller.onmarkerprev = function (on) { shot(1, on); }
        },

        play: function () {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', this._list[this._set][this._index], true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function() {
                if (!this.response)
                   return;
                player._context.decodeAudioData(this.response,
                            function(buffer) {
                    this.stop();
                    this._source = this._context.createBufferSource();
                    this._source.buffer = buffer;
                    this._source.onended = this.next;
                    this._source.connect(this._analyser);
                    this._source.connect(this._delay);
                    this._source.start(0);
                    console.log('music start: ' + this._list[this._set][this._index]);
                }.bind(player), function (error) { console.log(error); });
            };
            xhr.send();
        },
        stop: function () {
            if (player._source) {
                player._source.onended = null;
                player._source.stop();
            }
            player._source = null;
        },
        next: function () {
            player._index++;
            if (player._index == player._list[player._set].length)
                player._index = 0;
            player.play();
        },
        prev: function () {
            player._index--;
            if (player._index < 0)
                player._index = player._list[player._set].length - 1;
            player.play();
        },
        update: function () {
            this._gain.gain.value = controller.channels[7].slider;
            var value = 0.0;
            this._analyser.getFloatFrequencyData(this._fft);
            for (var i = 0; i < this._fft.length; ++i)
                value += this._fft[i] + 100.0;
            this.average = value / this._fft.length;
            this.average *= controller.channels[7].knob;
        },

        average: 0.0,
        _context: context,
        _gain: null,
        _delay: null,
        _analyser: null,
        _fft: null,
        _source: null,
        _list: list,
        _index: 0,
        _set: 0,
        _shots: [],
        _shotSources: [],
    };
})();
