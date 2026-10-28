import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import {setWasmPaths} from '@tensorflow/tfjs-backend-wasm';

import classifyGesture from './gesture-classifier.js';

const MAX_GESTURE_HISTORY = 3;

let detector = null;
const gestureHistory = new Map();

const requireSameOrigin = url => {
    const parsed = new URL(url, self.location.href);
    if (parsed.origin !== self.location.origin) {
        throw new Error('Hand-sensing assets must be served from the editor origin.');
    }
    return parsed.toString();
};

const stabilizeGesture = (handedness, classification) => {
    const history = gestureHistory.get(handedness) || [];
    history.push(classification);
    if (history.length > MAX_GESTURE_HISTORY) history.shift();
    gestureHistory.set(handedness, history);

    const matching = history.filter(item => item.gesture === classification.gesture);
    if (classification.gesture === 'none' || matching.length < 2) return {gesture: 'none', confidence: 0};
    return {
        gesture: classification.gesture,
        confidence: matching.reduce((sum, item) => sum + item.confidence, 0) / matching.length
    };
};

const normalizeHand = (prediction, width, height) => {
    const handedness = String(prediction.handedness || '').toLowerCase();
    if (handedness !== 'left' && handedness !== 'right') return null;

    const landmarks = prediction.keypoints.slice(0, 21).map((point, index) => ({
        x: point.x / width,
        y: point.y / height,
        z: Number.isFinite(prediction.keypoints3D?.[index]?.z) ? prediction.keypoints3D[index].z : 0
    }));
    if (landmarks.length !== 21) return null;

    const stableGesture = stabilizeGesture(handedness, classifyGesture(landmarks));
    return {
        handedness,
        confidence: prediction.score,
        gesture: stableGesture.gesture,
        gestureConfidence: stableGesture.confidence,
        landmarks
    };
};

const initialize = async config => {
    const wasmPath = requireSameOrigin(config.wasmPath);
    const detectorModelUrl = requireSameOrigin(config.detectorModelUrl);
    const landmarkModelUrl = requireSameOrigin(config.landmarkModelUrl);

    setWasmPaths(wasmPath);
    await tf.setBackend('wasm');
    await tf.ready();

    detector = await handPoseDetection.createDetector(
        handPoseDetection.SupportedModels.MediaPipeHands,
        {
            runtime: 'tfjs',
            modelType: 'lite',
            maxHands: 2,
            detectorModelUrl,
            landmarkModelUrl
        }
    );
    self.postMessage({type: 'ready'});
};

const estimate = async message => {
    if (!detector) throw new Error('Hand-sensing worker is not ready.');

    const pixels = new Uint8ClampedArray(message.buffer);
    const image = new ImageData(pixels, message.width, message.height);
    const predictions = await detector.estimateHands(image, {
        flipHorizontal: false,
        staticImageMode: false
    });
    const hands = predictions
        .map(prediction => normalizeHand(prediction, message.width, message.height))
        .filter(Boolean);

    if (hands.length === 0) gestureHistory.clear();
    self.postMessage({type: 'result', hands, timestamp: message.timestamp});
};

self.onmessage = event => {
    const {data} = event;
    const operation = data.type === 'initialize' ? initialize(data) :
        data.type === 'frame' ? estimate(data) : Promise.resolve();

    operation.catch(error => {
        self.postMessage({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown hand-sensing worker error.'
        });
    });
};
