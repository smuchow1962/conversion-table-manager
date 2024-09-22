// ---------------------
describe('ConversionTable Class - ES6 (import)', () => {
    let conversionTable;

    test('should load the class using import (ES6 modules)', async () => {
        const { default: ConversionTable } = await import('../conversion-table-manager.js'); // Use import
        conversionTable = ConversionTable.instance();

        expect(conversionTable).toBeDefined();
    });
});
