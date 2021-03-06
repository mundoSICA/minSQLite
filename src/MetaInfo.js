import out from './Out';
import { has } from './Utils';
import strQuery from './strQuery';

/*
 * This class is in charge of managing the metadata of the database.
 */
class MetaData {
  constructor() {
    if (typeof MetaData.instance === 'object') {
      return MetaData.instance;
    }
    this.loadedNames = false;
    this.connector = null;
    this.tables = {};
    this.created = null;
    MetaData.instance = this;
    return this;
  }

  /**
   * set the created item and return seconds
   */
  init() {
    return this.created - new Date().getTime();
  }

  /**
   * set connector and created
   *
   * @param {*} connector
   */
  setConnector(connector) {
    this.connector = connector;
    this.created = new Date().getTime();
  }

  static normalizeCol(column) {
    const col = { ...column };
    col.cid = parseInt(col.cid, 10);
    col.notnull = (col.notnull === 1 || col.notnull === true || col.notnull === '1');
    // Is part of the PRIMARY KEY
    col.pk = (col.pk === 1 || col.pk === true || col.pk === '1');
    const result = { name: col.name };
    delete col.name;
    result.col = col;
    return result;
  }

  /**
   * Devuelve un objeto de metadatos, generan un objeto tipo:
   * https://www.oreilly.com/library/view/using-sqlite/9781449394592/re205.html
   * {
   *  pk: 'id',.
   *  created: seconds,
   *  lastAccess: seconds,
   *  columns: {
   *    nombre:{
   *    cid: 0,
   *    type: 'NVARCHAR(120)',
   *    notnull: true,
   *    dflt_value: null,
   *    pk: 0
   *    }
   * ]
   * }
   */
  async table(name = '') {
    const diffNow = this.init() - this.created;
    if (has(this.tables, name) && this.tables[name] !== null) {
      this.tables[name].lastAccess = diffNow;
      return this.tables[name];
    }
    if (this.connector === null) {
      return null;
    }
    this.tables[name] = await this.pragma(name, diffNow);
    return this.tables[name];
  }

  /**
   *
   * @param {*} tableName
   * @param {*} created
   */
  async pragma(tableName, created) {
    let tableData = {
      pk: null,
      created,
      lastAccess: created,
      columns: {},
    };
    const query = `PRAGMA table_info (${tableName})`;
    try {
      out.line();
      const result = await this.connector.all(query);
      out.log(`showing the result typeof "${typeof result}"`, result);
      out.line();
      if (result === null || result.length <= 0) {
        out.error(`no hay informacion de la tabla ${tableName}.`, this.tables[tableName]);
        return tableData;
      }
      out.line();
      result.forEach((column) => {
        const metaCol = MetaData.normalizeCol(column);
        out.log(`MetaInfo.loadColumn(${metaCol.name})`, metaCol.col);
        // maybe .pk it should be a fix to support composite ids.
        if (metaCol.col.pk) {
          tableData.pk = metaCol.name;
        }
        tableData = metaCol.col;
      });
    } catch (e) {
      out.error('MetaInfo.loadTable(), exeption: ', e);
    }
    out.log(`MetaInfo.loadTable(${tableName})`, tableData);
    return tableData;
  }

  async columnsFrom(tableName) {
    const infoTable = await this.table(tableName);
    return infoTable.columns;
  }

  async pkFrom(tableName) {
    const infoTable = await this.table(tableName);
    return infoTable.pk();
  }

  async existsTable(tableName, forceUpdate = false) {
    if (has(this.tables, tableName)) {
      return true;
    }
    if (this.loadedNames === true && forceUpdate === false) {
      return false;
    }
    await this.loadTablesNames(forceUpdate);
    return has(this.tables, tableName);
  }

  /**
   *  Loads information from existing tables.
   *
   * @param {*} forceUpdate
   */
  async loadTablesNames(forceUpdate = false) {
    if (this.loadedNames === true && forceUpdate === false) {
      return false;
    }
    const query = strQuery.select({
      from: 'sqlite_master',
      columns: ['name'],
      where: [['type', 'table']],
    });
    try {
      const tables = await this.connector.all(query);
      tables.forEach((table) => {
        if (!has(this.tables, table.name)) {
          this.tables[table.name] = null;
        }
      });
      this.loadedNames = true;
    } catch (error) {
      out.error(`SQLite.loadTablesNames('${forceUpdate ? 'true' : 'false'}')`, error);
    }
    return this.loadedNames;
  }

  /**
   * Returns a list of names
   */
  async tablesNames() {
    await this.loadTablesNames();
    return Object.keys(this.tables);
  }
}

const metaInfo = new MetaData();
export default metaInfo;
