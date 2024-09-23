(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD (Asynchronous Module Definition)
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // CommonJS (Node.js)
        module.exports = factory();
    } else {
        // Global variable (browser <script> tag)
        root.ConversionModule = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    // ConversionTable class: Represents a single conversion table
    class ConversionTable {
        /**
         * Creates an instance of ConversionTable.
         *
         * @param {Object} table - The normalized table of units.
         * @param {string} base - The base unit of the table.
         * @param {string} regexString - The regex string used to match unit values.
         * @param {string} [tableName] - The name of the conversion table (optional).
         * @param {number} precision - The maximum precision found in the table (digits after the decimal point).
         */
        constructor(table, base, regexString, tableName = '', precision = 6) {
            this.table = table;
            this.base = base;
            this.regexString = regexString;
            this.tableName = tableName;
            this.precision = Math.max(6, Math.min(15, precision)); // Cap precision between 6 and 15
        }

        /**
         * Factory method to create a new ConversionTable instance.
         *
         * @param {Object} rawTable - The raw table object containing unit conversions.
         * @param {string} [tableName] - The name of the conversion table (optional).
         * @returns {[string|null, ConversionTable|null]} A tuple where the first value is an error message (or null),
         *                                                and the second value is the created ConversionTable instance (or null).
         */
        static factory(rawTable, tableName = '') {
            const [normalizeError, normalizedData] = ConversionTable.normalizeTable(rawTable, tableName);
            if (normalizeError) return [normalizeError, null];

            const [regexError, regexString] = ConversionTable.buildRegexString(normalizedData.table, tableName);
            if (regexError) return [regexError, null];

            return [null, new ConversionTable(normalizedData.table, normalizedData.base, regexString, tableName, normalizedData.precision)];
        }

        /**
         * Normalizes a conversion table.
         *
         * Converts the raw table to a normalized format with proper scaling, bias, term structure, etc.
         * Also identifies the base unit and calculates the largest number of digits after the decimal point (precision).
         *
         * @param {Object} table - The raw conversion table object.
         * @param {string} [tableName] - The name of the conversion table (optional).
         * @returns {[string|null, Object|null]} A tuple with the error message (or null) and the normalized table (or null).
         */
        static normalizeTable(table, tableName = '') {
            try {
                const normalizedTable = {};
                let baseKey = '';
                let maxPrecision = 6; // Set minimum precision to 6

                for (const key in table) {
                    let value = table[key];

                    if (value.base === true) {
                        if (baseKey) {
                            return [`Duplicate Base Key in table: ${key} collides with ${baseKey}`, null];
                        }
                        baseKey = key;
                    }

                    if (value.alias) {
                        const a = value.alias;
                        value = table[value.alias];
                        value.alias = a;
                    }

                    // Normalize the scale and round it to 15 decimal digits
                    const normalizedScale = ConversionTable._roundToPrecision(value.scale ?? 1, 15);
                    const normalizedTerm = ConversionTable._parseTerm(value.term); // Convert term to array
                    normalizedTable[key] = ConversionTable._getNormalizedUnit({ ...value, scale: normalizedScale, term: normalizedTerm });

                    // Calculate the number of digits after the decimal point in the scale
                    const precision = ConversionTable._getPrecision(normalizedScale);
                    maxPrecision = Math.max(maxPrecision, precision);
                }

                if (!baseKey) return [`No Base Key declared in table: ${tableName}`, null];

                // Cap precision between 6 and 15 digits
                maxPrecision = Math.max(6, Math.min(15, maxPrecision));

                return [null, { table: normalizedTable, base: baseKey, precision: maxPrecision }];
            } catch (error) {
                return [`Error normalizing table: ${tableName} - ${error.message}`, null];
            }
        }

        /**
         * Builds a regular expression from the normalized table of units.
         *
         * @param {Object} table - The normalized conversion table object.
         * @param {string} tableName - The name of the conversion table (optional).
         * @returns {[string|null, string|null]} A tuple with the error (or null) and the regex string (or null).
         */
        static buildRegexString(table, tableName = '') {
            try {
                const units = Object.keys(table);
                if (units.length === 0) return [`table:${tableName} No units found to build regex.`, null];

                // Sort units by length in descending order to avoid conflicts like 'c' and 'cm'
                units.sort((a, b) => b.length - a.length);
                const regexString = `^\\s*(?<majorValue>\\d+(?:\\.\\d+)?)\\s*(?<majorUnit>${units.join('|')})?\\s*(?<minorValue>\\d+(?:\\.\\d+)?)?\\s*$`;

                return [null, regexString];
            } catch (error) {
                return [`Error building regex for table:${tableName} ${error.message}`, null];
            }
        }

        /**
         * Rounds a number to the specified precision.
         *
         * @param {number} num - The number to round.
         * @param {number} precision - The maximum number of decimal places to round to.
         * @returns {number} The rounded number.
         * @private
         */
        static _roundToPrecision(num, precision) {
            return parseFloat(num.toFixed(precision));
        }

        /**
         * Returns the number of digits after the decimal point in a number.
         *
         * @param {number} num - The number to check.
         * @returns {number} The number of digits after the decimal point.
         * @private
         */
        static _getPrecision(num) {
            if (!isFinite(num)) return 0;
            const parts = num.toString().split('.');
            return parts.length > 1 ? parts[1].length : 0;
        }

        /**
         * Helper function to get normalized unit with scale, bias, and term.
         *
         * @param {Object} value - The raw value of the unit.
         * @returns {Object} The normalized unit with proper scale, bias, and term structure.
         * @private
         */
        static _getNormalizedUnit(value) {
            const { base, scale = 1, bias = 0, alias, minor, term } = value;

            let normalizedTerm = term;
            if (typeof term === 'string') {
                normalizedTerm = ConversionTable._parseTerm(term);
            }

            return {
                base: !!base,
                scale,
                bias,
                alias: alias || null,
                minor: minor || null,
                term: normalizedTerm,
            };
        }

        /**
         * Helper function to parse term into singular and plural forms.
         *
         * @param {string} term - The term string (e.g., "Meter(s)" or "Foot/Feet").
         * @returns {[string, string]} An array containing the singular and plural forms of the term.
         * @private
         */
        static _parseTerm(term) {
            if (Array.isArray(term)) return term;

            const matchParentheses = term?.match(/^([^\(]+)\(([^\)]+)\)$/);
            const matchSlash = term?.match(/^([^\/]+)\/(.+)$/);

            if (matchParentheses) {
                return [matchParentheses[1], matchParentheses[1] + matchParentheses[2]];
            } else if (matchSlash) {
                return [matchSlash[1], matchSlash[2]];
            } else if (term) {
                return [term, term];
            }

            return null;
        }

        /**
         * Pluralizes a unit based on the provided value.
         *
         * @param {string} unit - The unit key to pluralize (e.g., 'm', 'cm', etc.).
         * @param {number} value - The value to decide if singular or plural.
         * @returns {string} The singular or plural form of the unit term.
         * @private
         */
        _pluralize(unit, value) {
            const unitData = this.table[unit];
            if (!unitData || !unitData.term) return unit;
            return value === 1 ? unitData.term[0] : unitData.term[1];
        }
    }

    // ConversionTableOperations class: Responsible for handling conversion operations
    class ConversionTableOperations {
        static parse(input, conversionTable) {
            try {
                const regex = new RegExp(conversionTable.regexString);
                const match = input.trim().match(regex);

                if (match && match.groups) {
                    const { majorValue, majorUnit, minorValue } = match.groups;

                    // Resolve unit, check if it's an alias, and use the real unit.
                    let tableEntry = conversionTable.table[majorUnit] || conversionTable.table[conversionTable.base];
                    let resolvedUnit = majorUnit || conversionTable.base;

                    if (tableEntry.alias) {
                        const key = tableEntry.alias;
                        tableEntry = conversionTable.table[tableEntry.alias];
                        resolvedUnit = key;  // Return the real object as per your requirement
                    }

                    const parsed = {
                        main: {
                            unit: resolvedUnit,  // Assign the correct unit (resolved if alias)
                            value: parseFloat(majorValue),
                            scale: tableEntry.scale ?? 1,
                            bias: tableEntry.bias ?? 0
                        },
                        sub: minorValue ? {
                            unit: tableEntry.minor,
                            value: parseFloat(minorValue),
                            scale: conversionTable.table[tableEntry.minor]?.scale || 1,
                            bias: conversionTable.table[tableEntry.minor]?.bias || 0
                        } : null,
                        base: conversionTable.base
                    };

                    return [null, parsed];
                }

                return ['Invalid input format or no match found.', null];
            } catch (error) {
                return [`Error parsing input: ${error.message}`, null];
            }
        }

        static convert(inputValue, desiredUnit, conversionTable) {
            try {
                const [parseError, parsed] = ConversionTableOperations.parse(inputValue, conversionTable);
                if (parseError) {
                    return [parseError, null];
                }

                const desiredUnitData = conversionTable.table[desiredUnit];
                if (!desiredUnitData) {
                    return [`Unit '${desiredUnit}' not found.`, null];
                }

                let valueInBase = (parsed.main.value * parsed.main.scale) + parsed.main.bias;
                if (parsed.sub) {
                    valueInBase += (parsed.sub.value * parsed.sub.scale) + parsed.sub.bias;
                }

                const convertedValue = (valueInBase - desiredUnitData.bias) / desiredUnitData.scale;
                return [null, { unit: desiredUnit, value: convertedValue }];
            } catch (error) {
                return [`Error during conversion: ${error.message}`, null];
            }
        }
    }

    // ConversionTableManager class: Manages the registration and retrieval of ConversionTable instances
    class ConversionTableManager {
        constructor() {
            this.tables = {};
        }

        /**
         * Registers a new conversion table.
         * @param {string} name - Name of the conversion table.
         * @param {Object} rawTable - The raw conversion table data.
         * @param {boolean} [force=false] - Whether to overwrite an existing table.
         * @returns {[string|null, boolean|null]} Tuple with error message or null, and true if success.
         */
        register(name, rawTable, force = false) {
            if (this.tables[name] && !force) {
                return [`Table '${name}' is already registered. Use force=true to overwrite.`, null];
            }

            try {
                const [factoryError, tableInstance] = ConversionTable.factory(rawTable, name);
                if (factoryError) return [factoryError, null];

                this.tables[name] = tableInstance;
                return [null, `Table '${name}' registered successfully.`];
            } catch (error) {
                return [`Error registering table '${name}': ${error.message}`, null];
            }
        }

        /**
         * Unregisters a conversion table by name.
         * @param {string} name - The name of the table to unregister.
         * @param {boolean} verbose - If false, a missing table will not raise an error.
         * @returns {[string|null, boolean|null]} Tuple with error message or null, and true if unregistered.
         */
        unregister(name, verbose = false) {
            if (!this.tables[name]) {
                if (verbose) {
                    return [`Table '${name}' is not registered.`, null];
                }
                return [null, null];
            }
            delete this.tables[name];
            return [null, `Table '${name}' unregistered successfully.`];
        }

        /**
         * Retrieves a registered conversion table by name.
         * @param {string} name - The name of the conversion table.
         * @returns {[string|null, Object|null]} Tuple with error message or null, and the conversion table if found.
         */
        get(name) {
            const table = this.tables[name];
            if (!table) {
                return [`Table '${name}' not found.`, null];
            }
            return [null, table];
        }

        /**
         * Find a unit by its key in the specified table.
         * Resolves aliases and returns the actual unit data.
         *
         * @param {string} unitKey - The unit or alias key to search for.
         * @param {string} tableName - The name of the table to search in.
         * @returns {[string|null, Object|null]} A tuple with the error message (or null), and the unit data (or null).
         */
        find(unitKey, tableName) {
            const table = this.tables[tableName];
            if (!table) {
                return [`Table '${tableName}' not found.`, null];
            }

            // Find the unit data or alias
            let unitData = table.table[unitKey];
            if (!unitData) {
                return [`Unit '${unitKey}' not found in table '${tableName}'.`, null];
            }

            // If it's an alias, resolve it to the actual unit
            if (unitData.alias) {
                const resolvedData = table.table[unitData.alias];
                if (!resolvedData) {
                    return [`Alias '${unitKey}' does not map to a valid unit in the table.`, null];
                }
                unitData = resolvedData;  // Return the resolved data
            }

            return [null, {
                scale: unitData.scale,
                bias: unitData.bias ?? 0,
                term: unitData.term || undefined,  // Return the full term array if present
            }];
        }

    }

    return {
        ConversionTable,
        ConversionTableOperations,
        ConversionTableManager
    };
}));
