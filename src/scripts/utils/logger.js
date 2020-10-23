import log from 'loglevel'
// https://github.com/pimterry/loglevel
function LogMessage(logLevel, logMsg) {
  // originally included loggerName, but we're only using one logger for now
  this.logLevel = logLevel
  this.logMsg = logMsg
  this.windowTime = window.performance.now() // ms since window opened (approx)
  this.datetime = new Date().toLocaleString() // local datetime
}

// TODO: silent version depending on global config?
// so warnings/such don't show up in console
var originalFactory = log.methodFactory

log.methodFactory = function (methodName, logLevel, loggerName) {
  if (this.msgs === undefined) {
    this.msgs = []
  }
  let rawMethod = originalFactory(methodName, logLevel, loggerName)
  return function () {
    for (let i = 0; i < arguments.length; i++) {
      this.msgs.push(new LogMessage(methodName, arguments[i]))
    }
    rawMethod.apply(undefined, arguments)
  }
}

log.setLevel(log.getLevel())
log.setLevel('debug')
export default log
