class AnyError {

    constructor (message, source = null, details = {}) {
        this._message = message;
        this._source = source;
        this._details = details;
    }

    get message() {
        return this._message;
    }

    get source() {
        return this._source;
    }

    get details() {
        return this._details;
    }

    toString() {
        if (this.source !== null) {
            return `[${this.source}]: ${this.message}`;
        } else {
            return `${this.message}`;
        }
    }

}

export default AnyError;
