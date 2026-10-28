const MAX_EXERCISES = 50;
const MAX_INSTRUCTIONS = 20;
const STATUS_VALUES = new Set(['available', 'in_progress', 'completed', 'locked']);
const DIFFICULTY_VALUES = new Set(['beginner', 'intermediate', 'advanced']);

const requiredText = (value, field, maxLength = 160) => {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`Learning materials field "${field}" must be a non-empty string.`);
    }
    return value.trim().slice(0, maxLength);
};

const optionalText = (value, maxLength) => {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, maxLength);
};

const normalizeExercise = (exercise, index) => {
    if (!exercise || typeof exercise !== 'object' || Array.isArray(exercise)) {
        throw new Error(`Learning materials exercise ${index + 1} must be an object.`);
    }
    const instructions = Array.isArray(exercise.instructions) ? exercise.instructions : [];
    if (instructions.length === 0 || instructions.length > MAX_INSTRUCTIONS) {
        throw new Error(`Learning materials exercise ${index + 1} has an invalid instruction count.`);
    }

    return {
        id: requiredText(exercise.id, `exercises[${index}].id`, 80),
        title: requiredText(exercise.title, `exercises[${index}].title`),
        summary: optionalText(exercise.summary, 500),
        instructions: instructions.map((instruction, instructionIndex) =>
            requiredText(instruction, `exercises[${index}].instructions[${instructionIndex}]`, 1000)),
        difficulty: DIFFICULTY_VALUES.has(exercise.difficulty) ? exercise.difficulty : 'beginner',
        estimatedMinutes: Number.isInteger(exercise.estimatedMinutes) ?
            Math.min(999, Math.max(1, exercise.estimatedMinutes)) : 10,
        status: STATUS_VALUES.has(exercise.status) ? exercise.status : 'available'
    };
};

const normalizeLearningMaterials = manifest => {
    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
        throw new Error('Learning materials manifest must be an object.');
    }
    if (manifest.schemaVersion !== 1) {
        throw new Error('Learning materials manifest must use schema version 1.');
    }
    if (!Array.isArray(manifest.exercises) || manifest.exercises.length > MAX_EXERCISES) {
        throw new Error('Learning materials manifest has an invalid exercise list.');
    }

    const exercises = manifest.exercises.map(normalizeExercise);
    const exerciseIds = new Set(exercises.map(exercise => exercise.id));
    if (exerciseIds.size !== exercises.length) {
        throw new Error('Learning materials exercise IDs must be unique.');
    }

    return {
        schemaVersion: 1,
        activityId: requiredText(manifest.activityId, 'activityId', 120),
        revision: requiredText(manifest.revision, 'revision', 80),
        title: requiredText(manifest.title, 'title'),
        description: optionalText(manifest.description, 1000),
        exercises
    };
};

export {
    DIFFICULTY_VALUES,
    MAX_EXERCISES,
    STATUS_VALUES,
    normalizeLearningMaterials
};
