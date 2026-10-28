import LearningSubmissionService from '../../../src/lib/learning-submissions/learning-submission-service.js';

const makeInput = overrides => Object.assign({
    activityId: 'activity-1',
    activityRevision: '2',
    attemptId: 'attempt-1',
    exerciseId: 'exercise-1',
    exerciseStatuses: {'exercise-1': 'completed'},
    projectBlob: new Blob(['project']),
    projectId: '7'
}, overrides);

describe('LearningSubmissionService', () => {
    test('prepares an SB3 artifact and privacy-minimized metadata', async () => {
        const service = new LearningSubmissionService(null, {
            clock: () => new Date('2026-10-28T12:00:00.000Z'),
            createId: () => 'client-submission-1',
            digestBlob: () => Promise.resolve('abc123')
        });

        const prepared = await service.prepare(makeInput());

        expect(prepared.artifact).toBeInstanceOf(Blob);
        expect(prepared.metadata).toMatchObject({
            schemaVersion: 1,
            clientSubmissionId: 'client-submission-1',
            attemptId: 'attempt-1',
            exerciseId: 'exercise-1',
            artifact: {
                fileName: 'activity-1-exercise-1.sb3',
                mediaType: 'application/x.scratch.sb3',
                byteLength: 7,
                sha256: 'abc123'
            }
        });
        expect(prepared.metadata).not.toHaveProperty('learnerId');
    });

    test('reuses the idempotency identity when retrying the same artifact', async () => {
        const service = new LearningSubmissionService(null, {
            createId: () => 'new-client-id',
            digestBlob: () => Promise.resolve('same-digest')
        });
        const prepared = await service.prepare(makeInput({
            previousSubmission: {
                artifactSha256: 'same-digest',
                clientSubmissionId: 'existing-client-id',
                createdAt: '2026-10-28T12:00:00.000Z'
            }
        }));

        expect(prepared.metadata.clientSubmissionId).toBe('existing-client-id');
        expect(prepared.metadata.createdAt).toBe('2026-10-28T12:00:00.000Z');
    });

    test('returns an authoritative receipt without the project Blob', async () => {
        const client = {
            submit: jest.fn().mockResolvedValue({
                submissionId: 'submission-1',
                submittedAt: '2026-10-28T12:01:00.000Z',
                attemptNumber: 2
            })
        };
        const service = new LearningSubmissionService(client, {
            createId: () => 'client-submission-1',
            digestBlob: () => Promise.resolve('abc123')
        });
        const prepared = await service.prepare(makeInput());

        const result = await service.submit(prepared);

        expect(client.submit).toHaveBeenCalledWith(prepared);
        expect(result.receipt).toMatchObject({
            submissionId: 'submission-1',
            attemptNumber: 2,
            artifact: {sha256: 'abc123'}
        });
        expect(result.receipt).not.toHaveProperty('projectBlob');
        expect(result.receipt).not.toHaveProperty('artifactBlob');
    });

    test('rejects a malformed server receipt', async () => {
        const service = new LearningSubmissionService({
            submit: jest.fn().mockResolvedValue({
                submissionId: 'submission-1',
                submittedAt: 'not-a-timestamp'
            })
        }, {
            createId: () => 'client-submission-1',
            digestBlob: () => Promise.resolve('abc123')
        });
        const prepared = await service.prepare(makeInput());

        await expect(service.submit(prepared)).rejects.toThrow('must be an ISO timestamp');
    });
});
