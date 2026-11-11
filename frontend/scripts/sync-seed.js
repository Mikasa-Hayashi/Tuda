// Copies the backend seed JSON into the app bundle (text only, ~80 KB) so a fresh install has
// all monument/route text offline before the first sync. Run after editing backend/data.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', '..', 'backend', 'data');
const dst = path.join(__dirname, '..', 'src', 'data', 'seed');
fs.mkdirSync(dst, { recursive: true });
for (const f of [
  'monuments',
  'monument_translations',
  'monument_field_configs',
  'routes',
  'route_stops',
  'route_translations',
]) {
  const data = JSON.parse(fs.readFileSync(path.join(src, f + '.json'), 'utf8'));
  fs.writeFileSync(path.join(dst, f + '.json'), JSON.stringify(data));
  console.log(f, data.length);
}
