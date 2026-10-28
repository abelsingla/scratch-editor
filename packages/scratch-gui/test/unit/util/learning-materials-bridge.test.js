import defaultLearningMaterials from '../../../src/lib/learning-materials/default-manifest.js';
import LearningMaterialsBridge, {
    DRAFT_SAVED_MESSAGE_TYPE,
    MATERIALS_MESSAGE_TYPE,
    publishLearningPlatformEvent,
    STATUS_MESSAGE_TYPE
} from '../../../src/lib/learning-materials/learning-materials-bridge.js';

describe('LearningMaterialsBridge', () => {
    test('accepts a valid manifest from the configured origin', () => {
        const onMaterials = jest.fn();
        const bridge = new LearningMaterialsBridge({
            allowedOrigin: window.location.origin,
            onMaterials
        });
        bridge.start();

        window.dispatchEvent(new MessageEvent('message', {
            data: {type: MATERIALS_MESSAGE_TYPE, payload: defaultLearningMaterials},
            origin: window.location.origin,
            source: window
        }));

        expect(onMaterials).toHaveBeenCalledWith(expect.objectContaining({
            activityId: defaultLearningMaterials.activityId
        }));
        bridge.dispose();
    });

    test('rejects a manifest from another origin', () => {
        const onMaterials = jest.fn();
        const bridge = new LearningMaterialsBridge({
            allowedOrigin: window.location.origin,
            onMaterials
        });
        bridge.start();

        window.dispatchEvent(new MessageEvent('message', {
            data: {type: MATERIALS_MESSAGE_TYPE, payload: defaultLearningMaterials},
            origin: 'https://untrusted.example',
            source: window
        }));

        expect(onMaterials).not.toHaveBeenCalled();
        bridge.dispose();
    });

    test('publishes an explicit local status event', () => {
        const bridge = new LearningMaterialsBridge({onMaterials: jest.fn()});
        const listener = jest.fn();
        window.addEventListener(STATUS_MESSAGE_TYPE, listener);

        bridge.publishExerciseStatus({
            activityId: 'activity-1',
            exerciseId: 'exercise-1',
            status: 'completed'
        });

        expect(listener).toHaveBeenCalledWith(expect.objectContaining({
            detail: expect.objectContaining({
                activityId: 'activity-1',
                exerciseId: 'exercise-1',
                status: 'completed'
            })
        }));
        window.removeEventListener(STATUS_MESSAGE_TYPE, listener);
    });

    test('publishes draft metadata without project content', () => {
        const listener = jest.fn();
        window.addEventListener(DRAFT_SAVED_MESSAGE_TYPE, listener);
        const metadata = {
            schemaVersion: 1,
            draftId: 'draft-1',
            version: 1,
            savedAt: '2026-10-28T12:00:00.000Z'
        };

        publishLearningPlatformEvent(DRAFT_SAVED_MESSAGE_TYPE, metadata, window.location.origin);

        expect(listener).toHaveBeenCalledWith(expect.objectContaining({detail: metadata}));
        expect(listener.mock.calls[0][0].detail).not.toHaveProperty('projectBlob');
        window.removeEventListener(DRAFT_SAVED_MESSAGE_TYPE, listener);
    });
});
