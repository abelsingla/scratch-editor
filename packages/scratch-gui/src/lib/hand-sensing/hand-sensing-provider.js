import log from '../log.js';
import createHandSensingWorker from './create-hand-sensing-worker.js';

const EXTENSION_ID = 'handSensing';
const FRAME_DIMENSIONS = [480, 360];
const FRAME_INTERVAL = 1000 / 12;

class HandSensingProvider {
    constructor (vm) {
        this.vm = vm;
        this._active = false;
        this._busy = false;
        this._ready = false;
        this._loading = false;
        this._videoRequested = false;

        this._handleExtensionAdded = this._handleExtensionAdded.bind(this);
        this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
        this._handleWorkerMessage = this._handleWorkerMessage.bind(this);
        this._handleWorkerError = this._handleWorkerError.bind(this);
        this._captureFrame = this._captureFrame.bind(this);

        this.vm.on('EXTENSION_ADDED', this._handleExtensionAdded);
        document.addEventListener('visibilitychange', this._handleVisibilityChange);

        if (this.vm.extensionManager.isExtensionLoaded(EXTENSION_ID)) this.start();
    }

    _handleExtensionAdded (categoryInfo) {
        if (categoryInfo.id === EXTENSION_ID) this.start();
    }

    _handleVisibilityChange () {
        if (document.hidden) {
            this._stopResources();
        } else if (this.vm.extensionManager.isExtensionLoaded(EXTENSION_ID)) {
            this.start();
        }
    }

    _assetUrl (path) {
        const url = new URL(`static/hand-sensing/${path}`, document.baseURI);
        if (url.origin !== window.location.origin) {
            throw new Error('Hand-sensing assets must be served from the editor origin.');
        }
        return url.toString();
    }

    start () {
        if (this._active || document.hidden) return;
        this._active = true;
        this._loading = true;
        this.vm.runtime.emit('EXTENSION_DATA_LOADING', true);
        this._startupTimeout = setTimeout(() => {
            this._handleWorkerError(new Error('Hand sensing did not receive camera frames in time.'));
        }, 60000);

        try {
            this._worker = createHandSensingWorker();
            this._worker.onmessage = this._handleWorkerMessage;
            this._worker.onerror = this._handleWorkerError;
            this._worker.postMessage({
                type: 'initialize',
                wasmPath: this._assetUrl('wasm/'),
                detectorModelUrl: this._assetUrl('models/detector/model.json'),
                landmarkModelUrl: this._assetUrl('models/landmark/model.json')
            });
        } catch (error) {
            this._handleWorkerError(error);
            return;
        }

        const video = this.vm.runtime.ioDevices.video;
        this._videoRequested = true;
        Promise.resolve(video.enableVideo())
            .then(() => this._scheduleCapture())
            .catch(this._handleWorkerError);
    }

    _scheduleCapture () {
        clearTimeout(this._captureTimeout);
        if (this._active) this._captureTimeout = setTimeout(this._captureFrame, FRAME_INTERVAL);
    }

    _captureFrame () {
        if (!this._active || !this._ready || this._busy) {
            this._scheduleCapture();
            return;
        }

        const frame = this.vm.runtime.ioDevices.video.getFrame({
            dimensions: FRAME_DIMENSIONS,
            format: 'image-data',
            mirror: false,
            cacheTimeout: 0
        });
        if (!frame) {
            this._scheduleCapture();
            return;
        }

        const buffer = new Uint8ClampedArray(frame.data).buffer;
        this._busy = true;
        this._worker.postMessage({
            type: 'frame',
            buffer,
            width: frame.width,
            height: frame.height,
            timestamp: performance.now()
        }, [buffer]);
    }

    _handleWorkerMessage (event) {
        const {data} = event;
        if (data.type === 'ready') {
            this._ready = true;
            if (this._loading) {
                this._loading = false;
                this.vm.runtime.emit('EXTENSION_DATA_LOADING', false);
            }
            this._scheduleCapture();
            return;
        }
        if (data.type === 'result') {
            this._busy = false;
            clearTimeout(this._startupTimeout);
            this.vm.postIOData('handSensing', {hands: data.hands, timestamp: data.timestamp});
            this._scheduleCapture();
            return;
        }
        if (data.type === 'error') this._handleWorkerError(new Error(data.message));
    }

    _handleWorkerError (error) {
        log.warn(`Hand sensing stopped: ${error.message || error}`);
        this._stopResources();
    }

    _stopResources () {
        clearTimeout(this._captureTimeout);
        clearTimeout(this._startupTimeout);
        this._captureTimeout = null;
        this._startupTimeout = null;
        this._active = false;
        this._busy = false;
        this._ready = false;

        if (this._worker) this._worker.terminate();
        this._worker = null;

        this.vm.postIOData('handSensing', {hands: [], timestamp: performance.now()});
        if (this._videoRequested) {
            this._videoRequested = false;
            this.vm.runtime.ioDevices.video.disableVideo();
        }
        if (this._loading) {
            this._loading = false;
            this.vm.runtime.emit('EXTENSION_DATA_LOADING', false);
        }
    }

    dispose () {
        this.vm.off('EXTENSION_ADDED', this._handleExtensionAdded);
        document.removeEventListener('visibilitychange', this._handleVisibilityChange);
        this._stopResources();
    }
}

export default HandSensingProvider;
