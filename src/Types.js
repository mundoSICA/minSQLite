/* eslint: no-underscore-dangle: "off" */
/**
 * this is a implementation of SQLite 3 types
 *
 * more info check: https://sqlite.org/datatype3.html
 *
 * Example of use:
 *
 * types.list();                         // list a viable types
 * types.INTEGER                         // return a object type INTEGER
 * types.VARCHAR(30)                     //return a object type VARCHAR with len 30
 * const bol = types.create('BOOLEAN');  //return a object type BOOLEAN
 * types.withLen()                       // return [ 'VARCHAR', 'NVARCHAR', 'CHARACTER', 'NCHAR' ]
 * types.withLen('VARCHAR');             // true
 * types.withLen('BOOLEAN');             // alse
 * types.normalizeAttr('unique', 1);     // true
 * types.cast.BOOLEAN(1);                // true
 * types.cast.BOOLEAN('0');              // false
 * types.cast.INTEGER('123.23');         // 123
 * types.cast.FLOAT('123.23');           // 123.23
 * types.cast.TEXT('123.23');            // '123.23' (String)
 * const integer = types.INTEGER;        // create a type Integer
 * types.is(type);                       // true
 * types.is(bol);                        // true
 * types.is(types.VARCHAR(4));           // true
 * types.is({});                         // false
 * types.is(null);                       // false
 * types.DEFAULT.ai = true;              // No mutation, no errors
 * console.log(types.DEFAULT.ai);        // false (original value)
 * types.columnSQLDefinition(columnName, integer) // return SQL column definion
 *
 */

/**
 * Utils functions
 */
const sqlite3INT = (n) => parseInt(n, 10);
const sqlite3Text = (str) => ((str === null) ? null : String(str));
const sqlite3Blob = (data) => Buffer.from(data, 'base64');

const sqlite3AppendMaxLen = function sqlite3AppendMaxLen(data, n = -1) {
  const len = (n < 1) ? data.maxLen : Math.min(n, 255);
  return { ...data, ...{ maxLen: len } };
};

const sqlite3Types = {
  DEFAULT: {
    cast: null,
    pk: false, // T/F is primary key
    cid: 127, // order (cid in SQLite) - (default big number)
    maxLen: null, // F.E NVARCHAR(220) (SQLite)
    notnull: false, // IS NOT Null (notnull in SQLite)
    dflt_value: null, // Default value (dflt_value in SQLite)
    validator: null, // Run on set value on Model, and callbacks, f.e. beforeSave
    unique: false, // true/false UNIQUE
    ai: false, // SQLite AUTOINCREMENT
  },
  // Type primary key default
  PK: {
    pk: true, // T/F is primary key
    cid: 0, // order (cid in SQLite) - Firts column
    notnull: true, // IS NOT Null (notnull in SQLite)
    ai: true, // SQLite AUTOINCREMENT
  },
  /** ********************************************************************
 *  INTEGER: Rule Used To Determine Affinity: 1
 *  The value is a signed integer, stored in 1, 2, 3, 4, 6, or 8 bytes
 *  depending on the magnitude of the value.
 ********************************************************************* */
  INT: { },
  INTEGER: { },
  TINYINT: { },
  SMALLINT: { },
  MEDIUMINT: { },
  BIGINT: { },
  INT8: { },
  INT2: { },
  /** ********************************************************************
 * TEXT: Rule Used To Determine Affinity: 2
 * The value is a text string, stored using the database encoding
 * (UTF-8, UTF-16BE or UTF-16LE).
 ********************************************************************* */
  VARCHAR: { maxLen: 100 },
  NVARCHAR: { maxLen: 100 },
  CHARACTER: { maxLen: 100 },
  NCHAR: { maxLen: 55 },
  CLOB: {},
  TEXT: {},
  /** ********************************************************************
 * BLOB: Rule Used To Determine Affinity: 3
 * The value is a blob of data, stored exactly as it was input.
 * ---------------- Maybe convert to base64 ----------------------------
 ********************************************************************* */
  BLOB: {},
  /** ********************************************************************
 * REAL: Rule Used To Determine Affinity: 4
 * The value is a floating point value, stored as an 8-byte IEEE floating point number.
 ********************************************************************* */
  REAL: {},
  DOUBLE: {},
  FLOAT: {},
  /** ********************************************************************
 * NUMERIC: Rule Used To Determine Affinity: 5
 * the database engine may convert values between numeric storage classes (INTEGER and REAL)
 *  and TEXT during query execution.
 ********************************************************************* */
  NUMERIC: {},
  BOOLEAN: {},
  DATE: {},
  DATETIME: {},
  /*
   * CASTs definitions
   */
  cast: {
    // INTEGER
    INT: sqlite3INT,
    INTEGER: sqlite3INT,
    TINYINT: sqlite3INT,
    SMALLINT: sqlite3INT,
    MEDIUMINT: sqlite3INT,
    BIGINT: sqlite3INT,
    INT8: sqlite3INT,
    INT2: sqlite3INT,
    /// TEXT ////////////////////
    TEXT: sqlite3Text,
    VARCHAR: sqlite3Text,
    NVARCHAR: sqlite3Text,
    CHARACTER: sqlite3Text,
    NCHAR: sqlite3Text,
    CLOB: sqlite3Text,
    /// NUMBERS //////////////////////
    REAL: Number,
    DOUBLE: Number,
    FLOAT: Number,
    NUMERIC: Number,
    // BOOLEAN and others.
    BOOLEAN(b) { return ((b === '0') ? false : Boolean(b)); },
    DATE: Date,
    DATETIME: Date,
    BLOB: sqlite3Blob,
  },
  normalizeAttr(attrName, attrVal = null) {
    switch (attrName) {
      case 'cast':
        return (typeof attrVal === 'function') ? attrVal : null;
      case 'cid':
      case 'maxLen': {
        const num = parseInt(attrVal, 10);
        const defVal = (attrName === 'cid') ? 99 : null;
        return Number.isNaN(num) ? defVal : num;
      }
      case 'ai':
      case 'unique':
      case 'pk':
      case 'notnull': return Boolean(attrVal);
      case 'dflt_value': return attrVal;
      case 'validator': return (typeof attrVal === 'function') ? attrVal : null;
      case 'type':
        switch (attrVal) {
          case 'PK': return 'INTEGER';
          case 'DEFAULT': return 'TEXT';
          default:
            return this.list().includes(attrVal) ? attrVal : null;
        }
      default:
        throw new Error(`minSQLiteTypes cant access to ${attrName} attribute!`);
    }
  },
  // special case with VARCHAR,CHAR
  withLen(typeName = null) {
    const typesWithLen = ['VARCHAR', 'NVARCHAR', 'CHARACTER', 'NCHAR'];
    if (typeof typeName !== 'string') {
      return typesWithLen;
    }
    return typesWithLen.includes(typeName.trim().toUpperCase());
  },
  create(typeName = 'DEFAULT', len = 100) {
    if (this.withLen(typeName)) {
      return this[typeName](len);
    }
    if (typeName === 'cast'
      || typeof this[typeName] === 'undefined'
      || typeof this[typeName] !== 'object') {
      return this.DEFAULT;
    }
    return { ...this.DEFAULT, ...this[typeName] };
  },
  // return true if typeObjIn is a minSQLite type
  is(typeObjIn) {
    if (typeObjIn === null || typeof typeObjIn !== 'object') {
      return false;
    }
    const noHasSomeAttr = Object.keys(this.DEFAULT)
      .some((attrName) => typeof typeObjIn[attrName] === 'undefined');
    return !noHasSomeAttr;
  },
  list() {
    return Object.keys(this).filter((str) => /^[A-Z]+$/.test(str));
  },
  /**
   * columnName f.e. id, username, email,
   * typeObjIn
   */
  columnSQLDefinition(columnName, typeObjIn = {}) {
    if (typeof columnName !== 'string' || typeof typeObjIn !== 'object') {
      throw new Error('minSQLiteTypes can\'t create column sql definition!');
    }
    const typeName = this.normalizeAttr('type', typeObjIn.type);
    const colParams = [columnName, typeName];
    if (this.withLen(typeName) && typeObjIn.maxLen !== null) {
      colParams[1] += ` (${typeObjIn.maxLen})`;
    }
    // null
    if (typeObjIn.notnull) {
      colParams.push('NOT');
    }
    colParams.push('NULL');
    // unique
    if (typeObjIn.unique && typeObjIn.pk !== false) {
      colParams.push('UNIQUE');
    }
    // pk
    if (typeObjIn.pk) {
      colParams.push('PRIMARY KEY');
    }
    // ai
    if (typeObjIn.ai) {
      colParams.push('AUTOINCREMENT');
    } else if (typeObjIn.dflt_value !== null) {
      const val = `'${typeObjIn.dflt_value}'`;
      colParams.push(`DEFAULT ${val}`);
    } else if (!typeObjIn.notnull) {
      colParams.push('DEFAULT NULL');
    }
    return colParams.join(' ');
  },
};
/**
 * support to normalize attributes
 */

/*
 *Proxy prevening mutation data
 */
const sqliHandle = {
  get(typesObj, typeName) {
    if (typeof typesObj[typeName] === 'function') {
      return typesObj[typeName];
    }
    if (typeof typesObj[typeName] !== 'object') {
      throw new Error(`minSQLiteTypes, cant access ${typeName}!`);
    }
    const tData = (typesObj[typeName] === undefined) ? {} : typesObj[typeName];
    const data = { ...{ type: typeName }, ...typesObj.DEFAULT, ...tData };
    if (!typesObj.withLen(typeName)) {
      return data;
    }
    return (n = -1) => sqlite3AppendMaxLen(data, n);
  },
  set() { throw new Error('minSQLiteTypes is immutable!'); },
};

export default new Proxy(sqlite3Types, sqliHandle);
