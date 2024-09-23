// conversion-table-find.test.js
const { ConversionTableManager, ConversionUnit } = require('../conversion-table-manager');

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

    test('should find a normal unit and return an instance of ConversionUnit', () => {
        const [error, unitData] = conversionManager.find('cm', 'typography');
        expect(error).toBeNull();
        expect(unitData).toBeInstanceOf(ConversionUnit);  // Verify the class instance
        expect(unitData).toEqual(new ConversionUnit({
            alias: null,  // No alias for cm
            base: false,  // Not a base unit
            bias: 0,  // No bias
            minor: null,  // No minor unit
            scale: 28.3465,  // Correct scale for cm
            term: ['Centimeter', 'Centimeters']  // Correct singular/plural term
        }));
    });

    test('should find an alias and return the parent unit data as an instance of ConversionUnit', () => {
        const [error, unitData] = conversionManager.find('i', 'typography');
        expect(error).toBeNull();
        expect(unitData).toBeInstanceOf(ConversionUnit);
        expect(unitData).toEqual(new ConversionUnit({
            alias: 'in',  // Alias resolves to 'in'
            base: false,  // Not a base unit
            bias: 0,  // No bias for inches
            minor: null,  // No minor unit
            scale: 72.0,  // Correct scale for inches
            term: ['Inch', 'Inches']  // Correct singular/plural term
        }));
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
