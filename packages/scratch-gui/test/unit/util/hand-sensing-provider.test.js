import {EventEmitter} from 'events';

import HandSensingProvider from '../../../src/lib/hand-sensing/hand-sensing-provider.js';
import createHandSensingWorker from '../../../src/lib/hand-sensing/create-hand-sensing-worker.js';

jest.mock('../../../src/lib/hand-sensing/create-hand-sensing-worker.js', () => jest.fn());

const createVm = () => {
    const runtime = new EventEmitter();
    runtime.ioDevices = {
        video: {
            disableVideo: jest.fn(),
            enableVideo: jest.fn(() => Promise.resolve()),
            getFrame: jest.fn(() => null)
        }
    };
    const vm = new EventEmitter();
    vm.runtime = runtime;
    vm.extensionManager = {isExtensionLoaded: jest.fn(() => false)};
    vm.postIOData = jest.fn();
    return vm;
};

describe('HandSensingProvider', () => {
    let worker;

    beforeEach(() => {
        jest.useFakeTimers();
        worker = {
            postMessage: jest.fn(),
            terminate: jest.fn()
        };
        createHandSensingWorker.mockReturnValue(worker);
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    test('starts only after the hand-sensing extension is added', async () => {
        const vm = createVm();
        const provider = new HandSensingProvider(vm);

        vm.emit('EXTENSION_ADDED', {id: 'music'});
        expect(createHandSensingWorker).not.toHaveBeenCalled();

        vm.emit('EXTENSION_ADDED', {id: 'handSensing'});
        await Promise.resolve();

        expect(createHandSensingWorker).toHaveBeenCalledTimes(1);
        expect(vm.runtime.ioDevices.video.enableVideo).toHaveBeenCalledTimes(1);
        expect(worker.postMessage).toHaveBeenCalledWith(expect.objectContaining({
            type: 'initialize',
            detectorModelUrl: expect.stringContaining('/static/hand-sensing/models/detector/model.json'),
            landmarkModelUrl: expect.stringContaining('/static/hand-sensing/models/landmark/model.json')
        }));

        provider.dispose();
    });

    test('finishes loading when the worker is ready without waiting for a camera frame', () => {
        const vm = createVm();
        const loadingStates = [];
        vm.runtime.on('EXTENSION_DATA_LOADING', loadingStates.push.bind(loadingStates));
        const provider = new HandSensingProvider(vm);

        vm.emit('EXTENSION_ADDED', {id: 'handSensing'});
        worker.onmessage({data: {type: 'ready'}});

        expect(loadingStates).toEqual([true, false]);
        provider.dispose();
    });

    test('publishes derived worker results and releases camera resources', () => {
        const vm = createVm();
        vm.extensionManager.isExtensionLoaded.mockReturnValue(true);
        const provider = new HandSensingProvider(vm);

        worker.onmessage({
            data: {
                type: 'result',
                hands: [{handedness: 'right', landmarks: []}],
                timestamp: 42
            }
        });

        expect(vm.postIOData).toHaveBeenCalledWith('handSensing', {
            hands: [{handedness: 'right', landmarks: []}],
            timestamp: 42
        });

        provider.dispose();
        expect(worker.terminate).toHaveBeenCalledTimes(1);
        expect(vm.runtime.ioDevices.video.disableVideo).toHaveBeenCalledTimes(1);
        expect(vm.postIOData).toHaveBeenLastCalledWith('handSensing', {
            hands: [],
            timestamp: expect.any(Number)
        });
    });
});
