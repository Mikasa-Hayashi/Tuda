// Copies the "core" part of the backend data into the app bundle (text only, small) so a fresh
// install has the main 5 objects of every city, the base routes and their quizzes offline.
// Everything else is downloaded per city (see src/offline). Run after editing backend/data.
const fs = require('fs');
const path = require('path');

const backend = path.join(__dirname, '..', '..', 'backend');
const src = path.join(backend, 'data');
const dst = path.join(__dirname, '..', 'src', 'data', 'seed');
fs.mkdirSync(dst, { recursive: true });
const read = (f) => JSON.parse(fs.readFileSync(path.join(src, f + '.json'), 'utf8'));

const core = Object.values(read('core').cities).flat();
const routes = read('routes');
const routeStops = read('route_stops');
const monuments = read('monuments');
const cityOf = new Map(monuments.map((m) => [m.id, m.city_id]));

// Base routes: every route whose cover is a bundled city object comes along with its stops.
const keepRoutes = routes.filter((r) => cityOf.has(r.cover_monument_id));
const keepRouteIds = new Set(keepRoutes.map((r) => r.id));
const stops = routeStops.filter((s) => keepRouteIds.has(s.route_id));
const ids = new Set([...core, ...stops.map((s) => s.monument_id)]);

const write = (name, data) => {
  fs.writeFileSync(path.join(dst, name + '.json'), JSON.stringify(data));
  console.log(name, data.length ?? Object.keys(data).length);
};
write('monuments', monuments.filter((m) => ids.has(m.id)));
write('monument_translations', read('monument_translations').filter((t) => ids.has(t.monument_id)));
write('monument_field_configs', read('monument_field_configs').filter((c) => ids.has(c.monument_id)));
write('routes', keepRoutes);
write('route_stops', stops);
write('route_translations', read('route_translations').filter((t) => keepRouteIds.has(t.route_id)));

// Quizzes of the bundled objects (the rest come with the city's quiz pack).
const quizzes = {};
for (const f of fs.readdirSync(path.join(backend, 'static', 'quizzes'))) {
  const city = JSON.parse(fs.readFileSync(path.join(backend, 'static', 'quizzes', f), 'utf8'));
  for (const [id, q] of Object.entries(city)) if (core.includes(id)) quizzes[id] = q;
}
write('quizzes', quizzes);
