import Translation from 'tbrtc-common/translate/Translation';
import ClassWithEvents from 'tbrtc-common/event/ClassWithEvents';
import ValueChecker from 'tbrtc-common/utilities/ValueChecker';
import { IceCandidate } from 'tbrtc-common/model/IceCandidate';
import { Sdp } from 'tbrtc-common/model/Sdp';
import { User } from 'tbrtc-common/model/User';
import Stream from '../media/Stream';
import RemoteUserIsLocal from "../../exceptions/RemoteUserIsLocal";
import DataTransfer from "../data/DataTransfer";
import FileInput from "../dom/FileInput";

/**
 * This class represents single peer-to-peer connection, aggregated in MultiConnection class
 */
class PeerConnection extends ClassWithEvents {
    /**
     * Initialization of single peer connection
     * 
     * @param {object} config Options of tbRTC library
     * @param {User} localUser  Model of local user
     * @param {User} remoteUser Model of remote user
     * @param {Stream} localStream Object of local stream
     */
    constructor(config, localUser, remoteUser, localStream) {
        ValueChecker.check({ config, localUser, remoteUser, localStream }, {
            "config": {
                "required": true,
                "typeof": 'object'
            },
            "localUser": {
                "required": true,
                "typeof": 'object',
                "instanceof": User
            },
            "remoteUser": {
                "required": true,
                "typeof": 'object',
                "instanceof": User
            },
            "localStream": {
                "typeof": ['object', null],
                "instanceof": Stream
            }
        });
        super();
        this._config = config;
        this._localStream = localStream;
        this._localUser = localUser;
        this._remoteUser = remoteUser;
        if (remoteUser.id === this.localUser.id) {
            throw new RemoteUserIsLocal(remoteUser.name);
        }

        this._pc = new RTCPeerConnection(this._config.peerConfig);
        this._dataTransfer = new DataTransfer(this, this._config.filesConfig);
        this._pc.onnegotiationneeded = this._onNegotiationNeeded.bind(this);
        this._pc.onicecandidate = this._onIceCandidate.bind(this);
        this._pc.oniceconnectionstatechange = this._onIceStateChange.bind(this);
        this._pc.onconnectionstatechange = this._onConnectionStateChange.bind(this);
        this._pc.onicegatheringstatechange = this._onIceGatheringStateChange.bind(this);
        this._pc.onsignalingstatechange = this._onSigStateChange.bind(this);
        this._pc.ontrack = this._onRemoteTrackAdded.bind(this);
        this._pc.ondatachannel = this._onDataChannelCreated.bind(this);
        this._firstNegotiation = true;
        if(localStream !== null) {
            this.addLocalStream(localStream);
        }
        this._freshStream = false;
        this.dispatch('initialized', { pc: this._pc, localStream });
    }

    /**
     * It closes the connection
     */
    close() {
        if (this._pc === null || typeof this._pc.close !== 'function') {
            this.dispatch('error', { type: PeerConnection.ERRORS.NOT_CALLED, error: this._notCalledError() });
            return;
        }
        this._pc.close();
        this._pc = {};
        this.dispatch('closed');
    }

    /**
     * Adding of new local stream to the connection
     * 
     * @param {Stream} stream Object of added local stream
     */
    addLocalStream(stream) {
        if (this._pc === null) {
            this.dispatch('error', { type: PeerConnection.ERRORS.NOT_CALLED, error: this._notCalledError() });
            return;
        }
        ValueChecker.check({ stream }, {
            "stream": {
                "required": true,
                "typeof": 'object',
                "instanceof": Stream
            }
        });
        this._freshStream = true;
        this._localStream = stream;
        const senders = this._pc.getSenders();console.log('senders', senders);
        stream.tracks.forEach(track => {console.log('analyzed track', track);
            if(!senders.find(sender => sender.track && sender.track.id === track.id)) {
                this._pc.addTrack(track, stream.stream);console.log('track.added');
            }
        });
        this.dispatch('lstream.added', { stream });
    }

    /**
     * It adds ICE candidate data from remote user
     * 
     * @param {IceCandidate} ice Object with ICE candidate data from remote user
     */
    addIceCandidate(ice) {
        if (this._pc === null) {
            this.dispatch('error', { type: PeerConnection.ERRORS.NOT_CALLED, error: this._notCalledError() });
            return;
        }
        ValueChecker.check({ ice }, {
            "ice": {
                "required": true,
                "typeof": 'object',
                "instanceof": IceCandidate
            }
        });
        this._pc.addIceCandidate(new RTCIceCandidate(ice.iceCandidate));
        this.dispatch('ice.added', { ice });
    }

    /**
     * It adds new file input field to be observed. After that, according to configuration, file can be sent immediately after being chosen.
     *
     * @param {FileInput} fileInput Object of wrapped HTML file input field
     */
    addFileInput(fileInput) {
        ValueChecker.check({ fileInput }, {
            "fileInput": {
                "required": true,
                "typeof": 'object',
                "instanceof": FileInput
            }
        });
        this._dataTransfer.addFileInput(fileInput);
    }

    _isSdpEmpty(sdp) {
        return sdp === null || sdp.sdp === '';
    }

    /**
     * It creates an offer to start connection with remote user
     */
    createOffer() {console.log('create offer');
        this._firstNegotiation = true;
        if (this._pc === null) {
            this.dispatch('error', { type: PeerConnection.ERRORS.NOT_CALLED, error: this._notCalledError() });
            return;
        }
        if (!this._isSdpEmpty(this._pc.localDescription) && !(this._dataTransfer.hasFreshChannels() || this._freshStream)) {
            this.dispatch('error', {
                type: PeerConnection.ERRORS.OFFER_ALREADY_CREATED,
                error: new Error(
                    Translation.instance._('Connection offer between local user ({luser}) and remote ({ruser}) is already created', {
                        "luser": this._localUser.name,
                        "ruser": this._remoteUser.name
                    })
                )
            });
            return;
        }

        return this._pc.createOffer(this._config.offerOptions)
            .then(desc => {
                const sdp = Sdp.fromDescription(desc, this.localUser);
                this._pc.setLocalDescription(sdp.description)
                    .then(() => {
                        this._offered = true;
                        this.dispatch('offer.created', { sdp });
                        this.dispatch('ldesc.added', { sdp });
                    })
                    .catch(error => {
                        this.dispatch('error', { type: PeerConnection.ERRORS.LOCAL_DESC_ERROR, error });
                    });
            }).catch(error => {
                this.dispatch('error', { type: PeerConnection.ERRORS.OFFER_ERROR, error });
            });
    }

    /**
     * It sets session description from remote user
     * 
     * @param {Sdp} sdp SDP data from remote user
     */
    setRemoteDescription(sdp) {
        ValueChecker.check({ sdp }, {
            "sdp": {
                "required": true,
                "typeof": 'object',
                "instanceof": Sdp
            }
        });
        this._pc.setRemoteDescription(sdp.description)
            .then(() => {
                this.dispatch('rdesc.added', { sdp });
                if (sdp.type == 'offer') {
                    this._createAnswer();
                }
            }).catch(error => {
                this.dispatch('error', { type: PeerConnection.ERRORS.REMOTE_DESC_ERROR, error });
            });
    }

    /**
     * This method is used to create new instance of data channel class
     *
     * @param {string|null} label Label of created channel
     * @param {object|null} options List of options used to create data channel
     *
     * @returns {RTCDataChannel}
     */
    createDataChannel(label = null, options = null) {
        return this._pc.createDataChannel(label, options);
    }

    /**
     * It sends the given files to remote user.
     * If any file is not given, it will send files from observed inputs.
     *
     * @param {TransferFile[]|null} files Files to be sent
     */
    sendFiles(files = null) {
        this._dataTransfer.sendFiles(files);
    }

    /**
     * Local stream object if user media are used
     *
     * @readonly
     * @property
     * @type  {Stream|null}
     */
    get localStream() {
        return this._localStream;
    }

    /**
     * SDP data from local user
     *
     * @readonly
     * @property
     * @type {RTCSessionDescription|null}
     */
    get localDescription() {
        return this._pc.localDescription;
    }

    /**
     * SDP data from remote user
     *
     * @readonly
     * @property
     * @type {RTCSessionDescription|null}
     */
    get remoteDescription() {
        return this._pc.remoteDescription;
    }

    /**
     * Model of local user
     *
     * @readonly
     * @property
     * @type {UserModel}
     */
    get localUser() {
        return this._localUser;
    }

    /**
     * Model of remote user
     *
     * @readonly
     * @property
     * @type {UserModel}
     */
    get remoteUser() {
        return this._remoteUser;
    }

    /**
     * Object of data transport mechanism
     *
     * @readonly
     * @property
     * @type {UserModel}
     */
    get dataTransfer() {
        return this._dataTransfer;
    }

    /**
     * Value of ICE connection state
     *
     * @readonly
     * @property
     * @type {RTCIceConnectionState}
     */
    get connectionState() {
        return this._pc.iceConnectionState;
    }

    /**
     * Creator of error thrown when peer connection is not initialized before doing some operation
     *
     * @returns {Error}
     * @private
     */
    _notCalledError() {
        return new Error(
            Translation.instance._('Single peer connection to {runame} is not yet initialized', {
                "runame": this._remoteUser.name
            })
        );
    }

    /**
     * It creates an answer to received SDP offer
     *
     * @private
     */
    _createAnswer() {
        if (this._pc === null) {
            this.dispatch('error', { type: PeerConnection.ERRORS.NOT_CALLED, error: this._notCalledError() });
            return;
        }
        this._pc.createAnswer()
            .then(desc => {
                const sdp = Sdp.fromDescription(desc, this.localUser);
                this._pc.setLocalDescription(sdp.description)
                    .then(() => {
                        this.dispatch('answer.created', { sdp });
                        this.dispatch('ldesc.added', { sdp });
                    })
                    .catch(error => {
                        this.dispatch('error', { type: PeerConnection.ERRORS.LOCAL_DESC_ERROR, error });
                    });
            }).catch(error => {
                this.dispatch('error', { type: PeerConnection.ERRORS.OFFER_ERROR, error });
            });
    };

    /**
     * Callback being executed when negotiation between two peers is needed
     *
     * @param {Event} event Event data
     * @private
     */
    _onNegotiationNeeded(event) {console.log('negotiation needed', this._firstNegotiation, this._pc.iceConnectionState, this._freshStream);
        if((this._firstNegotiation && this._freshStream) || ['connected', 'completed'].indexOf(this._pc.iceConnectionState) >= 0 && this._dataTransfer.hasFreshChannels()) {
            this.createOffer();
        }
        this._freshStream = false;
    }

    /**
     * Callback being executed when local ICE agent wants to send negotiation message to remote one
     *
     * @param {RTCPeerConnectionIceEvent} event Event data
     * @private
     */
    _onIceCandidate(event) {
        if(event.candidate) {
            this.dispatch('ice.found', {
                ice: new IceCandidate(event.candidate, this.localUser),
                remoteUser: this.remoteUser
            });
        }
    }

    /**
     * Callback being executed when total state of the connection is changed
     *
     * @param {Event} event Event data
     * @private
     */
    _onConnectionStateChange(event) {
        this.dispatch('cstate.changed', { state: this._pc.connectionState, event });
    }

    /**
     * Callback being executed when state of connection's ICE agent is changed
     *
     * @param {Event} event Event data
     * @private
     */
    _onIceStateChange(event) {
        this.dispatch('istate.changed', { state: this._pc.iceConnectionState, event });
    }

    /**
     * Callback being executed when signaling state of the connection is changed
     *
     * @param {Event} event Event data
     * @private
     */
    _onSigStateChange(event) {
        this.dispatch('sigstate.changed', { state: this._pc.signalingState, event });
    }

    /**
     * Callback being executed when the state of ICE gathering operation is changed
     *
     * @param {Event} event Event data
     * @private
     */
    _onIceGatheringStateChange(event) {
        this.dispatch('igstate.changed', { state: this._pc.iceGatheringState, event });
    }

    /**
     * Callback being executed when new incoming remote track has been created and received
     *
     * @param {RTCTrackEvent} event Event data
     * @private
     */
    _onRemoteTrackAdded(event) {console.log('new remote track', event.streams);window.remoteStream = event.streams[0];
        this.dispatch('rstream.added', { stream: new Stream(event.streams[0]) });
    }

    /**
     * Callback being executed when new data channel is added to the connection by remote user
     *
     * @param {RTCDataChannelEvent} event Event data
     * @private
     */
    _onDataChannelCreated(event) {
        this.dispatch('dchannel.created', {
            localUser: this.localUser,
            channel: event.channel
        });
    }

    /**
     * It starts the execution of the specified event with passed parameters
     *
     * @param {string} eventName Name of executed event
     * @param {object} param Parameters passed to event callbacks
     */
    dispatch(eventName, param) {
        super.dispatch(eventName, {...param, remoteUser: this.remoteUser });
    }

    /**
     * Array of available events for this class
     *
     * @property
     * @readonly
     * @type {string[]}
     */
    get builtInEvents() {
        return PeerConnection.eventsOfConnection;
    }

    /**
     * Static field available by class name. It contains array of available events for this class.
     *
     * @property
     * @readonly
     * @type {string[]}
     */
    static get eventsOfConnection() {
        return [
            'initialized',
            'closed',
            'lstream.added',
            'rstream.added',
            'ldesc.added',
            'rdesc.added',
            'offer.created',
            'answer.created',
            'sdp.set',
            'ice.found',
            'ice.added',
            'cstate.changed',
            'istate.changed',
            'sigstate.changed',
            'igstate.changed',
            'dchannel.created',
            'error',
        ];
    }

    static get ERRORS() {
        return {
            "NOT_CALLED": 1,
            "ALREADY_CALLED": 2,
            "LOCAL_DESC_ERROR": 3,
            "REMOTE_DESC_ERROR": 4,
            "OFFER_ERROR": 5,
            "ANSWER_ERROR": 6,
            "OFFER_ALREADY_CREATED": 7,
        };
    }
}

export default PeerConnection;