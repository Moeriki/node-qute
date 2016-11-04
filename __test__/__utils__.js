'use strict';

const WAITING = Symbol('waiting');
const RUNNING = Symbol('running');
const REJECTED = Symbol('rejected');
const RESOLVED = Symbol('resolved');

module.exports = {

  WAITING,
  RUNNING,
  REJECTED,
  RESOLVED,

  deferred() {
    let status = WAITING;
    let handlerResult;

    const handler = function () {
      status = RUNNING;
      return handlerResult;
    };

    handlerResult = new Promise((resolve, reject) => {
      Object.assign(handler, {
        reject(err) {
          status = REJECTED;
          reject(err);
        },
        resolve(resolution) {
          status = RESOLVED;
          resolve(resolution);
        },
      });
    });

    Object.defineProperty(handler, 'status', {
      get() {
        return status;
      },
    });

    return handler;
  },

};
