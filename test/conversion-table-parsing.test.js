// ---------------------
const ConversionTable = require('../conversion-table-manager');

// Test data: Valid cases
const validCases = [
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
    { input: '10', table: 'typography', expectedError: 'Invalid input format or no match found.' },
    { input: 'hello', table: 'typography', expectedError: 'Invalid input format or no match found.' },
    { input: 'cm10', table: 'typography', expectedError: 'Invalid input format or no match found.' },
    { input: '5x', table: 'typography', expectedError: 'Invalid input format or no match found.' },
    { input: '20km', table: 'typography', expectedError: 'Invalid input format or no match found.' },
    { input: '1cmm', table: 'typography', expectedError: 'Invalid input format or no match found.' },
    { input: '12pt cm', table: 'typography', expectedError: 'Invalid input format or no match found.' },
    { input: '1.5', table: 'typography', expectedError: 'Invalid input format or no match found.' },
    { input: 'x1p2', table: 'typography', expectedError: 'Invalid input format or no match found.' },
    { input: '1.5x 5y', table: 'typography', expectedError: 'Invalid input format or no match found.' },
];

describe('ConversionTable Class - parse() method with structured result (Valid Cases)', () => {
    let conversionTable;

    beforeAll(() => {
        conversionTable = ConversionTable.instance();
        conversionTable.unregister('typography');
        conversionTable.register('typography', {
            'c': { scale: 12.789, minor: 'd', term: 'Cicero(s)' }, // Ciceros with Didots as the minor unit
            'cm': { scale: 28.3465, term: 'Centimeter(s)' },        // Centimeters
            'd': { scale: 1.06575, term: 'Didot(s)' },              // Didots
            'i': { alias: 'in' },                                   // Alias for inches
            'in': { scale: 72.0, term: 'Inch(es)' },                // Inches
            'p': { scale: 12.0, minor: 'pt', term: 'Pica(s)' },     // Picas with Points as the minor unit
            'pt': { base: true, term: 'Point(s)' },                 // Points as the base unit
        });
    });

    test.each(validCases)(
        'should parse %p correctly',
        ({ input, table, expected }) => {
            const [error, result] = conversionTable.parse(input, table);
            expect(error).toBeNull();
            expect(result).toEqual(expected);
        }
    );
});

describe('ConversionTable Class - parse() method with structured result (Invalid Cases)', () => {
    let conversionTable;

    beforeAll(() => {
        conversionTable = ConversionTable.instance();
    });

    test.each(invalidCases)(
        'should return error for %p',
        ({ input, table, expectedError }) => {
            const [error] = conversionTable.parse(input, table);
            expect(error).toBe(expectedError);
        }
    );
});
