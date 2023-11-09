export var workerConstructor;

if(workerConstructor === undefined) {
  if (typeof window !== 'undefined') {
    // This will only be executed in the browser environment
    // Vite will handle this import
    workerConstructor = (await import('./CacheWorker.ts?worker')).default;
  } else {
    //TODO: Fix this for node!
    // This will only be executed in the Node.js environment
    // const path = require('path');
    // const Worker = require('worker_threads').Worker;
    // const workerPath = path.resolve(__dirname, 'CacheWorker.js');
    // workerConstructor = () => new Worker(workerPath, { eval: false });
  }
}