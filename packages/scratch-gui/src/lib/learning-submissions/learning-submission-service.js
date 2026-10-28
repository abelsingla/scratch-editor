const SUBMISSION_SCHEMA_VERSION = 1;
const SB3_MEDIA_TYPE = 'application/x.scratch.sb3';

const requiredIdentifier = (value, field) => {
    if (typeof value !== 'string' || !value.trim()) {
        throw new Error(`Learning submission field "${field}" must be a non-empty string.`);
    }
    return value.trim();
};

const requiredTimestamp = (value, field) => {
    const timestamp = requiredIdentifier(value, field);
    if (Number.isNaN(Date.parse(timestamp))) {
        throw new Error(`Learning submission field "${field}" must be an ISO timestamp.`);
    }
    return timestamp;
};

const createClientSubmissionId = () => {
    if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
    if (typeof globalThis.crypto?.getRandomValues !== 'function') {
        throw new Error('Secure random values are not available for learning submissions.');
    }
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

const sha256Blob = async blob => {
    if (typeof globalThis.crypto?.subtle?.digest !== 'function') {
        throw new Error('SHA-256 is not available for learning submissions.');
    }
    const digest = await globalThis.crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
};

const safeFilePart = value => String(value)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .slice(0, 80);

class LearningSubmissionService {
    constructor (client, options = {}) {
        this.client = client;
        this.clock = options.clock || (() => new Date());
        this.createId = options.createId || createClientSubmissionId;
        this.digestBlob = options.digestBlob || sha256Blob;
    }

    async prepare ({
        activityId,
        activityRevision,
        attemptId,
        exerciseId,
        exerciseStatuses,
        previousSubmission,
        projectBlob,
        projectId
    }) {
        if (typeof Blob === 'undefined' || !(projectBlob instanceof Blob)) {
            throw new Error('Learning submissions require an SB3 Blob.');
        }
        const normalizedActivityId = requiredIdentifier(activityId, 'activityId');
        const normalizedExerciseId = requiredIdentifier(exerciseId, 'exerciseId');
        const artifactSha256 = await this.digestBlob(projectBlob);
        const canReuseRequest = previousSubmission?.artifactSha256 === artifactSha256 &&
            previousSubmission?.clientSubmissionId && previousSubmission?.createdAt;
        const clientSubmissionId = canReuseRequest ?
            previousSubmission.clientSubmissionId : this.createId();
        const createdAt = canReuseRequest ? previousSubmission.createdAt : this.clock().toISOString();
        const metadata = {
            schemaVersion: SUBMISSION_SCHEMA_VERSION,
            clientSubmissionId,
            attemptId: requiredIdentifier(attemptId, 'attemptId'),
            activityId: normalizedActivityId,
            activityRevision: requiredIdentifier(activityRevision, 'activityRevision'),
            exerciseId: normalizedExerciseId,
            projectId: projectId === null || typeof projectId === 'undefined' ? null : String(projectId),
            createdAt,
            artifact: {
                fileName: `${safeFilePart(normalizedActivityId)}-${safeFilePart(normalizedExerciseId)}.sb3`,
                mediaType: SB3_MEDIA_TYPE,
                byteLength: projectBlob.size,
                sha256: artifactSha256
            },
            evidence: {
                exerciseStatuses: Object.assign({}, exerciseStatuses)
            }
        };
        return {artifact: projectBlob, metadata};
    }

    async submit (preparedSubmission) {
        if (!this.client || typeof this.client.submit !== 'function') {
            throw new Error('A learning submission client is required.');
        }
        const response = await this.client.submit(preparedSubmission);
        if (!response || typeof response !== 'object') {
            throw new Error('The learning submission client returned an invalid receipt.');
        }
        const submittedAt = requiredTimestamp(response.submittedAt, 'receipt.submittedAt');
        const receipt = {
            schemaVersion: SUBMISSION_SCHEMA_VERSION,
            submissionId: requiredIdentifier(response.submissionId, 'receipt.submissionId'),
            clientSubmissionId: preparedSubmission.metadata.clientSubmissionId,
            attemptId: preparedSubmission.metadata.attemptId,
            activityId: preparedSubmission.metadata.activityId,
            activityRevision: preparedSubmission.metadata.activityRevision,
            exerciseId: preparedSubmission.metadata.exerciseId,
            projectId: preparedSubmission.metadata.projectId,
            submittedAt,
            attemptNumber: Number.isInteger(response.attemptNumber) && response.attemptNumber > 0 ?
                response.attemptNumber : null,
            artifact: Object.assign({}, preparedSubmission.metadata.artifact)
        };
        return {receipt};
    }
}

export {
    createClientSubmissionId,
    SB3_MEDIA_TYPE,
    sha256Blob,
    SUBMISSION_SCHEMA_VERSION
};

export default LearningSubmissionService;
