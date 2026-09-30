const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

test('data.js exports PORTFOLIO_DATA with every section', () => {
  const data = require('../assets/data.js');
  for (const key of ['profile', 'stats', 'highlights', 'experience', 'education', 'stack', 'projects', 'certifications', 'certificationsPending']) {
    assert.ok(key in data, `missing ${key}`);
  }
});

test('content matches the approved spec', () => {
  const data = require('../assets/data.js');
  assert.equal(data.profile.email, 'charleskenneth129@gmail.com');
  assert.equal(data.profile.linkedin, null);
  assert.deepEqual(data.projects.map((p) => [p.title, p.status]), [
    ['AmIgo', 'done'], ['Thready', 'in-progress'], ['Ambiancy', 'coming-soon'],
  ]);
  assert.equal(data.projects[2].description, null);
  assert.deepEqual(data.stack.map((g) => g.category), [
    'DevOps & Cloud', 'Security & Identity', 'Backend', 'Frontend', 'AI & Machine Learning', 'Developer Tools',
  ]);
  assert.equal(data.certifications.length, 0);
  assert.equal(data.stats[3].label, 'projects built & building');
});

test('every stack icon slug has a file on disk', () => {
  const data = require('../assets/data.js');
  for (const group of data.stack) {
    for (const item of group.items) {
      if (item.icon === null) continue;
      const file = path.join(ROOT, 'assets', 'icons', 'stack', `${item.icon}.svg`);
      assert.ok(fs.existsSync(file), `${item.name}: ${file} missing`);
    }
  }
});

test('every highlight icon has a file on disk', () => {
  const data = require('../assets/data.js');
  for (const h of data.highlights) {
    assert.ok(fs.existsSync(path.join(ROOT, 'assets', 'icons', `${h.icon}.svg`)), `${h.icon}.svg missing`);
  }
});

test('the real data passes validateData', () => {
  const data = require('../assets/data.js');
  const { validateData } = require('../script.js');
  assert.deepEqual(validateData(data), []);
});
