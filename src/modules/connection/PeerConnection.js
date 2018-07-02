import _ from 'underscore';
import ClassWithEvents from 'tbrtc-common/event/ClassWithEvents';
import ValueChecker from 'tbrtc-common/utilities/ValueChecker';
import { IceCandidate } from 'tbrtc-common/model/IceCandidate';
import { Sdp } from 'tbrtc-common/model/Sdp';
import { User } from 'tbrtc-common/model/User';
import Stream from '../media/Stream';

class PeerConnection extends ClassWithEvents {
    /**
     * Initialization of single peer connection
     * 
     * @param {object} peerConfig Options of RTCPeerConnection
     * @param {User} localUser  Model of local user
     * @param {User} remoteUser Model of remote user
     * @param {Stream} localStream Object of local stream
     */
    constructor(peerConfig, localUser, remoteUser, localStream) {
        ValueChecker.check({ peerConfig, remoteUser, localStream }, {
            "peerConfig": {
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
                "required": true,
                "typeof": 'object',
                "instanceof": Stream
            }
        });
        super();
        this._localStream = localStream;
        this._localDescription = null;
        this._remoteDescription = null;
        this._localUser = localUser;
        this._remoteUser = remoteUser;

        this._pc = new RTCPeerConnection(peerConfig);
        this._pc.onicecandidate = this._onIceCandidate.bind(this);
        this._pc.oniceconnectionstatechange = this._onIceStateChange.bind(this);
        this._pc.onconnectionstatechange = this._onConnectionStateChange.bind(this);
        this._pc.onicegatheringstatechange = this._onIceGatheringStateChange.bind(this);
        this._pc.onsignalingstatechange = this._onSigStateChange.bind(this);
        this._pc.ontrack = this._onRemoteTrackAdded.bind(this);
        this._pc.ondatachannel = this._onDataChannelCreated.bind(this);
        this.addLocalStream(localStream);
        this.dispatch('init', { pc: this._pc, localStream });
    }

    /**
     * It closes the connection
     */
    close() {
        if (this._pc === null) {
            this.dispatch('error', { type: PeerConnection.ERRORS.NOT_CALLED, error: {} });
            return;
        }
        this._pc.close();
        this._pc = null;
        this.dispatch('closed');
    }

    /**
     * Adding of new local stream to the connection
     * 
     * @param {Stream} stream Object of added local stream
     */
    addLocalStream(stream) {
        if (this._pc === null) {
            this.dispatch('error', { type: PeerConnection.ERRORS.NOT_CALLED, error: {} });
            return;
        }
        ValueChecker.check({ stream }, {
            "stream": {
                "required": true,
                "typeof": 'object',
                "instanceof": Stream
            }
        });
        stream.tracks.forEach(track => {
            this._pc.addTrack(track, stream.stream);
        })
        this._pc.addStream(stream.stream);
        this.dispatch('lstream.added', { stream });
    }

    /**
     * It adds ICE candidate data from remote user
     * 
     * @param {IceCandidate} ice Object with ICE candidate data from remote user
     */
    addIceCandidate(ice) {
        if (this._pc === null) {
            this.dispatch('error', { type: PeerConnection.ERRORS.NOT_CALLED, error: {} });
            return;
        }
        this._pc.addIceCandidate(ice.iceCandidate);
        this.dispatch('ice.added', { ice });
    }

    /**
     * It creates an offer to start connection with remote user
     * 
     * @param {object} offerOptions Options of offer
     */
    createOffer(offerOptions = {}) {
        if (this._pc === null) {
            this.dispatch('error', { type: PeerConnection.ERRORS.NOT_CALLED, error: {} });
            return;
        }
        const fullOfferOptions = _.defaults(offerOptions, {
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 1
        });
        return this._pc.createOffer(fullOfferOptions)
            .then(desc => this._localDescription = desc)
            .then(desc => {
                this._pc.setLocalDescription(desc)
                    .then(() => {
                        const sdp = Sdp.fromDescription(desc, this.localUser);
                        this.dispatch('ldesc.added', { sdp });
                        this.dispatch('offer.created', { sdp });
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
            "stream": {
                "required": true,
                "typeof": 'object',
                "instanceof": Sdp
            }
        });
        this._pc.setRemoteDescription(sdp.description)
            .then(() => {
                if (sdp.type == 'offer') {
                    this._createAnswer();
                }
            }).catch(error => {
                this.dispatch('error', { type: PeerConnection.ERRORS.REMOTE_DESC_ERROR, error });
            });
    }

    get localStream() {
        return this._localStream;
    }

    /**
     * SDP data from local user
     * @readonly 
     * @type {Sdp|null}
     */
    get localDescription() {
        return this._localDescription;
    }

    /**
     * SDP data from remote user
     * @readonly 
     * @type {Sdp|null}
     */
    get remoteDescription() {
        return this._localDescription;
    }

    /**
     * Model of local user
     * @readonly 
     * @type {UserModel}
     */
    get localUser() {
        return this._localUser;
    }

    /**
     * Model of remote user
     * @readonly 
     * @type {UserModel}
     */
    get remoteUser() {
        return this._remoteUser;
    }

    _createAnswer() {
        if (this._pc === null) {
            this.dispatch('error', { type: PeerConnection.ERRORS.NOT_CALLED, error: {} });
            return;
        }
        this._pc.createAnswer()
            .then(desc => this._localDescription = desc)
            .then(desc => {
                this._pc.setLocalDescription(desc)
                    .then(() => {
                        const sdp = Sdp.fromDescription(desc, this.localUser);
                        this.dispatch('ldesc.added', { sdp });
                        this.dispatch('answer.created', { sdp });
                    })
                    .catch(error => {
                        this.dispatch('error', { type: PeerConnection.ERRORS.LOCAL_DESC_ERROR, error });
                    });
            }).catch(error => {
                this.dispatch('error', { type: PeerConnection.ERRORS.OFFER_ERROR, error });
            });
    };

    _onIceCandidate(event) {
        this.dispatch('ice.found', {
            ice: new IceCandidate(event.candidate, this.localUser),
            remoteUser: this.remoteUser
        });
    }

    _onConnectionStateChange(event) {
        this.dispatch('cstate.changed', { state: this._pc.connectionState, event });
    }

    _onIceStateChange(event) {
        this.dispatch('istate.changed', { state: this._pc.iceConnectionState, event });
    }

    _onSigStateChange(event) {
        this.dispatch('sigstate.changed', { state: this._pc.signalingState, event });
    }

    _onIceGatheringStateChange(event) {
        this.dispatch('igstate.changed', { state: this._pc.iceGatheringState, event });
    }

    _onRemoteTrackAdded(event) {
        this.dispatch('rstream.added', { stream: event.streams[0] });
    }

    _onDataChannelCreated(event) {
        this.dispatch('dchannel.created', {
            localUser: this.localUser,
            channel: event.channel
        });
    }

    dispatch(eventName, param) {
        super.dispatch(eventName, {...param, remoteUser: this.remoteUser });
    }

    get builtInEvents() {
        return [
            'init',
            'stop',
            'lstream.added',
            'rstream.added',
            'ldesc.added',
            'rdesc.added',
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
        };
    }
}

export default PeerConnection;