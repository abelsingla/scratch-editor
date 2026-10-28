import LearningDraftService, {
    createLearningDraftId
} from '../../../src/lib/learning-drafts/learning-draft-service.js';

class MemoryDraftStore {
    constructor () {
        this.records = new Map();
    }

    get (id) {
        return Promise.resolve(this.records.get(id) || null);
    }

    put (record) {
        this.records.set(record.id, record);
        return Promise.resolve(record);
    }

    delete (id) {
        this.records.delete(id);
        return Promise.resolve();
    }
}

describe('LearningDraftService', () => {
    test('creates a stable local scope and supports an external attempt scope', () => {
        expect(createLearningDraftId({
            activityId: 'activity-1',
            activityRevision: '2',
            projectId: '3'
        })).toBe('local:activity-1:2:3');
        expect(createLearningDraftId({draftId: 'attempt 42'})).toBe('external:attempt%2042');
    });

    test('stores a complete SB3 draft and increments its version', async () => {
        const store = new MemoryDraftStore();
        const service = new LearningDraftService(store);
        const input = {
            activityId: 'activity-1',
            activityRevision: '1',
            draftId: 'draft-1',
            exerciseStatuses: {'exercise-1': 'in_progress'},
            projectBlob: new Blob(['project']),
            projectId: '7'
        };

        const first = await service.save(input);
        const second = await service.save(input);

        expect(first.metadata).toMatchObject({draftId: 'draft-1', version: 1, byteLength: 7});
        expect(second.metadata.version).toBe(2);
        expect(second.record.exerciseStatuses).toEqual({'exercise-1': 'in_progress'});
    });

    test('restores a saved draft record', async () => {
        const service = new LearningDraftService(new MemoryDraftStore());
        await service.save({
            activityId: 'activity-1',
            activityRevision: '1',
            draftId: 'draft-1',
            exerciseStatuses: {'exercise-1': 'completed'},
            projectBlob: new Blob(['project']),
            projectId: null
        });

        const restored = await service.restore('draft-1');

        expect(restored.metadata.version).toBe(1);
        expect(restored.record.projectBlob).toBeInstanceOf(Blob);
        expect(restored.record.exerciseStatuses).toEqual({'exercise-1': 'completed'});
    });
});
