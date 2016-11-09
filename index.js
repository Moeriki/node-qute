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
      if (typeof handler !== 'function') {
        throw new Error('Qute::push/unshift expected a function, received ');
      }
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
    Promise.resolve(item.handler())
      .then((result) => {
        pendingCount--;
        item.resolve(result);
      }, (err) => {
        pendingCount--;
        item.reject(err);
      })
      .then(() => {
        defer(tryToRunNext);
      });

    defer(tryToRunNext);
  }

  // exposed

  return (
    queueInstance = {
      push() {
        const handlers = Array.prototype.slice.apply(arguments);
        return add(handlers);
      },
      pause() {
        isPaused = true;
        return queueInstance;
      },
      resume() {
        isPaused = false;
        tryToRunNext();
        return queueInstance;
      },
      size() {
        return queuedItems.length + pendingCount;
      },
      sizePending() {
        return pendingCount;
      },
      sizeQueued() {
        return queuedItems.length;
      },
      unshift() {
        const handlers = Array.prototype.slice.apply(arguments);
        return add(handlers, true);
      },
    }
  );
}

module.exports = qute;
