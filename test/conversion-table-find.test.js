// ---------------------
const ConversionTable = require('../conversion-table-manager');

describe('ConversionTable Class - find() method', () => {
    let conversionTable;

    beforeAll(() => {
        conversionTable = ConversionTable.instance();
        conversionTable.register('typography', {
            'i': { alias: 'in' },        // Alias for Inches
            'in': { scale: 72.0, term: 'Inch(es)' },    // Inches
            'cm': { scale: 28.3465, term: 'Centimeter(s)' },  // Centimeters
            'pt': { base: true, term: 'Point(s)' },     // Points (Base Unit)
        });
    });

    test('should find a normal unit', () => {
        const [error, unitData] = conversionTable.find('cm', 'typography');
        expect(error).toBeNull();
        expect(unitData).toEqual({
            bias: 0,
            scale: 28.3465,
            term: 'Centimeter(s)',
        });
    });

    test('should find an alias and return the parent unit data', () => {
        const [error, unitData] = conversionTable.find('i', 'typography');
        expect(error).toBeNull();
        expect(unitData).toEqual({
            bias: 0,
            scale: 72.0,
            term: 'Inch(es)',
        });
    });

    test('should return an error if the unit does not exist', () => {
        const [error, unitData] = conversionTable.find('nonexistent', 'typography');
        expect(error).toBe("Unit 'nonexistent' not found in table 'typography'.");
        expect(unitData).toBeNull();
    });

    test('should return an error if the alias does not map to a valid unit', () => {
        conversionTable.register('invalid', {
            'fake': { alias: 'nonexistent' },  // Invalid alias
        });
        const [error, unitData] = conversionTable.find('fake', 'invalid');
        expect(error).toBe("Alias 'fake' does not map to a valid unit in the table.");
        expect(unitData).toBeNull();
    });
});
