const RESET_LEARNING_SUBMISSIONS = 'scratch-gui/learning-submissions/RESET';
const SET_LEARNING_SUBMISSION = 'scratch-gui/learning-submissions/SET';

const STATUS_VALUES = new Set(['submitting', 'submitted', 'error']);

const initialState = {
    byExercise: {}
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case RESET_LEARNING_SUBMISSIONS:
        return initialState;
    case SET_LEARNING_SUBMISSION:
        return {
            byExercise: Object.assign({}, state.byExercise, {
                [action.exerciseId]: Object.assign({}, state.byExercise[action.exerciseId], action.details, {
                    status: action.status
                })
            })
        };
    default:
        return state;
    }
};

const resetLearningSubmissions = () => ({type: RESET_LEARNING_SUBMISSIONS});

const setLearningSubmission = (exerciseId, status, details = {}) => {
    if (typeof exerciseId !== 'string' || !exerciseId) {
        throw new Error('A learning submission exercise ID is required.');
    }
    if (!STATUS_VALUES.has(status)) throw new Error(`Unsupported learning submission status: ${status}`);
    return {
        type: SET_LEARNING_SUBMISSION,
        exerciseId,
        status,
        details
    };
};

export {
    initialState as learningSubmissionsInitialState,
    resetLearningSubmissions,
    setLearningSubmission
};

export default reducer;
