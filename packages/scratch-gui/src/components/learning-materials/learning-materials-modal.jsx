import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useCallback} from 'react';
import ReactModal from 'react-modal';
import {defineMessages, FormattedMessage, useIntl} from 'react-intl';

import closeIcon from '../debug-modal/icons/icon--close.svg';
import {learningMaterialsShape} from '../../lib/learning-materials/prop-types.js';
import styles from './learning-materials-modal.css';

const messages = defineMessages({
    title: {
        id: 'gui.learningMaterials.title',
        defaultMessage: 'Learning materials',
        description: 'Title of the learning materials window'
    },
    close: {
        id: 'gui.learningMaterials.close',
        defaultMessage: 'Close learning materials',
        description: 'Accessible label for closing the learning materials window'
    },
    progress: {
        id: 'gui.learningMaterials.progress',
        defaultMessage: '{completed} of {total} exercises completed',
        description: 'Learning activity completion summary'
    },
    minutes: {
        id: 'gui.learningMaterials.minutes',
        defaultMessage: '{minutes} min',
        description: 'Estimated exercise duration in minutes'
    },
    instructions: {
        id: 'gui.learningMaterials.instructions',
        defaultMessage: 'Steps',
        description: 'Heading above exercise instructions'
    },
    beginner: {
        id: 'gui.learningMaterials.beginner',
        defaultMessage: 'Beginner',
        description: 'Beginner exercise difficulty'
    },
    intermediate: {
        id: 'gui.learningMaterials.intermediate',
        defaultMessage: 'Intermediate',
        description: 'Intermediate exercise difficulty'
    },
    advanced: {
        id: 'gui.learningMaterials.advanced',
        defaultMessage: 'Advanced',
        description: 'Advanced exercise difficulty'
    },
    available: {
        id: 'gui.learningMaterials.available',
        defaultMessage: 'Available',
        description: 'Available exercise status'
    },
    inProgress: {
        id: 'gui.learningMaterials.inProgress',
        defaultMessage: 'In progress',
        description: 'Exercise in progress status'
    },
    completed: {
        id: 'gui.learningMaterials.completed',
        defaultMessage: 'Completed',
        description: 'Completed exercise status'
    },
    locked: {
        id: 'gui.learningMaterials.locked',
        defaultMessage: 'Locked',
        description: 'Locked exercise status'
    },
    start: {
        id: 'gui.learningMaterials.start',
        defaultMessage: 'Start exercise',
        description: 'Button that marks an exercise as in progress'
    },
    complete: {
        id: 'gui.learningMaterials.complete',
        defaultMessage: 'Mark as completed',
        description: 'Button that marks an exercise as completed'
    },
    reopen: {
        id: 'gui.learningMaterials.reopen',
        defaultMessage: 'Reopen exercise',
        description: 'Button that reopens a completed exercise'
    },
    submit: {
        id: 'gui.learningMaterials.submit',
        defaultMessage: 'Submit to teacher',
        description: 'Button that submits an exercise program to the teacher'
    },
    submitting: {
        id: 'gui.learningMaterials.submitting',
        defaultMessage: 'Submitting…',
        description: 'Button label while an exercise program is being submitted'
    },
    submitted: {
        id: 'gui.learningMaterials.submitted',
        defaultMessage: 'Submitted to teacher',
        description: 'Status shown after an exercise program was submitted'
    },
    resubmit: {
        id: 'gui.learningMaterials.resubmit',
        defaultMessage: 'Submit updated program',
        description: 'Button that submits a newer exercise program version'
    },
    submissionError: {
        id: 'gui.learningMaterials.submissionError',
        defaultMessage: 'Submission failed. Try again.',
        description: 'Status shown when an exercise program submission failed'
    }
});

const difficultyMessages = {
    beginner: messages.beginner,
    intermediate: messages.intermediate,
    advanced: messages.advanced
};

const statusMessages = {
    available: messages.available,
    in_progress: messages.inProgress,
    completed: messages.completed,
    locked: messages.locked
};

const statusCardStyles = {
    completed: styles.statusCompleted,
    locked: styles.statusLocked
};

const statusLabelStyles = {
    available: styles.statusLabelAvailable,
    in_progress: styles.statusLabelInProgress,
    completed: styles.statusLabelCompleted,
    locked: styles.statusLabelLocked
};

const noop = () => {};

const LearningMaterialsModal = ({
    isOpen,
    manifest,
    statusByExercise,
    submissionAvailable = false,
    submissionsByExercise = {},
    onClose,
    onStatusChange,
    onSubmit = noop
}) => {
    const intl = useIntl();
    const handleStatusClick = useCallback(event => {
        onStatusChange(event.currentTarget.dataset.exerciseId, event.currentTarget.dataset.nextStatus);
    }, [onStatusChange]);
    const handleSubmitClick = useCallback(event => {
        onSubmit(event.currentTarget.dataset.exerciseId);
    }, [onSubmit]);
    if (!isOpen) return null;

    const completedCount = manifest.exercises.filter(exercise =>
        statusByExercise[exercise.id] === 'completed').length;
    const progress = manifest.exercises.length === 0 ? 0 :
        Math.round((completedCount / manifest.exercises.length) * 100);

    const nextStatusFor = status => {
        if (status === 'available') return 'in_progress';
        if (status === 'in_progress') return 'completed';
        if (status === 'completed') return 'in_progress';
        return null;
    };

    const actionMessageFor = status => {
        if (status === 'available') return messages.start;
        if (status === 'in_progress') return messages.complete;
        return messages.reopen;
    };

    return (
        <ReactModal
            isOpen={isOpen}
            className={styles.modal}
            contentLabel={intl.formatMessage(messages.title)}
            overlayClassName={styles.overlay}
            onRequestClose={onClose}
        >
            <header className={styles.header}>
                <div>
                    <div className={styles.eyebrow}><FormattedMessage {...messages.title} /></div>
                    <h1 className={styles.activityTitle}>{manifest.title}</h1>
                </div>
                <button
                    aria-label={intl.formatMessage(messages.close)}
                    className={styles.closeButton}
                    type="button"
                    onClick={onClose}
                >
                    <img
                        alt=""
                        src={closeIcon}
                    />
                </button>
            </header>
            <div className={styles.activitySummary}>
                <p>{manifest.description}</p>
                <div className={styles.progressSummary}>
                    <FormattedMessage
                        {...messages.progress}
                        values={{completed: completedCount, total: manifest.exercises.length}}
                    />
                </div>
                <div
                    aria-hidden="true"
                    className={styles.progressTrack}
                >
                    <div
                        className={styles.progressValue}
                        style={{width: `${progress}%`}}
                    />
                </div>
            </div>
            <main className={styles.cardGrid}>
                {manifest.exercises.map((exercise, index) => {
                    const status = statusByExercise[exercise.id] || 'available';
                    const nextStatus = nextStatusFor(status);
                    const submission = submissionsByExercise[exercise.id];
                    const isSubmitting = submission?.status === 'submitting';
                    const wasSubmitted = submission?.status === 'submitted';
                    const submissionFailed = submission?.status === 'error';
                    const submissionButtonMessage = isSubmitting ? messages.submitting :
                        wasSubmitted ? messages.resubmit : messages.submit;
                    return (
                        <article
                            className={classNames(styles.card, statusCardStyles[status])}
                            key={exercise.id}
                        >
                            <div className={styles.cardTopLine}>
                                <span className={styles.exerciseNumber}>{index + 1}</span>
                                <span className={classNames(styles.status, statusLabelStyles[status])}>
                                    <FormattedMessage {...statusMessages[status]} />
                                </span>
                            </div>
                            <h2>{exercise.title}</h2>
                            <p className={styles.summary}>{exercise.summary}</p>
                            <div className={styles.metadata}>
                                <span><FormattedMessage {...difficultyMessages[exercise.difficulty]} /></span>
                                <span aria-hidden="true">•</span>
                                <span>
                                    <FormattedMessage
                                        {...messages.minutes}
                                        values={{minutes: exercise.estimatedMinutes}}
                                    />
                                </span>
                            </div>
                            <h3><FormattedMessage {...messages.instructions} /></h3>
                            <ol className={styles.instructions}>
                                {exercise.instructions.map((instruction, instructionIndex) => (
                                    <li key={`${exercise.id}-${instructionIndex}`}>{instruction}</li>
                                ))}
                            </ol>
                            <div className={styles.actions}>
                                {nextStatus ? (
                                    <button
                                        className={classNames(styles.actionButton, {
                                            [styles.completeButton]: nextStatus === 'completed'
                                        })}
                                        data-exercise-id={exercise.id}
                                        data-next-status={nextStatus}
                                        type="button"
                                        onClick={handleStatusClick}
                                    >
                                        <FormattedMessage {...actionMessageFor(status)} />
                                    </button>
                                ) : null}
                                {submissionAvailable && status === 'completed' ? (
                                    <div className={styles.submissionAction}>
                                        {wasSubmitted ? (
                                            <div
                                                className={styles.submissionSuccess}
                                                role="status"
                                            >
                                                <FormattedMessage {...messages.submitted} />
                                            </div>
                                        ) : null}
                                        {submissionFailed ? (
                                            <div
                                                className={styles.submissionError}
                                                role="alert"
                                            >
                                                <FormattedMessage {...messages.submissionError} />
                                            </div>
                                        ) : null}
                                        <button
                                            className={classNames(styles.actionButton, styles.submitButton)}
                                            data-exercise-id={exercise.id}
                                            disabled={isSubmitting}
                                            type="button"
                                            onClick={handleSubmitClick}
                                        >
                                            <FormattedMessage {...submissionButtonMessage} />
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        </article>
                    );
                })}
            </main>
        </ReactModal>
    );
};

LearningMaterialsModal.propTypes = {
    isOpen: PropTypes.bool,
    manifest: learningMaterialsShape.isRequired,
    onClose: PropTypes.func.isRequired,
    onStatusChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func,
    statusByExercise: PropTypes.objectOf(PropTypes.string).isRequired,
    submissionAvailable: PropTypes.bool,
    submissionsByExercise: PropTypes.objectOf(PropTypes.object)
};

export default LearningMaterialsModal;
