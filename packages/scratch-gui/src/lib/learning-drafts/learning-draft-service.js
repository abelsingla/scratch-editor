const DRAFT_SCHEMA_VERSION = 1;

const encodeDraftPart = value => encodeURIComponent(String(value || 'default')).slice(0, 240);

const createLearningDraftId = ({activityId, activityRevision, draftId, projectId}) => {
    if (typeof draftId === 'string' && draftId.trim()) {
        return `external:${encodeDraftPart(draftId.trim())}`;
    }
    return [
        'local',
        encodeDraftPart(activityId),
        encodeDraftPart(activityRevision),
        encodeDraftPart(projectId)
    ].join(':');
};

const createDraftMetadata = record => ({
    schemaVersion: DRAFT_SCHEMA_VERSION,
    activityId: record.activityId,
    activityRevision: record.activityRevision,
    byteLength: record.byteLength,
    draftId: record.id,
    projectId: record.projectId,
    savedAt: record.savedAt,
    version: record.version
});

class LearningDraftService {
    constructor (store) {
        this.store = store;
    }

    async save ({
        activityId,
        activityRevision,
        draftId,
        exerciseStatuses,
        projectBlob,
        projectId
    }) {
        if (typeof Blob === 'undefined' || !(projectBlob instanceof Blob)) {
            throw new Error('Learning drafts require an SB3 Blob.');
        }
        const previousRecord = await this.store.get(draftId);
        const record = {
            schemaVersion: DRAFT_SCHEMA_VERSION,
            id: draftId,
            activityId,
            activityRevision,
            projectId: projectId === null || typeof projectId === 'undefined' ? null : String(projectId),
            version: previousRecord && Number.isInteger(previousRecord.version) ? previousRecord.version + 1 : 1,
            savedAt: new Date().toISOString(),
            byteLength: projectBlob.size,
            exerciseStatuses: Object.assign({}, exerciseStatuses),
            projectBlob
        };
        await this.store.put(record);
        return {metadata: createDraftMetadata(record), record};
    }

    async restore (draftId) {
        const record = await this.store.get(draftId);
        if (
            !record ||
            record.schemaVersion !== DRAFT_SCHEMA_VERSION ||
            typeof Blob === 'undefined' ||
            !(record.projectBlob instanceof Blob)
        ) {
            return null;
        }
        return {metadata: createDraftMetadata(record), record};
    }

    delete (draftId) {
        return this.store.delete(draftId);
    }

    close () {
        if (this.store.close) this.store.close();
    }
}

export {
    createDraftMetadata,
    createLearningDraftId,
    DRAFT_SCHEMA_VERSION
};

export default LearningDraftService;
