import ValueChecker from 'tbrtc-common/utilities/ValueChecker';

/**
 * Statistics about sending files
 */
class DataStats {
    /**
     * Initializing the statistic mechanism
     *
     * @param {number} fileSize Total size of sending file in bytes
     * @param {number} chunkNumber Total number of chunks
     */
    constructor(fileSize, chunkNumber) {
        ValueChecker.check({ fileSize, chunkNumber }, {
            "fileSize": {
                "required": true,
                "typeof": 'number'
            },
            "chunkNumber": {
                required: true,
                typeof: 'number'
            }
        });
        this._fileSize = fileSize;
        this._chunkNumber = chunkNumber;
        this._currentChunk = 0;
        this._percent = 0;
        this._maxSpeed = 0;
        this._currentSpeed = 0;
        this._sentBytes = 0;
    }

    /**
     * It updates statistics of sending files
     *
     * @param {number} currentSentBytes Number of bytes which are currently sent (at the moment of executing the method)
     * @param {number} sendingTime Total time of sending file process
     * @param {number} currentChunk Order number of currently sending chunk
     */
    update(currentSentBytes, sendingTime, currentChunk) {
        ValueChecker.check({ currentSentBytes, sendingTime, currentChunk }, {
            "currentSentBytes": {
                "required": true,
                "typeof": 'number'
            },
            "sendingTime": {
                required: true,
                typeof: 'number'
            },
            "currentChunk": {
                required: true,
                typeof: 'number'
            }
        });
        this._currentSpeed = Math.round((currentSentBytes - this._sentBytes) * 8 / sendingTime);
        this._maxSpeed = Math.max(this.currentSpeed, this._maxSpeed);
        this._currentChunk = currentChunk;
        this._sentBytes += currentSentBytes;
        this._percent = Math.round(this._sentBytes / this._fileSize);
    }

    /**
     * Total size of sending file in bytes
     *
     * @property
     * @readonly
     * @type {number}
     */
    get fileSize() {
        return this._fileSize;
    }

    /**
     * Total number of chunks
     *
     * @property
     * @readonly
     * @type {number}
     */
    get chunkNumber() {
        return this._chunkNumber;
    }

    /**
     * Order number of last sent chunk
     *
     * @property
     * @readonly
     * @type {number}
     */
    get currentChunk() {
        return this._currentChunk;
    }

    /**
     * Size of sent part of file in percentage
     *
     * @property
     * @readonly
     * @type {number}
     */
    get percent() {
        return this._percent;
    }

    /**
     * Maximal speed of sending file
     *
     * @property
     * @readonly
     * @type {number}
     */
    get maxSpeed() {
        return this._maxSpeed;
    }

    /**
     * Current speed of sending file, calcluated based on last chunk
     *
     * @property
     * @readonly
     * @type {number}
     */
    get currentSpeed() {
        return this._currentSpeed;
    }
}

export default DataStats;