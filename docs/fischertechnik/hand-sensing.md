# Hand Sensing extension architecture

## Status

The VM contract, Scratch blocks, browser camera provider, dedicated inference
worker, local model packaging, and static gesture classifier are implemented.

The worker uses `@tensorflow-models/hand-pose-detection` 2.0.1 with the
TensorFlow.js WASM backend 4.22.0. It loads pinned MediaPipe Hand Tracking lite
models from the editor origin. The application does not use TensorFlow Hub,
Google storage, a CDN, or a remote inference service at runtime.

## Boundary

The browser vision provider publishes derived results through:

```js
vm.postIOData('handSensing', {
    hands: [{
        handedness: 'right',
        confidence: 0.96,
        gesture: 'open_palm',
        gestureConfidence: 0.91,
        landmarks: [{x: 0.5, y: 0.5, z: 0}]
    }],
    timestamp: performance.now()
});
```

Coordinates are normalized to the camera image. The VM converts x and y to
Scratch stage coordinates for reporter blocks. A result may contain at most two
hands and 21 landmarks per hand.

The stable gesture identifiers are:

- `closed_fist`
- `open_palm`
- `pointing_up`
- `thumb_down`
- `thumb_up`
- `victory`
- `i_love_you`

## Privacy invariant

Only derived numeric landmarks, gesture labels, confidence values, and a
timestamp may cross into the VM. `HandSensing.postData` rejects common raw-media
fields such as `frame`, `image`, `imageData`, and `video`.

The browser provider enforces these requirements:

- run inference in a dedicated worker on the learner's device;
- serve pinned WASM and model artifacts from the product origin;
- make no inference, telemetry, CDN, or fallback network requests;
- stop camera tracks when the page is hidden or the editor is disposed;
- avoid logs containing landmarks unless a local diagnostic mode is explicitly
  enabled;
- publish an empty hand list when results expire or camera access ends.

Camera resources and the worker are released when the editor stage is disposed
or the page becomes hidden. They are recreated when the learner returns to a
project that contains the extension.

Third-party package versions, model sources, licenses, and SHA-256 checksums are
recorded in `packages/scratch-gui/src/lib/hand-sensing/THIRD_PARTY_NOTICES.md`.

## Gesture classification

The first classifier uses deterministic joint angles and relative landmark
distances. A gesture must be observed in at least two of the last three results
before it is published. This avoids an additional gesture model and keeps the
initial prototype fully auditable and offline.

The classifier is suitable for prototype evaluation, not yet for final
accessibility or curriculum claims. Accuracy must be measured across learners,
lighting, skin tones, hand sizes, camera positions, and supported classroom
devices before commercial release.

## Compatibility

Saved projects depend on the extension ID `handSensing`, block opcodes, menu
values, and landmark indexes. Those values are public compatibility contracts.
Model implementations may change without changing the contract.

Custom and temporal gestures will use separate stable identifiers in a future
contract version. Unsupported or low-confidence results must report `none`; they
must not be guessed by the VM.
