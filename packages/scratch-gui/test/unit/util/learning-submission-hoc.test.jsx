import React from 'react';
import PropTypes from 'prop-types';
import configureStore from 'redux-mock-store';
import {fireEvent, render, waitFor} from '@testing-library/react';
import VM from '@scratch/scratch-vm';

import defaultLearningMaterials from '../../../src/lib/learning-materials/default-manifest.js';

const mockPreparedSubmission = {
    artifact: new Blob(['project']),
    metadata: {
        schemaVersion: 1,
        clientSubmissionId: 'client-submission-1',
        attemptId: 'attempt-1',
        activityId: 'hand-sensing-foundations',
        activityRevision: '1',
        exerciseId: 'detect-a-hand',
        createdAt: '2026-10-28T12:00:00.000Z',
        artifact: {sha256: 'abc123'}
    }
};

const mockReceipt = {
    schemaVersion: 1,
    submissionId: 'submission-1',
    clientSubmissionId: 'client-submission-1',
    attemptId: 'attempt-1',
    activityId: 'hand-sensing-foundations',
    activityRevision: '1',
    exerciseId: 'detect-a-hand',
    submittedAt: '2026-10-28T12:01:00.000Z',
    artifact: {sha256: 'abc123'}
};

const mockPrepare = jest.fn().mockResolvedValue(mockPreparedSubmission);
const mockSubmit = jest.fn().mockResolvedValue({receipt: mockReceipt});

jest.mock('../../../src/lib/learning-submissions/learning-submission-service.js', () =>
    jest.fn().mockImplementation(() => ({prepare: mockPrepare, submit: mockSubmit}))
);

import LearningSubmissionHOC from '../../../src/lib/learning-submissions/learning-submission-hoc.jsx';

const TestComponent = ({onLearningExerciseSubmit}) => {
    const handleSubmit = React.useCallback(() => {
        onLearningExerciseSubmit('detect-a-hand');
    }, [onLearningExerciseSubmit]);
    return (
        <button
            type="button"
            onClick={handleSubmit}
        >
            Submit
        </button>
    );
};

TestComponent.propTypes = {
    onLearningExerciseSubmit: PropTypes.func.isRequired
};

describe('LearningSubmissionHOC', () => {
    const mockStore = configureStore();

    beforeEach(() => {
        mockPrepare.mockClear();
        mockSubmit.mockClear();
    });

    test('serializes and submits one exercise with the opaque attempt scope', async () => {
        const vm = new VM();
        vm.saveProjectSb3 = jest.fn().mockResolvedValue(new Blob(['project']));
        const store = mockStore({
            scratchGui: {
                learningMaterials: {
                    manifest: defaultLearningMaterials,
                    statusByExercise: {'detect-a-hand': 'completed'}
                },
                learningSubmissions: {byExercise: {}},
                projectState: {projectId: 'project-1'},
                vm
            }
        });
        const onLearningSubmissionEvent = jest.fn();
        const WrappedComponent = LearningSubmissionHOC(TestComponent);
        const {getByRole} = render(
            <WrappedComponent
                learningAttemptId="attempt-1"
                learningSubmissionClient={{submit: jest.fn()}}
                onLearningSubmissionEvent={onLearningSubmissionEvent}
                store={store}
            />
        );

        fireEvent.click(getByRole('button', {name: 'Submit'}));

        await waitFor(() => expect(mockSubmit).toHaveBeenCalledWith(mockPreparedSubmission));
        expect(vm.saveProjectSb3).toHaveBeenCalledTimes(1);
        expect(mockPrepare).toHaveBeenCalledWith(expect.objectContaining({
            attemptId: 'attempt-1',
            exerciseId: 'detect-a-hand',
            projectId: 'project-1'
        }));
        expect(onLearningSubmissionEvent).toHaveBeenCalledWith(
            'ft-learning/submission-created.v1',
            mockReceipt
        );
        expect(store.getActions()).toEqual(expect.arrayContaining([
            expect.objectContaining({status: 'submitting'}),
            expect.objectContaining({status: 'submitted'})
        ]));
    });
});
