import defaultLearningMaterials from '../lib/learning-materials/default-manifest.js';
import {normalizeLearningMaterials, STATUS_VALUES} from '../lib/learning-materials/manifest.js';

const SET_LEARNING_MATERIALS = 'scratch-gui/learning-materials/SET_LEARNING_MATERIALS';
const SET_EXERCISE_STATUS = 'scratch-gui/learning-materials/SET_EXERCISE_STATUS';
const RESTORE_EXERCISE_STATUSES = 'scratch-gui/learning-materials/RESTORE_EXERCISE_STATUSES';

const buildStatusMap = manifest => manifest.exercises.reduce((result, exercise) => {
    result[exercise.id] = exercise.status;
    return result;
}, {});

const normalizedDefaultManifest = normalizeLearningMaterials(defaultLearningMaterials);

const initialState = {
    manifest: normalizedDefaultManifest,
    statusByExercise: buildStatusMap(normalizedDefaultManifest)
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_LEARNING_MATERIALS:
        return {
            manifest: action.manifest,
            statusByExercise: buildStatusMap(action.manifest)
        };
    case SET_EXERCISE_STATUS:
        if (!Object.prototype.hasOwnProperty.call(state.statusByExercise, action.exerciseId)) return state;
        return Object.assign({}, state, {
            statusByExercise: Object.assign({}, state.statusByExercise, {
                [action.exerciseId]: action.status
            })
        });
    case RESTORE_EXERCISE_STATUSES:
        return Object.assign({}, state, {
            statusByExercise: Object.keys(state.statusByExercise).reduce((result, exerciseId) => {
                const restoredStatus = action.statusByExercise[exerciseId];
                result[exerciseId] = STATUS_VALUES.has(restoredStatus) ?
                    restoredStatus : state.statusByExercise[exerciseId];
                return result;
            }, {})
        });
    default:
        return state;
    }
};

const setLearningMaterials = manifest => ({
    type: SET_LEARNING_MATERIALS,
    manifest: normalizeLearningMaterials(manifest)
});

const setExerciseStatus = (exerciseId, status) => {
    if (!STATUS_VALUES.has(status)) throw new Error(`Unsupported exercise status: ${status}`);
    return {type: SET_EXERCISE_STATUS, exerciseId, status};
};

const restoreExerciseStatuses = statusByExercise => ({
    type: RESTORE_EXERCISE_STATUSES,
    statusByExercise: statusByExercise && typeof statusByExercise === 'object' ? statusByExercise : {}
});

export {
    initialState as learningMaterialsInitialState,
    restoreExerciseStatuses,
    setExerciseStatus,
    setLearningMaterials
};

export default reducer;
