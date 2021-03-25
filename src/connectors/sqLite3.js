import out from '../Out';
import { has } from '../Utils';
/**
 * Support to Node SQLite
 *
 * https://github.com/kriasoft/node-sqlite#readme
 */

const connector = {
  db: null,
  async all(queryStr) {
    let data = [];
    try {
      data = await this.db.all(queryStr);
    } catch (e) {
      out.error('conectorSQLite,all', e);
      return [];
    }
    return data;
  },
  isOpen() {
    return (this.db !== null);
  },
  async execSQL(query = '') {
    let result = null;
    const qparts = query.trim().split(' ');
    const type = qparts[0].trim().toUpperCase();
    if (['REPLACE', 'INSERT'].includes(type)) {
      result = await this.withInsert(query);
      return result;
    }
    try {
      await this.db.exec(query);
      result = true;
    } catch (e) {
      out.error('SQLite.execSQL', query);
    }
    return result;
  },

  async withInsert(query) {
    try {
      const result = await this.db.run(query);
      if (has(result, 'lastID')) {
        return result.lastID;
      }
      return result;
    } catch (e) {
      out.error('withInsert', query);
    }
    return null;
  },
  async get(query) {
    try {
      const result = await this.db.get(query);
      return result;
    } catch (e) {
      out.error(`SQLite.get(${query})`, e);
    }
    return null;
  },
  resultType(type) {
    out.error('SQLite.resultType', type);
  },
};

export default {
  async initConector(sqliteOpen, sqlite3Lib, filename = '/tmp/database.db') {
    connector.db = await this.openDb(sqliteOpen, sqlite3Lib, filename);
    connector.db.on('error', (error) => {
      out.error('SQLite.dbOnError', error);
    });
    return connector;
  },
  async openDb(sqliteOpen, sqlite3Lib, filename = '/tmp/database.db') {
    return sqliteOpen({
      filename,
      driver: sqlite3Lib.Database,
    });
  },
};
