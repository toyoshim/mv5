controller = {
    _input: null,
    channels: [],
    onrecord: null,
    onplay: null,
    onstop: null,
    onnext: null,
    onprev: null,
    oncycle: null,
    ontrackprev: null,
    ontracknext: null,
    onset: null,
    onmarkerprev: null,
    onmarkernext: null
};

(function() {
    for (var i = 0; i < 8; ++i) {
        controller.channels[i] = {
            slider: 0.0,
            knob: 0.0,
            onsolo: null,
            onmute: null,
            onrecord: null
        };
    }
})();

if (!navigator['requestMIDIAccess']) {
    navigator.requestMIDIAccess = function() {
        return {
            then: function(accept, reject) { reject('MIDI disabled'); }
        };
    }
}

navigator.requestMIDIAccess().then(function (access) {
    console.log('MIDI enabled');
    try {
        var inputs = access.inputs();
        var input = null;
        var i;
        for (i = 0; i < inputs.length; ++i) {
            if (inputs[i].manufacturer != "KORG INC.")
                continue;
            if (inputs[i].name != "SLIDER/KNOB")
                continue;
            input = inputs[i];
            break;
        }
        if (!input)
            return;
        controller._input = input;
        console.log('nanoKONTROL2 found');
        input.onmidimessage = function (data) {
            var status = data.data[0];
            if (status != 0xb0) {
                console.log(data.data);
                return;
            }
            var id = data.data[1];
            var value = data.data[2] / 127.0;
            var ch = id;
            if (id < 8) {
                // Slider
                controller.channels[id].slider = value;
            } else if (id < 16) {
                console.log(data.data);
            } else if (id < 24) {
                // Knob
                ch = id - 16;
                controller.channels[ch].knob = value;
            } else if (id < 32) {
                console.log(data.data);
            } else if (id < 40) {
                // Solo
                ch = id - 32;
                if (controller.channels[ch].onsolo)
                    controller.channels[ch].onsolo(data.data[2] != 0);
            } else if (id < 48) {
                var callback = null;
                if (id == 41)
                    callback = controller.onplay;
                else if (id == 42)
                    callback = controller.onstop;
                else if (id == 43)
                    callback = controller.onprev;
                else if (id == 44)
                    callback = controller.onnext;
                else if (id == 45)
                    callback = controller.onrecord;
                else if (id == 46)
                    callback = controller.oncycle;
                else if (id == 47)
                    console.log(data.data);
                if (callback)
                    callback(data.data[2] != 0);
            } else if (id < 56) {
                // Mute
                ch = id - 48;
                if (controller.channels[ch].onmute)
                    controller.channels[ch].onmute(data.data[2] != 0);
            } else if (id == 58) {
                if (controller.ontrackprev)
                    controller.ontrackprev(data.data[2] != 0);
            } else if (id == 59) {
                if (controller.ontracknext)
                    controller.ontracknext(data.data[2] != 0);
            } else if (id == 60) {
                if (controller.onset)
                    controller.onset(data.data[2] != 0);
            } else if (id == 61) {
                if (controller.onmarkerprev)
                    controller.onmarkerprev(data.data[2] != 0);
            } else if (id == 62) {
                if (controller.onmarkernext)
                    controller.onmarkernext(data.data[2] != 0);
            } else if (id < 64) {
                console.log(data.data);
            } else if (id < 72) {
                // Mute
                ch = id - 64;
                if (controller.channels[ch].onrecord)
                    controller.channels[ch].onrecord(data.data[2] != 0);
            } else {
                console.log(data.data);
            }
        };
    } catch (e) { console.log(e); };
}, function (error) { console.log(error); });
