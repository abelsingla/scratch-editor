const SET_LEARNING_DRAFT_STATUS = 'scratch-gui/learning-draft/SET_STATUS';

const STATUS_VALUES = new Set([
    'disabled',
    'idle',
    'pending',
    'saving',
    'saved',
    'restoring',
    'error'
]);

const initialState = {
    draftId: null,
    errorCode: null,
    savedAt: null,
    status: 'idle',
    version: 0
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    if (action.type !== SET_LEARNING_DRAFT_STATUS) return state;
    return Object.assign({}, state, action.details, {status: action.status});
};

const setLearningDraftStatus = (status, details = {}) => {
    if (!STATUS_VALUES.has(status)) throw new Error(`Unsupported learning draft status: ${status}`);
    return {
        type: SET_LEARNING_DRAFT_STATUS,
        status,
        details
    };
};

export {
    initialState as learningDraftInitialState,
    setLearningDraftStatus
};

export default reducer;
