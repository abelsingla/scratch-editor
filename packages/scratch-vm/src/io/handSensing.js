const HAND_COUNT_LIMIT = 2;
const LANDMARK_COUNT = 21;
const RAW_MEDIA_FIELDS = ['frame', 'image', 'imageData', 'video'];

const clampConfidence = value => Math.max(0, Math.min(1, Number(value) || 0));

const normalizeLandmark = landmark => {
    if (!landmark || !Number.isFinite(landmark.x) || !Number.isFinite(landmark.y)) {
        return null;
    }

    return {
        x: landmark.x,
        y: landmark.y,
        z: Number.isFinite(landmark.z) ? landmark.z : 0
    };
};

const normalizeHand = hand => {
    if (!hand || (hand.handedness !== 'left' && hand.handedness !== 'right')) {
        return null;
    }

    const landmarks = Array.isArray(hand.landmarks) ?
        hand.landmarks.slice(0, LANDMARK_COUNT).map(normalizeLandmark) : [];

    return {
        handedness: hand.handedness,
        confidence: clampConfidence(hand.confidence),
        gesture: typeof hand.gesture === 'string' ? hand.gesture : 'none',
        gestureConfidence: clampConfidence(hand.gestureConfidence),
        landmarks
    };
};

class HandSensing {
    constructor () {
        this._hands = [];
        this._timestamp = 0;
    }

    /**
     * Store derived hand-sensing data. Raw camera media is forbidden at this boundary.
     * @param {object} data - Derived output posted by the on-device vision provider.
     * @param {Array<object>} data.hands - Up to two normalized hand results.
     * @param {number} data.timestamp - Capture timestamp in milliseconds.
     */
    postData (data) {
        if (!data || typeof data !== 'object') {
            throw new Error('HandSensing.postData requires a data object.');
        }

        const rawMediaField = RAW_MEDIA_FIELDS.find(field => Object.prototype.hasOwnProperty.call(data, field));
        if (rawMediaField) {
            throw new Error(`HandSensing.postData does not accept raw media field "${rawMediaField}".`);
        }

        const normalizedHands = Array.isArray(data.hands) ?
            data.hands.slice(0, HAND_COUNT_LIMIT).map(normalizeHand) : [];
        this._hands = normalizedHands.filter(Boolean);
        this._timestamp = Number.isFinite(data.timestamp) ? data.timestamp : 0;
    }

    /**
     * Return the strongest matching hand result.
     * @param {string} handedness - `left`, `right`, or `any`.
     * @returns {object|null} A normalized hand result, or null when no hand matches.
     */
    getHand (handedness) {
        const candidates = handedness === 'any' ?
            this._hands : this._hands.filter(hand => hand.handedness === handedness);

        if (candidates.length === 0) return null;
        let strongest = candidates[0];
        for (const hand of candidates) {
            if (hand.confidence > strongest.confidence) strongest = hand;
        }
        return strongest;
    }

    /**
     * @returns {number} Timestamp of the most recent result in milliseconds.
     */
    getTimestamp () {
        return this._timestamp;
    }
}

module.exports = HandSensing;
