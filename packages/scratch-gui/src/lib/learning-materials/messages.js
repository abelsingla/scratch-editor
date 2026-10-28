const englishMessages = {
    'gui.learningMaterials.menuButton': 'Learning materials',
    'gui.learningMaterials.title': 'Learning materials',
    'gui.learningMaterials.close': 'Close learning materials',
    'gui.learningMaterials.progress': '{completed} of {total} exercises completed',
    'gui.learningMaterials.minutes': '{minutes} min',
    'gui.learningMaterials.beginner': 'Beginner',
    'gui.learningMaterials.intermediate': 'Intermediate',
    'gui.learningMaterials.advanced': 'Advanced',
    'gui.learningMaterials.available': 'Available',
    'gui.learningMaterials.inProgress': 'In progress',
    'gui.learningMaterials.completed': 'Completed',
    'gui.learningMaterials.locked': 'Locked',
    'gui.learningMaterials.start': 'Start exercise',
    'gui.learningMaterials.complete': 'Mark as completed',
    'gui.learningMaterials.reopen': 'Reopen exercise',
    'gui.learningMaterials.instructions': 'Steps'
};

const catalanMessages = {
    'gui.learningMaterials.menuButton': 'Material docent',
    'gui.learningMaterials.title': 'Material docent',
    'gui.learningMaterials.close': 'Tanca el material docent',
    'gui.learningMaterials.progress': '{completed} de {total} exercicis completats',
    'gui.learningMaterials.minutes': '{minutes} min',
    'gui.learningMaterials.beginner': 'Inicial',
    'gui.learningMaterials.intermediate': 'Intermedi',
    'gui.learningMaterials.advanced': 'Avançat',
    'gui.learningMaterials.available': 'Disponible',
    'gui.learningMaterials.inProgress': 'En curs',
    'gui.learningMaterials.completed': 'Completat',
    'gui.learningMaterials.locked': 'Bloquejat',
    'gui.learningMaterials.start': 'Comença l’exercici',
    'gui.learningMaterials.complete': 'Marca com a completat',
    'gui.learningMaterials.reopen': 'Torna a obrir l’exercici',
    'gui.learningMaterials.instructions': 'Passos'
};

const withLearningMaterialsMessages = messagesByLocale => Object.keys(messagesByLocale).reduce((result, locale) => {
    result[locale] = Object.assign(
        {},
        messagesByLocale[locale],
        englishMessages,
        locale === 'ca' ? catalanMessages : {}
    );
    return result;
}, {});

export {
    catalanMessages,
    englishMessages,
    withLearningMaterialsMessages
};
