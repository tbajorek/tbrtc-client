import _ from 'underscore'
import TrackNotFound from '../../exceptions/TrackNotFound';
import Volume from './Volume'

class Stream
{
    constructor(stream) {
        this._stream = stream;
        this._volume = null;
    }
    get stream() {
        return this._stream;
    }
    get audio() {
        var parent = this;

        return {
            get tracks() {
                return parent._stream.getAudioTracks();
            },
            get volume() {
                if(parent._volume === null || parent._volume.stopped) {
                    parent._volume = new Volume(parent._stream);
                }
                return parent._volume;
            },
            getSettings: function(index = null) {
                return parent._getDefaultTrack("audio", index).getSettings();
            },
            getConstraints: function(index = null) {
                return parent._getDefaultTrack("audio", index).getConstraints();
            },
            applyConstraints: function(constraints, index = null) {
                return parent._getDefaultTrack("audio", index).applyConstraints(constraints);
            },
            enable: function(index = null) {
                return parent._getDefaultTrack("audio", index).enable = true;
            },
            disable: function(index = null) {
                return parent._getDefaultTrack("audio", index).enable = false;
            },
            stop: function(index = null) {
                if(index !== null && typeof this.tracks[index] !== 'undefined') {
                    this.tracks[index].stop();
                } else {
                    this.tracks.forEach(function(elem){
                        elem.stop();
                    });
                }
            }
        };
    }
    get video() {
        var parent = this;

        return {
            get tracks() {
                return parent._stream.getVideoTracks();
            },
            getSettings: function(index = null) {
                return parent._getDefaultTrack("video", index).getSettings();
            },
            getConstraints: function(index = null) {
                return parent._getDefaultTrack("video", index).getConstraints();
            },
            applyConstraints: function(constraints, index = null) {
                return parent._getDefaultTrack("video", index).applyConstraints(constraints);
            },
            enable: function(index = null) {
                return parent._getDefaultTrack("video", index).enable = true;
            },
            disable: function(index = null) {
                return parent._getDefaultTrack("video", index).enable = false;
            },
            stop: function(index = null) {
                if(index !== null && typeof this.tracks[index] !== 'undefined') {
                    this.tracks[index].stop();
                } else {
                    this.tracks.forEach(function(elem){
                        elem.stop();
                    });
                }
            }
        };
    }
    get tracks() {
        var audioTracks = this.audio.tracks;
        var videoTracks = this.video.tracks;
        return _.union(audioTracks, videoTracks);
    }
    get active() {
        return this._stream.active;
    }
    stop() {
        this.tracks.forEach(function(elem) {
            elem.stop();
        });
    }
    _getDefaultTrack(kind, index = null) {
        if(index === null) {
            index = 0;
        }
        var trackSet = this[kind];
        if(typeof trackSet !== 'undefined') {
            return trackSet[index];
        } else {
            throw new TrackNotFound(index, kind);
        }
    }
}

export default Stream;