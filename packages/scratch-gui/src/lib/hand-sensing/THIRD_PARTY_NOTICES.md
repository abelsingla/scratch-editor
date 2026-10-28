# Hand-sensing third-party assets

## TensorFlow.js hand pose detection

- Package: `@tensorflow-models/hand-pose-detection` 2.0.1
- License: Apache-2.0
- Source: <https://github.com/tensorflow/tfjs-models/tree/master/hand-pose-detection>

## TensorFlow.js WASM backend

- Package: `@tensorflow/tfjs-backend-wasm` 4.22.0
- License: Apache-2.0
- Source: <https://github.com/tensorflow/tfjs>

## MediaPipe Hand Tracking lite models

- License: Apache-2.0
- Model card: <https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Hand%20Tracking%20%28Lite_Full%29%20with%20Fairness%20Oct%202021.pdf>
- Detector source: <https://tfhub.dev/mediapipe/tfjs-model/handpose_3d/detector/lite/1>
- Landmark source: <https://tfhub.dev/mediapipe/tfjs-model/handpose_3d/landmark/lite/1>

Pinned file checksums:

| File | SHA-256 |
| --- | --- |
| `models/detector/model.json` | `2de2e139e240169c9794c21676b8ca94da2bbc0146a3e0664133ce66e021b1a5` |
| `models/detector/group1-shard1of1.bin` | `8ba46d2152f48320cdb8835854f53d469dc6a33933099ff89929755ca1a88d51` |
| `models/landmark/model.json` | `2d6bd4d3b34a684e96293ff71e31f9fbc1b4922e0a88d82184cb584055ff3783` |
| `models/landmark/group1-shard1of1.bin` | `444bee1c7d6d330991bd3ce840a95d0c0afcc3a3fcec47c0c3b7f66a3f3533b0` |

The application loads these assets only from its own origin. It does not use
the default TensorFlow Hub model URLs at runtime.
