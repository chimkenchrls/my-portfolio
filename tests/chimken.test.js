const test = require('node:test');
const assert = require('node:assert/strict');
const { CHIMKEN, createChimkenState, stepChimken, spawnGap } = require('../script.js');

const DT = 1 / 60;
const NONE = { jump: false, holding: false };
const JUMP = { jump: true, holding: true };
const never = () => 0.999; // random that pushes spawns far away
const run = (state, seconds, input = NONE, random = never) => {
  let s = state;
  for (let t = 0; t < seconds; t += DT) s = stepChimken(s, DT, input, random);
  return s;
};
const started = () => stepChimken(createChimkenState(), DT, { jump: true, holding: false }, never);

test('a new game waits for the first jump', () => {
  const s = createChimkenState(42);
  assert.equal(s.status, 'ready');
  assert.equal(s.score, 0);
  assert.equal(s.hi, 42);
  assert.deepEqual(s.obstacles, []);
  const idle = run(s, 1);
  assert.equal(idle.status, 'ready');
  assert.equal(idle.distance, 0);
});

test('jumping from ready starts the run and leaves the ground', () => {
  const s = started();
  assert.equal(s.status, 'running');
  assert.ok(s.chimken.y > 0);
  assert.equal(s.chimken.onGround, false);
});

test('a tap jump peaks around 100px and lands in about 0.6s', () => {
  let s = started();
  let peak = 0;
  let t = 0;
  while (!s.chimken.onGround && t < 2) {
    s = stepChimken(s, DT, NONE, never);
    peak = Math.max(peak, s.chimken.y);
    t += DT;
  }
  assert.ok(peak > 85 && peak < 120, `peak ${peak}`);
  assert.ok(t > 0.45 && t < 0.75, `airtime ${t}`);
  assert.equal(s.chimken.y, 0);
});

test('holding the jump key jumps higher than a tap', () => {
  const peakOf = (holding) => {
    let s = stepChimken(createChimkenState(), DT, { jump: true, holding }, never);
    let peak = 0;
    for (let i = 0; i < 90; i += 1) {
      s = stepChimken(s, DT, { jump: false, holding }, never);
      peak = Math.max(peak, s.chimken.y);
    }
    return peak;
  };
  assert.ok(peakOf(true) > peakOf(false) + 10);
});

test('no double jump in mid-air', () => {
  let s = run(started(), 0.1);
  const vy = s.chimken.vy;
  s = stepChimken(s, DT, JUMP, never);
  assert.ok(s.chimken.vy < vy, 'velocity keeps falling instead of resetting upward');
});

test('bugs scroll left at the current speed and are removed off-screen', () => {
  let s = started();
  s = { ...s, obstacles: [{ x: 100, w: 14, h: 12, kind: 'small' }] };
  const next = stepChimken(s, DT, NONE, never);
  assert.ok(Math.abs(next.obstacles[0].x - (100 - s.speed * DT)) < 1);
  const gone = stepChimken({ ...s, obstacles: [{ x: -20, w: 14, h: 12, kind: 'small' }] }, DT, NONE, never);
  assert.equal(gone.obstacles.length, 0);
});

test('hitting a bug ends the game and records the high score', () => {
  let s = run(started(), 1.2);
  s = { ...s, distance: 5000, score: 500, hi: 100, obstacles: [{ x: CHIMKEN.chimkenX, w: 14, h: 12, kind: 'small' }] };
  const over = stepChimken(s, DT, NONE, never);
  assert.equal(over.status, 'over');
  assert.equal(over.hi, 500);
});

test('clearing a bug in the air is not a collision', () => {
  let s = run(started(), 0.25); // near the top of the jump
  s = { ...s, obstacles: [{ x: CHIMKEN.chimkenX, w: 14, h: 12, kind: 'small' }] };
  assert.equal(stepChimken(s, DT, NONE, never).status, 'running');
});

test('spawn gaps always leave room to land and jump again', () => {
  for (const speed of [CHIMKEN.startSpeed, 500, CHIMKEN.maxSpeed]) {
    const gap = spawnGap(speed, () => 0);
    assert.ok(gap >= speed * 0.75, `speed ${speed}: gap ${gap}`);
    assert.ok(spawnGap(speed, () => 0.999) > gap);
  }
});

test('bugs spawn while running', () => {
  const s = run(started(), 6, NONE, () => 0);
  assert.ok(s.obstacles.length > 0 || s.status === 'over');
});

test('speed ramps up and caps at the maximum', () => {
  assert.equal(createChimkenState().speed, CHIMKEN.startSpeed);
  const s = started();
  assert.ok(s.speed > CHIMKEN.startSpeed);
  const later = stepChimken({ ...s, speed: CHIMKEN.maxSpeed - 0.01 }, 1, NONE, never);
  assert.equal(later.speed, CHIMKEN.maxSpeed);
});

test('score grows with distance', () => {
  const s = run(started(), 2);
  assert.ok(s.score > 0);
  assert.equal(s.score, Math.floor(s.distance / 10));
});

test('restart needs a short cooldown and keeps the high score', () => {
  let s = run(started(), 1);
  s = stepChimken({ ...s, obstacles: [{ x: CHIMKEN.chimkenX, w: 14, h: 12, kind: 'small' }], distance: 770, score: 77 }, DT, NONE, never);
  assert.equal(s.status, 'over');
  const tooSoon = stepChimken(s, DT, JUMP, never);
  assert.equal(tooSoon.status, 'over');
  const waited = run(s, 0.6);
  const restarted = stepChimken(waited, DT, JUMP, never);
  assert.equal(restarted.status, 'running');
  assert.equal(restarted.score, 0);
  assert.equal(restarted.hi, 77);
  assert.deepEqual(restarted.obstacles, []);
});

const { chimkenView, buildSky, skyOffset, starAlpha } = require('../script.js');

test('desktop view keeps the 600x150 playfield', () => {
  const v = chimkenView(606, 151.5);
  assert.ok(Math.abs(v.width - 600) < 0.01 && Math.abs(v.height - 150) < 0.01, JSON.stringify(v));
  assert.ok(Math.abs(v.groundY - CHIMKEN.groundY) < 0.01);
});

test('phone view keeps pixel size, shows more sky, ground stays at the bottom', () => {
  const v = chimkenView(343, 640);
  assert.equal(v.scale, 1);
  assert.equal(v.width, 343);
  assert.equal(v.height, 640);
  assert.equal(v.groundY, 640 - (CHIMKEN.height - CHIMKEN.groundY));
});

test('sky fills the space above the ground, deterministically', () => {
  let seed = 3;
  const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const small = buildSky(600, CHIMKEN.groundY, rng);
  seed = 3;
  const again = buildSky(600, CHIMKEN.groundY, rng);
  assert.deepEqual(small, again);
  const tall = buildSky(343, 618, () => 0.5);
  assert.ok(tall.stars.length > small.stars.length, 'taller sky has more stars');
  for (const sky of [small, tall]) {
    for (const star of sky.stars) {
      assert.ok(star.x >= 0 && star.x < sky.width && star.y >= 6 && star.y <= sky.groundY - 36, JSON.stringify(star));
    }
    for (const body of [sky.moon, sky.sun]) assert.ok(body.y >= 6 && body.y < sky.groundY - 36);
    assert.ok(sky.clouds.length >= 2);
  }
});

test('parallax offsets wrap into the layer width', () => {
  assert.equal(skyOffset(0, 0.1, 600), 0);
  assert.equal(skyOffset(1000, 0.1, 600), 100);
  assert.equal(skyOffset(7000, 0.1, 600), 100);
  const o = skyOffset(123456, 0.25, 343);
  assert.ok(o >= 0 && o < 343);
});

test('stars twinkle within a gentle range, and hold still with reduced motion', () => {
  for (let t = 0; t < 10; t += 0.37) {
    const a = starAlpha(1.3, t, false);
    assert.ok(a >= 0.3 && a <= 0.75, String(a));
  }
  assert.equal(starAlpha(1.3, 0, true), starAlpha(0.2, 9, true));
});
