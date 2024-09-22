// ---------------------
const ConversionTable = require('../conversion-table-manager');

describe('ConversionTable Class', () => {
    let conversionTable;

    beforeEach(() => {
        // Reset singleton instance before each test
        conversionTable = ConversionTable.instance();
        conversionTable.unregister('typography');
        conversionTable.unregister('temp');
    });

    afterEach(() => {
        // Unregister any tables created during the test
        conversionTable.unregister('typography');
        conversionTable.unregister('temp');
    });

    test('should return the singleton instance', () => {
        const instance1 = ConversionTable.instance();
        const instance2 = ConversionTable.instance();
        expect(instance1).toBe(instance2);
    });

    test('should register a conversion table and retrieve it successfully', () => {
        const [error, success] = conversionTable.register('temp', {
            'C': { base: true, term: 'Celsius' },
            'F': { scale: 5 / 9, bias: 32, term: 'Fahrenheit' },
            'K': { bias: 273.15, term: 'Kelvin' }
        });

        expect(error).toBeNull();
        expect(success).toBe(true);

        const [fetchError, tempTable] = conversionTable.get('temp');
        expect(fetchError).toBeNull();
        expect(tempTable).toBeDefined();
    });

    test('should not register a table with the same name unless force=true', () => {
        conversionTable.register('temp', {
            'C': { base: true, term: 'Celsius' }
        });

        const [error] = conversionTable.register('temp', {
            'F': { base: true, term: 'Fahrenheit' }
        });
        expect(error).toBe("Table 'temp' is already registered. Use force=true to overwrite.");

        const [forceError, forceSuccess] = conversionTable.register('temp', {
            'F': { base: true, term: 'Fahrenheit' }
        }, true);

        expect(forceError).toBeNull();
        expect(forceSuccess).toBe(true);
    });

    test('should unregister a table successfully', () => {
        conversionTable.register('temp', {
            'C': { base: true, term: 'Celsius' }
        });

        const message = conversionTable.unregister('temp');
        expect(message).toBe("Table 'temp' unregistered successfully.");

        const [fetchError] = conversionTable.get('temp');
        expect(fetchError).toBe("Conversion table 'temp' not registered");
    });

    test('should normalize a table', () => {
        const normalizedTable = conversionTable.normalizeTable({
            'C': { base: true, term: 'Celsius' },
            'F': { scale: 5 / 9, bias: 32, term: 'Fahrenheit' }
        });

        expect(normalizedTable.C.scale).toBe(1);
        expect(normalizedTable.C.bias).toBe(0);
        expect(normalizedTable.F.scale).toBe(5 / 9);
        expect(normalizedTable.F.bias).toBe(32);
    });

    test('should build a valid regex for registered table', () => {
        conversionTable.register('temp', {
            'C': { base: true, term: 'Celsius' },
            'F': { scale: 5 / 9, bias: 32, term: 'Fahrenheit' }
        });

        const [error, regex] = conversionTable.regex('temp');
        expect(error).toBeNull();
        expect(regex).toBeInstanceOf(RegExp);

        const result = '100C'.match(regex);
        expect(result.groups.majorValue).toBe('100');
        expect(result.groups.majorUnit).toBe('C');
        expect(result.groups.minorValue).toBeUndefined();
    });

    test('should match complex units with minor values', () => {
        conversionTable.register('typography', {
            'p': { scale: 12.0, minor: 'pt', term: 'Pica(s)' },
            'pt': { base: true, term: 'Point(s)' }
        });

        const [error, regex] = conversionTable.regex('typography');
        expect(error).toBeNull();

        const result = '1p6'.match(regex); // '1 Pica 6 Points'
        expect(result.groups.majorValue).toBe('1');
        expect(result.groups.majorUnit).toBe('p');
        expect(result.groups.minorValue).toBe('6');
    });

    test('should return error when trying to retrieve non-registered table', () => {
        const [error] = conversionTable.get('nonexistent');
        expect(error).toBe("Conversion table 'nonexistent' not registered");
    });

    test('should return error when trying to retrieve regex for non-registered table', () => {
        const [error] = conversionTable.regex('nonexistent');
        expect(error).toBe("Conversion table 'nonexistent' not registered");
    });
});
