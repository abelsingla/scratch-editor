const WRIST = 0;

const FINGERS = {
    index: {mcp: 5, pip: 6, tip: 8},
    middle: {mcp: 9, pip: 10, tip: 12},
    ring: {mcp: 13, pip: 14, tip: 16},
    pinky: {mcp: 17, pip: 18, tip: 20}
};

const distance = (first, second) => Math.hypot(first.x - second.x, first.y - second.y);

const angle = (first, vertex, last) => {
    const firstVector = {x: first.x - vertex.x, y: first.y - vertex.y};
    const lastVector = {x: last.x - vertex.x, y: last.y - vertex.y};
    const denominator = Math.hypot(firstVector.x, firstVector.y) * Math.hypot(lastVector.x, lastVector.y);
    if (!denominator) return 0;

    const cosine = ((firstVector.x * lastVector.x) + (firstVector.y * lastVector.y)) / denominator;
    return Math.acos(Math.max(-1, Math.min(1, cosine))) * (180 / Math.PI);
};

const fingerIsExtended = (landmarks, finger) => {
    const wrist = landmarks[WRIST];
    const mcp = landmarks[finger.mcp];
    const pip = landmarks[finger.pip];
    const tip = landmarks[finger.tip];
    return angle(mcp, pip, tip) > 155 && distance(tip, wrist) > (distance(pip, wrist) * 1.08);
};

const thumbIsExtended = landmarks => {
    const wrist = landmarks[WRIST];
    const mcp = landmarks[2];
    const ip = landmarks[3];
    const tip = landmarks[4];
    return angle(mcp, ip, tip) > 145 && distance(tip, wrist) > (distance(ip, wrist) * 1.05);
};

const result = (gesture, confidence) => ({gesture, confidence});

/**
 * Classify the seven stable gestures exposed by the Scratch extension.
 * This geometry-only classifier is deterministic and never performs network requests.
 * @param {Array<object>} landmarks - Twenty-one normalized MediaPipe hand landmarks.
 * @returns {{gesture: string, confidence: number}} Stable gesture ID and confidence.
 */
const classifyGesture = landmarks => {
    if (!Array.isArray(landmarks) || landmarks.length < 21) return result('none', 0);

    const extended = {
        thumb: thumbIsExtended(landmarks),
        index: fingerIsExtended(landmarks, FINGERS.index),
        middle: fingerIsExtended(landmarks, FINGERS.middle),
        ring: fingerIsExtended(landmarks, FINGERS.ring),
        pinky: fingerIsExtended(landmarks, FINGERS.pinky)
    };
    const longFingerCount = [extended.index, extended.middle, extended.ring, extended.pinky].filter(Boolean).length;

    if (extended.thumb && extended.index && !extended.middle && !extended.ring && extended.pinky) {
        return result('i_love_you', 0.9);
    }
    if (extended.index && extended.middle && !extended.ring && !extended.pinky) {
        return result('victory', 0.9);
    }
    if (extended.index && !extended.middle && !extended.ring && !extended.pinky) {
        return result('pointing_up', 0.85);
    }
    if (extended.thumb && longFingerCount === 0) {
        const wrist = landmarks[WRIST];
        const thumbTip = landmarks[4];
        const palmSize = Math.max(distance(wrist, landmarks[9]), 0.01);
        const verticalDelta = wrist.y - thumbTip.y;
        if (verticalDelta > palmSize * 0.35) return result('thumb_up', 0.9);
        if (verticalDelta < palmSize * -0.35) return result('thumb_down', 0.9);
    }
    if (longFingerCount === 4) return result('open_palm', extended.thumb ? 0.95 : 0.85);
    if (longFingerCount === 0 && !extended.thumb) return result('closed_fist', 0.9);
    return result('none', 0);
};

export default classifyGesture;
