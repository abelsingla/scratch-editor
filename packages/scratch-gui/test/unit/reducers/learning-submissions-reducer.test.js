import reducer, {
    learningSubmissionsInitialState,
    resetLearningSubmissions,
    setLearningSubmission
} from '../../../src/reducers/learning-submissions.js';

describe('learning submissions reducer', () => {
    test('tracks an immutable submission receipt for an exercise', () => {
        const state = reducer(learningSubmissionsInitialState, setLearningSubmission('exercise-1', 'submitted', {
            submissionId: 'submission-1',
            submittedAt: '2026-10-28T12:00:00.000Z'
        }));

        expect(state.byExercise['exercise-1']).toEqual({
            status: 'submitted',
            submissionId: 'submission-1',
            submittedAt: '2026-10-28T12:00:00.000Z'
        });
    });

    test('preserves retry identity when a submission fails', () => {
        const submitting = reducer(learningSubmissionsInitialState,
            setLearningSubmission('exercise-1', 'submitting', {clientSubmissionId: 'client-1'}));
        const failed = reducer(submitting,
            setLearningSubmission('exercise-1', 'error', {errorCode: 'failed'}));

        expect(failed.byExercise['exercise-1']).toMatchObject({
            status: 'error',
            clientSubmissionId: 'client-1',
            errorCode: 'failed'
        });
    });

    test('resets submission state when the learning attempt changes', () => {
        const submitted = reducer(learningSubmissionsInitialState,
            setLearningSubmission('exercise-1', 'submitted', {submissionId: 'submission-1'}));

        expect(reducer(submitted, resetLearningSubmissions())).toBe(learningSubmissionsInitialState);
    });
});
