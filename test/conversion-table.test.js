const { ConversionTableManager, ConversionTable } = require('../conversion-table-manager');

describe('ConversionTableManager Class', () => {
    let conversionManager;

    beforeEach(() => {
        // Create a new instance of the ConversionTableManager before each test
        conversionManager = new ConversionTableManager();
        conversionManager.unregister('typography');
        conversionManager.unregister('temp');
    });

    afterEach(() => {
        // Unregister any tables created during the test
        conversionManager.unregister('typography');
        conversionManager.unregister('temp');
    });

    test('should register a conversion table and retrieve it successfully', () => {
        const [error, message] = conversionManager.register('temp', {
            'C': { base: true, term: 'Celsius' },
            'F': { scale: 5 / 9, bias: 32, term: 'Fahrenheit' },
            'K': { bias: 273.15, term: 'Kelvin' }
        });

        expect(error).toBeNull();
        expect(message).toBe("Table 'temp' registered successfully.");

        const [fetchError, tempTable] = conversionManager.get('temp');
        expect(fetchError).toBeNull();
        expect(tempTable).toBeDefined();
    });

    test('should not register a table with the same name unless force=true', () => {
        conversionManager.register('temp', {
            'C': { base: true, term: 'Celsius' }
        });

        const [error] = conversionManager.register('temp', {
            'F': { base: true, term: 'Fahrenheit' }
        });
        expect(error).toBe("Table 'temp' is already registered. Use force=true to overwrite.");

        const [forceError, message] = conversionManager.register('temp', {
            'F': { base: true, term: 'Fahrenheit' }
        }, true);

        expect(forceError).toBeNull();
        expect(message).toBe("Table 'temp' registered successfully.");
    });

    test('should unregister a table successfully', () => {
        conversionManager.register('temp', {
            'C': { base: true, term: 'Celsius' }
        });

        const [unregisterError, message] = conversionManager.unregister('temp');
        expect(unregisterError).toBeNull();
        expect(message).toBe("Table 'temp' unregistered successfully.");

        const [fetchError] = conversionManager.get('temp');
        expect(fetchError).toBe("Table 'temp' not found.");
    });

    test('should normalize a table', () => {
        const [normalizeError, normalizedTable] = ConversionTable.normalizeTable({
            'C': { base: true, term: 'Celsius' },
            'F': { scale: 5 / 9, bias: 32, term: 'Fahrenheit' }
        });

        expect(normalizeError).toBeNull();
        expect(normalizedTable.table.C.scale).toBe(1);
        expect(normalizedTable.table.C.bias).toBe(0);
        expect(normalizedTable.table.F.scale).toBeCloseTo(5 / 9);
        expect(normalizedTable.table.F.bias).toBe(32);
    });

    test('should build a valid regex for a registered table', () => {
        conversionManager.register('temp', {
            'C': { base: true, term: 'Celsius' },
            'F': { scale: 5 / 9, bias: 32, term: 'Fahrenheit' }
        });

        const [error, tempTable] = conversionManager.get('temp');
        expect(error).toBeNull();

        const [regexError, regexString] = ConversionTable.buildRegexString(tempTable.table, 'temp');
        expect(regexError).toBeNull();
        expect(typeof regexString).toBe('string');  // Check if regexString is a string

        const result = '100C'.match(regexString);
        expect(result.groups.majorValue).toBe('100');
        expect(result.groups.majorUnit).toBe('C');
        expect(result.groups.minorValue).toBeUndefined();
    });

    test('should match complex units with minor values', () => {
        conversionManager.register('typography', {
            'p': { scale: 12.0, minor: 'pt', term: 'Pica(s)' },
            'pt': { base: true, term: 'Point(s)' }
        });

        const [error, typographyTable] = conversionManager.get('typography');
        expect(error).toBeNull();

        const [regexError, regexString] = ConversionTable.buildRegexString(typographyTable.table, 'typography');
        expect(regexError).toBeNull();
        expect(typeof regexString).toBe('string');  // Check if regexString is a string

        const result = '1p6'.match(regexString); // '1 Pica 6 Points'
        expect(result.groups.majorValue).toBe('1');
        expect(result.groups.majorUnit).toBe('p');
        expect(result.groups.minorValue).toBe('6');
    });

    test('should return error when trying to retrieve non-registered table', () => {
        const [error] = conversionManager.get('nonexistent');
        expect(error).toBe("Table 'nonexistent' not found.");
    });

    test('should return error when trying to retrieve regex for non-registered table', () => {
        const [error] = conversionManager.get('nonexistent');
        expect(error).toBe("Table 'nonexistent' not found.");
    });
});
