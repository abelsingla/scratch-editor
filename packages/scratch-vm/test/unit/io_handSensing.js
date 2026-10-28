const test = require('tap').test;
const HandSensing = require('../../src/io/handSensing');

const createLandmarks = () => Array.from({length: 21}, (_, index) => ({
    x: index / 20,
    y: 1 - (index / 20),
    z: index / 100
}));

test('starts without a detected hand', t => {
    const handSensing = new HandSensing();

    t.equal(handSensing.getHand('any'), null);
    t.equal(handSensing.getTimestamp(), 0);
    t.end();
});

test('stores normalized results and selects the strongest hand', t => {
    const handSensing = new HandSensing();

    handSensing.postData({
        hands: [{
            handedness: 'left',
            confidence: 0.7,
            gesture: 'open_palm',
            gestureConfidence: 0.8,
            landmarks: createLandmarks()
        }, {
            handedness: 'right',
            confidence: 0.9,
            gesture: 'victory',
            gestureConfidence: 0.95,
            landmarks: createLandmarks()
        }],
        timestamp: 1234
    });

    t.equal(handSensing.getHand('left').gesture, 'open_palm');
    t.equal(handSensing.getHand('any').handedness, 'right');
    t.equal(handSensing.getHand('right').landmarks.length, 21);
    t.equal(handSensing.getTimestamp(), 1234);
    t.end();
});

test('clamps confidence and rejects invalid hand records', t => {
    const handSensing = new HandSensing();

    handSensing.postData({
        hands: [{
            handedness: 'left',
            confidence: 4,
            gestureConfidence: -2,
            landmarks: [{x: 0.5, y: 0.5}]
        }, {
            handedness: 'unknown',
            confidence: 1
        }]
    });

    t.equal(handSensing.getHand('left').confidence, 1);
    t.equal(handSensing.getHand('left').gestureConfidence, 0);
    t.equal(handSensing.getHand('right'), null);
    t.end();
});

test('rejects raw camera data', t => {
    const handSensing = new HandSensing();

    t.throws(
        () => handSensing.postData({hands: [], frame: new Uint8Array(4)}),
        /does not accept raw media field "frame"/
    );
    t.end();
});
