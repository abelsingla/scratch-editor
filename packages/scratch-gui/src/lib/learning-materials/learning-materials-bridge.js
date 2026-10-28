import log from '../log.js';
import {normalizeLearningMaterials} from './manifest.js';

const MATERIALS_MESSAGE_TYPE = 'ft-learning/materials.v1';
const READY_MESSAGE_TYPE = 'ft-learning/editor-ready.v1';
const STATUS_MESSAGE_TYPE = 'ft-learning/exercise-status.v1';
const DRAFT_SAVED_MESSAGE_TYPE = 'ft-learning/draft-saved.v1';
const DRAFT_RESTORED_MESSAGE_TYPE = 'ft-learning/draft-restored.v1';
const DRAFT_ERROR_MESSAGE_TYPE = 'ft-learning/draft-error.v1';
const SUBMISSION_CREATED_MESSAGE_TYPE = 'ft-learning/submission-created.v1';
const SUBMISSION_ERROR_MESSAGE_TYPE = 'ft-learning/submission-error.v1';

const resolveLearningPlatformOrigin = allowedOrigin =>
    new URL(allowedOrigin || window.location.origin, window.location.href).origin;

const publishLearningPlatformEvent = (type, payload, allowedOrigin) => {
    window.dispatchEvent(new CustomEvent(type, {detail: payload}));
    if (window.parent !== window) {
        window.parent.postMessage({type, payload}, resolveLearningPlatformOrigin(allowedOrigin));
    }
};

class LearningMaterialsBridge {
    constructor ({allowedOrigin, onMaterials}) {
        this.allowedOrigin = resolveLearningPlatformOrigin(allowedOrigin);
        this.onMaterials = onMaterials;
        this._handleMessage = this._handleMessage.bind(this);
    }

    start () {
        window.addEventListener('message', this._handleMessage);
        if (window.parent !== window) {
            window.parent.postMessage({type: READY_MESSAGE_TYPE, schemaVersion: 1}, this.allowedOrigin);
        }
    }

    _handleMessage (event) {
        if (event.origin !== this.allowedOrigin) return;
        if (event.source !== window && event.source !== window.parent) return;
        if (!event.data || event.data.type !== MATERIALS_MESSAGE_TYPE) return;

        try {
            this.onMaterials(normalizeLearningMaterials(event.data.payload));
        } catch (error) {
            log.warn(`Learning materials message rejected: ${error.message}`);
        }
    }

    publishExerciseStatus ({activityId, exerciseId, status}) {
        const detail = {
            schemaVersion: 1,
            activityId,
            exerciseId,
            status,
            timestamp: new Date().toISOString()
        };
        publishLearningPlatformEvent(STATUS_MESSAGE_TYPE, detail, this.allowedOrigin);
    }

    dispose () {
        window.removeEventListener('message', this._handleMessage);
    }
}

export {
    DRAFT_ERROR_MESSAGE_TYPE,
    DRAFT_RESTORED_MESSAGE_TYPE,
    DRAFT_SAVED_MESSAGE_TYPE,
    MATERIALS_MESSAGE_TYPE,
    publishLearningPlatformEvent,
    READY_MESSAGE_TYPE,
    resolveLearningPlatformOrigin,
    SUBMISSION_CREATED_MESSAGE_TYPE,
    SUBMISSION_ERROR_MESSAGE_TYPE,
    STATUS_MESSAGE_TYPE
};

export default LearningMaterialsBridge;
