import reducer, {
    learningDraftInitialState,
    setLearningDraftStatus
} from '../../../src/reducers/learning-draft.js';

describe('learning draft reducer', () => {
    test('records successful draft metadata', () => {
        const state = reducer(learningDraftInitialState, setLearningDraftStatus('saved', {
            draftId: 'draft-1',
            savedAt: '2026-10-28T12:00:00.000Z',
            version: 2
        }));
        expect(state).toMatchObject({
            draftId: 'draft-1',
            savedAt: '2026-10-28T12:00:00.000Z',
            status: 'saved',
            version: 2
        });
    });

    test('rejects unsupported statuses', () => {
        expect(() => setLearningDraftStatus('unknown')).toThrow('Unsupported learning draft status');
    });
});
