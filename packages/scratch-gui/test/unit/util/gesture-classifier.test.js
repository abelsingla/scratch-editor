import classifyGesture from '../../../src/lib/hand-sensing/gesture-classifier.js';

const point = (x, y) => ({x, y, z: 0});

const createHand = ({thumb = false, index = false, middle = false, ring = false, pinky = false} = {}) => {
    const landmarks = Array.from({length: 21}, () => point(0.5, 0.8));
    landmarks[0] = point(0.5, 0.9);

    const setFinger = (indexes, x, extended) => {
        landmarks[indexes[0]] = point(x, 0.72);
        landmarks[indexes[1]] = point(x, extended ? 0.5 : 0.58);
        landmarks[indexes[2]] = point(x, extended ? 0.35 : 0.62);
        landmarks[indexes[3]] = point(extended ? x : x + 0.05, extended ? 0.2 : 0.7);
    };

    setFinger([5, 6, 7, 8], 0.4, index);
    setFinger([9, 10, 11, 12], 0.48, middle);
    setFinger([13, 14, 15, 16], 0.56, ring);
    setFinger([17, 18, 19, 20], 0.64, pinky);

    landmarks[1] = point(0.43, 0.78);
    landmarks[2] = point(0.38, 0.7);
    landmarks[3] = point(thumb ? 0.28 : 0.43, thumb ? 0.62 : 0.68);
    landmarks[4] = point(thumb ? 0.16 : 0.46, thumb ? 0.58 : 0.74);
    return landmarks;
};

describe('gesture classifier', () => {
    test.each([
        [{}, 'closed_fist'],
        [{thumb: true, index: true, middle: true, ring: true, pinky: true}, 'open_palm'],
        [{index: true}, 'pointing_up'],
        [{index: true, middle: true}, 'victory'],
        [{thumb: true, index: true, pinky: true}, 'i_love_you']
    ])('classifies a stable gesture', (fingers, expectedGesture) => {
        expect(classifyGesture(createHand(fingers)).gesture).toBe(expectedGesture);
    });

    test('returns none for incomplete landmarks', () => {
        expect(classifyGesture([])).toEqual({gesture: 'none', confidence: 0});
    });

    test.each([
        [{mcp: 0.75, ip: 0.55, tip: 0.3}, 'thumb_up'],
        [{mcp: 0.7, ip: 0.82, tip: 1.1}, 'thumb_down']
    ])('classifies vertical thumb direction', (thumb, expectedGesture) => {
        const landmarks = createHand({thumb: true});
        landmarks[2] = point(0.5, thumb.mcp);
        landmarks[3] = point(0.5, thumb.ip);
        landmarks[4] = point(0.5, thumb.tip);
        expect(classifyGesture(landmarks).gesture).toBe(expectedGesture);
    });
});
