// ---------------------

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD (Asynchronous Module Definition)
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // CommonJS (Node.js)
        module.exports = factory();
    } else {
        // Global variable (browser)
        root.ConversionTable = root.ConversionTable || factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    /**
     * ConversionTable class providing a singleton pattern for registering,
     * managing, and retrieving conversion tables for various unit conversions.
     */
    class ConversionTable {
        /**
         * The singleton instance of the ConversionTable class.
         * @type {ConversionTable|null}
         * @private
         */
        static _instance = null;

        /**
         * A map to hold registered conversion tables.
         * @type {Object}
         */
        tables = {};

        /**
         * Private constructor to prevent direct instantiation.
         * Use ConversionTable.instance() to get the singleton instance.
         * @throws {Error} If the constructor is called directly.
         */
        constructor() {
            if (ConversionTable._instance) {
                throw new Error("Use ConversionTable.instance() to get the singleton instance.");
            }
        }

        /**
         * Returns the singleton instance of the ConversionTable class.
         * Ensures that only one instance of the class is created.
         *
         * @returns {ConversionTable} The singleton instance of ConversionTable.
         */
        static instance() {
            if (!ConversionTable._instance) {
                ConversionTable._instance = new ConversionTable();
            }
            return ConversionTable._instance;
        }

        /**
         * Registers a conversion table under a given name.
         * Normalizes the table and builds the regex string for it.
         * If force is true, it overwrites an existing table.
         *
         * @param {string} name - The name of the conversion table.
         * @param {Object} table - The conversion table to register.
         * @param {boolean} [force=false] - Whether to overwrite an existing table.
         * @returns {[string|null, boolean|null]} - A tuple: error message or null if successful.
         */
        register(name, table, force = false) {
            try {
                if (this.tables[name] && !force) {
                    return [`Table '${name}' is already registered. Use force=true to overwrite.`, null];
                }

                const instance = ConversionTable.instance();
                instance.table = instance.normalizeTable(table);
                instance.regexString = instance.buildRegex(instance.table);

                // Save the normalized table and regex string as a Singleton
                this.tables[name] = {instance};

                return [null, true];
            } catch (error) {
                return [`Error registering table '${name}': ${error.message}`, null];
            }
        }

        /**
         * Unregisters a conversion table by name.
         * Removes the table from the internal map if it exists.
         *
         * @param {string} name - The name of the conversion table to remove.
         * @returns {string} - A message indicating success or that the table does not exist.
         */
        unregister(name) {
            if (this.tables[name]) {
                delete this.tables[name];
                return `Table '${name}' unregistered successfully.`;
            } else {
                return `Table '${name}' is not registered.`;
            }
        }

        /**
         * Normalizes a conversion table:
         * - Ensures base units have a scale of 1 and a default bias of 0.
         * - Handles alias mapping and preserves the alias property.
         *
         * @param {Object} table - The conversion table to normalize.
         * @returns {Object} - The normalized conversion table.
         */
        normalizeTable(table) {
            const normalizedTable = {};

            for (const key in table) {
                const value = table[key];

                // Ensure base units have a scale of 1 and default bias to 0 if not set
                if (value.base === true) {
                    normalizedTable[key] = {
                        ...value,
                        scale: 1,
                        bias: value.bias ?? 0,
                    };
                } else if (value.alias) {
                    // If the unit is an alias, map it to the corresponding unit and keep the alias
                    normalizedTable[key] = {
                        ...table[value.alias],  // Map to parent unit
                        alias: value.alias      // Preserve the alias
                    };
                } else {
                    normalizedTable[key] = {
                        ...value,
                        scale: value.scale ?? 1,  // Default scale to 1
                        bias: value.bias ?? 0,    // Default bias to 0
                    };
                }
            }

            return normalizedTable;
        }

        /**
         * Builds a regex string from the conversion table's unit names.
         * The regex string is built by sorting units based on length to avoid conflicts
         * (e.g., matching 'c' before 'cm') and captures the major unit and an optional minor unit.
         *
         * @param {Object} table - The conversion table.
         * @returns {string} - The regular expression string for matching unit strings.
         */
        buildRegex(table) {
            const units = Object.keys(table);
            // Sort units by length in descending order to avoid matching 'c' before 'cm'
            units.sort((a, b) => b.length - a.length);
            return `^\\s*(?<majorValue>\\d+(?:\\.\\d+)?)\\s*(?<majorUnit>${units.join('|')})\\s*(?<minorValue>\\d+(?:\\.\\d+)?)?\\s*$`;
        }

        /**
         * Retrieve a registered conversion table by name.
         * Returns [errorString, null] if the table is not registered,
         * or [null, tableInstance] if successful.
         *
         * @param {string} name - The name of the registered conversion table.
         * @returns {[string|null, Object|null]} - A tuple: error message or the table instance.
         */
        get(name) {
            if (!this.tables[name]) {
                return [`Conversion table '${name}' not registered`, null];
            }
            return [null, this.tables[name].instance.table];
        }

        /**
         * Returns a new `RegExp` object created from the regex string stored for the registered table.
         * The regex is used to parse unit strings with major and optional minor units.
         *
         * - **majorValue**: Captures the main numerical value before the unit (e.g., '10' in '10cm').
         * - **majorUnit**: Captures the main unit (e.g., 'cm' in '10cm').
         * - **minorValue**: Captures the optional minor numerical value after the unit (e.g., '5' in '1p5',
         *   where 'p' is Picas and '5' is Points).
         *
         * The named capture groups can be accessed in the `groups` property of the match result.
         *
         * @param {string} name - The name of the registered conversion table to retrieve the regex for.
         * @returns {[string|null, RegExp|null]} - A tuple: error message or the RegExp object.
         */
        regex(name) {
            if (!this.tables[name]) {
                return [`Conversion table '${name}' not registered`, null];
            }
            const regexString = this.tables[name].instance.regexString;
            return [null, new RegExp(regexString)];
        }

        /**
         * Parses a given string using the conversion table specified by tableName.
         * It extracts and returns an object with the following fields:
         *
         * - `main`: Contains the parsed major unit, its value, scale, and bias.
         * - `sub`: Contains the minor unit (if any), its value, scale, and bias.
         * - `base`: The base unit from the conversion table for easy conversion.
         *
         * The result is returned as a tuple where the first element is an error or `null`,
         * and the second element is the parsed object or `null` if no match is found.
         *
         * @param {string} input - The input string to parse.
         * @param {string} tableName - The name of the conversion table to use for parsing.
         * @returns {[string|null, Object|null]} - Tuple with error message or null, and parsed object or null.
         */
        parse(input, tableName) {
            // Retrieve the regex for the table
            const [regexError, regex] = this.regex(tableName);
            if (regexError) {
                return [regexError, null];
            }

            // Match the input string with the retrieved regex
            const match = input.trim().match(regex);
            if (match && match.groups) {
                const {majorValue, majorUnit, minorValue} = match.groups;

                // Retrieve the relevant table entry (handling alias resolution)
                let tableEntry = this.tables[tableName]?.instance.table[majorUnit];
                let parentUnit = majorUnit;

                // If the unit is an alias, resolve it to the parent unit
                if (tableEntry && tableEntry.alias) {
                    parentUnit = tableEntry.alias;
                    tableEntry = this.tables[tableName]?.instance.table[parentUnit];
                }

                let minorUnit = null;
                let subUnit = null;

                // Set the minorUnit if a minorValue is present
                if (minorValue && tableEntry && tableEntry.minor) {
                    minorUnit = tableEntry.minor;
                    subUnit = {
                        unit: minorUnit,
                        value: parseFloat(minorValue),
                        scale: this.tables[tableName]?.instance.table[minorUnit]?.scale || 1,
                        bias: this.tables[tableName]?.instance.table[minorUnit]?.bias || 0,
                    };
                }

                return [null, {
                    main: {
                        unit: parentUnit,  // Use the resolved parent unit (alias resolved)
                        value: parseFloat(majorValue),
                        scale: tableEntry?.scale || 1,  // Default scale to 1 if undefined
                        bias: tableEntry?.bias || 0,    // Default bias to 0 if undefined
                    },
                    sub: subUnit,  // If subunit exists, else null
                    base: Object.keys(this.tables[tableName]?.instance.table).find(
                        key => this.tables[tableName].instance.table[key]?.base
                    ),
                }];
            }

            // Return error if no match is found
            return ['Invalid input format or no match found.', null];
        }

        /**
         * Converts a value from one unit to another within the same table.
         *
         * Conversion steps:
         * 1. The input value is first converted to the base unit using the source unit's scale and bias.
         * 2. If a minor unit is present (e.g., didots in "1 cicero 4 didots"), it is also converted to the base unit.
         * 3. The base unit value is then converted to the desired unit by applying the desired unit's scale and bias.
         *
         * Formula:
         * - To Base Unit: value_in_base = (input_value * source_scale) + source_bias
         * - To Desired Unit: converted_value = (value_in_base - desired_bias) / desired_scale
         *
         * @param {string} inputValue - The input value with its unit (e.g., '10cm' or '1c4').
         * @param {string} desiredUnit - The unit to convert to (e.g., 'm').
         * @param {string} tableName - The name of the conversion table to use.
         * @returns {[string|null, Object|null]} - Tuple: error or null, and the result with converted value and unit.
         */
        convert(inputValue, desiredUnit, tableName) {
            // Parse the input value to handle both major and minor units
            const [parseError, parsed] = this.parse(inputValue, tableName);
            if (parseError) {
                return [parseError, null]; // If parsing fails, return the error
            }

            // Find the desired unit data
            const [findError, desiredUnitData] = this.find(desiredUnit, tableName);
            if (findError) {
                return [findError, null]; // Return the specific error about the missing unit
            }

            // Convert the main unit to the base unit
            let valueInBase = (parsed.main.value * parsed.main.scale) + parsed.main.bias;

            // If a minor unit exists (e.g., didots for ciceros), convert it to the base unit and add to the total
            if (parsed.sub) {
                valueInBase += (parsed.sub.value * parsed.sub.scale) + parsed.sub.bias;
            }

            // Convert from the base unit to the desired unit
            const convertedValue = (valueInBase - desiredUnitData.bias) / desiredUnitData.scale;

            // Return the result
            return [null, { unit: desiredUnit, value: convertedValue }];
        }

        /**
         * Finds the unit or its parent unit (if the unit is an alias) in the table.
         * Returns a tuple with the full content of the unit, or the base unit's data if the unit is an alias.
         * and ensures that the returned object has default values for `scale` (default: 1) and `bias` (default: 0).
         *
         * @param {string} unitName - The name of the unit to find.
         * @param {string} tableName - The name of the conversion table to search in.
         * @returns {[string|null, Object|null]} - Tuple with error message or null, and found unit data or null.
         */
        find(unitName, tableName) {
            // Retrieve the conversion table
            const [getError, tableInstance] = this.get(tableName);
            if (getError) {
                return [getError, null];
            }

            // Check if the unit exists in the table
            let unitData = tableInstance[unitName];

            // If the unit is an alias, find the parent unit and its data
            if (unitData?.alias) {
                unitData = tableInstance[unitData.alias];
                if (!unitData) {
                    return [`Alias '${unitName}' does not map to a valid unit in the table.`, null];
                }
            }

            // Return the unit data or an error if the unit was not found
            if (!unitData) {
                return [`Unit '${unitName}' not found in table '${tableName}'.`, null];
            }

            // Return a new version of the row, with default bias and scale values if they do not exist
            const updatedUnitData = {
                ...unitData,
                scale: unitData.scale !== undefined ? unitData.scale : 1,
                bias: unitData.bias !== undefined ? unitData.bias : 0,
            };

            return [null, updatedUnitData];
        }
    }

    // Return the ConversionTable class as the module export
    return ConversionTable;

}));
