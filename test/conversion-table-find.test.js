const { ConversionTableManager } = require('../conversion-table-manager');

describe('ConversionTableManager - find() method', () => {
    let conversionManager;

    beforeAll(() => {
        conversionManager = new ConversionTableManager();
        conversionManager.register('typography', {
            'i': { alias: 'in' },        // Alias for Inches
            'in': { scale: 72.0, term: 'Inch(es)' },    // Inches with singular/plural term
            'cm': { scale: 28.3465, term: 'Centimeter(s)' },  // Centimeters with singular/plural term
            'pt': { base: true, term: 'Point(s)' },     // Points with singular/plural term (Base Unit)
        });
    });

    test('should find a normal unit', () => {
        const [error, unitData] = conversionManager.find('cm', 'typography');
        expect(error).toBeNull();
        expect(unitData).toEqual({
            alias: null,
            base: false,
            bias: 0,
            minor: null,
            scale: 28.3465,
            term: ['Centimeter', 'Centimeters'],  // Term returned as an array when found
        });
    });

    test('should find an alias and return the parent unit data', () => {
        const [error, unitData] = conversionManager.find('i', 'typography');
        expect(error).toBeNull();
        expect(unitData).toEqual({
            alias: 'in',
            base: false,
            bias: 0,
            minor: null,
            scale: 72.0,
            term: ['Inch', 'Inches'],  // Term returned as an array when found
        });
    });

    test('should return an error if the unit does not exist', () => {
        const [error, unitData] = conversionManager.find('nonexistent', 'typography');
        expect(error).toBe("Unit 'nonexistent' not found in table 'typography'.");
        expect(unitData).toBeNull();
    });

    test('should return an error if the alias does not map to a valid unit', () => {
        conversionManager.register('invalid', {
            'fake': { alias: 'nonexistent' },  // Invalid alias
        });
        const [error, unitData] = conversionManager.find('fake', 'invalid');
        expect(error).toBe("Table 'invalid' not found.");
        expect(unitData).toBeNull();
    });
});
