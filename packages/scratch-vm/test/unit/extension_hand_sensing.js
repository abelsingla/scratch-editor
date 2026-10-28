const test = require('tap').test;
const HandSensing = require('../../src/io/handSensing');
const HandSensingBlocks = require('../../src/extensions/scratch3_hand_sensing');

const createRuntime = () => ({
    ioDevices: {
        handSensing: new HandSensing()
    }
});

const createLandmarks = () => Array.from({length: 21}, () => ({x: 0.25, y: 0.75, z: 0}));

test('extension metadata exposes the stable extension ID', t => {
    const blocks = new HandSensingBlocks(createRuntime());
    const info = blocks.getInfo();

    t.equal(info.id, 'handSensing');
    t.match(info.blocks, [{opcode: 'whenGestureDetected'}]);
    t.end();
});

test('reporters return safe defaults without a detected hand', t => {
    const blocks = new HandSensingBlocks(createRuntime());

    t.equal(blocks.handDetected({HAND: 'any'}), false);
    t.equal(blocks.gesture({HAND: 'any'}), 'none');
    t.equal(blocks.handConfidence({HAND: 'any'}), 0);
    t.equal(blocks.landmarkPosition({HAND: 'any', LANDMARK: '8', AXIS: 'x'}), 0);
    t.end();
});

test('reporters expose derived hand results in Scratch coordinates', t => {
    const runtime = createRuntime();
    const blocks = new HandSensingBlocks(runtime);

    runtime.ioDevices.handSensing.postData({
        hands: [{
            handedness: 'right',
            confidence: 0.91,
            gesture: 'victory',
            gestureConfidence: 0.97,
            landmarks: createLandmarks()
        }],
        timestamp: 10
    });

    t.equal(blocks.handDetected({HAND: 'right'}), true);
    t.equal(blocks.gesture({HAND: 'right'}), 'victory');
    t.equal(blocks.handConfidence({HAND: 'right'}), 91);
    t.equal(blocks.landmarkPosition({HAND: 'right', LANDMARK: '8', AXIS: 'x'}), 120);
    t.equal(blocks.landmarkPosition({HAND: 'right', LANDMARK: '8', AXIS: 'y'}), -90);
    t.equal(blocks.whenGestureDetected({HAND: 'right', GESTURE: 'victory'}), true);
    t.end();
});
