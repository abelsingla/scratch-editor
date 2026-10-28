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

## Local draft autosave

The editor stores a complete SB3 draft and the exercise status map in IndexedDB.
Changes are saved after five seconds of inactivity and when the page becomes
hidden. On the next editor session, the matching draft is restored automatically.
The title bar shows whether autosave is ready, pending, saving, saved, restoring,
disabled, or in an error state.

An embedding application should provide an opaque `learningDraftId` for each
learning attempt. Without it, the editor derives a standalone key from the
activity ID, activity revision, and Scratch project ID. The fallback makes local
evaluation convenient but is not suitable for shared school devices because it
does not identify a learner or LMS attempt.

The optional integration properties are:

- `learningAutosaveEnabled`: enables local draft autosave; defaults to `true`.
- `learningAutosaveIntervalMs`: inactivity delay; defaults to `5000`.
- `learningDraftId`: stable opaque attempt identifier supplied by the host.
- `learningDraftStore`: storage adapter implementing `get`, `put`, and `delete`.
- `onLearningDraftEvent`: callback receiving draft event type and metadata.

The default store is browser-local. A later learning-service adapter can
implement the same interface with authenticated remote storage.

## Draft events

The editor publishes these local events and forwards them to an explicitly
configured parent origin:

- `ft-learning/draft-saved.v1`
- `ft-learning/draft-restored.v1`
- `ft-learning/draft-error.v1`

Successful event payloads contain the schema version, opaque draft ID, activity
and project references, draft version, byte length, and timestamp. Project
content, learner identity, camera data, and credentials are never included in a
browser message.

## Persistence boundary

The IndexedDB copy is a recovery cache, not an authoritative submission. It can
be removed by browser storage policies or by clearing site data. Remote draft
history, optimistic concurrency, attempt authorization, immutable submissions,
and teacher review remain learning-service milestones. A host must not treat a
draft event as an auditable submission or grade.
