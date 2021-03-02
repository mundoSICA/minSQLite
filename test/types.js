import chai from 'chai';
import { types, out } from '../dist/index';
chai.use(require('chai-match'));

const { assert, expect } = chai;

let listTypesNames = [];

// A sample Mocha test
describe('Types.js', () => {
  // Probando update
  describe('#Validando La existencia de los campos', () => {
    it('Validando list()', async () => {
      out.line();
      listTypesNames = types.list();
      assert.isArray(listTypesNames);
      assert.isTrue(listTypesNames.length > 0);
    }); // it
    it('Validando create y validate', async () => {
      listTypesNames.forEach((typeName) => {
        const type = types.create(typeName);
        const isType = types.is(type);
        assert.isTrue(isType);
      });
    }); // it
    it('withLen() and Maxlen', async () => {
      out.line();
      const withLenTypes = types.withLen();
      assert.isArray(withLenTypes);
      assert.isTrue(withLenTypes.length > 0);
      withLenTypes.forEach((typeName, i) => {
        const type = types.create(typeName, 90 + i);
        assert.strictEqual(type.maxLen, 90 + i); // compare with ===
        const isType = types.is(type);
        assert.isTrue(isType);
      });
    }); // it
    it('withLen() and Maxlen', async () => {
      out.line();
      listTypesNames.forEach((typeName, i) => {
        const type = types.create(typeName, 90 + i);
        const colSQL = types.columnSQLDefinition(`column_${i + 1}`, type);
        console.log(colSQL);
      });
    }); // it
  }); // campos
});
