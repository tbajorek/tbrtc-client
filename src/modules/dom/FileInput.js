import _ from 'underscore';
import ClassWithEvents from "tbrtc-common/event/ClassWithEvents";
import TransportFile from "../data/TransferFile";

/**
 * It wraps original file input represents as HTMLInputFile and adds necessary functionality
 */
class FileInput extends ClassWithEvents {
    /**
     * Initialization of the wrapper
     *
     * @param {HTMLInputElement} inputElement Original input file object
     * @param {object} config Configuration object
     */
    constructor(inputElement, config) {
        super();
        this._config = config;
        this._input = inputElement;
        this._input.hidden = this._config.hideInput;
        this._files = [];
        if(this._config.acceptedTypes !== null) {
            this._input.accept = this._config.acceptedTypes;
        }
        this._input.setAttribute('multiple', this._config.multipleFiles);
        this._input.onchange = (e) => {
            this._files = _.map(e.target.files, (file) => {
                return new TransportFile(this._config, file);
            });
            this.dispatch('file.chosen', { files: this._files });
        };
    }

    /**
     * It opens remotely dialog for file input to choose files
     */
    openDialog() {
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
        });
        this._input.dispatchEvent(clickEvent);
    }

    /**
     * Identifier of file input
     *
     * @property
     * @readonly
     * @type {string}
     */
    get id() {
        return this._input.id;
    }

    /**
     * List of all files chosen in the file input
     *
     * @property
     * @readonly
     * @type {TransferFile[]}
     */
    get files() {
        return this._files;
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
            'file.chosen'
        ];
    }
}

export default FileInput;