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
    'gui.learningMaterials.instructions': 'Steps',
    'gui.learningDraft.disabled': 'Autosave off',
    'gui.learningDraft.idle': 'Autosave on',
    'gui.learningDraft.pending': 'Changes pending',
    'gui.learningDraft.saving': 'Saving draft…',
    'gui.learningDraft.saved': 'Draft saved',
    'gui.learningDraft.restoring': 'Restoring draft…',
    'gui.learningDraft.error': 'Autosave error'
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
    'gui.learningMaterials.instructions': 'Passos',
    'gui.learningDraft.disabled': 'Desament automàtic desactivat',
    'gui.learningDraft.idle': 'Desament automàtic actiu',
    'gui.learningDraft.pending': 'Canvis pendents',
    'gui.learningDraft.saving': 'Desant l’esborrany…',
    'gui.learningDraft.saved': 'Esborrany desat',
    'gui.learningDraft.restoring': 'Restaurant l’esborrany…',
    'gui.learningDraft.error': 'Error de desament automàtic'
};

const germanMessages = {
    'gui.learningMaterials.menuButton': 'Lernmaterial',
    'gui.learningMaterials.title': 'Lernmaterial',
    'gui.learningMaterials.close': 'Lernmaterial schließen',
    'gui.learningMaterials.progress': '{completed} von {total} Übungen abgeschlossen',
    'gui.learningMaterials.minutes': '{minutes} Min.',
    'gui.learningMaterials.beginner': 'Anfänger',
    'gui.learningMaterials.intermediate': 'Mittel',
    'gui.learningMaterials.advanced': 'Fortgeschritten',
    'gui.learningMaterials.available': 'Verfügbar',
    'gui.learningMaterials.inProgress': 'In Bearbeitung',
    'gui.learningMaterials.completed': 'Abgeschlossen',
    'gui.learningMaterials.locked': 'Gesperrt',
    'gui.learningMaterials.start': 'Übung starten',
    'gui.learningMaterials.complete': 'Als abgeschlossen markieren',
    'gui.learningMaterials.reopen': 'Übung erneut öffnen',
    'gui.learningMaterials.instructions': 'Schritte',
    'gui.learningDraft.disabled': 'Automatisches Speichern aus',
    'gui.learningDraft.idle': 'Automatisches Speichern aktiv',
    'gui.learningDraft.pending': 'Änderungen ausstehend',
    'gui.learningDraft.saving': 'Entwurf wird gespeichert…',
    'gui.learningDraft.saved': 'Entwurf gespeichert',
    'gui.learningDraft.restoring': 'Entwurf wird wiederhergestellt…',
    'gui.learningDraft.error': 'Fehler beim automatischen Speichern'
};

const withLearningMaterialsMessages = messagesByLocale => Object.keys(messagesByLocale).reduce((result, locale) => {
    result[locale] = Object.assign(
        {},
        messagesByLocale[locale],
        englishMessages,
        locale === 'ca' ? catalanMessages : {},
        locale === 'de' ? germanMessages : {}
    );
    return result;
}, {});

export {
    catalanMessages,
    englishMessages,
    germanMessages,
    withLearningMaterialsMessages
};
