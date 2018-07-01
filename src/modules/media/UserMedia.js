import _ from 'underscore'
import BadParamType from 'tbrtc-common/exceptions/BadParamType';
import Constraints from '../config/Constraints'
import Compatibility from '../utilities/Compatibility'
import Stream from './Stream'

/**
 * It provides unified access to user media
 */
const UserMedia = {
    /**
     * Stream which is accessed by the provider
     */
    _stream: null,
    /**
     * Success callback
     * 
     * @param {Stream} stream - Stream object from accessed media
     */
    onSuccess: function(stream) { console.log(stream); },
    /**
     * Error callback
     * 
     * @param {MediaStreamError} error - Error object with details
     */
    onError: function(error) { console.error(error); },
    /**
     * This method allows to get access to user media. The access can be available in {@link onSuccess} method
     */
    get: function(constraints) {
        if (!_.isFunction(this.onSuccess)) {
            throw new BadParamType("onSuccess", "UserMedia.get", "function");
        }
        if (!_.isFunction(this.onError)) {
            throw new BadParamType("onError", "UserMedia.get", "function");
        }
        if (UserMedia._stream !== null) {
            this.stop();
        }
        if (Array.isArray(constraints)) {
            for (var i = 0; i < constraints.length; ++i) {
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
        }).catch(UserMedia.onError);
    },
    /**
     * You can stop stream if it's available
     */
    stop() {
        if (this._stream !== null) {
            this._stream.stop();
        }
        this._stream = null;
    }
};

export default UserMedia;