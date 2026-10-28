const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const formatMessage = require('format-message');

const HANDS = {
    ANY: 'any',
    LEFT: 'left',
    RIGHT: 'right'
};

const GESTURES = {
    CLOSED_FIST: 'closed_fist',
    OPEN_PALM: 'open_palm',
    POINTING_UP: 'pointing_up',
    THUMB_DOWN: 'thumb_down',
    THUMB_UP: 'thumb_up',
    VICTORY: 'victory',
    I_LOVE_YOU: 'i_love_you'
};

const LANDMARKS = {
    WRIST: '0',
    THUMB_CMC: '1',
    THUMB_MCP: '2',
    THUMB_IP: '3',
    THUMB_TIP: '4',
    INDEX_MCP: '5',
    INDEX_PIP: '6',
    INDEX_DIP: '7',
    INDEX_TIP: '8',
    MIDDLE_MCP: '9',
    MIDDLE_PIP: '10',
    MIDDLE_DIP: '11',
    MIDDLE_TIP: '12',
    RING_MCP: '13',
    RING_PIP: '14',
    RING_DIP: '15',
    RING_TIP: '16',
    PINKY_MCP: '17',
    PINKY_PIP: '18',
    PINKY_DIP: '19',
    PINKY_TIP: '20'
};

const AXES = {
    X: 'x',
    Y: 'y'
};

const blockIconURI = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">' +
    '<path fill="#fff" d="' +
    'M12 20V9a2 2 0 0 1 4 0v8-11a2 2 0 0 1 4 0v11-9a2 2 0 0 1 4 0v9-6a2 2 0 0 1 4 0v11' +
    'c0 8-5 13-12 13-6 0-9-4-11-9l-2-5a2.5 2.5 0 0 1 4.5-2l2.5 4v-3a2 2 0 0 1 2-2Z"/>' +
    '</svg>'
)}`;

class Scratch3HandSensingBlocks {
    constructor (runtime) {
        this.runtime = runtime;
    }

    get HAND_INFO () {
        return [{
            text: formatMessage({
                id: 'handSensing.anyHand',
                default: 'any',
                description: 'Option for selecting any detected hand'
            }),
            value: HANDS.ANY
        }, {
            text: formatMessage({
                id: 'handSensing.leftHand',
                default: 'left',
                description: 'Option for selecting the left hand'
            }),
            value: HANDS.LEFT
        }, {
            text: formatMessage({
                id: 'handSensing.rightHand',
                default: 'right',
                description: 'Option for selecting the right hand'
            }),
            value: HANDS.RIGHT
        }];
    }

    get GESTURE_INFO () {
        return [{
            text: formatMessage({
                id: 'handSensing.closedFist',
                default: 'closed fist',
                description: 'Closed fist gesture name'
            }),
            value: GESTURES.CLOSED_FIST
        }, {
            text: formatMessage({
                id: 'handSensing.openPalm',
                default: 'open palm',
                description: 'Open palm gesture name'
            }),
            value: GESTURES.OPEN_PALM
        }, {
            text: formatMessage({
                id: 'handSensing.pointingUp',
                default: 'pointing up',
                description: 'Pointing up gesture name'
            }),
            value: GESTURES.POINTING_UP
        }, {
            text: formatMessage({
                id: 'handSensing.thumbDown',
                default: 'thumb down',
                description: 'Thumb down gesture name'
            }),
            value: GESTURES.THUMB_DOWN
        }, {
            text: formatMessage({
                id: 'handSensing.thumbUp',
                default: 'thumb up',
                description: 'Thumb up gesture name'
            }),
            value: GESTURES.THUMB_UP
        }, {
            text: formatMessage({
                id: 'handSensing.victory',
                default: 'victory',
                description: 'Victory gesture name'
            }),
            value: GESTURES.VICTORY
        }, {
            text: formatMessage({
                id: 'handSensing.iLoveYou',
                default: 'I love you',
                description: 'I love you gesture name'
            }),
            value: GESTURES.I_LOVE_YOU
        }];
    }

    get LANDMARK_INFO () {
        return [
            {
                text: formatMessage({
                    id: 'handSensing.wrist',
                    default: 'wrist',
                    description: 'Hand landmark name'
                }),
                value: LANDMARKS.WRIST
            }, {
                text: formatMessage({
                    id: 'handSensing.thumbCmc',
                    default: 'thumb base',
                    description: 'Hand landmark name'
                }),
                value: LANDMARKS.THUMB_CMC
            }, {
                text: formatMessage({
                    id: 'handSensing.thumbMcp',
                    default: 'thumb lower joint',
                    description: 'Hand landmark name'
                }),
                value: LANDMARKS.THUMB_MCP
            }, {
                text: formatMessage({
                    id: 'handSensing.thumbIp',
                    default: 'thumb upper joint',
                    description: 'Hand landmark name'
                }),
                value: LANDMARKS.THUMB_IP
            }, {
                text: formatMessage({
                    id: 'handSensing.thumbTip',
                    default: 'thumb tip',
                    description: 'Hand landmark name'
                }),
                value: LANDMARKS.THUMB_TIP
            }, {
                text: formatMessage({
                    id: 'handSensing.indexMcp',
                    default: 'index base',
                    description: 'Hand landmark name'
                }),
                value: LANDMARKS.INDEX_MCP
            }, {
                text: formatMessage({
                    id: 'handSensing.indexPip',
                    default: 'index lower joint',
                    description: 'Hand landmark name'
                }),
                value: LANDMARKS.INDEX_PIP
            }, {
                text: formatMessage({
                    id: 'handSensing.indexDip',
                    default: 'index upper joint',
                    description: 'Hand landmark name'
                }),
                value: LANDMARKS.INDEX_DIP
            }, {
                text: formatMessage({
                    id: 'handSensing.indexTip',
                    default: 'index tip',
                    description: 'Hand landmark name'
                }),
                value: LANDMARKS.INDEX_TIP
            }, {
                text: formatMessage({
                    id: 'handSensing.middleMcp',
                    default: 'middle base',
                    description: 'Hand landmark name'
                }),
                value: LANDMARKS.MIDDLE_MCP
            }, {
                text: formatMessage({
                    id: 'handSensing.middlePip',
                    default: 'middle lower joint',
                    description: 'Hand landmark name'
                }),
                value: LANDMARKS.MIDDLE_PIP
            }, {
                text: formatMessage({
                    id: 'handSensing.middleDip',
                    default: 'middle upper joint',
                    description: 'Hand landmark name'
                }),
                value: LANDMARKS.MIDDLE_DIP
            }, {
                text: formatMessage({
                    id: 'handSensing.middleTip',
                    default: 'middle tip',
                    description: 'Hand landmark name'
                }),
                value: LANDMARKS.MIDDLE_TIP
            }, {
                text: formatMessage({
                    id: 'handSensing.ringMcp',
                    default: 'ring base',
                    description: 'Hand landmark name'
                }),
                value: LANDMARKS.RING_MCP
            }, {
                text: formatMessage({
                    id: 'handSensing.ringPip',
                    default: 'ring lower joint',
                    description: 'Hand landmark name'
                }),
                value: LANDMARKS.RING_PIP
            }, {
                text: formatMessage({
                    id: 'handSensing.ringDip',
                    default: 'ring upper joint',
                    description: 'Hand landmark name'
                }),
                value: LANDMARKS.RING_DIP
            }, {
                text: formatMessage({
                    id: 'handSensing.ringTip',
                    default: 'ring tip',
                    description: 'Hand landmark name'
                }),
                value: LANDMARKS.RING_TIP
            }, {
                text: formatMessage({
                    id: 'handSensing.pinkyMcp',
                    default: 'pinky base',
                    description: 'Hand landmark name'
                }),
                value: LANDMARKS.PINKY_MCP
            }, {
                text: formatMessage({
                    id: 'handSensing.pinkyPip',
                    default: 'pinky lower joint',
                    description: 'Hand landmark name'
                }),
                value: LANDMARKS.PINKY_PIP
            }, {
                text: formatMessage({
                    id: 'handSensing.pinkyDip',
                    default: 'pinky upper joint',
                    description: 'Hand landmark name'
                }),
                value: LANDMARKS.PINKY_DIP
            }, {
                text: formatMessage({
                    id: 'handSensing.pinkyTip',
                    default: 'pinky tip',
                    description: 'Hand landmark name'
                }),
                value: LANDMARKS.PINKY_TIP
            }
        ];
    }

    get AXIS_INFO () {
        return [{text: 'x', value: AXES.X}, {text: 'y', value: AXES.Y}];
    }

    getInfo () {
        return {
            id: 'handSensing',
            name: formatMessage({
                id: 'handSensing.categoryName',
                default: 'Hand Sensing',
                description: 'Name of the hand sensing extension'
            }),
            blockIconURI,
            menuIconURI: blockIconURI,
            blocks: [{
                opcode: 'whenGestureDetected',
                text: formatMessage({
                    id: 'handSensing.whenGestureDetected',
                    default: 'when [HAND] hand makes [GESTURE]',
                    description: 'Event that runs when a selected hand makes a gesture'
                }),
                blockType: BlockType.HAT,
                arguments: {
                    HAND: {
                        type: ArgumentType.STRING,
                        menu: 'HAND',
                        defaultValue: HANDS.ANY
                    },
                    GESTURE: {
                        type: ArgumentType.STRING,
                        menu: 'GESTURE',
                        defaultValue: GESTURES.OPEN_PALM
                    }
                }
            }, '---', {
                opcode: 'handDetected',
                text: formatMessage({
                    id: 'handSensing.handDetected',
                    default: '[HAND] hand detected?',
                    description: 'Reports whether the selected hand is detected'
                }),
                blockType: BlockType.BOOLEAN,
                arguments: {
                    HAND: {
                        type: ArgumentType.STRING,
                        menu: 'HAND',
                        defaultValue: HANDS.ANY
                    }
                }
            }, {
                opcode: 'gesture',
                text: formatMessage({
                    id: 'handSensing.gesture',
                    default: 'gesture of [HAND] hand',
                    description: 'Reports the gesture made by the selected hand'
                }),
                blockType: BlockType.REPORTER,
                disableMonitor: true,
                arguments: {
                    HAND: {
                        type: ArgumentType.STRING,
                        menu: 'HAND',
                        defaultValue: HANDS.ANY
                    }
                }
            }, {
                opcode: 'handConfidence',
                text: formatMessage({
                    id: 'handSensing.handConfidence',
                    default: 'confidence of [HAND] hand',
                    description: 'Reports the detection confidence of the selected hand'
                }),
                blockType: BlockType.REPORTER,
                disableMonitor: true,
                arguments: {
                    HAND: {
                        type: ArgumentType.STRING,
                        menu: 'HAND',
                        defaultValue: HANDS.ANY
                    }
                }
            }, {
                opcode: 'landmarkPosition',
                text: formatMessage({
                    id: 'handSensing.landmarkPosition',
                    default: '[AXIS] position of [LANDMARK] on [HAND] hand',
                    description: 'Reports a hand landmark position in Scratch stage coordinates'
                }),
                blockType: BlockType.REPORTER,
                disableMonitor: true,
                arguments: {
                    AXIS: {
                        type: ArgumentType.STRING,
                        menu: 'AXIS',
                        defaultValue: AXES.X
                    },
                    LANDMARK: {
                        type: ArgumentType.STRING,
                        menu: 'LANDMARK',
                        defaultValue: LANDMARKS.INDEX_TIP
                    },
                    HAND: {
                        type: ArgumentType.STRING,
                        menu: 'HAND',
                        defaultValue: HANDS.ANY
                    }
                }
            }],
            menus: {
                AXIS: this.AXIS_INFO,
                GESTURE: this.GESTURE_INFO,
                HAND: this.HAND_INFO,
                LANDMARK: this.LANDMARK_INFO
            }
        };
    }

    _getHand (handedness) {
        return this.runtime.ioDevices.handSensing.getHand(handedness);
    }

    whenGestureDetected (args) {
        const hand = this._getHand(args.HAND);
        return Boolean(hand && hand.gesture === args.GESTURE);
    }

    handDetected (args) {
        return Boolean(this._getHand(args.HAND));
    }

    gesture (args) {
        const hand = this._getHand(args.HAND);
        return hand ? hand.gesture : 'none';
    }

    handConfidence (args) {
        const hand = this._getHand(args.HAND);
        return hand ? Math.round(hand.confidence * 100) : 0;
    }

    landmarkPosition (args) {
        const hand = this._getHand(args.HAND);
        if (!hand) return 0;

        const landmark = hand.landmarks[Number(args.LANDMARK)];
        if (!landmark) return 0;

        if (args.AXIS === AXES.X) return Math.round((0.5 - landmark.x) * 480);
        if (args.AXIS === AXES.Y) return Math.round((0.5 - landmark.y) * 360);
        return 0;
    }
}

module.exports = Scratch3HandSensingBlocks;
