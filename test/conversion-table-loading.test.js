// conversion-table-loading.test.js
const { ConversionTableManager } = require('../conversion-table-manager');

describe('ConversionTableManager - CommonJS Usage', () => {
    let conversionManager;

    beforeEach(() => {
        conversionManager = new ConversionTableManager();
        const [unregisterError] = conversionManager.unregister('length', false); // Ensure no leftover tables
        expect(unregisterError).toBeNull();  // Unregister shouldn't error out when verbose is false
    });

    it('should create a singleton instance and register a table', () => {
        const lengthTable = {
            cm: { base: true, term: 'Centimeter(s)' },
            m: { scale: 100, term: 'Meter(s)' },
            mm: { scale: 0.1, term: 'Millimeter(s)' }
        };

        // Register the table
        const [registerError, successMessage] = conversionManager.register('length', lengthTable);
        expect(registerError).toBeNull();
        expect(successMessage).toBe("Table 'length' registered successfully.");

        // Check that the table is correctly registered
        const [getError, registeredTable] = conversionManager.get('length');
        expect(getError).toBeNull();
        expect(registeredTable).toBeTruthy();
        expect(registeredTable.base).toBe('cm');
    });

    it('should unregister a table correctly with verbose set to true', () => {
        const lengthTable = {
            cm: { base: true, term: 'Centimeter(s)' },
            m: { scale: 100, term: 'Meter(s)' },
            mm: { scale: 0.1, term: 'Millimeter(s)' }
        };

        // Register and then unregister the table
        conversionManager.register('length', lengthTable);
        const [unregisterError, unregisterMessage] = conversionManager.unregister('length', true);
        expect(unregisterError).toBeNull();
        expect(unregisterMessage).toBe("Table 'length' unregistered successfully.");

        // Ensure that the table is no longer available
        const [getError] = conversionManager.get('length');
        expect(getError).toBe("Table 'length' not found.");
    });

    it('should not return an error when unregistering a non-existent table with verbose false', () => {
        // Attempt to unregister a non-existent table
        const [unregisterError] = conversionManager.unregister('nonExistentTable', false);
        expect(unregisterError).toBeNull(); // No error should be thrown
    });

    it('should return an error when unregistering a non-existent table with verbose true', () => {
        // Attempt to unregister a non-existent table with verbose = true
        const [unregisterError] = conversionManager.unregister('nonExistentTable', true);
        expect(unregisterError).toBe("Table 'nonExistentTable' is not registered.");
    });
});

// Test case for ES module import
describe('ConversionTableManager - ES6 import', () => {
    let conversionManager;

    beforeEach(() => {
        conversionManager = new ConversionTableManager();
        const [unregisterError] = conversionManager.unregister('length', false);
        expect(unregisterError).toBeNull();
    });

    test('should handle ES6 import and unregister tables properly', async () => {
        const { ConversionTableManager } = await import('../conversion-table-manager.js');
        conversionManager = new ConversionTableManager();

        const [error] = conversionManager.get('length');
        expect(error).toBe("Table 'length' not found.");
    });
});

// Test case for global script inclusion (browser)
describe('ConversionTableManager - Global Usage', () => {
    // Set up jsdom for window object in Jest environment
    beforeAll(() => {
        global.window = { ConversionTableManager: require('../conversion-table-manager').ConversionTableManager };
    });

    afterAll(() => {
        delete global.window;  // Clean up global window mock after tests
    });

    it('should exist as a global variable', () => {
        expect(window.ConversionTableManager).toBeDefined();
        const conversionManager = new window.ConversionTableManager();
        expect(conversionManager).toBeInstanceOf(window.ConversionTableManager);
    });
});
