const test = require('tap').test;
const formatMessage = require('format-message');
const VirtualMachine = require('../../src/virtual-machine');
const sourceMessages = require('../../translations/core/en.json');

test('setLocale does not mutate extension messages supplied by the caller', async t => {
    const vm = new VirtualMachine();
    const messages = Object.fromEntries(
        Object.entries(sourceMessages).map(([id, descriptor]) => [id, descriptor.message])
    );
    messages['handSensing.categoryName'] = 'Test hand sensing';

    const initialLocale = 'locale-messages-initial';
    formatMessage.setup({
        locale: initialLocale,
        translations: {[initialLocale]: Object.assign({}, messages)}
    });
    vm.extensionManager.loadExtensionIdSync('handSensing');
    await vm.setLocale('hand-sensing-test', messages);

    t.equal(messages['handSensing.categoryName'], 'Test hand sensing');
});
