import _ from 'underscore';
import ValueChecker from 'tbrtc-common/utilities/ValueChecker';
import { AbstractModel } from 'tbrtc-common/model/AbstractModel';

/**
 * Structure represents information about transferred file
 */
class FileInfo extends AbstractModel {
    /**
     * It sets basic information
     *
     * @param {File} file Original file from input element
     * @param {string} fileId
     */
    constructor(file, fileId) {
        super();
        this._name = file.name;
        this._size = file.size;
        this._lastModifiedDate = file.lastModifiedDate;
        this._type = file.type;
        this._fileId = fileId;
    }

    /**
     * Name of file
     *
     * @property
     * @readonly
     * @type {string}
     */
    get name() {
        return this._name;
    }

    /**
     * Size of transferred file in bytes
     *
     * @property
     * @readonly
     * @type {number}
     */
    get size() {
        return this._size;
    }

    /**
     * Object with information about date when the file has been last time modified
     *
     * @property
     * @readonly
     * @type {Date}
     */
    get lastModifiedDate() {
        return this._lastModifiedDate;
    }

    /**
     * MIME type of file
     *
     * @property
     * @readonly
     * @type {string}
     */
    get type() {
        return this._type;
    }

    /**
     * Id of file
     *
     * @property
     * @readonly
     * @type {string}
     */
    get fileId() {
        return this._fileId;
    }

    /**
     * Comparation if two objects with information are equal or not
     *
     * @param {FileInfo} fileInfo Second FileInfo object
     * @return {boolean}
     */

    compare(fileInfo) {
        ValueChecker.check({ fileInfo }, {
            "fileInfo": {
                "required": true,
                "typeof": 'object',
                "instanceof": FileInfo
            }
        });
        return _.isEqual(this, fileInfo);
    }

    /**
     * Map with information helpful to the serialization/deserialization process
     *
     * @return {object}
     * @private
     */
    get _serializedMap() {
        return {
            name: '_name',
            size: '_size',
            lastModifiedDate: '_lastModifiedDate',
            type: '_type',
            fileId: '_fileId',
        };
    }

    /**
     * It creates empty object. It is used in deserialization process
     *
     * @return {FileInfo}
     * @private
     */
    static _createEmpty() {
        return new FileInfo({}, null);
    }
}

export default FileInfo;