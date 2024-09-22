const { ConversionTableManager, ConversionTableOperations } = require('../conversion-table-manager');

// Test data: Valid cases for the convert() method
const validCases = [
    { input: '2in', table: 'typography', targetUnit: 'pt', expected: { unit: 'pt', value: 144.0 } },
    { input: '10cm', table: 'typography', targetUnit: 'pt', expected: { unit: 'pt', value: 283.46456692914 } },
    { input: '1c4', table: 'typography', targetUnit: 'pt', expected: { unit: 'pt', value: 17.051238978076 } },
    { input: '1p6', table: 'typography', targetUnit: 'pt', expected: { unit: 'pt', value: 18.0 } },
    { input: '1in', table: 'typography', targetUnit: 'cm', expected: { unit: 'cm', value: 2.54 } },
    { input: '3.5cm', table: 'typography', targetUnit: 'pt', expected: { unit: 'pt', value: 99.212598425194 } },
    { input: '10p2', table: 'typography', targetUnit: 'pt', expected: { unit: 'pt', value: 122.0 } },
    { input: '0.25in', table: 'typography', targetUnit: 'mm', expected: { unit: 'mm', value: 6.35 } },
    { input: '1c', table: 'typography', targetUnit: 'pt', expected: { unit: 'pt', value: 12.78906575 } },
    { input: '12cm', table: 'typography', targetUnit: 'pt', expected: { unit: 'pt', value: 340.15748031493 } },
    { input: '10', table: 'typography', targetUnit: 'pt', expected: { unit: 'pt', value: 10 } },
];

// Test data: Invalid cases for the convert() method
const invalidCases = [
    { input: '20km', table: 'typography', targetUnit: 'pt', expectedError: 'Invalid input format or no match found.' },
    { input: 'hello', table: 'typography', targetUnit: 'pt', expectedError: 'Invalid input format or no match found.' },
    { input: 'cm10', table: 'typography', targetUnit: 'pt', expectedError: 'Invalid input format or no match found.' },
    { input: '5x', table: 'typography', targetUnit: 'pt', expectedError: 'Invalid input format or no match found.' },
    { input: '1cmm', table: 'typography', targetUnit: 'pt', expectedError: 'Invalid input format or no match found.' },
];

describe('ConversionTableOperations - convert() method (Valid Cases)', () => {
    let conversionManager;

    beforeAll(() => {
        conversionManager = new ConversionTableManager();
        conversionManager.unregister('typography');
        conversionManager.register('typography', {
            'c': { scale: 12.789065750000, minor: 'd', term: 'Cicero(s)' }, // Ciceros with Didots as the minor unit
            'mm': { scale: 2.834645669291, term: 'Millimeter(s)' },        // Millimeters
            'cm': { scale: 28.346456692914, term: 'Centimeter(s)' },        // Centimeters
            'd': { scale: 1.065543307019, term: 'Didot(s)' },              // Didots
            'i': { alias: 'in' },                                   // Alias for inches
            'in': { scale: 72.0, term: 'Inch(es)' },                // Inches
            'p': { scale: 12.0, minor: 'pt', term: 'Pica(s)' },     // Picas with Points as the minor unit
            'pt': { base: true, term: 'Point(s)' },                 // Points as the base unit
        });
    });

    test.each(validCases)(
        'should convert %p to target unit %p correctly',
        ({ input, table, targetUnit, expected }) => {
            const [tableError, conversionTable] = conversionManager.get(table);
            expect(tableError).toBeNull();

            const [error, result] = ConversionTableOperations.convert(input, targetUnit, conversionTable);

            // Log the conversion, result, and expected result
            console.log(`Input: ${input} -> Target Unit: ${targetUnit}  result: ${result.value}, expected: ${expected.value}`);

            expect(error).toBeNull();
            expect(result.unit).toBe(expected.unit);
            expect(result.value).toBeCloseTo(expected.value, 8); // Precision up to 8 decimal places
        }
    );
});

describe('ConversionTableOperations - convert() method (Invalid Cases)', () => {
    let conversionManager;

    beforeAll(() => {
        conversionManager = new ConversionTableManager();
        conversionManager.unregister('typography');
        conversionManager.register('typography', {
            'c': { scale: 12.789065750000, minor: 'd', term: 'Cicero(s)' }, // Ciceros with Didots as the minor unit
            'mm': { scale: 2.834645669291, term: 'Millimeter(s)' },        // Millimeters
            'cm': { scale: 28.346456692914, term: 'Centimeter(s)' },        // Centimeters
            'd': { scale: 1.065543307019, term: 'Didot(s)' },              // Didots
            'i': { alias: 'in' },                                   // Alias for inches
            'in': { scale: 72.0, term: 'Inch(es)' },                // Inches
            'p': { scale: 12.0, minor: 'pt', term: 'Pica(s)' },     // Picas with Points as the minor unit
            'pt': { base: true, term: 'Point(s)' },                 // Points as the base unit
        });
    });

    test.each(invalidCases)(
        'should return error for %p',
        ({ input, table, targetUnit, expectedError }) => {
            const [tableError, conversionTable] = conversionManager.get(table);
            expect(tableError).toBeNull();

            const [error] = ConversionTableOperations.convert(input, targetUnit, conversionTable);

            // Log the invalid input and expected error
            console.log(`Input: ${input} -> Target Unit: ${targetUnit}`);
            console.log(`Expected Error: ${expectedError}`);
            console.log(`Actual Error: ${error}`);

            expect(error).toBe(expectedError);
        }
    );
});
