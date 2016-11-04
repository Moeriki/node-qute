'use strict';

// vendor modules

const delay = require('delay');

// modules

const qute = require('../index');

const utils = require('./__utils__');

const WAITING = utils.WAITING;
const RUNNING = utils.RUNNING;
const RESOLVED = utils.RESOLVED;
const deferred = utils.deferred;

// private variables

const TIMEOUT = 5;

// tests

it('should queue no items', async () => {
  const queue = qute();
  const result = queue.push();
  await result;
});

it('should queue one item', async () => {
  const queue = qute();
  const defer1 = deferred();
  const result = queue.push(defer1);
  defer1.resolve();
  await delay(TIMEOUT);
  await result;
});

it('should queue some items', async () => {
  const queue = qute();
  const defer1 = deferred();
  const defer2 = deferred();
  const defer3 = deferred();
  const result = queue.push(defer1, defer2, defer3);
  await delay(TIMEOUT);
  expect(defer1.status).toBe(RUNNING);
  expect(defer2.status).toBe(WAITING);
  expect(defer3.status).toBe(WAITING);
  defer1.resolve();
  await delay(TIMEOUT);
  expect(defer1.status).toBe(RESOLVED);
  expect(defer2.status).toBe(RUNNING);
  expect(defer3.status).toBe(WAITING);
  defer2.resolve();
  await delay(TIMEOUT);
  expect(defer1.status).toBe(RESOLVED);
  expect(defer2.status).toBe(RESOLVED);
  expect(defer3.status).toBe(RUNNING);
  defer3.resolve();
  await delay(TIMEOUT);
  expect(defer1.status).toBe(RESOLVED);
  expect(defer2.status).toBe(RESOLVED);
  expect(defer3.status).toBe(RESOLVED);
  await result;
});

it('should push and unshift', async () => {
  const queue = qute();
  const defer1 = deferred();
  const defer2 = deferred();
  const defer3 = deferred();
  const result1 = queue.push(defer1, defer3);
  const result2 = queue.unshift(defer2);
  await delay(TIMEOUT);
  expect(defer1.status).toBe(RUNNING);
  expect(defer2.status).toBe(WAITING);
  expect(defer3.status).toBe(WAITING);
  defer1.resolve();
  await delay(TIMEOUT);
  expect(defer1.status).toBe(RESOLVED);
  expect(defer2.status).toBe(RUNNING);
  expect(defer3.status).toBe(WAITING);
  defer2.resolve();
  defer3.resolve();
  await Promise.all([result1, result2]);
});

it('should respect concurrency', async () => {
  const queue = qute({ maxConcurrency: 2 });
  const defer1 = deferred();
  const defer2 = deferred();
  const defer3 = deferred();
  const result = queue.push(defer1, defer2, defer3);
  await delay(TIMEOUT);
  expect(defer1.status).toBe(RUNNING);
  expect(defer2.status).toBe(RUNNING);
  expect(defer3.status).toBe(WAITING);
  defer1.resolve();
  await delay(TIMEOUT);
  expect(defer1.status).toBe(RESOLVED);
  expect(defer2.status).toBe(RUNNING);
  expect(defer3.status).toBe(RUNNING);
  defer2.resolve();
  await delay(TIMEOUT);
  expect(defer1.status).toBe(RESOLVED);
  expect(defer2.status).toBe(RESOLVED);
  expect(defer3.status).toBe(RUNNING);
  defer3.resolve();
  await delay(TIMEOUT);
  expect(defer1.status).toBe(RESOLVED);
  expect(defer2.status).toBe(RESOLVED);
  expect(defer3.status).toBe(RESOLVED);
  await result;
});

it('should start paused / resume', async () => {
  const queue = qute({ paused: true });
  const defer1 = deferred();
  const defer2 = deferred();
  const result = queue.push(defer1, defer2);
  await delay(TIMEOUT);
  expect(defer1.status).toBe(WAITING);
  expect(defer2.status).toBe(WAITING);
  queue.resume();
  await delay(TIMEOUT);
  expect(defer1.status).toBe(RUNNING);
  expect(defer2.status).toBe(WAITING);
  defer1.resolve();
  queue.pause();
  await delay(TIMEOUT);
  expect(defer1.status).toBe(RESOLVED);
  expect(defer2.status).toBe(WAITING);
  queue.resume();
  defer2.resolve();
  await delay(TIMEOUT);
  expect(defer1.status).toBe(RESOLVED);
  expect(defer2.status).toBe(RESOLVED);
  await result;
});

it('should expose size', async () => {
  const queue = qute();
  const defer1 = deferred();
  const defer2 = deferred();
  const defer3 = deferred();
  queue.push(defer1, defer2, defer3);
  await delay(TIMEOUT);
  expect(queue.size()).toBe(3);
  expect(queue.sizePending()).toBe(1);
  expect(queue.sizeQueued()).toBe(2);
  defer1.resolve();
  await delay(TIMEOUT);
  expect(queue.size()).toBe(2);
  expect(queue.sizePending()).toBe(1);
  expect(queue.sizeQueued()).toBe(1);
  defer2.resolve();
  await delay(TIMEOUT);
  expect(queue.size()).toBe(1);
  expect(queue.sizePending()).toBe(1);
  expect(queue.sizeQueued()).toBe(0);
  defer3.reject();
  await delay(TIMEOUT);
  expect(queue.size()).toBe(0);
  expect(queue.sizePending()).toBe(0);
  expect(queue.sizeQueued()).toBe(0);
});
