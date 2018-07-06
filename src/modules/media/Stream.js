import _ from 'underscore'
import TrackNotFound from '../../exceptions/TrackNotFound';
import Volume from './Volume'

/**
 * This class wraps original MediaStream object and provides united functionality to get full control of it
 */
class Stream
{
    /**
     * Initialize stream wrapper
     *
     * @param {MediaStream} stream
     */
    constructor(stream) {
        this._stream = stream;
        this._volume = null;
    }

    /**
     * Original MediaStream
     *
     * @readonly
     * @property
     * @type {MediaStream}
     */
    get stream() {
        return this._stream;
    }

    /**
     * Object with data of audio part of the stream
     *
     * @readonly
     * @property
     * @type {object}
     */
    get audio() {
        const parent = this;

        return {
            /**
             * List of all audio tracks
             *
             * @readonly
             * @property
             * @type {MediaStreamTrack[]}
             */
            get tracks() {
                return parent._stream.getAudioTracks();
            },
            /**
             * Volume controller
             *
             * @readonly
             * @property
             * @type {Volume}
             */
            get volume() {
                if(parent._volume === null || parent._volume.stopped) {
                    parent._volume = new Volume(parent._stream);
                }
                return parent._volume;
            },
            /**
             * Returns object with settings of the selected media track
             *
             * @param {number|null} index Index of track
             * @returns {MediaTrackSettings}
             */
            getSettings: function(index = null) {
                return parent._findTrack("audio", index).getSettings();
            },
            /**
             * Returns object with settings of the selected media track
             *
             * @param {number|null} index Index of track
             * @returns {MediaTrackConstraints}
             */
            getConstraints: function(index = null) {
                return parent._findTrack("audio", index).getConstraints();
            },
            /**
             * It applies the given constraints
             * and returns promise which resolves when the constraints have been applied
             *
             * @param {MediaTrackConstraints} constraints The given constraints object
             * @param {number|null} index Index of track
             * @returns {Promise<void>}
             */
            applyConstraints: function(constraints, index = null) {
                return parent._findTrack("audio", index).applyConstraints(constraints);
            },
            /**
             * It enables the given track
             *
             * @param {number|null} index Index of track
             */
            enable: function(index = null) {
                parent._findTrack("audio", index).enabled = true;
            },
            /**
             * It disables the given track
             *
             * @param {number|null} index Index of track
             */
            disable: function(index = null) {
                parent._findTrack("audio", index).enabled = false;
            },
            /**
             * It stops the given track
             *
             * @param {number|null} index Index of track
             */
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
    /**
     * Object with data of video part of the stream
     *
     * @readonly
     * @property
     * @type {object}
     */
    get video() {
        const parent = this;

        return {
            /**
             * List of all video tracks
             *
             * @readonly
             * @property
             * @type {MediaStreamTrack[]}
             */
            get tracks() {
                return parent._stream.getVideoTracks();
            },
            /**
             * Returns object with settings of the selected media track
             *
             * @param {number|null} index Index of track
             * @returns {MediaTrackSettings}
             */
            getSettings: function(index = null) {
                return parent._findTrack("video", index).getSettings();
            },
            /**
             * Returns object with settings of the selected media track
             *
             * @param {number|null} index Index of track
             * @returns {MediaTrackConstraints}
             */
            getConstraints: function(index = null) {
                return parent._findTrack("video", index).getConstraints();
            },
            /**
             * It applies the given constraints
             * and returns promise which resolves when the constraints have been applied
             *
             * @param {MediaTrackConstraints} constraints The given constraints object
             * @param {number|null} index Index of track
             * @returns {Promise<void>}
             */
            applyConstraints: function(constraints, index = null) {
                return parent._findTrack("video", index).applyConstraints(constraints);
            },
            /**
             * It enables the given track
             *
             * @param {number|null} index Index of track
             */
            enable: function(index = null) {
                return parent._findTrack("video", index).enable = true;
            },
            /**
             * It disables the given track
             *
             * @param {number|null} index Index of track
             */
            disable: function(index = null) {
                return parent._findTrack("video", index).enable = false;
            },
            /**
             * It stops the given track
             *
             * @param {number|null} index Index of track
             */
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

    /**
     * It contains all tracks of both types: audio and video
     *
     * @readonly
     * @property
     * @type {MediaStreamTrack[]}
     */
    get tracks() {
        const audioTracks = this.audio.tracks;
        const videoTracks = this.video.tracks;
        return _.union(audioTracks, videoTracks);
    }
    /**
     * Flag if stream is active
     *
     * @readonly
     * @property
     * @type {boolean}
     */
    get active() {
        return this._stream.active;
    }

    /**
     * It stops the stream and its data
     */
    stop() {
        this.tracks.forEach(function(elem) {
            elem.stop();
        });
    }

    /**
     * Finds a track of the given kind. If the index of track is not passed, returned is the first track.
     *
     * @param {string} kind Kind of track: 'audio' or 'video'
     * @param {number|null} index Index of a track
     * @returns {MediaStreamTrack}
     * @private
     */
    _findTrack(kind, index = null) {
        if(index === null) {
            index = 0;
        }
        const trackSet = this[kind].tracks;
        if(typeof trackSet !== 'undefined') {
            return trackSet[index];
        } else {
            throw new TrackNotFound(index, kind);
        }
    }
}

export default Stream;