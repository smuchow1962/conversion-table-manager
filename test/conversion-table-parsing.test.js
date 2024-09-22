// conversion-table-parsing.test.js
const { ConversionTableManager, ConversionTableOperations } = require('../conversion-table-manager');

// Test data: Valid cases
const validCases = [
    { input: '11', table: 'typography', expected: { main: { unit: 'pt', value: 11, scale: 1, bias: 0 }, sub: null, base: 'pt' } },
    { input: '1.5', table: 'typography', expected: { main: { unit: 'pt', value: 1.5, scale: 1, bias: 0 }, sub: null, base: 'pt' } },
    { input: '2i', table: 'typography', expected: { main: { unit: 'in', value: 2, scale: 72.0, bias: 0 }, sub: null, base: 'pt' } },
    { input: '10cm', table: 'typography', expected: { main: { unit: 'cm', value: 10, scale: 28.3465, bias: 0 }, sub: null, base: 'pt' } },
    { input: '1c4', table: 'typography', expected: { main: { unit: 'c', value: 1, scale: 12.789, bias: 0 }, sub: { unit: 'd', value: 4, scale: 1.06575, bias: 0 }, base: 'pt' } },
    { input: '1p6', table: 'typography', expected: { main: { unit: 'p', value: 1, scale: 12.0, bias: 0 }, sub: { unit: 'pt', value: 6, scale: 1, bias: 0 }, base: 'pt' } },
    { input: '1 in', table: 'typography', expected: { main: { unit: 'in', value: 1, scale: 72.0, bias: 0 }, sub: null, base: 'pt' } },
    { input: '3.5cm', table: 'typography', expected: { main: { unit: 'cm', value: 3.5, scale: 28.3465, bias: 0 }, sub: null, base: 'pt' } },
    { input: '10p 2', table: 'typography', expected: { main: { unit: 'p', value: 10, scale: 12.0, bias: 0 }, sub: { unit: 'pt', value: 2, scale: 1, bias: 0 }, base: 'pt' } },
    { input: ' 10 p ', table: 'typography', expected: { main: { unit: 'p', value: 10, scale: 12.0, bias: 0 }, sub: null, base: 'pt' } },
    { input: ' 1 c 4 ', table: 'typography', expected: { main: { unit: 'c', value: 1, scale: 12.789, bias: 0 }, sub: { unit: 'd', value: 4, scale: 1.06575, bias: 0 }, base: 'pt' } },
    { input: '10cm ', table: 'typography', expected: { main: { unit: 'cm', value: 10, scale: 28.3465, bias: 0 }, sub: null, base: 'pt' } },
    { input: '0.25in', table: 'typography', expected: { main: { unit: 'in', value: 0.25, scale: 72.0, bias: 0 }, sub: null, base: 'pt' } },
    { input: '0.5p', table: 'typography', expected: { main: { unit: 'p', value: 0.5, scale: 12.0, bias: 0 }, sub: null, base: 'pt' } },
    { input: '10d', table: 'typography', expected: { main: { unit: 'd', value: 10, scale: 1.06575, bias: 0 }, sub: null, base: 'pt' } },
    { input: '4.5pt', table: 'typography', expected: { main: { unit: 'pt', value: 4.5, scale: 1, bias: 0 }, sub: null, base: 'pt' } },
    { input: '5 c 6', table: 'typography', expected: { main: { unit: 'c', value: 5, scale: 12.789, bias: 0 }, sub: { unit: 'd', value: 6, scale: 1.06575, bias: 0 }, base: 'pt' } },
    { input: '1c', table: 'typography', expected: { main: { unit: 'c', value: 1, scale: 12.789, bias: 0 }, sub: null, base: 'pt' } },
    { input: '12cm', table: 'typography', expected: { main: { unit: 'cm', value: 12, scale: 28.3465, bias: 0 }, sub: null, base: 'pt' } },
    { input: '0.75cm', table: 'typography', expected: { main: { unit: 'cm', value: 0.75, scale: 28.3465, bias: 0 }, sub: null, base: 'pt' } },
    { input: '3in', table: 'typography', expected: { main: { unit: 'in', value: 3, scale: 72.0, bias: 0 }, sub: null, base: 'pt' } },
    { input: ' 2cm ', table: 'typography', expected: { main: { unit: 'cm', value: 2, scale: 28.3465, bias: 0 }, sub: null, base: 'pt' } },
    { input: '6 p', table: 'typography', expected: { main: { unit: 'p', value: 6, scale: 12.0, bias: 0 }, sub: null, base: 'pt' } },
    { input: '0.2d', table: 'typography', expected: { main: { unit: 'd', value: 0.2, scale: 1.06575, bias: 0 }, sub: null, base: 'pt' } },
    { input: '7p9', table: 'typography', expected: { main: { unit: 'p', value: 7, scale: 12.0, bias: 0 }, sub: { unit: 'pt', value: 9, scale: 1, bias: 0 }, base: 'pt' } },
    { input: '0.1in', table: 'typography', expected: { main: { unit: 'in', value: 0.1, scale: 72.0, bias: 0 }, sub: null, base: 'pt' } },
];

// Test data: Invalid cases
const invalidCases = [
    { input: 'hello', table: 'typography', expectedError: 'Invalid input format or no match found.' },
    { input: 'cm10', table: 'typography', expectedError: 'Invalid input format or no match found.' },
    { input: '5x', table: 'typography', expectedError: 'Invalid input format or no match found.' },
    { input: '20km', table: 'typography', expectedError: 'Invalid input format or no match found.' },
    { input: '1cmm', table: 'typography', expectedError: 'Invalid input format or no match found.' },
    { input: '12pt cm', table: 'typography', expectedError: 'Invalid input format or no match found.' },
    { input: 'x1p2', table: 'typography', expectedError: 'Invalid input format or no match found.' },
    { input: '1.5x 5y', table: 'typography', expectedError: 'Invalid input format or no match found.' },
];

describe('ConversionTableOperations - parse() method with structured result (Valid Cases)', () => {
    let conversionManager, typographyTable;

    beforeAll(() => {
        conversionManager = new ConversionTableManager();
        const typographyTableData = {
            'c': { scale: 12.789, minor: 'd', term: 'Cicero(s)' }, // Ciceros with Didots as the minor unit
            'cm': { scale: 28.3465, term: 'Centimeter(s)' },        // Centimeters
            'd': { scale: 1.06575, term: 'Didot(s)' },              // Didots
            'i': { alias: 'in' },                                   // Alias for inches
            'in': { scale: 72.0, term: 'Inch(es)' },                // Inches
            'p': { scale: 12.0, minor: 'pt', term: 'Pica(s)' },     // Picas with Points as the minor unit
            'pt': { base: true, term: 'Point(s)' },                 // Points as the base unit
        };

        const [registerError] = conversionManager.register('typography', typographyTableData);
        expect(registerError).toBeNull();

        // Retrieve table for later use
        const [getError, table] = conversionManager.get('typography');
        expect(getError).toBeNull();
        typographyTable = table;
    });

    test.each(validCases)(
        'should parse %p correctly',
        ({ input, expected }) => {
            const [error, result] = ConversionTableOperations.parse(input, typographyTable);
            expect(error).toBeNull();
            expect(result).toEqual(expected);
        }
    );
});

describe('ConversionTableOperations - parse() method with structured result (Invalid Cases)', () => {
    let conversionManager, typographyTable;

    beforeAll(() => {
        conversionManager = new ConversionTableManager();

        // Register the typography table again
        const typographyTableData = {
            'c': { scale: 12.789, minor: 'd', term: 'Cicero(s)' }, // Ciceros with Didots as the minor unit
            'cm': { scale: 28.3465, term: 'Centimeter(s)' },        // Centimeters
            'd': { scale: 1.06575, term: 'Didot(s)' },              // Didots
            'i': { alias: 'in' },                                   // Alias for inches
            'in': { scale: 72.0, term: 'Inch(es)' },                // Inches
            'p': { scale: 12.0, minor: 'pt', term: 'Pica(s)' },     // Picas with Points as the minor unit
            'pt': { base: true, term: 'Point(s)' },                 // Points as the base unit
        };

        const [registerError] = conversionManager.register('typography', typographyTableData);
        expect(registerError).toBeNull();

        const [getError, table] = conversionManager.get('typography');
        expect(getError).toBeNull();
        typographyTable = table;
    });

    test.each(invalidCases)(
        'should return error for %p',
        ({ input, expectedError }) => {
            const [error] = ConversionTableOperations.parse(input, typographyTable);
            expect(error).toBe(expectedError);
        }
    );
});
