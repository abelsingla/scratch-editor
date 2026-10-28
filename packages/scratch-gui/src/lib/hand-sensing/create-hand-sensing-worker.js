const createHandSensingWorker = () => new Worker(new URL('./hand-sensing-worker.js', import.meta.url));

export default createHandSensingWorker;
