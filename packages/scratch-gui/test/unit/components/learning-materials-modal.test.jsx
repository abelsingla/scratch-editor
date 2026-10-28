import React from 'react';
import ReactModal from 'react-modal';
import {fireEvent, screen} from '@testing-library/react';

import LearningMaterialsModal from '../../../src/components/learning-materials/learning-materials-modal.jsx';
import defaultLearningMaterials from '../../../src/lib/learning-materials/default-manifest.js';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';

describe('LearningMaterialsModal teacher submissions', () => {
    let appElement;

    beforeEach(() => {
        appElement = document.createElement('div');
        document.body.appendChild(appElement);
        ReactModal.setAppElement(appElement);
    });

    afterEach(() => appElement.remove());

    test('submits a completed exercise individually', () => {
        const onSubmit = jest.fn();
        renderWithIntl(
            <LearningMaterialsModal
                isOpen
                manifest={defaultLearningMaterials}
                statusByExercise={{
                    'detect-a-hand': 'completed',
                    'move-with-index-finger': 'available',
                    'gesture-challenge': 'available'
                }}
                submissionAvailable
                submissionsByExercise={{}}
                onClose={jest.fn()}
                onStatusChange={jest.fn()}
                onSubmit={onSubmit}
            />
        );

        fireEvent.click(screen.getByRole('button', {name: 'Submit to teacher'}));

        expect(onSubmit).toHaveBeenCalledWith('detect-a-hand');
        expect(screen.queryAllByRole('button', {name: 'Submit to teacher'})).toHaveLength(1);
    });

    test('shows the authoritative submission result and permits a new version', () => {
        renderWithIntl(
            <LearningMaterialsModal
                isOpen
                manifest={defaultLearningMaterials}
                statusByExercise={{
                    'detect-a-hand': 'completed',
                    'move-with-index-finger': 'available',
                    'gesture-challenge': 'available'
                }}
                submissionAvailable
                submissionsByExercise={{'detect-a-hand': {status: 'submitted'}}}
                onClose={jest.fn()}
                onStatusChange={jest.fn()}
                onSubmit={jest.fn()}
            />
        );

        expect(screen.getByText('Submitted to teacher')).not.toBeNull();
        expect(screen.getByRole('button', {name: 'Submit updated program'})).not.toBeNull();
    });
});
