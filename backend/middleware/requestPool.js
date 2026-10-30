/**
 * Request Pool / Concurrency Limiter Middleware
 * Protects backend from thread/socket exhaustion by queuing requests beyond MAX_CONCURRENT_REQUESTS.
 */

const maxConcurrent = parseInt(process.env.MAX_CONCURRENT_REQUESTS || "100", 10);
let activeRequests = 0;
const waitingQueue = [];

function processNext() {
  if (activeRequests < maxConcurrent && waitingQueue.length > 0) {
    const nextProceed = waitingQueue.shift();
    activeRequests++;
    nextProceed();
  }
}

module.exports = function requestPool(req, res, next) {
  const proceed = () => {
    let finished = false;
    const release = () => {
      if (!finished) {
        finished = true;
        activeRequests--;
        processNext();
      }
    };
    res.on("finish", release);
    res.on("close", release);
    next();
  };

  if (activeRequests < maxConcurrent) {
    activeRequests++;
    proceed();
  } else {
    // Queue if capacity reached
    if (waitingQueue.length > 500) {
      return res.status(503).json({
        message: "Server is currently experiencing heavy load. Please try again momentarily."
      });
    }
    waitingQueue.push(proceed);
  }
};
