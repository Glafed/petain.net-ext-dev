var howlInstance;
var howlMethods = [];
var currentSong = {
    title: '',
    artist: '',
    album: '',
    duration: 0,
    currentTime: 0,
    startedAt: 0,
    endAt: 0,
    src: ''
};

function WaitForHowl() {
    return new Promise(resolve => {
        const checkHowl = () => {
            if (window.Howl) {
                resolve(window.Howl);
            } else {
                setTimeout(checkHowl, 200);
            }
        };
        checkHowl();
    });
}

function SetCurrentSong(data) {
    if (!data) return;

    const pathParts = data._src.split("music")[1].split("/");
    const artistAlbumPart = pathParts[1];
    const title = pathParts[2].split(".")[0].replace(/^\d+ - | - \d+$|^\d+ | \d+$/, '');

    let artist, album;

    if (artistAlbumPart.includes(" - ")) {
        [artist, album] = artistAlbumPart.split(" - ");
        artist = artist.replace(/\d+$/, '').trim();
    } else {
        artist = artistAlbumPart.replace(/\d+$/, '').trim();
        album = artistAlbumPart.match(/\d+$/) ? artistAlbumPart.match(/\d+$/)[0] : "Album Inconnu";
    }

    currentSong = {
        title: title,
        artist: artist,
        album: album,
        duration: data.duration,
        startedAt: data.startedAt,
        endAt: data.endAt,
        src: data._src
    }
}

function UpdateCurrentSong(data, toUpdate) {
    if (!data) return;

    currentSong[toUpdate] = data;
}

function SendMediaInfo(event) {

    var data;

    switch (event) {
        case 'play':
            data = {
                msg: 'MEDIA_INFOS',
                song_data: currentSong,
                event: 'play'
            }
            break;
        case 'pause':
            data = {
                msg: 'MEDIA_INFOS',
                song_data: currentSong,
                event: 'pause'
            }
            break;
        case 'refresh':
            data = {
                msg: 'MEDIA_INFOS',
                song_data: currentSong,
                event: 'refresh'
            }
            break;
    }

    window.postMessage({
        message: 'FROM_MEDIA_HANDLER',
        body: data
    }, '*');

}

function GetObjectMethods(proto) {
    let methods = new Set();

    Object.getOwnPropertyNames(proto).forEach(p => methods.add(p));

    if (methods.size <= 0) return;

    methods = [...methods].filter(method => {
        return typeof proto[method] === 'function' && method !== 'constructor';
    });

    return methods;
}

window.addEventListener('message', async (message) => {

    if (message.source !== window) return;

    if (message.data.message !== 'FROM_CONTENT_LOADER') return

    if (message.data.body !== 'MEDIA_INFOS') return

    
    
    if (howlInstance && typeof howlInstance.seek === 'function') {
        await howlInstance.seek();
    } else {
        console.error("howlInstance is not defined or does not have a seek method");
    }
    
    SendMediaInfo('refresh');

    /*window.postMessage({
        message: 'FROM_MEDIA_HANDLER',
        body: {
            msg: 'MEDIA_INFOS',
            song_data: currentSong,
            event: 'refresh'
        }
    });*/
});

(function () {

    if (window.hasRun) return;
    window.hasRun = true;

    const settings = {
        "enabled": true,
        "hookHowler": false,
        "hookHowl": true,
        "debug": true,
        "interval": 1000
    };

    function OverrideAndApplyHooks(instance) {
        console.log('Overriding Howl functions started.');

        var blacklist = [
            "init",
            "_emit"
        ];

        var whitelist = [
            "play",
            "pause",
            "stop",
            "seek",
            "volume",
            "mute"
        ]

        howlMethods = GetObjectMethods(instance.prototype);

        howlMethods.forEach(method => {
            if (blacklist.includes(method)) return;
            const originalMethod = instance.prototype[method];

            if (!originalMethod) return;

            instance.prototype[method] = function () {
                const args = Array.from(arguments);
                //if(whitelist.includes(method)) console.info(`Howl method ${method} called with arguments: `, args);

                switch (method) {
                    case 'play':
                        var startTime = Date.now();
                        endTime = startTime + (this.duration() * 1000);

                        if (this.seek() > 0) {
                            startTime = startTime - (this.seek() * 1000); // it's js, we're never sure

                            UpdateCurrentSong(this.seek(), 'currentTime');

                        }

                        SetCurrentSong({
                            _src: this._src,
                            duration: this.duration(),
                            startedAt: startTime,
                            endAt: endTime
                        });

                        SendMediaInfo('play');
                        break;
                    case 'pause':

                        UpdateCurrentSong(this._sounds[0]._seek, 'currentTime');

                        SendMediaInfo('pause');
                        break;
                    case 'seek':
                        if (Array.isArray(this._sounds)) {
                            this._sounds.forEach(sound => {
                                UpdateCurrentSong(sound._seek, 'currentTime');
                            });
                        } else {
                            console.error('this._sounds is not an array or is undefined:', this._sounds);
                        }
                        //UpdateCurrentSong(this._sounds[0]._seek, 'currentTime');
                        break;
                }


                return originalMethod.apply(this, arguments);
            };
            //console.log(`Overrided Howl method: ${method}`);
        });
    }

    async function main() {
        if (settings.debug) console.log('hookScript.js loaded');

        howlInstance = await WaitForHowl();

        if (!settings.hookHowl) return;

        OverrideAndApplyHooks(howlInstance);
    }

    if (!settings.enabled) return;

    main();

})();