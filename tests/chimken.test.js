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
