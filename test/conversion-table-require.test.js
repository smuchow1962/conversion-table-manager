// ---------------------
describe('ConversionTable Class - CommonJS (require)', () => {
    let conversionTable;

    test('should load the class using require (CommonJS)', () => {
        const ConversionTable = require('../conversion-table-manager');  // Use require
        conversionTable = ConversionTable.instance();

        expect(conversionTable).toBeDefined();
    });
});
