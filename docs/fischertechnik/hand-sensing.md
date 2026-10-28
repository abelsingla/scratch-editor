# Hand Sensing extension architecture

## Status

The VM contract and Scratch blocks are implemented. Browser camera capture,
MediaPipe inference, and the dedicated worker are the next milestone.

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

The browser provider must also satisfy these requirements:

- run inference in a dedicated worker on the learner's device;
- serve pinned WASM and model artifacts from the product origin;
- make no inference, telemetry, CDN, or fallback network requests;
- stop camera tracks when the extension is disabled or the editor is disposed;
- avoid logs containing landmarks unless a local diagnostic mode is explicitly
  enabled;
- publish an empty hand list when results expire or camera access ends.

## Compatibility

Saved projects depend on the extension ID `handSensing`, block opcodes, menu
values, and landmark indexes. Those values are public compatibility contracts.
Model implementations may change without changing the contract.

Custom and temporal gestures will use separate stable identifiers in a future
contract version. Unsupported or low-confidence results must report `none`; they
must not be guessed by the VM.
