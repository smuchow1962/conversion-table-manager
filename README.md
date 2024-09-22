# Conversion Table Manager


[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
![File Size][filesize-url]
[![CDNJS][cdnjs-image]][cdnjs-url]


## ConversionTable
`ConversionTable` collects tables of different unit types, using a pre-defined format and
simplifies managing them.

- This class has a conversion function to change from one unit to another. 
- It is designed as a container of tables
  that can be injected into other functions to perform calculations.

## Features

- **Register** your own custom conversion tables.
- Supports **alias mapping** for alternate unit names.
- Automatically builds **regex** patterns from unit names for parsing.
- Provides a **get method** to get conversion tables.
- Supports the singleton pattern to keep global environment pollution at a minimum (as well
  as static variables).
  - Registering, normalizing, and retrieval of conversion tables are all done from the
    instance() method to enforce this.
- The **parse method** extracts structured data from input strings, supporting major and minor
  units and returning a result that facilitates conversion to base units.

## Installation

To install the package, `conversion-table-manager`, use npm:

```bash
npm install @mmpress/conversion-table-manager
```

## Usage

### Example

The following example illustrates how to use the `ConversionTable` class to register, get, and use
conversion tables:

```javascript
const ConversionTable = require('conversion-table-manager');

// Get singleton instance
const conversionTable = ConversionTable.instance();

// Register a simple temperature conversion table
const [error, success] = conversionTable.register('temp', {
    'C': { base: true, term: 'Celsius' },
    'F': { scale: 5 / 9, bias: 32, term: 'Fahrenheit' },
    'K': { bias: 273.15, term: 'Kelvin' }
});

if (error) {
    console.error(error);
} else {
    console.log("Temperature table registered successfully.");
}

// Fetch the registered table
const [fetchError, tempTable] = conversionTable.get('temp');
if(fetchError) {
    console.error(fetchError);
} else {
    console.log('Fetched table:', tempTable);
}

// Unregister the 'temp' table
const unregisterMessage = conversionTable.unregister('temp');
console.log({unregisterMessage});

// Attempt to retrieve the unregistered table
const [unregisterError] = conversionTable.get('temp');
if (unregisterError) {
    console.error(unregisterError); // Should output an error saying it's not registered
}
```

### Using the `regex()` Method

You can retrieve the regex used to match units in a registered table by calling the `regex()`
method. This returns a new `RegExp` object each time, built from the stored regex string.

Example usage:

```javascript
const [error, regex] = conversionTable.regex('temp');
if (error) {
    console.error(error);
} else {
    console.log(regex);  // Outputs the RegExp object
}

// Example of matching input against the regex
const result = '100C'.match(regex);
console.log(result);  // Matches against the 'C' (Celsius) unit
```

### Using the `parse()` Method

The `parse()` method allows you to analyze input strings and extract structured unit information.
The returned result contains major and minor units, their values, and their scale and bias
relative to the base unit. Additionally, the base unit is identified for conversion purposes.

Example:

```javascript
const [error, result] = conversionTable.parse('10cm', 'distance');
if (error) {
    console.error(error);
} else {
    console.log(result);
    /*
    {
        main: { unit: 'cm', value: 10, scale: 1, bias: 0 },
        sub: null,
        base: 'cm'
    }
    */
}
```

If the input contains both a major and a minor unit, the `sub` field will also be filled with
the minor unit’s information:

```javascript
const [error, result] = conversionTable.parse('1p6', 'typography');
if (error) {
    console.error(error);
} else {
    console.log(result);
    /*
    {
        main: { unit: 'p', value: 1, scale: 12, bias: 0 },
        sub: { unit: 'pt', value: 6, scale: 1, bias: 0 },
        base: 'pt'
    }
    */
}
```

### Parse Method Output Format

The `parse()` method returns an object with the following structure:

```javascript
{
    main: { 
        unit: string,       // The major unit type (e.g., 'cm', 'p', etc.)
        value: Number,       // The numeric value associated with the major unit
        scale: Number,       // The scale factor of the major unit relative to the base unit
        bias: Number         // The bias value for the major unit (added after scaling)
    },
    sub: { 
        unit: string,        // The minor unit type (optional, e.g., 'pt' for points)
        value: Number,       // The numeric value for the minor unit (optional)
        scale: Number,       // The scale factor of the minor unit (optional)
        bias: Number         // The bias value for the minor unit (optional)
    },
    base: string             // The key for the base unit used for conversion
}
```

If the input does not contain a minor unit, the `sub` field will be `null`. The `base` field will
contain the key of the base unit defined in the conversion table, which is used for conversion
purposes.

## Conversion Table Properties

### Structure

A Units Conversion Table is an object in which each key represents a unit, and the value associated
with each key is an object that defines the following properties:

- **base**: `boolean` (required) — Marks the unit as the base unit with a scale of 1 and a bias of 0. Only one
  of the units should have `base: true`.
- **scale**: `number` (optional, default: 1.0) — Conversion factor relative to the base unit.
  This is how the unit relates to the base unit.
- **bias**: `number` (optional, default: 0) — A value added after scaling to the number. Useful
  in temperature conversions.
- **minor**: `string` (optional) — The unit may have a minor unit. For example, Picas have
  Points as their minor unit. Ciceros have Didots.
- **alias**: `string` (optional) — An alias for another unit. The alias behaves the same as
  the unit. For example, `i` is an alias for `in`, which represents 'inches'.
- **term**: `string` (optional) — Descriptive name or pattern of the unit.

### Example: Temperature Conversion Table

Here is an example of how you would format a conversion table for temperature units:

```javascript
const tempTable = {
    'C': { base: true, term: 'Celsius' },                // Base unit (Celsius)
    'F': { scale: 5 / 9, bias: 32, term: 'Fahrenheit' }, // Fahrenheit, with scaling factor and bias
    'K': { bias: 273.15, term: 'Kelvin' },               // Kelvin, bias added
    '°F': { alias: 'F' },                                // Alias for Fahrenheit
    '°C': { alias: 'C' },                                // Alias for Celsius
};
```

### Example: Typography Conversion Table

A bit more interesting example shows up in typography, where units like **Picas** (`p`) and
**Ciceros** (`c`) come with minor units - the Points and Didots respectively:

```javascript
const type = {
    'p': { scale: 12.0, minor: 'pt', term: 'Pica(s)' },    // Picas with Points as the minor unit
    'pt': { base: true, term: 'Point(s)' },                // Points as base unit
    'c': { scale: 12.789, minor: 'd', term: 'Cicero(s)' }, // Ciceros with Didots as the minor unit
    'd': { scale: 1.06575, term: 'Didot(s)' },             // Didots
};
```

### Example: Distance Conversion Table

You can also declare more classic unit conversions, such as distance units:

```javascript
const distance = {
    'cm': { base: true, term: 'Centimeter(s)' }, // Centimeters as base unit
    'm': { scale: 100, term: 'Meter(s)' },       // Meters (100 centimeters)
    'mm': { scale: 0.1, term: 'Millimeter(s)' }, // Millimeters (0.1 centimeter)
    'in': { scale: 2.54, term: 'Inch(es)' },     // Inches in centimeters (2.54 centimeters)
    'ft': { scale: 30.48, term: 'Foot/Feet' },   // Feet (30.48 centimeters)
};
```

## API Documentation

### `ConversionTable.instance()`

Returns the singleton instance of `ConversionTable`. This enforces that, throughout the application,
there is only one instance of this class.

```javascript
const conversionTable = ConversionTable.instance();
```

### `register(name, table, [force=false])`

Registers a new conversion table under the given `name`. It finds the base of the table and creates
a regex pattern able to identify units.

- **name**: A string of the name of the conversion table. For example: `'temp'` for temperature units.
- **table**: The conversion table. For details, see [Conversion Table Properties](#conversion-table-properties).
- **force** (optional): If `true`, `register` overwrites an existing table if there is one by the same name.

Returns an array `[error, success]`:
- `error`: A string containing an error message, if this exists.
- `success`: If the registration was successful.

```javascript
const [error, success] = conversionTable.register('distance', {
    'cm': { base: true, term: 'Centimeter(s)' },
    'm': { scale: 100, term: 'Meter(s)' },
    'mm': { scale: 0.1, term: 'Millimeter(s)' },
});
```

### `unregister(name)`

Removes the designated conversion table.

- **name**: The name of the conversion table to delete.

Returns a string indicating success or failure.

```javascript
const message = conversionTable.unregister('temp');
console.log(message); // "Table 'temp' unregistered successfully."
```

### `get(name)`

Retrieves the registered conversion table with the specified name.

- **name**: The name of the registered table.

Returns an array `[error, table]`:
- `error`: A string if the table does not exist.
- `table`: The conversion table object if successful.

```javascript
const [error, table] = conversionTable.get('distance');
```

### `regex(name)`

Retrieves the `RegExp` used to parse units from a conversion table.

- **name**: The name of the registered conversion table.

Returns an array `[error, regex]`:
- `error`: A string if the table does not exist.
- `regex`: A new `RegExp` object for matching unit strings.

```javascript
const [error, regex] = conversionTable.regex('distance');
```

### `parse(input, tableName)`

Parses the provided `input` string and extracts unit and value information based on the
specified `tableName`. Returns a structured object that includes the major unit, minor unit (if any),
and base unit.

- **input**: The input string to parse (e.g., `'10cm'` or `'1p6'`).
- **tableName**: The name of the registered table to use for parsing.

Returns an array `[error, result]`:
- `error`: A string if the table does not exist or the input cannot be parsed.
- `result`: An object containing structured data for major, minor, and base units.

```javascript
const [error, result] = conversionTable.parse('1p6', 'typography');
```

### Parse Method Output Format

The `parse()` method returns an object with the following structure:

```javascript
{
    main: { 
        unit: string,       // The major unit type (e.g., 'cm', 'p', etc.)
        value: number,       // The numeric value associated with the major unit
        scale: number,       // The scale factor of the major unit relative to the base unit
        bias: number         // The bias value for the major unit (added after scaling)
    },
    sub: { 
        unit: string,        // The minor unit type (optional, e.g., 'pt' for points)
        value: number,       // The numeric value for the minor unit (optional)
        scale: number,       // The scale factor of the minor unit (optional)
        bias: number         // The bias value for the minor unit (optional)
    },
    base: string             // The key for the base unit used for conversion
}
```

If the input does not contain a minor unit, the `sub` field will be `null`. The `base` field will
contain the key of the base unit defined in the conversion table, which is used for conversion
purposes.

### `find(unitName, tableName)`

Finds the unit or its parent unit (if the unit is an alias) in the table. Returns a tuple with the full content
of the `unitName` or the base unit's data if the `unitName` is an alias, and ensures that the returned 
object has default values for `scale` (default: 1) and `bias` (default: 0).

#### Parameters:
- **unitName**: The name of the unit to find.
- **tableName**: The name of the conversion table to search in.

#### Returns:
- A tuple `[error, unitData]`:
  - `error`: A string with the error message, if applicable.
  - `unitData`: The complete data of the found unit or the base unit's data if the `unitName` is an 
    alias, with defaults for `scale` and `bias`.

#### Example:

```javascript
const conversionTable = ConversionTable.instance();
conversionTable.register('typography', {
    'i': { alias: 'in' },      // Alias for 'in'
    'in': { scale: 72, term: 'Inch(es)' },   // Inches
    'pt': { base: true, term: 'Point(s)' },  // Base unit (points)
    'noScale': { term: 'No Scale Unit' }     // Unit with no scale or bias
});

const [error, unitData] = conversionTable.find('i', 'typography');
console.log(unitData); // { scale: 72, term: 'Inch(es)', bias: 0 }

const [error2, noScaleUnit] = conversionTable.find('noScale', 'typography');
console.log(noScaleUnit); // { term: 'No Scale Unit', scale: 1, bias: 0 }
```

### `convert(inputValue, desiredUnit, tableName)`

The `convert` function takes an input value and unit, converts it to the desired unit within a specified 
table, and returns a structured result with the converted value and unit.

#### Parameters:
- **inputValue**: The input string that includes both the value and the unit to be converted (e.g., `'150cm'`).
- **desiredUnit**: The unit to which you want to convert the input value (e.g., `'m'` for meters).
- **tableName**: The name of the conversion table that contains both the input and desired units.

#### Returns:
- A tuple `[error, result]`:
  - `error`: A string containing an error message if the conversion fails.
  - `result`: An object with the converted value and unit, structured as `{ unit: string, value: number }`.

#### Conversion Process:
- The `convert` function parses the `inputValue` using the `parse()` method to extract the major unit and its associated value.
- It retrieves the scale and bias for both the input unit and the desired unit from the specified conversion table.
- The conversion formula applied is:

  ```
  Converted Value = ((Input Value * Input Scale) + Input Bias - Desired Bias) / Desired Scale
  ```

This accounts for differences in scale and bias between the two units.

#### Example:

```javascript
// Assuming the ConversionTable class is in a module called conversion-table-manager.js
const ConversionTable = require('./conversion-table-manager');

// Create a conversion table for length
let conversionTable = ConversionTable.instance();

conversionTable.register('length', {
    cm: { base: true, term: 'Centimeter' },
    m: { scale: 100, term: 'Meter' },
    mm: { scale: 0.1, term: 'Millimeter' }
});

// Convert '150 cm' to meters
let [error, result] = conversionTable.convert('150cm', 'm', 'length');
if (!error) {
    console.log(`150 cm is equal to ${result.value} ${result.unit}`);
}

// Reuse the same variables for another conversion
[error, result] = conversionTable.convert('1m', 'mm', 'length');
if (!error) {
    console.log(`1 m is equal to ${result.value} ${result.unit}`);
}

// Another conversion from millimeters to centimeters
[error, result] = conversionTable.convert('1000mm', 'cm', 'length');
if (!error) {
    console.log(`1000 mm is equal to ${result.value} ${result.unit}`);
}
```

### Example Output:

```bash
150 cm is equal to 1.5 m
1 m is equal to 1000 mm
1000 mm is equal to 100 cm
```

### Full Conversion Process:

1. **Input Parsing**: The `convert` function first parses the input string 
   using the `parse()` method to extract the value and unit.
2. **Table Lookup**: It looks up both the input unit and the desired unit in the specified conversion table.
3. **Conversion Formula**: It applies the conversion formula using the scales and biases of both units.
4. **Return**: The function returns the result with the converted value and the desired unit.
