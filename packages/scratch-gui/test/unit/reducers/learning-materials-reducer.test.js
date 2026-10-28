import reducer, {
    learningMaterialsInitialState,
    setExerciseStatus,
    setLearningMaterials
} from '../../../src/reducers/learning-materials.js';

describe('learning materials reducer', () => {
    test('updates an exercise status without changing the manifest', () => {
        const state = reducer(learningMaterialsInitialState, setExerciseStatus('detect-a-hand', 'in_progress'));
        expect(state.manifest).toBe(learningMaterialsInitialState.manifest);
        expect(state.statusByExercise['detect-a-hand']).toBe('in_progress');
    });

    test('loads a new activity and its initial statuses', () => {
        const action = setLearningMaterials({
            schemaVersion: 1,
            activityId: 'activity-2',
            revision: '1',
            title: 'Second activity',
            exercises: [{
                id: 'exercise-1',
                title: 'Exercise',
                instructions: ['Complete the exercise.'],
                difficulty: 'advanced',
                estimatedMinutes: 20,
                status: 'locked'
            }]
        });
        const state = reducer(learningMaterialsInitialState, action);
        expect(state.manifest.activityId).toBe('activity-2');
        expect(state.statusByExercise).toEqual({'exercise-1': 'locked'});
    });

    test('ignores unknown exercise IDs', () => {
        const state = reducer(learningMaterialsInitialState, setExerciseStatus('missing', 'completed'));
        expect(state).toBe(learningMaterialsInitialState);
    });
});
