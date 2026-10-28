import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {defineMessages, FormattedMessage} from 'react-intl';

import styles from './learning-draft-status.css';

const messages = defineMessages({
    disabled: {
        id: 'gui.learningDraft.disabled',
        defaultMessage: 'Autosave off',
        description: 'Status shown when local learning draft autosave is disabled'
    },
    idle: {
        id: 'gui.learningDraft.idle',
        defaultMessage: 'Autosave on',
        description: 'Status shown when local learning draft autosave is ready'
    },
    pending: {
        id: 'gui.learningDraft.pending',
        defaultMessage: 'Changes pending',
        description: 'Status shown while learning draft changes wait to be saved'
    },
    saving: {
        id: 'gui.learningDraft.saving',
        defaultMessage: 'Saving draft…',
        description: 'Status shown while the local learning draft is being saved'
    },
    saved: {
        id: 'gui.learningDraft.saved',
        defaultMessage: 'Draft saved',
        description: 'Status shown after the local learning draft was saved'
    },
    restoring: {
        id: 'gui.learningDraft.restoring',
        defaultMessage: 'Restoring draft…',
        description: 'Status shown while a local learning draft is being restored'
    },
    error: {
        id: 'gui.learningDraft.error',
        defaultMessage: 'Autosave error',
        description: 'Status shown when the local learning draft could not be saved'
    }
});

const LearningDraftStatus = ({status}) => (
    <div
        aria-live="polite"
        className={classNames(styles.status, styles[status])}
        role="status"
    >
        <span
            aria-hidden="true"
            className={styles.indicator}
        />
        <span className={styles.label}>
            <FormattedMessage {...messages[status]} />
        </span>
    </div>
);

LearningDraftStatus.propTypes = {
    status: PropTypes.oneOf(Object.keys(messages)).isRequired
};

const mapStateToProps = state => ({
    status: state.scratchGui.learningDraft?.status || 'idle'
});

export {
    LearningDraftStatus as UnconnectedLearningDraftStatus
};

export default connect(mapStateToProps)(LearningDraftStatus);
