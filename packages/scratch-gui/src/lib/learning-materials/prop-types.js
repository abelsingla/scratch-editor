import PropTypes from 'prop-types';

const exerciseShape = PropTypes.shape({
    difficulty: PropTypes.oneOf(['beginner', 'intermediate', 'advanced']).isRequired,
    estimatedMinutes: PropTypes.number.isRequired,
    id: PropTypes.string.isRequired,
    instructions: PropTypes.arrayOf(PropTypes.string).isRequired,
    status: PropTypes.oneOf(['available', 'in_progress', 'completed', 'locked']).isRequired,
    summary: PropTypes.string,
    title: PropTypes.string.isRequired
});

const learningMaterialsShape = PropTypes.shape({
    activityId: PropTypes.string.isRequired,
    description: PropTypes.string,
    exercises: PropTypes.arrayOf(exerciseShape).isRequired,
    revision: PropTypes.string.isRequired,
    schemaVersion: PropTypes.oneOf([1]).isRequired,
    title: PropTypes.string.isRequired
});

export {
    exerciseShape,
    learningMaterialsShape
};
