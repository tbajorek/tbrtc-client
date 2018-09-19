import uuidv4 from "uuid/v4";
import ClassWithEvents from "tbrtc-common/event/ClassWithEvents";
import readableFileSize from "tbrtc-common/utilities/readableFileSize";
import ValueChecker from 'tbrtc-common/utilities/ValueChecker';
import FileInfo from "./FileInfo";
import FileIsNotLoaded from "../../exceptions/FileIsNotLoaded";
import SentData from "./SentData";
import FileIsNotTheSame from "../../exceptions/FileIsNotTheSame";
import ChunkAlreadyExists from "../../exceptions/ChunkAlreadyExists";
import FileInfoNotExist from "../../exceptions/FileInfoNotExist";
import FileIsNotCompleted from "../../exceptions/FileIsNotCompleted";
import ChunkNotExist from "../../exceptions/ChunkNotExist";

/**
 * Class represents a single transmitted file through WebRTC data channel
 */
class TransferFile extends ClassWithEvents
{
    /**
     * Initialization of file
     *
     * @param {object} config Configuration object
     * @param {File|null} fileReference Reference to original file from input field
     */

    constructor(config, fileReference = null) {
        super();
        ValueChecker.check({ config, fileReference }, {
            "config": {
                "required": true,
                "typeof": 'object'
            },
            "fileReference": {
                "typeof": ['null', 'object'],
                "instanceof": File
            }
        });
        const fileId = uuidv4();
        this._config = config;
        this._fileReference = fileReference;
        if(fileReference !== null) {
            this.setInfo(new FileInfo(fileReference, fileId));
        } else {
            this._info = null;
            this._chunkNumber = 0;
        }
        this._currentChunk = 0;
        this._chunks = {};
        this._completed = false;
        this._binary = null;
    }

    /**
     * Operation of splitting the file to smaller chunks. Size value is given by the configuration.
     */
    chunkify() {
        if(this._fileReference === null) {
            throw new FileIsNotLoaded();
        }
        this._currentChunk = 0;
        const reader = new FileReader();
        let chunk;
        reader.onload = (event) => {
            chunk = event.target.result;
            this._chunks[this._currentChunk] = chunk;
            const size = atob(chunk.substr(chunk.indexOf(',') + 1)).length;
            const data = new SentData(this._info, this._chunkNumber, this._currentChunk, size, chunk);
            console.log('data', data);
            this.dispatch('chunk.loaded', {
                data,
            });
            if(this.isNextChunk()) {
                setTimeout(()=>reader.readAsDataURL(this._getNextChunk()), this._config.latency);
            } else {
                this._completeCreating();
            }
        };
        reader.onerror = (error) => {
            this.dispatch('chunk.failed', {
                chunkNumber: this._chunkNumber
            });
        };
        reader.readAsDataURL(this._getNextChunk());
    }

    /**
     * It sets the passed information about the file and calculates total number of chunks
     * (without operation of splitting).
     *
     * @param {FileInfo} info Structure with information about the file
     */
    setInfo(info) {
        ValueChecker.check({ info }, {
            "info": {
                "required": true,
                "typeof": 'object',
                "instanceof": FileInfo
            }
        });
        this._info = info;
        this._chunkNumber = this._calculateChunkNumber();
    }

    /**
     * It adds new chunk, received by data channel while receiving of the whole file is in progress
     *
     * @param {SentData} sentData Structure with received data with transferred chunk
     */
    addChunk(sentData) {
        ValueChecker.check({ sentData }, {
            "sentData": {
                "required": true,
                "typeof": 'object',
                "instanceof": SentData
            }
        });
        if(this._info === null) {
            if(this._chunkNumber === 0) {
                this.setInfo(sentData.info);
                this._chunkNumber = this._calculateChunkNumber();
            } else {
                throw new FileInfoNotExist(sentData.currentChunk, sentData.info.name);
            }
        }
        if(!this._info.compare(sentData.info)) {
            throw new FileIsNotTheSame(this._info.name, sentData.info.name);
        }
        if(typeof this._chunks[sentData.currentChunk] !== 'undefined') {
            throw new ChunkAlreadyExists(sentData.currentChunk, this._info.name);
        }
        this._chunks[sentData.currentChunk] = sentData.chunk;
        ++this._currentChunk;
        if(this._currentChunk === sentData.chunkNumber) {
            this._completeCreating();
        }
    }

    /**
     * It performs operation of downloading transferred file. Proper prompt will be shown to user of browser.
     */
    download() {
        const dataURL = URL.createObjectURL(this.binary);
        const link = document.createElement('a');
        link.target = '_blank';
        link.href = dataURL;
        link.download = this._info.name;
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
        });
        link.dispatchEvent(clickEvent);
        URL.revokeObjectURL(dataURL);
    }

    /**
     * Binary data with the whole file. If not all is transmitted, the exception {@link FileIsNotCompleted} is thrown.
     *
     * @readonly
     * @property
     * @type {Blob}
     */
    get binary() {
        if(this._binary === null) {
            if(this._completed === false) {
                throw new FileIsNotCompleted(this._info.name);
            }
            const data = [];
            for(let i = 1; i <= this._chunkNumber; ++i) {
                data.push(this._binarizeChunk(i));
            }
            this._binary = new Blob(data, { type: this._info.type });
        }
        return this._binary;
    }

    /**
     * It calculates total number of chunks based on information about total file size
     * and limit of chunk size coming from the configuration object
     *
     * @returns {number}
     * @private
     */
    _calculateChunkNumber() {
        return Math.ceil(this._info.size / this._config.maxChunkSize);
    }

    /**
     *
     * @param chunkId
     * @returns {Blob}
     * @private
     */
    _binarizeChunk(chunkId) {
        if(typeof this._chunks[chunkId] === 'undefined') {
            throw new ChunkNotExist(chunkId, this._info.name);
        }
        const chunk = this._chunks[chunkId];
        const decoded = atob(chunk.substr(chunk.indexOf(',') + 1));
        const array = new Uint8Array(decoded.length);
        for(let i = 0; i < decoded.length; ++i) {
            array[i] = decoded.charCodeAt(i);
        }
        return new Blob([array]);
    }

    /**
     * If all file is sent/received, this method perform an action being done when operations on the file are finished
     *
     * @private
     */
    _completeCreating() {
        if(!this.isNextChunk()) {
            this._completed = true;
            this.dispatch('file.finished', {
                binary: this.binary,
            });
        }
    }

    /**
     * It returns next chunk to be loaded. If there is no waiting chunk, null value is returned.
     *
     * @returns {Blob|null}
     * @private
     */
    _getNextChunk() {
        const startPosition = this._currentChunk * this._config.maxChunkSize;
        if(startPosition > this._info.size) {
            return null;
        }
        const endPosition = Math.min(startPosition + this._config.maxChunkSize, this._info.size);
        ++this._currentChunk;
        return this._fileReference.slice(startPosition, endPosition);
    }

    /**
     * It checks if there is a next chunk waiting to be loaded
     *
     * @returns {boolean}
     */
    isNextChunk() {
        return this._currentChunk * this._config.maxChunkSize < this._info.size && Object.values(this._chunks).length <= this._chunkNumber;
    }

    /**
     * Structure with information about the file
     *
     * @property
     * @readonly
     * @type {FileInfo}
     */
    get info() {
        return this._info;
    }

    /**
     * Number of chunks for which should be sliced input file
     *
     * @property
     * @readonly
     * @type {number}
     */
    get chunkNumber() {
        return this._chunkNumber;
    }

    /**
     * Flag if the whole file is sent/received
     *
     * @property
     * @readonly
     * @type {boolean}
     */
    get completed() {
        return this._completed;
    }

    /**
     * Human-readable file size with two precision numbers
     *
     * @property
     * @readonly
     * @type {string}
     */
    get readableSize() {
        return readableFileSize(this.info.size);
    }

    /**
     * Array of available events for this class
     *
     * @property
     * @readonly
     * @type {string[]}
     */
    get builtInEvents() {
        return [
            "chunk.loaded",
            "chunk.failed",
            "file.finished"
        ];
    }
}

export default TransferFile;