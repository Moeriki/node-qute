'use strict';

// vendor modules

const Promise = require('any-promise');

// private variables

const DEFAULT_MAX_CONCURRENCY = 1;

// private functions

function defer(func) {
  setTimeout(func, 0);
}

// exports

function qute(options) {
  options = options || {};
  options.maxConcurrency = options.maxConcurrency == null ? DEFAULT_MAX_CONCURRENCY : options.maxConcurrency;
  options.paused = options.paused == null ? false : options.paused;

  const queuedItems = [
  // {
  //   handler:Function,
  //   promise:Promise<*>,
  //   resolve:Function,
  //   reject:Function,
  // }
  ];
  let pendingCount = 0;
  let isPaused = options.paused;

  let queueInstance;

  // private functions

  function add(handlers, atBeginning) {
    if (handlers.length === 0) {
      return Promise.resolve();
    }

    const newItems = handlers.map((handler) => {
      let resolve, reject;
      const promise = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
      });
      return {
        handler,
        promise,
        resolve,
        reject,
      };
    });

    Array.prototype[atBeginning ? 'unshift' : 'push'].apply(queuedItems, newItems);

    tryToRunNext();

    return newItems.length === 1
      ? newItems[0].promise
      : Promise.all(newItems.map((item) => item.promise));
  }

  function tryToRunNext() {
    if (isPaused || queuedItems.length === 0 || pendingCount === options.maxConcurrency) {
      return;
    }

    pendingCount++;
    const item = queuedItems.shift();
    item.handler()
      .then((result) => {
        pendingCount--;
        item.resolve(result);
        defer(tryToRunNext);
      }, (err) => {
        pendingCount--;
        item.reject(err);
      });

    defer(tryToRunNext);
  }

  // exposed

  function push() {
    const handlers = Array.prototype.slice.apply(arguments);
    return add(handlers);
  }

  function pause() {
    isPaused = true;
    return queueInstance;
  }

  function resume() {
    isPaused = false;
    tryToRunNext();
    return queueInstance;
  }

  function size() {
    return queuedItems.length + pendingCount;
  }

  function sizePending() {
    return pendingCount;
  }

  function sizeQueued() {
    return queuedItems.length;
  }

  function unshift() {
    const handlers = Array.prototype.slice.apply(arguments);
    return add(handlers, true);
  }

  return (
    queueInstance = {
      push,
      pause,
      resume,
      size,
      sizePending,
      sizeQueued,
      unshift,
    }
  );
}

module.exports = qute;
