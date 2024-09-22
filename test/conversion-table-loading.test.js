// ---------------------
const ConversionTable = require('../conversion-table-manager');

// Test case for CommonJS
describe('ConversionTable - CommonJS Usage', () => {
    beforeEach(() => {
        const conversionTable = ConversionTable.instance();
        conversionTable.unregister('length'); // Ensure no leftover tables
    });

    it('should create a singleton instance and register a table', () => {
        const conversionTable = ConversionTable.instance();
        const [error, success] = conversionTable.register('length', {
            cm: { base: true, term: 'Centimeter' },
            m: { scale: 100, term: 'Meter' },
            mm: { scale: 0.1, term: 'Millimeter' }
        });

        expect(error).toBeNull();
        expect(success).toBe(true);
    });
});

// Test case for ES module
describe('ConversionTable - ES6 import', () => {
    beforeEach(() => {
        const conversionTable = ConversionTable.instance();
        conversionTable.unregister('length'); // Unregister to reset state
    });

    test('should handle ES6 import and unregister tables properly', async () => {
        const { default: ConversionTable } = await import('../conversion-table-manager.js');
        const conversionTable = ConversionTable.instance();

        const [error] = conversionTable.get('length');
        expect(error).toBe("Conversion table 'length' not registered");
    });
});

// Test case for global script inclusion (browser)
describe('ConversionTable - Global Usage', () => {
    // Set up jsdom for window object in Jest environment
    beforeAll(() => {
        global.window = { ConversionTable: require('../conversion-table-manager') };
    });

    afterAll(() => {
        delete global.window;  // Clean up global window mock after tests
    });

    it('should exist as a global variable', () => {
        expect(window.ConversionTable).toBeDefined();
        const conversionTable = window.ConversionTable.instance();
        expect(conversionTable).toBeInstanceOf(window.ConversionTable);
    });
});
