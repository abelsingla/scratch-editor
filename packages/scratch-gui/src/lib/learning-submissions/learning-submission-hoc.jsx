import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import VM from '@scratch/scratch-vm';

import {
    publishLearningPlatformEvent,
    SUBMISSION_CREATED_MESSAGE_TYPE,
    SUBMISSION_ERROR_MESSAGE_TYPE
} from '../learning-materials/learning-materials-bridge.js';
import {learningMaterialsShape} from '../learning-materials/prop-types.js';
import {
    resetLearningSubmissions,
    setLearningSubmission
} from '../../reducers/learning-submissions.js';
import LearningSubmissionService from './learning-submission-service.js';

const SUBMISSION_ERROR_CODE = 'learning-submission-failed';

const LearningSubmissionHOC = WrappedComponent => {
    class LearningSubmission extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, ['handleExerciseSubmit']);
            this.submissionService = new LearningSubmissionService(props.learningSubmissionClient);
        }

        componentDidUpdate (prevProps) {
            if (this.props.learningSubmissionClient !== prevProps.learningSubmissionClient) {
                this.submissionService = new LearningSubmissionService(this.props.learningSubmissionClient);
            }
            if (this.getSubmissionScope(prevProps) !== this.getSubmissionScope(this.props)) {
                this.props.onResetSubmissions();
            }
        }

        getAttemptId (props = this.props) {
            return props.learningAttemptId || props.learningDraftId || '';
        }

        getSubmissionScope (props = this.props) {
            return [
                this.getAttemptId(props),
                props.learningMaterialsManifest.activityId,
                props.learningMaterialsManifest.revision
            ].join(':');
        }

        publishSubmissionEvent (type, payload) {
            try {
                publishLearningPlatformEvent(type, payload, this.props.learningMaterialsOrigin);
            } catch {
                // Integration listeners cannot change the authoritative submission result.
            }
            try {
                if (this.props.onLearningSubmissionEvent) this.props.onLearningSubmissionEvent(type, payload);
            } catch {
                // Host callbacks are isolated from the submission lifecycle.
            }
        }

        async handleExerciseSubmit (exerciseId) {
            const exercise = this.props.learningMaterialsManifest.exercises.find(item => item.id === exerciseId);
            if (!exercise) throw new Error(`Unknown learning exercise: ${exerciseId}`);
            const attemptId = this.getAttemptId();
            if (!this.props.learningSubmissionEnabled || !this.props.learningSubmissionClient || !attemptId) {
                throw new Error('Learning submission is not configured.');
            }

            let preparedSubmission = null;
            try {
                const projectBlob = await this.props.vm.saveProjectSb3();
                preparedSubmission = await this.submissionService.prepare({
                    activityId: this.props.learningMaterialsManifest.activityId,
                    activityRevision: this.props.learningMaterialsManifest.revision,
                    attemptId,
                    exerciseId,
                    exerciseStatuses: this.props.learningMaterialsStatus,
                    previousSubmission: this.props.learningSubmissionsByExercise[exerciseId],
                    projectBlob,
                    projectId: this.props.projectId
                });
                this.props.onSetSubmission(exerciseId, 'submitting', {
                    artifactSha256: preparedSubmission.metadata.artifact.sha256,
                    clientSubmissionId: preparedSubmission.metadata.clientSubmissionId,
                    createdAt: preparedSubmission.metadata.createdAt,
                    errorCode: null
                });
                const result = await this.submissionService.submit(preparedSubmission);
                this.props.onSetSubmission(exerciseId, 'submitted', Object.assign({}, result.receipt, {
                    artifactSha256: result.receipt.artifact.sha256,
                    errorCode: null
                }));
                this.publishSubmissionEvent(SUBMISSION_CREATED_MESSAGE_TYPE, result.receipt);
                return result.receipt;
            } catch (error) {
                const errorPayload = {
                    schemaVersion: 1,
                    attemptId,
                    activityId: this.props.learningMaterialsManifest.activityId,
                    activityRevision: this.props.learningMaterialsManifest.revision,
                    exerciseId,
                    clientSubmissionId: preparedSubmission?.metadata.clientSubmissionId || null,
                    code: SUBMISSION_ERROR_CODE,
                    timestamp: new Date().toISOString()
                };
                this.props.onSetSubmission(exerciseId, 'error', {
                    artifactSha256: preparedSubmission?.metadata.artifact.sha256 || null,
                    clientSubmissionId: preparedSubmission?.metadata.clientSubmissionId || null,
                    createdAt: preparedSubmission?.metadata.createdAt || null,
                    errorCode: SUBMISSION_ERROR_CODE
                });
                this.publishSubmissionEvent(SUBMISSION_ERROR_MESSAGE_TYPE, errorPayload);
                return null;
            }
        }

        render () {
            const {
                learningMaterialsManifest: _learningMaterialsManifest,
                learningMaterialsStatus: _learningMaterialsStatus,
                learningSubmissionClient: _learningSubmissionClient,
                learningSubmissionEnabled: _learningSubmissionEnabled,
                learningSubmissionsByExercise,
                onLearningSubmissionEvent: _onLearningSubmissionEvent,
                onResetSubmissions: _onResetSubmissions,
                onSetSubmission: _onSetSubmission,
                projectId: _projectId,
                ...componentProps
            } = this.props;
            const learningSubmissionAvailable = Boolean(
                this.props.learningSubmissionEnabled &&
                this.props.learningSubmissionClient &&
                this.getAttemptId()
            );
            return (
                <WrappedComponent
                    {...componentProps}
                    learningSubmissionAvailable={learningSubmissionAvailable}
                    learningSubmissionsByExercise={learningSubmissionsByExercise}
                    onLearningExerciseSubmit={this.handleExerciseSubmit}
                />
            );
        }
    }

    LearningSubmission.propTypes = {
        learningAttemptId: PropTypes.string,
        learningDraftId: PropTypes.string,
        learningMaterialsManifest: learningMaterialsShape.isRequired,
        learningMaterialsOrigin: PropTypes.string,
        learningMaterialsStatus: PropTypes.objectOf(PropTypes.string).isRequired,
        learningSubmissionClient: PropTypes.shape({
            submit: PropTypes.func.isRequired
        }),
        learningSubmissionEnabled: PropTypes.bool.isRequired,
        learningSubmissionsByExercise: PropTypes.objectOf(PropTypes.object).isRequired,
        onLearningSubmissionEvent: PropTypes.func,
        onResetSubmissions: PropTypes.func.isRequired,
        onSetSubmission: PropTypes.func.isRequired,
        projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        vm: PropTypes.instanceOf(VM).isRequired
    };

    LearningSubmission.defaultProps = {
        learningSubmissionEnabled: true
    };

    const mapStateToProps = state => ({
        learningMaterialsManifest: state.scratchGui.learningMaterials.manifest,
        learningMaterialsStatus: state.scratchGui.learningMaterials.statusByExercise,
        learningSubmissionsByExercise: state.scratchGui.learningSubmissions.byExercise,
        projectId: state.scratchGui.projectState.projectId,
        vm: state.scratchGui.vm
    });

    const mapDispatchToProps = dispatch => ({
        onResetSubmissions: () => dispatch(resetLearningSubmissions()),
        onSetSubmission: (exerciseId, status, details) =>
            dispatch(setLearningSubmission(exerciseId, status, details))
    });

    const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign(
        {}, stateProps, dispatchProps, ownProps
    );

    return connect(mapStateToProps, mapDispatchToProps, mergeProps)(LearningSubmission);
};

export {
    LearningSubmissionHOC as default,
    SUBMISSION_ERROR_CODE
};
