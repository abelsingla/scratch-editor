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

When `learningAttemptId` is configured for teacher submissions, autosave uses it
as the draft scope unless a distinct `learningDraftId` is explicitly provided.

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

## Teacher submissions

The editor supports explicit, per-exercise submission through a host-provided
adapter. Submission controls appear after an exercise is marked complete and
only when all required integration properties are configured:

- `learningAttemptId`: an opaque, server-authorized attempt identifier. If it is
  omitted, `learningDraftId` is used for compatibility.
- `learningSubmissionClient`: an object with an asynchronous `submit` method.
- `learningSubmissionEnabled`: optional feature switch; defaults to `true`.
- `onLearningSubmissionEvent`: optional callback for receipt or error metadata.

The adapter receives `{artifact, metadata}`. `artifact` is the complete SB3
`Blob`. `metadata` includes the activity revision, exercise ID, attempt ID,
project reference, exercise status snapshot, artifact size, SHA-256 digest, and
an idempotent client submission ID. The adapter must upload the artifact through
an authenticated learning-service session and resolve with:

```js
{
    submissionId: 'opaque-server-submission-id',
    submittedAt: '2026-10-28T12:00:00.000Z',
    attemptNumber: 1
}
```

A same-origin learning-platform adapter can use a multipart request:

```js
const learningSubmissionClient = {
    async submit ({artifact, metadata}) {
        const body = new FormData();
        body.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
        body.append('artifact', artifact, metadata.artifact.fileName);
        const response = await fetch(`/v1/attempts/${metadata.attemptId}/submissions`, {
            method: 'POST',
            credentials: 'include',
            headers: {'Idempotency-Key': metadata.clientSubmissionId},
            body
        });
        if (!response.ok) throw new Error(`Submission failed with status ${response.status}.`);
        return response.json();
    }
};
```

The server receipt is shown in the exercise card and the learner can submit a
new immutable version later. Failed retries of the same artifact reuse the
client submission ID.

The editor emits these metadata-only events:

- `ft-learning/submission-created.v1`
- `ft-learning/submission-error.v1`

SB3 content is passed only to the explicit submission adapter. It is never
included in a DOM event or parent-window message. The server must derive learner
identity and course authorization from the authenticated attempt rather than
trust browser-supplied identity fields.
