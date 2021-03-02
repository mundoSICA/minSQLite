/* eslint "no-console": "off" */

export default {
  debug: true,
  sica() {
    if (this.debug === false) {
      return;
    }
    console.log(' ⬤ ⬤ ');
    console.log(' ⬤  Mundosica.com');
  },
  dateStr() {
    return (new Date()).toISOString().substr(0, 19);
  },
  line() {
    if (this.debug === false) {
      return;
    }
    console.log(''.padStart(80, '█'));
  },
  error(type, msg = '', newLine = false) {
    if (this.debug === false) {
      return;
    }
    let line = `✗ Error: ${this.dateStr()}→[${type}]: ${this.fancyStr(msg)}`;
    if (newLine) {
      line = '\n'.padStart(80, '█') + line;
    }
    console.log(line);
  },
  log(type, msg = '', newLine = false) {
    if (this.debug === false) {
      return;
    }
    let line = `⦿  Log: ${this.dateStr()}→[${type}]: ${this.fancyStr(msg)}`;
    if (newLine) {
      line = '\n'.padStart(80, '█') + line;
    }
    console.log(line);
  },
  fancyStr(obj) {
    const attrs = [];
    if (obj === null) {
      return 'null';
    }
    if (typeof obj === 'object') {
      Object.entries(obj).forEach((item) => {
        let line = `${item[0]}: `;
        switch (typeof item[1]) {
          case 'object':
            if (Array.isArray(item[1])) {
              line += '[...]';
            } else {
              line += '{...}';
            }
            break;
          case 'string':
            line += `"${item[1]}"`;
            break;
          default:
            line += item[1];
        }
        attrs.push(line);
      });
      return `{ ${attrs.join(', ')} }`;
    }// end if
    return `"${obj}"`;
  },
};
