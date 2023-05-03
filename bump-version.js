const fs = require('fs');

const VERSION = process.env.VERSION;

console.log('Bumping to ' + VERSION);

function withJsonFile(name, callback) {
  const text = fs.readFileSync(name);
  const json = JSON.parse(text);
  callback(json);
  fs.writeFileSync(name, JSON.stringify(json, null, '  '));
}

withJsonFile('./core/package.json', (j) => {
  j.version = VERSION;
});

withJsonFile('./tea-cup/package.json', (j) => {
  j.version = VERSION;
  j.peerDependencies['tea-cup-core'] = VERSION;
});

withJsonFile('./samples/package.json', (j) => {
  j.dependencies['tea-cup-core'] = VERSION;
  j.dependencies['react-tea-cup'] = VERSION;
});
