"use strict";

module.exports = {
  require: ['esm'],
  reporter: 'node_modules/mochawesome',
  'reporter-option': [
        'reportDir=test-report/',
        'reportFilename=index.html',
        'reportTitle=minSQLite Report'
    ],
}
