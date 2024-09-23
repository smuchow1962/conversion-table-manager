// conversion-table-object.test.js

const { ConversionTable } = require('../conversion-table-manager');

// Define the test tables
const tempTable = {
    'C': { base: true, term: 'Celsius' },
    'F': { scale: 5 / 9, bias: 32, term: 'Fahrenheit' },
    'K': { bias: 273.15, term: 'Kelvin' }
};

const typographyTable = {
    'c': { scale: 12.789065750000, minor: 'd', term: 'Cicero(s)' }, // Ciceros with Didots as the minor unit
    'mm': { scale: 2.834645669291, term: 'Millimeter(s)' }, // Millimeters
    'cm': { scale: 28.346456692914, term: 'Centimeter(s)' }, // Centimeters
    'd': { scale: 1.065543307019, term: 'Didot(s)' }, // Didots
    'i': { alias: 'in' }, // Alias for inches
    'in': { scale: 72.0, term: 'Inch(es)' }, // Inches
    'p': { scale: 12.0, minor: 'pt', term: 'Pica(s)' }, // Picas with Points as the minor unit
    'pt': { base: true, term: 'Point(s)' }, // Points as the base unit
};

const distanceTable = {
    'm': { base: true, term: 'Meter(s)' }, // Meters as the base unit
    'cm': { scale: 0.01, term: 'Centimeter(s)' }, // Centimeters
    'mm': { scale: 0.001, term: 'Millimeter(s)' }, // Millimeters
    'km': { scale: 1000, term: 'Kilometer(s)' }, // Kilometers
    'in': { scale: 0.0254, term: 'Inch(es)' }, // Inches
    'ft': { scale: 0.3048, term: 'Foot/Feet' }, // Feet
    'yd': { scale: 0.9144, term: 'Yard(s)' }, // Yards
    'mi': { scale: 1609.34, term: 'Mile(s)' }, // Miles
    'nmi': { scale: 1852, term: 'Nautical Mile(s)' }, // Nautical Miles
    'fathom': { scale: 1.8288, term: 'Fathom(s)' }, // Fathoms
    'cable': { scale: 185.2, term: 'Cable(s)' }, // Cables (Nautical)
    'league': { scale: 4828.03, term: 'League(s)' }, // Leagues (Nautical)
    'cubit': { scale: 0.4572, term: 'Cubit(s)' }, // Cubits (Ancient)
};

describe('ConversionTable', () => {
    let tempConversionTable, typographyConversionTable, distanceConversionTable;

    // Register the conversion tables before all tests
    beforeAll(() => {
        // Create the conversion tables for each test suite
        const [tempError, tempTableInstance] = ConversionTable.factory(tempTable, 'temperature');
        tempConversionTable = tempTableInstance;

        const [typoError, typoTableInstance] = ConversionTable.factory(typographyTable, 'typography');
        typographyConversionTable = typoTableInstance;

        const [distanceError, distanceTableInstance] = ConversionTable.factory(distanceTable, 'distance');
        distanceConversionTable = distanceTableInstance;
    });

    // Test the factory method for temperature table
    test('should correctly normalize and create a temperature conversion table', () => {
        expect(tempConversionTable).toBeTruthy();
        expect(tempConversionTable.base).toBe('C'); // Celsius should be the base unit
        expect(tempConversionTable.table['F']).toBeDefined(); // Fahrenheit should exist
    });

    // Test the precision for temperature table
    test('should track precision for temperature table', () => {
        expect(tempConversionTable.precision).toBe(15); // 5/9 introduces a repeating decimal, minimum precision of 6
    });

    // Test the normalization logic for typography table
    test('should correctly normalize the typography table', () => {
        expect(typographyConversionTable).toBeTruthy();
        expect(typographyConversionTable.base).toBe('pt'); // Points (pt) should be the base unit

        // Adjusted test for Cicero normalization
        expect(typographyConversionTable.table['c']).toEqual(expect.objectContaining({
            scale: 12.789065750000,
            bias: 0 // bias is default 0 for non-base units
        }));
    });

    // Test the precision handling for repeating decimal in temperature table
    test('should round repeating decimals and cap precision between 6 and 15 for temperature table', () => {
        expect(tempConversionTable.precision).toBe(15); // 5/9 introduces repeating decimal, minimum precision of 6
        expect(tempConversionTable.table['F'].scale).toBeCloseTo(0.555555555555556, 15); // Rounded to 15 digits
    });

    // Test the precision handling for typography table
    test('should correctly track precision for typography table', () => {
        expect(typographyConversionTable.precision).toBe(12); // Highest precision in scale (12.789065750000)
    });

    // Test precision tracking for distance table
    test('should correctly track precision for distance table and round to max 15 digits', () => {
        expect(distanceConversionTable.precision).toBe(6); // Highest precision is in 0.0254 (4 decimal places)
        expect(distanceConversionTable.table['in'].scale).toBeCloseTo(0.0254, 15);
    });

    // Test the precision for typography table
    test('should track precision for typography table', () => {
        expect(typographyConversionTable.precision).toBe(12); // Highest precision in scale (12.789065750000)
    });

    // Test the buildRegexString method for the typography table
    test('should correctly build regex for unit recognition', () => {
        const [error, regexString] = ConversionTable.buildRegexString(typographyConversionTable.table, 'typography');
        expect(error).toBeNull();
        expect(regexString).toBeTruthy();

        const regex = new RegExp(regexString);
        const result = regex.exec('10 cm');
        expect(result.groups.majorValue).toBe('10');
        expect(result.groups.majorUnit).toBe('cm');
    });

    // Test error when no base unit is provided
    test('should return an error when no base unit is provided', () => {
        const badTable = {
            'F': { scale: 5 / 9, bias: 32, term: 'Fahrenheit' }, // Missing base unit
            'K': { bias: 273.15, term: 'Kelvin' }
        };
        const [error, conversionTable] = ConversionTable.factory(badTable, 'badTable');
        expect(error).toMatch(/No Base Key declared/);
        expect(conversionTable).toBeNull();
    });

    // Test error for duplicate base units
    test('should return an error for duplicate base units', () => {
        const badTable = {
            'C': { base: true, term: 'Celsius' },
            'F': { base: true, scale: 5 / 9, bias: 32, term: 'Fahrenheit' }, // Duplicate base
            'K': { bias: 273.15, term: 'Kelvin' }
        };
        const [error, conversionTable] = ConversionTable.factory(badTable, 'badTable');
        expect(error).toMatch(/Duplicate Base Key/);
        expect(conversionTable).toBeNull();
    });

    // Test successful creation of the typography table
    test('should correctly create a typography conversion table', () => {
        expect(typographyConversionTable).toBeTruthy();
        expect(typographyConversionTable.base).toBe('pt'); // Points should be the base unit
        expect(typographyConversionTable.table['p']).toBeDefined(); // Picas should be defined
    });

    // Test precision tracking for distance table
    test('should correctly track precision for distance table', () => {
        expect(distanceConversionTable.precision).toBe(6); // Highest precision is in 0.0254 (4 decimal places)
    });
});

describe('ConversionTable pluralize functionality', () => {
    let distanceConversionTable;

    beforeAll(() => {
        const distanceTable = {
            'm': { base: true, term: 'Meter(s)' },
            'km': { scale: 1000, term: 'Kilometer(s)' },
            'ft': { scale: 0.3048, term: 'Foot/Feet' },
            'cubit': { scale: 0.4572, term: 'Cubit(s)' },
        };

        const [error, tableInstance] = ConversionTable.factory(distanceTable, 'distance');
        distanceConversionTable = tableInstance;
    });

    test('should return singular form for 1 unit', () => {
        expect(distanceConversionTable._pluralize('m', 1)).toBe('Meter');
        expect(distanceConversionTable._pluralize('ft', 1)).toBe('Foot');
        expect(distanceConversionTable._pluralize('cubit', 1)).toBe('Cubit');
    });

    test('should return plural form for multiple units', () => {
        expect(distanceConversionTable._pluralize('m', 5)).toBe('Meters');
        expect(distanceConversionTable._pluralize('ft', 10)).toBe('Feet');
        expect(distanceConversionTable._pluralize('cubit', 2)).toBe('Cubits');
    });
});
