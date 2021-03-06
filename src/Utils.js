function strFormat(c, ...params) {
  const regex = /(\$[a-z]+[a-z0-9_]*)/gi;
  const vars = c.match(regex);
  if (vars === null) {
    if (arguments.length !== 1) {
      throw new Error('Error in the number of arguments');
    }
    return c;
  }
  if (vars.length !== params.length) {
    throw new Error('Error in the number of arguments');
  }
  const parts = [];
  let index = 0;
  vars.forEach((vName, pos) => {
    const i = c.indexOf(vName, index);
    parts.push(c.substr(index, i - index));
    parts.push(params[pos]);
    index = i + vName.length;
  });
  if (index < c.length) {
    parts.push(c.substr(index));
  }
  return parts.join('');
}

/** INMUTABLE OPTIONS */
const immutable = (obj) => new Proxy(obj, {
  get(target, prop) {
    return typeof target[prop] === 'object'
      ? immutable(target[prop])
      : target[prop];
  },
  set() {
    throw new Error('Immutable!');
  },
});

/* eslint no-await-in-loop: "off" */
function empty(obj) {
  switch (typeof obj) {
    case 'undefined': return true;
    case 'string': return obj.length === 0;
    case 'object': {
      if (obj === null) return true;
      const arr = (Array.isArray(obj)) ? obj : Object.keys(obj);
      return (arr.length === 0);
    }
    case 'number': return parseInt(obj, 10) === 0;
    case 'bigint': return parseInt(obj, 10) === 0;
    case 'symbol': return false;
    case 'function': return false;
    default:
      return true;
  }
}

/**
 * Agrega la función has()
 * Inspirado: https://github.com/airbnb/javascript#objects--prototype-builtins
 */

function has(obj, keySearch) {
  if (obj === null || typeof keySearch === 'undefined' || typeof obj === 'undefined') {
    return false;
  }
  if (typeof obj === 'object' && typeof obj[keySearch] !== 'undefined') {
    return true;
  }
  return Object.prototype.hasOwnProperty.call(obj, keySearch);
}

/**
 * Funcion sleep util para debug y etc...
 * info: https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep#answers
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Permite ejecutar un forEach asincrono.
 *
 * Inspirado: https://codeburst.io/javascript-async-await-with-foreach-b6ba62bbf404
 */
async function asyncEach(array, callback) {
  if (!Array.isArray(array) || typeof callback !== 'function') {
    return;
  }
  for (let index = 0; index < array.length; index += 1) {
    await callback(array[index], index, array);
  }
}

export {
  has, sleep, asyncEach, empty, immutable, strFormat,
};
