import FileInfo from "./FileInfo";

/**
 * This structure represents single packet with data used to transferring file through data channel
 */
class SentData {
    /**
     * Initialize class by setting data to be sent
     *
     * @param {FileInfo} info Information about sending file
     * @param {number} chunkNumber Total number of chunks of sending file
     * @param {number} currentChunk Number of current sent chunk
     * @param {number} size Original size of current sent chunk
     * @param {string|null} chunk Chunk data
     */
    constructor(info, chunkNumber, currentChunk, size, chunk = null) {
        this._info = info;
        this._chunkNumber = chunkNumber;
        this._currentChunk = currentChunk;
        this._size = size;
        this._chunk = chunk;
    }

    /**
     * Information about sending file
     *
     * @property
     * @readonly
     * @type {FileInfo}
     */
    get info() {
        return this._info;
    }

    /**
     * Chunk data
     *
     * @property
     * @readonly
     * @type {string|null}
     */
    get chunk() {
        return this._chunk;
    }

    /**
     * Total number of chunks of sending file
     *
     * @property
     * @readonly
     * @type {number}
     */
    get chunkNumber() {
        return this._chunkNumber;
    }

    /**
     * Number of current sent chunk
     *
     * @property
     * @readonly
     * @type {number}
     */
    get currentChunk() {
        return this._currentChunk;
    }

    /**
     * Size of current single chunk which is already sent
     *
     * @property
     * @readonly
     * @type {number}
     */
    get size() {
        return this._size;
    }

    /**
     * Flag if the packet is the first one
     *
     * @property
     * @readonly
     * @type {boolean}
     */
    get first() {
        return this._chunkNumber === 1;
    }

    /**
     * Flag if the packet is the last one
     *
     * @property
     * @readonly
     * @type {boolean}
     */
    get last() {
        return this._currentChunk === this._chunkNumber;
    }

    /**
     * It creates new object of SentData class from given string which contains stringified data
     *
     * @param {string} inputString
     * @return {SentData}
     */
    static fromString(inputString) {
        const object = JSON.parse(inputString);
        return new SentData(FileInfo.fromJSON(object._info), object._chunkNumber, object._currentChunk, object._size, object._chunk);
    }
}

export default SentData;