![minSQLite](minSQLite.png)

The light and minimalist ORM for sqlite 3


> This project is currently under development.

## Model example:
> 

## Trying

### utils (`src/Utils.js`)
```javascript
import { utils } from ''min-sqlite;

// strFormat
utils.strFormat(
  'SELECT $fields FROM $name WHERE $conds ;',
  '*',
  'users',
  'id = 1'
);
// return
// SELECT users FROM users WHERE id = 1 ;

// method has
const undef = undefined;
const arr = [12, 4, 5, 6];
utils.has(null, 'x');            // false
utils.has(undef, 'y');           // false
utils.has({}, undef));           // false
utils.has(arr, 0))               // true
utils.has(arr, arr.length - 1);  // true
utils.has(arr, arr.length);      // true
// method sleep
async function someFunc() {
  await utils.sleep(1000); // sleeping 1s
  // ... more code
}

// immutable Object
const objImmutable = utils.immutable({ betzy: '💘', fitorec: '🤓' });
// return { betzy: '💘', fitorec: '🤓' }
objImmutable.betzy             // '💘'
objImmutable.fitorec           // '🤓'
objImmutable.betzy = 6;        // Exception Error: Immutable!
objImmutable.firorec = 'x';    // Exception Error: Immutable!
objImmutable.newProp = 'some value'; // Exception Error: Immutable!
objImmutable.betzy                   // '💘'  (no changed)
objImmutable.fitorec                 // '🤓' (no changed)
utils.has('newProp', objImmutable);  // false
```



### SQLite3 types (`src/Types.js`)

```javascript

import {types} from ''min-sqlite;

types.list();                         // List of available types
types.INTEGER                         // an object type INTEGER
types.VARCHAR(30)                     // an object type VARCHAR with length 30
const bol = types.create('BOOLEAN');  // an object type BOOLEAN
types.withLen()                       // [ 'VARCHAR', 'NVARCHAR','CHARACTER', 'NCHAR' ]
types.withLen('VARCHAR');             // true
types.withLen('BOOLEAN');             // alse
types.normalizeAttr('unique', 1);     // true
types.cast.BOOLEAN(1);                // true
types.cast.BOOLEAN('0');              // false
types.cast.INTEGER('123.23');         // 123
types.cast.FLOAT('123.23');           // 123.23
types.cast.TEXT('123.23');            // '123.23' (String)
const integer = types.INTEGER;        // create a type Integer
types.is(type);                       // true
types.is(bol);                        // true
types.is(types.VARCHAR(4));           // true
types.is({});                         // false
types.is(null);                       // false
types.DEFAULT.ai = true;              // No mutation, no errors
console.log(types.DEFAULT.ai);        // false (original value)
types.columnSQLDefinition(columnName, integer)  // return SQL column definion
```


# Contributing Guide

> Por su interes, gracias =)

Contributions are welcome and are greatly appreciated! Every little bit helps, and credit will
always be given.


## Setting up your environment

After forking to your own github org, do the following steps to get started:


```bash
# clone your fork to your local machine
git clone https://github.com/<you-user>/minSQLite

# step into local repo
cd minSQLite

# install dependencies
npm install
```

### Style & Linting

This codebase adheres to the [Airbnb Styleguide](https://github.com/airbnb/javascript) and is
enforced using [ESLint](http://eslint.org/).

It is recommended that you install an eslint plugin for your editor of choice when working on this
codebase, however you can always check to see if the source code is compliant by running:

```bash
npm run lint
```



## Testing


```bash
npm test
```

## Pull Request Guidelines

...

> "Pendiente", on this moment you pull and push :smile:
