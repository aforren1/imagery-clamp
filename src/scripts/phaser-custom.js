// https://github.com/photonstorm/phaser3-project-template-custom-build
require('../../node_modules/phaser/src/polyfills')

var CONST = require('../../node_modules/phaser/src/const')

var Extend = require('../../node_modules/phaser/src/utils/object/Extend')

/**
 * @namespace Phaser
 */

// Patch in RAF timestamp
// after https://github.com/photonstorm/phaser/commit/ec5f3d3a33e786094652c3183428e984a395f100
// the RAF time gives us something closer to VSYNC time
var Core = require('../../node_modules/phaser/src/core')
var ts = function (time) {
  //  Because the timestamp passed in from raf represents the beginning of the main thread frame that we’re currently in,
  //  not the actual time now, and as we want to compare this time value against Event timeStamps and the like, we need a
  //  more accurate one:
  this.now = time
  var before = time - this.lastTime
  if (before < 0) {
    //  Because, Chrome.
    before = 0
  }
  this.rawDelta = before
  var idx = this.deltaIndex
  var history = this.deltaHistory
  var max = this.deltaSmoothingMax
  //  delta time (time is in ms)
  var dt = before
  //  Delta Average
  var avg = before
  //  When a browser switches tab, then comes back again, it takes around 10 frames before
  //  the delta time settles down so we employ a 'cooling down' period before we start
  //  trusting the delta values again, to avoid spikes flooding through our delta average
  if (this.smoothStep) {
    if (this._coolDown > 0 || !this.inFocus) {
      this._coolDown--

      dt = Math.min(dt, this._target)
    }

    if (dt > this._min) {
      //  Probably super bad start time or browser tab context loss,
      //  so use the last 'sane' dt value

      dt = history[idx]

      //  Clamp delta to min (in case history has become corrupted somehow)
      dt = Math.min(dt, this._min)
    }

    //  Smooth out the delta over the previous X frames
    //  add the delta to the smoothing array
    history[idx] = dt

    //  adjusts the delta history array index based on the smoothing count
    //  this stops the array growing beyond the size of deltaSmoothingMax
    this.deltaIndex++

    if (this.deltaIndex > max) {
      this.deltaIndex = 0
    }

    //  Loop the history array, adding the delta values together
    avg = 0

    for (var i = 0; i < max; i++) {
      avg += history[i]
    }

    //  Then divide by the array length to get the average delta
    avg /= max
  }

  //  Set as the world delta value
  this.delta = avg

  //  Real-world timer advance
  this.time += this.rawDelta

  // Update the estimate of the frame rate, `fps`. Every second, the number
  // of frames that occurred in that second are included in an exponential
  // moving average of all frames per second, with an alpha of 0.25. This
  // means that more recent seconds affect the estimated frame rate more than
  // older seconds.
  //
  // When a browser window is NOT minimized, but is covered up (i.e. you're using
  // another app which has spawned a window over the top of the browser), then it
  // will start to throttle the raf callback time. It waits for a while, and then
  // starts to drop the frame rate at 1 frame per second until it's down to just over 1fps.
  // So if the game was running at 60fps, and the player opens a new window, then
  // after 60 seconds (+ the 'buffer time') it'll be down to 1fps, so rafin'g at 1Hz.
  //
  // When they make the game visible again, the frame rate is increased at a rate of
  // approx. 8fps, back up to 60fps (or the max it can obtain)
  //
  // There is no easy way to determine if this drop in frame rate is because the
  // browser is throttling raf, or because the game is struggling with performance
  // because you're asking it to do too much on the device.

  if (time > this.nextFpsUpdate) {
    //  Compute the new exponential moving average with an alpha of 0.25.
    this.actualFps = 0.25 * this.framesThisSecond + 0.75 * this.actualFps
    this.nextFpsUpdate = time + 1000
    this.framesThisSecond = 0
  }
  this.framesThisSecond++
  //  Interpolation - how far between what is expected and where we are?
  var interpolation = avg / this._target
  this.callback(time, avg, interpolation)
  //  Shift time value over
  this.lastTime = time
  this.frame++
}
Core.TimeStep.prototype.step = ts
Core.TimeStep.prototype.tick = function () {
  this.step(window.performance.now())
}

var Phaser = {
  Actions: require('../../node_modules/phaser/src/actions'),
  //Animations: require('../../node_modules/phaser/src/animations'),
  Cache: require('../../node_modules/phaser/src/cache'),
  Cameras: require('../../node_modules/phaser/src/cameras'),
  Core: Core,
  Class: require('../../node_modules/phaser/src/utils/Class'),
  Create: require('../../node_modules/phaser/src/create'),
  //Curves: require('../../node_modules/phaser/src/curves'),
  Data: require('../../node_modules/phaser/src/data'),
  Display: require('../../node_modules/phaser/src/display'),
  DOM: require('../../node_modules/phaser/src/dom'),
  Events: require('../../node_modules/phaser/src/events'),
  Game: require('../../node_modules/phaser/src/core/Game'),
  GameObjects: require('../../node_modules/phaser/src/gameobjects'),
  Geom: require('../../node_modules/phaser/src/geom'),
  Input: require('../../node_modules/phaser/src/input'),
  Loader: require('../../node_modules/phaser/src/loader'),
  Math: require('../../node_modules/phaser/src/math'),
  //Physics: require('../../node_modules/phaser/src/physics'),
  Plugins: require('../../node_modules/phaser/src/plugins'),
  Renderer: require('../../node_modules/phaser/src/renderer'),
  Scale: require('../../node_modules/phaser/src/scale'),
  Scene: require('../../node_modules/phaser/src/scene/Scene'),
  Scenes: require('../../node_modules/phaser/src/scene'),
  //Sound: require('../../node_modules/phaser/src/sound'),
  Structs: require('../../node_modules/phaser/src/structs'),
  Textures: require('../../node_modules/phaser/src/textures'),
  //Tilemaps: require('../../node_modules/phaser/src/tilemaps'),
  Time: require('../../node_modules/phaser/src/time'),
  Tweens: require('../../node_modules/phaser/src/tweens'),
  Utils: require('../../node_modules/phaser/src/utils'),
}

//   Merge in the consts

Phaser = Extend(false, Phaser, CONST)

//  Export it

export default Phaser

global.Phaser = Phaser
