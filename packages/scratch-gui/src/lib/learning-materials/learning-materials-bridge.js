import log from '../log.js';
import {normalizeLearningMaterials} from './manifest.js';

const MATERIALS_MESSAGE_TYPE = 'ft-learning/materials.v1';
const READY_MESSAGE_TYPE = 'ft-learning/editor-ready.v1';
const STATUS_MESSAGE_TYPE = 'ft-learning/exercise-status.v1';

class LearningMaterialsBridge {
    constructor ({allowedOrigin, onMaterials}) {
        this.allowedOrigin = new URL(allowedOrigin || window.location.origin, window.location.href).origin;
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
        window.dispatchEvent(new CustomEvent(STATUS_MESSAGE_TYPE, {detail}));
        if (window.parent !== window) {
            window.parent.postMessage({type: STATUS_MESSAGE_TYPE, payload: detail}, this.allowedOrigin);
        }
    }

    dispose () {
        window.removeEventListener('message', this._handleMessage);
    }
}

export {
    MATERIALS_MESSAGE_TYPE,
    READY_MESSAGE_TYPE,
    STATUS_MESSAGE_TYPE
};

export default LearningMaterialsBridge;
