import out from './Out';
import { has, strFormat } from './Utils';

/**
 * Se encarga de administrar las consultas SQL en forma de texto.
 */
export default {
  parseName(name) {
    const n = this.slug(name);
    return (n.length === 0) ? null : n;
  },
  slug(str, separator = '_') {
    const strSlug = `${str}`.trim();
    return strSlug.toString()
      .normalize('NFD') // split an accented letter in the base letter and the acent
      .replace(/[\u0300-\u036f]/g, '') // remove all previously split accents
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 ]/g, '') // remove all chars not letters, numbers and spaces (to be replaced)
      .replace(/\s+/g, separator);
  },
  /*
   * Regresa true si el objeto tableInfo es correcto.
   */
  valideTableInfo(tableInfo) {
    if (has(tableInfo, 'pk') && has(tableInfo, 'columns') && typeof tableInfo === 'object') {
      if (tableInfo.pk === null) {
        return true;
      } if (typeof tableInfo.pk === 'string' && tableInfo.pk.length > 0) {
        return has(tableInfo.columns, tableInfo.pk);
      }
    }
    return false;
  },

  /**
   * Intenta devolver una consulta SQL, en caso de no poder, devuelve false.
   * https://www.sqlitetutorial.net/sqlite-update/
   */
  update(tablaNombre, tableInfo, jsonData) {
    if (!this.valideTableInfo(tableInfo)) { // Error
      out.error(`strQuery.update('${tablaNombre}'), tableInfo erroneo`, tableInfo);
      return false;
    }
    const { pk, columns } = tableInfo;
    if (!has(jsonData, pk)) { // Error
      out.error(`strQuery.update('${tablaNombre}'), no existe el campo pk(${pk})`, jsonData);
      return false;
    }
    const sets = [];
    Object.entries(jsonData).forEach(([field, value]) => {
      if (field !== pk && has(columns, field)) {
        sets.push(this.conditionStr([field, '=', value]));
      }
    });
    return strFormat(
      'UPDATE $tablaNombre SET $sets WHERE $conditions',
      tablaNombre,
      sets.join(', '),
      this.conditionStr([tableInfo.pk, '=', jsonData[pk]]),
    );
  },

  /**
   * Instenta generar los metadatos para generar un insert.
   */
  insertMetaData(tablaNombre, tableInfo, jsonData) {
    if (!this.valideTableInfo(tableInfo)) { // Error
      out.error(`strQuery.insert('${tablaNombre}'), tableInfo erroneo`, tableInfo);
      return null;
    }
    const values = [];
    const fields = [];
    Object.entries(jsonData)
      .filter(([field, value]) => has(tableInfo.columns, field) && value !== null)
      .forEach(([field, value]) => {
        values.push(this.normalizarValue(value));
        fields.push(field);
      });
    if (values.length === 0) {
      out.error(`strQuery.insert('${tablaNombre}'), no hay datos validos`, jsonData);
      return null;
    }
    return {
      nombre: tablaNombre,
      fields: fields.join(', '),
      values: values.join(', '),
    };
  },

  /*
   * Intenta devolver una sonsulta SQL del tipo INSERT
   */
  insert(tablaNombre, tableInfo, jsonData, replace = false) {
    const dataInsert = this.insertMetaData(tablaNombre, tableInfo, jsonData);
    if (dataInsert === null) {
      return false;
    }
    const { nombre, fields, values } = dataInsert;
    if (replace === true) {
      return strFormat(
        'REPLACE INTO $tableName ($fields) VALUES ($values)',
        nombre,
        fields,
        values,
      );
    }
    return strFormat(
      'INSERT INTO $tableName ($fields) VALUES ($values)',
      nombre,
      fields,
      values,
    );
  },

  /*
   * Intenta devolver una sonsulta SQL del tipo REPLACE
   * https://www.sqlitetutorial.net/sqlite-replace-statement/
   */
  replace(tablaNombre, tableInfo, jsonData) {
    return this.insert(tablaNombre, tableInfo, jsonData, true);
  },

  /*
   * Intenta generar una consulta DELETE
   * https://www.sqlitetutorial.net/sqlite-delete/
   */
  delete(tablaNombre, tableInfo, pkValue) {
    if (!this.valideTableInfo(tableInfo)) { // Error
      out.error(`strQuery.delete('${tablaNombre}'), tableInfo erroneo`, tableInfo);
      return false;
    }
    return strFormat(
      'DELETE FROM $tablaNombre WHERE $conditions',
      tablaNombre,
      this.conditionStr([tableInfo.pk, '=', pkValue]),
    );
  },
  deleteAll(tabla, tableInfo, ids) {
    return `DELETE FROM ${tabla} WHERE ${tableInfo.pk} in (${ids.toString()})`;
  },

  /**
   * Devuelve una consulta SELECT a partir
   */
  select(queryIn = {}) {
    if (typeof queryIn !== 'object' || queryIn === null) {
      out.error('sqlQuery, no se puede determinar la consulta', queryIn);
    }
    const defaultVals = {
      from: 'sqlite_master',
      columns: ['*'],
      where: ['1'],
      order: [],
    };
    const queryObj = { ...defaultVals, ...queryIn };
    // Las columnas a usar
    const select = queryObj.columns.join(', ');
    // las tablas de donde obtenemos los datos
    const from = (typeof queryObj.from === 'string') ? queryObj.from : queryObj.from.join(', ');
    // las condiciones (where)
    const where = queryObj.where.map((c) => this.conditionStr(c)).join(' AND ');
    // La consulta base.
    let query = strFormat('SELECT $s FROM $f WHERE $w', select, from, where);
    if (queryObj.order.length === 0) {
      return query;
    }
    const ordersStr = queryObj.order.map(this.orderByParam).join(', ');
    query += ` ORDER BY ${ordersStr}`;
    if (has(queryObj, 'limit')) {
      query += ` LIMIT ${queryObj.limit}`;
    }
    return query;
  },
  /**
   * Regresa un parametro de order
   */
  orderByParam(order) {
    let ordParts = [];
    if (typeof order === 'string') {
      ordParts = order.split(' ');
    } else if (Array.isArray(order)) {
      ordParts = [...order];
    }
    if (ordParts.length === 1 && typeof ordParts[0] === 'string') {
      return `${ordParts[0]} ASC`;
    } if (ordParts.length > 1 && typeof ordParts[1] === 'string') {
      const ord = ordParts[1].trim().toUpperCase();
      if (['ASC', 'DESC'].includes(ord)) {
        return `${ordParts[0]} ${ord}`;
      }
    }
    return `${order}`;
  },
  /**
   * Genera una condición a partir de los parametros.
   *
   * ConditionArray: arreglo de condiciones.
   *
   */
  conditionStr(conditionArray = ['1']) {
    if (!Array.isArray(conditionArray)) {
      out.error(`conditionStr tipo ${typeof conditionArray}, data: `, conditionArray);
      return '1';
    }
    switch (conditionArray.length) {
      case 1:
        return conditionArray[0];
      case 2: {
        const [c, v] = conditionArray;
        if (v === null || v === 'null') {
          return `${c} IS NULL`;
        }
        return `${c} = ${this.normalizarValue(v)}`;
      }
      case 3: {
        const [column, op, values] = conditionArray;
        if (typeof op === 'string' && op.trim().toUpperCase() === 'IN') {
          return strFormat('$s IN ($in)', column, values.toString());
        }
        return `${column} ${op} ${this.normalizarValue(values)}`;
      }
      default:
        out.log(`Error: conditionArray.length ${conditionArray.length}`);
    }
    return '1';
  },
  create(tableName) {
    out.log(tableName.name);
    const queryCreateTable = strFormat(
      'CREATE TABLE IF NOT EXISTS $tableName ($columns)',
      tableName.name,
      tableName.columns.join(', '),
    );
    return queryCreateTable;
  },

  normalizarValue(value) {
    if (value === true || value === 'true') {
      return 1;
    }
    if (value === false || value === 'false') {
      return 0;
    }
    if (value === null
        || (typeof value === 'string' && value.trim().toUpperCase() === 'NULL')
    ) {
      return 'NULL';
    }
    if (typeof value === 'string' && Number.isNaN(Number(value))) {
      const v = value.replace(/'/g, "''");
      return `'${v}'`;
    }
    return value;
  },
};
