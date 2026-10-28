import {germanMessages as germanHandMessages} from '../../../src/lib/hand-sensing/messages.js';
import {germanMessages as germanLearningMessages} from '../../../src/lib/learning-materials/messages.js';

describe('fischertechnik German messages', () => {
    test('translates the hand sensing extension', () => {
        expect(germanHandMessages['gui.extension.handSensing.name']).toBe('Handerkennung');
        expect(germanHandMessages['handSensing.thumbUp']).toBe('Daumen nach oben');
    });

    test('translates learning materials and draft autosave', () => {
        expect(germanLearningMessages['gui.learningMaterials.menuButton']).toBe('Lernmaterial');
        expect(germanLearningMessages['gui.learningDraft.saved']).toBe('Entwurf gespeichert');
    });
});
