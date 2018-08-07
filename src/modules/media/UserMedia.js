import _ from 'underscore';
import Translation from 'tbrtc-common/translate/Translation';
import BadParamType from 'tbrtc-common/exceptions/BadParamType';
import Stream from './Stream'

/**
 * It provides unified access to user media
 */
const UserMedia = {
    /**
     * Stream which is accessed by the provider
     *
     * @type {Stream|null}
     * @property
     */
    _stream: null,
    /**
     * Flag if debug mode is activated
     *
     * @type {boolean}
     * @property
     */
    debug: false,
    /**
     * Success callback
     *
     * @method
     * @param {Stream} stream - Stream object from accessed media
     */
    onSuccess: function(stream) {
        if(UserMedia.debug) {
            const message = Translation.instance._('User media has been got successfully');
            console.info(message);
        }
    },
    /**
     * Error callback
     *
     * @method
     * @param {MediaStreamError} error - Error object with details
     */
    onError: function(error) {
        if(UserMedia.debug) {
            const message = Translation.instance._('Error in {uname} module: ({etype}) {emsg}', {
                uname: 'UserMedia',
                etype: error.name,
                emsg: error.message
            });
            console.error(message);
        }
    },
    /**
     * This method allows to get access to user media. The access can be available in {@link onSuccess} method
     *
     * @method
     * @param {object} constraints Object with constraints data
     * @returns {Promise<MediaStream>}
     */
    get: function(constraints) {
        if (!_.isFunction(UserMedia.onSuccess)) {
            throw new BadParamType("onSuccess", "UserMedia.get", "function");
        }
        if (!_.isFunction(UserMedia.onError)) {
            throw new BadParamType("onError", "UserMedia.get", "function");
        }
        if (UserMedia._stream !== null) {
            UserMedia.stop();
        }
        if (Array.isArray(constraints)) {
            for (let i = 0; i < constraints.length; ++i) {
                if (typeof constraints[i] === 'function') {
                    constraints[i] = constraints[i]();
                }
            }
            constraints = Object.assign({}, ...constraints);
        } else if (typeof constraints !== 'object') {
            throw new BadParamType("constraints", "UserMedia.get", "array/object");
        }
        return navigator.mediaDevices.getUserMedia(constraints).
        then(function(s) {
            UserMedia._stream = new Stream(s);
            UserMedia.onSuccess(UserMedia._stream);
            return UserMedia._stream;
        }).catch(UserMedia.onError);
    },
    /**
     * It stops yhe current stream if it's available
     *
     * @method
     */
    stop() {
        if (UserMedia._stream !== null) {
            UserMedia._stream.stop();
        }
        UserMedia._stream = null;
    }
};

export default UserMedia;