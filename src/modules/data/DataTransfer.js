import uuidv4 from 'uuid/v4';
import _ from 'underscore';
import ClassWithEvents from "tbrtc-common/event/ClassWithEvents";
import Event from "tbrtc-common/event/Event";
import ValueChecker from 'tbrtc-common/utilities/ValueChecker';
import PeerConnection from "../connection/PeerConnection";
import FileInput from "../dom/FileInput";
import FileInputAlreadyExists from "../../exceptions/InputFileAlreadyExists";
import FilesNotChosen from "../../exceptions/FilesNotChosen";
import FileIsEmpty from "../../exceptions/FileIsEmpty";
import {File as TransferFile} from "./File";
import SentData from "./SentData";
import DataChannelNotOpened from "../../exceptions/DataChannelNotOpened";
import DataStats from "./DataStats";

/**
 * Mechanism of sending files throught WebRTC between two users
 */
class DataTransfer extends ClassWithEvents
{
    /**
     * Initialization of the mechanism and binding events
     *
     * @param {PeerConnection} peerConnection
     * @param {object} config
     */
    constructor(peerConnection, config) {
        ValueChecker.check({ peerConnection, config }, {
            "peerConnection": {
                "required": true,
                "typeof": 'object',
                "instanceof": PeerConnection
            },
            "config": {
                required: true,
                typeof: 'object'
            }
        });
        super();
        this._config = config;
        this._inputFields = {};
        this._pc = peerConnection;
        this._freshChannels = 0;
        this._pc.on('dchannel.created', this._receivedChannelHandle.bind(this));
    }

    /**
     * It adds passed file input to be observed
     *
     * @param {FileInput} input File to be observed
     */
    addFileInput(input) {
        ValueChecker.check({ input }, {
            "input": {
                "required": true,
                "typeof": 'object',
                "instanceof": FileInput
            }
        });

        if(typeof this._inputFields[input.id] !== "undefined") {
            throw new FileInputAlreadyExists(input.id);
        }
        this._inputFields[input.id] = input;
        this._inputFields[input.id].on('file.chosen', this._onChooseFiles.bind(this));
    }

    /**
     * It sends passed array of files
     *
     * @param {TransferFile[]} files Array of files to be sent
     */
    sendFiles(files = null) {
        ValueChecker.check({ files }, {
            "files": {
                "typeof": ['array', 'null'],
                "inside": {
                    "required": true,
                    "typeof": 'object',
                    "instanceof": TransferFile
                }
            }
        });
        if(Array.isArray(files)) {
            if(files.length < 1) {
                throw new FilesNotChosen();
            }
        } else {
            files = this._readFilesFromInput();
        }
        for(const file of files) {
            if(!this._config.emptyFiles) {
                throw new FileIsEmpty(file.name);
            }
            this.sendSingleFile(file);
        }
    }

    /**
     * It checks if the data transfer mechanism has fresh channels.
     * It means: channels which are requested to be created but they are not yet opened.
     *
     * @returns {boolean}
     */
    hasFreshChannels() {
        return this._freshChannels !== 0;
    }

    /**
     * It creates new data channel and sends the given file through it
     *
     * @param {TransferFile} file Single file chosen to be sent
     */
    sendSingleFile(file) {
        const timeout = 100;
        ValueChecker.check({ file }, {
            "file": {
                "required": true,
                "typeof": 'object',
                "instanceof": TransferFile
            }
        });
        const channelId = uuidv4();
        let stats = new DataStats(file.info.size, file.chunkNumber);
        let channel = this._pc.createDataChannel(channelId, this._config.dataChannel);
        ++this._freshChannels;
        let timestamp = 0;
        channel.onopen = () => {
            --this._freshChannels;
            this.dispatch('data.channel.opened', {
                channel,
            });
            timestamp = (new Date()).getTime();
            this.dispatch('send.file.started', {
                channelId: channel.label,
                file
            });
            file.chunkify();
        };
        channel.onclose = () => {
            this.dispatch('send.file.finished', {
                channelId: channel.label,
                file
            });
            channel = null;
            this.dispatch('data.channel.closed', {
                channelId
            });
        };
        channel.onerror = (error) => {
            this.dispatch('data.error.occured', {
                channelId: channel.label,
                error
            });
        };
        file.on('chunk.loaded', (event) => {
            setTimeout(() => {
                const { data } = event.data;
                const currentTimestamp = (new Date()).getTime();
                if(channel === null || channel.readyState !== 'open') {
                    this.dispatch('data.error.occured', {
                        error: new DataChannelNotOpened(channel.label, data.currentChunk, data.info.name, this._pc.remoteUser.name),
                        channelId: channel.label,
                    });
                }
                const size = this._sendSingleChunk(channel, data);
                stats.update(size, currentTimestamp - timestamp, data.currentChunk);
                this.dispatch('send.file.updated', {
                    channelId: channel.label,
                    file,
                    data,
                    stats
                });
            }, timeout);
        });
        file.on('chunk.failed', (event) => {
            const error = event.data.error;
            this.dispatch('error.occured', {
                channelId,
                error
            });
        });
    }

    /**
     * It sends single chunk trough the given channel
     *
     * @param {RTCDataChannel} channel
     * @param {SentData} data
     * @returns {number}
     * @private
     */
    _sendSingleChunk(channel, data) {
        if(channel === null) {
            return 0;
        }
        channel.send(JSON.stringify(data));
        return data.chunk.length;
    }

    /**
     * It prepares a collection of all selected files in all observed file inputs
     *
     * @returns {Array}
     * @private
     */
    _readFilesFromInput() {
        let allFiles = [];
        _.keys(this._inputFields).forEach(key => {
            allFiles = allFiles.concat(this._inputFields[key].files);
        });
        return allFiles;
    }

    /**
     * Callback being executed when remote channel has been created. It means a new file will be transmitted using that channel.
     *
     * @param {Event} event Event data
     * @private
     */
    _receivedChannelHandle(event) {
        let { channel } = event.data;
        const channelId = uuidv4();
        const file = new TransferFile(this._config);
        channel.onopen = () => {
            this.dispatch('data.channel.opened', {
                channelId,
                channel,
            });
        };
        channel.onclose = () => {
            this.dispatch('data.channel.closed', {
                channelId
            });
        };
        channel.onerror = (error) => {
            this.dispatch('data.error.occured', {
                channelId,
                error
            });
        };
        let stats = null;
        let timestamp = (new Date()).getTime();
        channel.onmessage = (message) => {
            const data = SentData.fromString(message.data);
            if(stats === null) {
                stats = new DataStats(data.info.size, data.chunkNumber);
                file.setInfo(data.info);
                this.dispatch('receive.file.started', {
                    sender: this._pc.remoteUser,
                    channelId,
                    file,
                });
            }
            file.addChunk(data);
            const currentTimestamp = (new Date()).getTime();
            stats.update(data.length, currentTimestamp - timestamp, data.currentChunk);
            this.dispatch('receive.file.updated', {
                channelId,
                data,
                file,
                stats,
                sender: this._pc.remoteUser,
            });
            timestamp = currentTimestamp;
            if(file.completed) {
                this.dispatch('receive.file.finished', {
                    channelId,
                    file,
                    sender: this._pc.remoteUser,
                });
                channel.close();
                channel = null;
            }
        };
    }

    /**
     * Callback being executed when any file in observed file inputs has been chosen
     *
     * @param {Event} event Event data
     * @private
     */
    _onChooseFiles(event) {
        if(this._config.enabled && this._config.autoSending) {
            this.sendFiles(event.data.files);
        }
    }

    /**
     * Array of available events for this class
     *
     * @property
     * @readonly
     * @type {string[]}
     */
    get builtInEvents() {
        return DataTransfer.eventsOfDataTransfer;
    }

    /**
     * Static field available by class name. It contains array of available events for this class.
     *
     * @property
     * @readonly
     * @type {string[]}
     */
    static get eventsOfDataTransfer() {
        return [
            'data.channel.opened',
            'data.channel.closed',
            'data.error.occured',
            'send.file.started',
            'send.file.updated',
            'send.file.finished',
            'receive.file.started',
            'receive.file.updated',
            'receive.file.finished',
        ];
    }
}

export default DataTransfer;