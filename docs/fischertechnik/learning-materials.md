# Learning materials window

## Purpose

The editor displays teacher-provided activities as exercise cards without
embedding learning records in the Scratch project file. The first prototype
includes a local hand-sensing activity so the window can be evaluated without a
learning service.

Each card contains a stable exercise ID, title, summary, ordered instructions,
difficulty, estimated duration, and current status. Learners can explicitly move
an exercise from available to in progress, mark it as completed, or reopen it.

## Manifest contract

The editor accepts schema version 1 manifests:

```json
{
  "schemaVersion": 1,
  "activityId": "hand-sensing-foundations",
  "revision": "1",
  "title": "Hand-controlled character",
  "description": "Use hand positions and gestures in Scratch.",
  "exercises": [
    {
      "id": "detect-a-hand",
      "title": "Detect a hand",
      "summary": "React when a hand is visible.",
      "instructions": ["Add Hand Sensing.", "Use the detected reporter."],
      "difficulty": "beginner",
      "estimatedMinutes": 10,
      "status": "available"
    }
  ]
}
```

Supported difficulties are `beginner`, `intermediate`, and `advanced`. Supported
statuses are `available`, `in_progress`, `completed`, and `locked`.

The parser limits the number of exercises, instruction count, and text length.
All content is rendered as plain React text; HTML from a manifest is never
interpreted.

## Host bridge

An embedding learning platform can supply a manifest through the `learningMaterials`
GUI property or with an origin-checked browser message:

```js
editorWindow.postMessage({
    type: 'ft-learning/materials.v1',
    payload: manifest
}, editorOrigin);
```

The editor accepts messages only from its own origin by default. A cross-origin
parent must be configured explicitly with the `learningMaterialsOrigin` GUI
property. The message source must be the editor window or its parent window.

When an exercise status changes, the editor emits a local
`ft-learning/exercise-status.v1` browser event. In an iframe it also sends the
same payload to the configured parent origin. The payload contains only activity
ID, exercise ID, status, schema version, and timestamp. It does not contain the
project, learner identity, camera data, or LMS credentials.

## Current persistence boundary

Exercise state currently lives in the editor session. Server autosave, attempt
identity, submission artifacts, and teacher review remain separate learning
service milestones. The host must not treat the prototype status event as an
auditable submission.
