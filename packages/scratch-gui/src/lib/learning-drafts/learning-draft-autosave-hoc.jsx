import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import VM from '@scratch/scratch-vm';

import {getIsShowingProject} from '../../reducers/project-state';
import {setProjectChanged} from '../../reducers/project-changed';
import {setLearningDraftStatus} from '../../reducers/learning-draft';
import {restoreExerciseStatuses} from '../../reducers/learning-materials';
import {
    DRAFT_ERROR_MESSAGE_TYPE,
    DRAFT_RESTORED_MESSAGE_TYPE,
    DRAFT_SAVED_MESSAGE_TYPE,
    publishLearningPlatformEvent
} from '../learning-materials/learning-materials-bridge.js';
import {learningMaterialsShape} from '../learning-materials/prop-types.js';
import LocalDraftStore from './local-draft-store.js';
import LearningDraftService, {createLearningDraftId} from './learning-draft-service.js';

const ERROR_CODE = 'local-draft-storage-failed';

const LearningDraftAutosaveHOC = WrappedComponent => {
    class LearningDraftAutosave extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'handlePageHide',
                'handleProjectChanged',
                'handleVisibilityChange',
                'saveDraft'
            ]);
            this.ownsDraftService = !props.learningDraftStore;
            this.draftService = new LearningDraftService(props.learningDraftStore || new LocalDraftStore());
            this.restoredDraftIds = new Set();
            this.dirty = false;
            this.restoring = false;
            this.saving = false;
            this.saveQueued = false;
            this.saveTimer = null;
        }

        componentDidMount () {
            this.props.vm.on('PROJECT_CHANGED', this.handleProjectChanged);
            document.addEventListener('visibilitychange', this.handleVisibilityChange);
            window.addEventListener('pagehide', this.handlePageHide);
            if (this.props.learningAutosaveEnabled) this.maybeRestoreDraft();
            else this.props.onDraftStatus('disabled', {draftId: this.getDraftId(), errorCode: null});
        }

        componentDidUpdate (prevProps) {
            const previousDraftId = this.getDraftId(prevProps);
            const currentDraftId = this.getDraftId(this.props);
            if (!this.props.learningAutosaveEnabled && prevProps.learningAutosaveEnabled) {
                this.clearSaveTimer();
                this.dirty = false;
                this.props.onDraftStatus('disabled', {draftId: currentDraftId, errorCode: null});
                return;
            }
            if (this.props.learningAutosaveEnabled && !prevProps.learningAutosaveEnabled) {
                this.props.onDraftStatus('idle', {draftId: currentDraftId, errorCode: null});
                this.maybeRestoreDraft();
            }
            if (previousDraftId !== currentDraftId) {
                this.clearSaveTimer();
                this.dirty = false;
                this.props.onDraftStatus('idle', {draftId: currentDraftId, errorCode: null});
            }
            if (
                this.props.learningMaterialsStatus !== prevProps.learningMaterialsStatus &&
                previousDraftId === currentDraftId &&
                this.props.learningAutosaveEnabled &&
                this.props.isShowingProject &&
                !this.props.isPlayerOnly &&
                !this.restoring
            ) {
                this.dirty = true;
                if (this.saving) this.saveQueued = true;
                else this.scheduleSave();
            }
            if (this.props.isShowingProject && (!prevProps.isShowingProject || previousDraftId !== currentDraftId)) {
                this.maybeRestoreDraft();
            }
        }

        componentWillUnmount () {
            this.clearSaveTimer();
            this.props.vm.removeListener('PROJECT_CHANGED', this.handleProjectChanged);
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);
            window.removeEventListener('pagehide', this.handlePageHide);
            if (this.ownsDraftService) this.draftService.close();
        }

        getDraftId (props = this.props) {
            return createLearningDraftId({
                activityId: props.learningMaterialsManifest.activityId,
                activityRevision: props.learningMaterialsManifest.revision,
                draftId: props.learningDraftId,
                projectId: props.projectId
            });
        }

        clearSaveTimer () {
            if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
            this.saveTimer = null;
        }

        scheduleSave () {
            this.clearSaveTimer();
            this.props.onDraftStatus('pending', {
                draftId: this.getDraftId(),
                errorCode: null
            });
            this.saveTimer = window.setTimeout(this.saveDraft, this.props.learningAutosaveIntervalMs);
        }

        handleProjectChanged () {
            if (
                !this.props.learningAutosaveEnabled ||
                !this.props.isShowingProject ||
                this.props.isPlayerOnly ||
                this.restoring
            ) return;
            this.dirty = true;
            if (this.saving) {
                this.saveQueued = true;
                return;
            }
            this.scheduleSave();
        }

        handleVisibilityChange () {
            if (document.visibilityState === 'hidden' && this.dirty) this.saveDraft();
        }

        handlePageHide () {
            if (this.dirty) this.saveDraft();
        }

        publishDraftEvent (type, payload) {
            try {
                publishLearningPlatformEvent(type, payload, this.props.learningMaterialsOrigin);
            } catch {
                // An integration listener must not invalidate a draft that was already persisted.
            }
            try {
                if (this.props.onLearningDraftEvent) this.props.onLearningDraftEvent(type, payload);
            } catch {
                // Host callbacks are isolated from the local recovery lifecycle.
            }
        }

        async saveDraft () {
            this.clearSaveTimer();
            if (
                !this.dirty ||
                !this.props.learningAutosaveEnabled ||
                !this.props.isShowingProject ||
                this.props.isPlayerOnly
            ) return null;
            if (this.saving) {
                this.saveQueued = true;
                return null;
            }

            this.saving = true;
            this.dirty = false;
            const draftId = this.getDraftId();
            const activityId = this.props.learningMaterialsManifest.activityId;
            const activityRevision = this.props.learningMaterialsManifest.revision;
            const exerciseStatuses = this.props.learningMaterialsStatus;
            const projectId = this.props.projectId;
            this.props.onDraftStatus('saving', {draftId, errorCode: null});
            try {
                const projectBlob = await this.props.vm.saveProjectSb3();
                const result = await this.draftService.save({
                    activityId,
                    activityRevision,
                    draftId,
                    exerciseStatuses,
                    projectBlob,
                    projectId
                });
                if (draftId !== this.getDraftId()) return result.metadata;
                this.props.onDraftStatus('saved', Object.assign({}, result.metadata, {errorCode: null}));
                this.publishDraftEvent(DRAFT_SAVED_MESSAGE_TYPE, result.metadata);
                return result.metadata;
            } catch (error) {
                this.dirty = true;
                const payload = {
                    schemaVersion: 1,
                    activityId: this.props.learningMaterialsManifest.activityId,
                    draftId,
                    code: ERROR_CODE,
                    timestamp: new Date().toISOString()
                };
                this.props.onDraftStatus('error', {draftId, errorCode: ERROR_CODE});
                this.publishDraftEvent(DRAFT_ERROR_MESSAGE_TYPE, payload);
                return null;
            } finally {
                this.saving = false;
                if (this.saveQueued) {
                    this.saveQueued = false;
                    this.scheduleSave();
                }
            }
        }

        async maybeRestoreDraft () {
            if (
                !this.props.learningAutosaveEnabled ||
                !this.props.isShowingProject ||
                this.props.isPlayerOnly
            ) return;
            const draftId = this.getDraftId();
            if (this.restoredDraftIds.has(draftId)) return;
            this.restoredDraftIds.add(draftId);
            this.restoring = true;
            this.props.onDraftStatus('restoring', {draftId, errorCode: null});
            try {
                const result = await this.draftService.restore(draftId);
                if (!result) {
                    this.props.onDraftStatus('idle', {draftId, errorCode: null});
                    return;
                }
                if (draftId !== this.getDraftId()) return;
                const projectData = await result.record.projectBlob.arrayBuffer();
                await this.props.vm.loadProject(projectData);
                if (draftId !== this.getDraftId()) return;
                this.props.onRestoreExerciseStatuses(result.record.exerciseStatuses);
                this.props.onProjectChanged();
                this.props.onDraftStatus('saved', Object.assign({}, result.metadata, {errorCode: null}));
                this.publishDraftEvent(DRAFT_RESTORED_MESSAGE_TYPE, result.metadata);
            } catch (error) {
                const payload = {
                    schemaVersion: 1,
                    activityId: this.props.learningMaterialsManifest.activityId,
                    draftId,
                    code: ERROR_CODE,
                    timestamp: new Date().toISOString()
                };
                this.props.onDraftStatus('error', {draftId, errorCode: ERROR_CODE});
                this.publishDraftEvent(DRAFT_ERROR_MESSAGE_TYPE, payload);
            } finally {
                this.restoring = false;
            }
        }

        render () {
            const {
                isPlayerOnly: _isPlayerOnly,
                isShowingProject: _isShowingProject,
                learningAutosaveEnabled: _learningAutosaveEnabled,
                learningAutosaveIntervalMs: _learningAutosaveIntervalMs,
                learningDraftId: _learningDraftId,
                learningDraftStore: _learningDraftStore,
                learningMaterialsManifest: _learningMaterialsManifest,
                learningMaterialsStatus: _learningMaterialsStatus,
                onDraftStatus: _onDraftStatus,
                onLearningDraftEvent: _onLearningDraftEvent,
                onProjectChanged: _onProjectChanged,
                onRestoreExerciseStatuses: _onRestoreExerciseStatuses,
                projectId: _projectId,
                ...componentProps
            } = this.props;
            return <WrappedComponent {...componentProps} />;
        }
    }

    LearningDraftAutosave.propTypes = {
        isPlayerOnly: PropTypes.bool,
        isShowingProject: PropTypes.bool,
        learningAutosaveEnabled: PropTypes.bool.isRequired,
        learningAutosaveIntervalMs: PropTypes.number.isRequired,
        learningDraftId: PropTypes.string,
        learningDraftStore: PropTypes.shape({
            close: PropTypes.func,
            delete: PropTypes.func.isRequired,
            get: PropTypes.func.isRequired,
            put: PropTypes.func.isRequired
        }),
        learningMaterialsManifest: learningMaterialsShape.isRequired,
        learningMaterialsOrigin: PropTypes.string,
        learningMaterialsStatus: PropTypes.objectOf(PropTypes.string).isRequired,
        onDraftStatus: PropTypes.func.isRequired,
        onLearningDraftEvent: PropTypes.func,
        onProjectChanged: PropTypes.func.isRequired,
        onRestoreExerciseStatuses: PropTypes.func.isRequired,
        projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        vm: PropTypes.instanceOf(VM).isRequired
    };

    LearningDraftAutosave.defaultProps = {
        learningAutosaveEnabled: true,
        learningAutosaveIntervalMs: 5000
    };

    const mapStateToProps = state => ({
        isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
        isShowingProject: getIsShowingProject(state.scratchGui.projectState.loadingState),
        learningMaterialsManifest: state.scratchGui.learningMaterials.manifest,
        learningMaterialsStatus: state.scratchGui.learningMaterials.statusByExercise,
        projectId: state.scratchGui.projectState.projectId,
        vm: state.scratchGui.vm
    });

    const mapDispatchToProps = dispatch => ({
        onDraftStatus: (status, details) => dispatch(setLearningDraftStatus(status, details)),
        onProjectChanged: () => dispatch(setProjectChanged()),
        onRestoreExerciseStatuses: statuses => dispatch(restoreExerciseStatuses(statuses))
    });

    const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign(
        {}, stateProps, dispatchProps, ownProps
    );

    return connect(mapStateToProps, mapDispatchToProps, mergeProps)(LearningDraftAutosave);
};

export {
    ERROR_CODE,
    LearningDraftAutosaveHOC as default
};
