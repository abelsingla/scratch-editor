# Moodle integration architecture

## Decision

Moodle should integrate the fischertechnik Learning Platform as an LTI 1.3
Advantage external tool. Moodle remains the system of record for courses,
enrolments, activity availability, completion, and grades. The fischertechnik
service owns the exercise catalogue, Scratch projects, draft history,
submissions, and teacher review data.

The Scratch editor is a browser client of the fischertechnik service. It must
not implement LTI validation or hold Moodle credentials. An authenticated
learning-service backend sits between Moodle and the editor.

This approach avoids a mandatory custom Moodle plugin and keeps the product
compatible with other LTI 1.3 learning platforms. A fischertechnik-hosted Moodle
deployment can use the same integration.

## System boundaries

| Component | Responsibilities |
| --- | --- |
| Moodle | Courses, enrolments, roles, deadlines, activity completion, and gradebook |
| fischertechnik learning service | LTI security, content selection, attempts, remote drafts, immutable submissions, review, and grade synchronization |
| Scratch editor | Exercise cards, local recovery autosave, project editing, and explicit per-exercise submission |
| Object storage | Versioned SB3 artifacts and derived previews, referenced by opaque IDs |

Moodle is the LTI platform and the fischertechnik learning service is the LTI
tool. The service should implement these capabilities:

- LTI 1.3 core launch for single sign-on and trusted course, role, resource,
  and user context.
- Deep Linking 2.0 so a teacher can select a fischertechnik exercise or lesson
  while creating a Moodle activity.
- Assignment and Grade Services 2.0 (AGS) to create or update the corresponding
  gradebook result.
- Names and Role Provisioning Services 2.0 (NRPS) only when a teacher view needs
  a complete course roster. A normal learner launch does not require it.
- Dynamic Registration later. Manual registration is sufficient for the first
  controlled Moodle deployment.

## Required backend endpoints

The concrete paths can change, but the service needs equivalent endpoints:

| Endpoint | Purpose |
| --- | --- |
| `GET/POST /lti/login` | Start the OpenID Connect login flow |
| `POST /lti/launch` | Validate an LTI launch and create the application session |
| `GET /.well-known/jwks.json` | Publish the tool's public signing keys |
| `POST /lti/deep-link` | Let a teacher select fischertechnik content |
| `GET /v1/attempts/{id}` | Return the authorized attempt and exercise manifest |
| `PUT /v1/attempts/{id}/draft` | Store a versioned remote draft |
| `POST /v1/attempts/{id}/submissions` | Store an immutable exercise submission |
| `GET /v1/activities/{id}/review` | Return authorized teacher review data |

The launch handler must validate the JWT signature against the Moodle key set,
issuer, audience, deployment ID, nonce, state, timestamps, target link URI, and
message type. It then maps the LTI `sub` value to an internal opaque learner ID
and creates an HTTP-only application session. The browser must never be trusted
to provide learner identity, course membership, attempt ownership, or a grade.

LTI platform registrations and users must be keyed by issuer and deployment as
well as their external identifiers. An LTI `sub` value is not globally unique.

## Teacher flow

1. A Moodle administrator registers the fischertechnik tool once for the site.
2. A teacher adds the preconfigured external tool to a course.
3. Moodle launches Deep Linking when the teacher chooses **Select content**.
4. The fischertechnik catalogue returns an LTI resource link for the selected
   lesson and revision.
5. Moodle creates the course activity and, when enabled, its gradebook item.
6. The teacher later launches the same tool with an instructor role to review
   attempts, open submitted SB3 versions, add feedback, and publish a result.

The resource link should identify an immutable activity revision. Editing a
catalogue lesson should create a new revision instead of silently changing an
activity that learners have already started.

## Learner flow

1. The learner opens the external-tool activity in Moodle.
2. The signed LTI launch identifies the Moodle installation, course, activity,
   learner, and role without a second login.
3. The learning service creates or resumes an authorized attempt and redirects
   to an opaque editor URL.
4. The editor receives the exercise manifest, `learningAttemptId`, and adapters
   for remote draft and submission storage.
5. Local IndexedDB autosave remains a recovery cache. Remote storage becomes
   authoritative once the learning service is available.
6. Each explicit submission stores a new immutable SB3 version. The teacher can
   inspect every version associated with that exercise and learner.
7. The learning service sends the final score or completion result to Moodle by
   AGS. Moodle remains the authoritative gradebook.

An exercise status change is progress telemetry, not a grade. Only a server-side
review or an explicitly defined automatic assessment rule may publish a grade.

## Moodle configuration

The following configuration becomes possible after the learning-service LTI
endpoints exist:

1. Serve Moodle and the fischertechnik service over HTTPS.
2. In Moodle, open **Site administration > Plugins > Activity modules >
   External tool > Manage tools** and configure an LTI 1.3 tool.
3. Exchange the client ID, deployment ID, issuer, authentication URL, token URL,
   key-set URL, login-initiation URL, launch URL, and redirect URLs.
4. Enable Deep Linking, AGS, and the minimum identity fields required by the
   product. Enable NRPS only for teacher roster features.
5. Make the preconfigured tool available in the activity chooser.
6. Configure the launch container as **New window** for the first robotics
   release.

Opening the robotics editor in a new window is intentional. Hand sensing needs
camera permission, and later controller integrations may need browser hardware
permissions. A cross-origin iframe adds Permissions Policy, third-party cookie,
screen-size, and browser compatibility constraints. Embedded mode can be added
later as an optional, tested presentation mode.

## Privacy and retention

- Use the opaque LTI subject as the default external learner reference. Names
  and email addresses are optional and should be requested only when the teacher
  workflow requires them.
- Never include LTI tokens, Moodle access tokens, or personal identity in an SB3
  file, exercise manifest, browser event, URL, or local draft key.
- Keep camera frames and hand landmarks on the learner's device.
- Define tenant-specific retention for drafts, submissions, feedback, and audit
  events.
- Record who submitted or reviewed an artifact, but derive that identity from
  the authenticated server session.
- Scope every attempt and artifact authorization to the LTI platform,
  deployment, course context, resource link, and learner.

## Delivery phases

### Phase 1: controlled Moodle prototype

- Implement manual LTI 1.3 registration and resource-link launch.
- Create an authenticated attempt from the launch.
- Load the existing learning-material manifest in the editor.
- Replace local-only authoritative storage with remote draft and submission
  adapters.
- Provide a basic instructor review page.

### Phase 2: course authoring and gradebook

- Add Deep Linking content selection.
- Add AGS completion and grade synchronization.
- Add rubric feedback and submission history.
- Add NRPS only if the review page needs learners who have never launched the
  activity.

### Phase 3: product operation

- Add dynamic registration and tenant administration.
- Add retention controls, exports, audit reporting, monitoring, and support
  tooling.
- Test additional LTI 1.3 platforms while Moodle remains the reference
  implementation.

## Current readiness

The editor already provides the exercise manifest contract, status events,
local recovery autosave, a remote-draft adapter boundary, and explicit
per-exercise SB3 submission. The LTI service, authenticated remote storage,
teacher review application, Deep Linking catalogue, and AGS synchronization do
not exist yet. The current browser bridge is an integration seam, not a secure
Moodle integration by itself.

## References

- [Moodle LTI External tool activity](https://docs.moodle.org/503/en/External_tool_settings)
- [Moodle LTI External tool FAQ](https://docs.moodle.org/503/en/LTI_External_tool_FAQ)
- [1EdTech LTI and LTI Advantage overview](https://www.1edtech.org/standards/lti)
- [1EdTech Deep Linking specification](https://standards.1edtech.org/lti/specifications/launch_messages/deep_linking/lti-deep-linking-spec)

