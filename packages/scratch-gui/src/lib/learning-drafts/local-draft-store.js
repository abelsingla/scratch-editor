const DATABASE_NAME = 'ft-learning-local-drafts';
const DATABASE_VERSION = 1;
const STORE_NAME = 'drafts';

const storageError = (error, fallbackMessage) => {
    if (error instanceof Error) return error;
    return new Error(fallbackMessage);
};

const transactionComplete = transaction => new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(storageError(transaction.error, 'Learning draft transaction failed.'));
    transaction.onabort = () => reject(storageError(transaction.error, 'Learning draft transaction was aborted.'));
});

class LocalDraftStore {
    constructor ({databaseName = DATABASE_NAME, indexedDBFactory} = {}) {
        this.databaseName = databaseName;
        this.indexedDB = indexedDBFactory || (typeof window === 'object' ? window.indexedDB : null);
        this.databasePromise = null;
    }

    open () {
        if (!this.indexedDB) return Promise.reject(new Error('IndexedDB is not available.'));
        if (this.databasePromise) return this.databasePromise;

        this.databasePromise = new Promise((resolve, reject) => {
            const request = this.indexedDB.open(this.databaseName, DATABASE_VERSION);
            request.onupgradeneeded = () => {
                const database = request.result;
                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    database.createObjectStore(STORE_NAME, {keyPath: 'id'});
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(storageError(request.error, 'Could not open the learning draft database.'));
            request.onblocked = () => reject(new Error('The learning draft database is blocked.'));
        }).catch(error => {
            this.databasePromise = null;
            throw error;
        });

        return this.databasePromise;
    }

    async get (id) {
        const database = await this.open();
        const transaction = database.transaction(STORE_NAME, 'readonly');
        const request = transaction.objectStore(STORE_NAME).get(id);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(storageError(request.error, 'Could not read the learning draft.'));
        });
    }

    async put (record) {
        const database = await this.open();
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        transaction.objectStore(STORE_NAME).put(record);
        await transactionComplete(transaction);
        return record;
    }

    async delete (id) {
        const database = await this.open();
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        transaction.objectStore(STORE_NAME).delete(id);
        await transactionComplete(transaction);
    }

    close () {
        if (!this.databasePromise) return;
        this.databasePromise.then(database => database.close()).catch(() => {});
        this.databasePromise = null;
    }
}

export {
    DATABASE_NAME,
    DATABASE_VERSION,
    STORE_NAME
};

export default LocalDraftStore;
