import defaultLearningMaterials from '../../../src/lib/learning-materials/default-manifest.js';
import {normalizeLearningMaterials} from '../../../src/lib/learning-materials/manifest.js';

describe('learning materials manifest', () => {
    test('normalizes the bundled activity', () => {
        const manifest = normalizeLearningMaterials(defaultLearningMaterials);
        expect(manifest.schemaVersion).toBe(1);
        expect(manifest.exercises).toHaveLength(3);
        expect(manifest.exercises[0].status).toBe('available');
    });

    test('rejects duplicate exercise IDs', () => {
        const duplicate = Object.assign({}, defaultLearningMaterials, {
            exercises: [defaultLearningMaterials.exercises[0], defaultLearningMaterials.exercises[0]]
        });
        expect(() => normalizeLearningMaterials(duplicate)).toThrow('IDs must be unique');
    });

    test('rejects unsupported schema versions', () => {
        expect(() => normalizeLearningMaterials(Object.assign({}, defaultLearningMaterials, {
            schemaVersion: 2
        }))).toThrow('schema version 1');
    });

    test('limits text and normalizes optional fields', () => {
        const manifest = normalizeLearningMaterials(Object.assign({}, defaultLearningMaterials, {
            title: 'x'.repeat(300),
            exercises: [Object.assign({}, defaultLearningMaterials.exercises[0], {
                difficulty: 'unknown',
                estimatedMinutes: 5000,
                status: 'unknown'
            })]
        }));
        expect(manifest.title).toHaveLength(160);
        expect(manifest.exercises[0]).toMatchObject({
            difficulty: 'beginner',
            estimatedMinutes: 999,
            status: 'available'
        });
    });
});
