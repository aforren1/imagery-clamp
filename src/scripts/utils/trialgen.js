// generate trial table

/*
general constraints:
- 4 equidistant targets, non-cardinal
- each target guaranteed every 4 trials
- during manipulation, 75% clamp imagine trials with online feedback
                       25% actual reach trials without online feedback (endpoint?)
- during manipulation, never 2 consecutive actual-reach trials
- no feedback == not even endpoint feedback

trial structure:

{
    target_radius in pix
    target_angle in degrees
    clamp in true/false
    feedback in online, endpoint, none
    imagine in true/false
}
// part1:

*/

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

// https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
function randint(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function makeTrial(target_radius, target_angle, clamp_angle, trial_type) {
  return {
    target_radius: target_radius,
    target_angle: target_angle,
    clamp_angle: clamp_angle,
    trial_type: trial_type, // no_feedback, online_feedback, clamp_imagery
  }
}

function angleHelper(ref) {
  return [ref, ref + 90, ref + 180, ref + 270]
}

function generateTrials() {
  const ref_angle = randint(5, 85) //
  let trials = []
  const radius = 200
  // part 1: 20 baseline trials, no feedback
  for (let repeats = 0; repeats < 5; repeats++) {
    let angles = angleHelper(ref_angle)
    shuffleArray(angles)
    for (let angle of angles) {
      trials.push(makeTrial(radius, angle, 0, 'no_feedback'))
    }
  }
  // part 2: 20 trials, with feedback
  for (let repeats = 0; repeats < 5; repeats++) {
    let angles = angleHelper(ref_angle)
    shuffleArray(angles)
    for (let angle of angles) {
      trials.push(makeTrial(radius, angle, 0, 'online_feedback'))
    }
  }
  // part 3: 160 trials of manipulation; 75% 15deg clamp imagery, 25% move without feedback
  const sign = randint(0, 1) ? 1 : -1
  const angle = 15 * sign // clamp angle
  let imagine_per_target = 30 // 30 * 4 + 10 * 4
  let no_feedback_per_target = 10
  /* need to enforce:
   - having one of each target every cycle
   - not having two consecutive "actual reach" trials across trials
   - not having two consecutive "actual reach" trials across cycles for one target
  */
  /* algorithm:
  while (true), 
   1. Generate pool of imagine/real per target (guarantees right # of trials and percentages)
   2. shuffle each target pool separately until no consecutive real reaches within pool
   3. generate trial order similar to part 1/2 (guarantees every target once per cycle)
   4. If consecutive "actual reach" across trials, repeat 3. Otherwise done
  */

  let bad_t = 1
  let out = []
  while (bad_t) {
    let ind_pools = []
    for (let i = 0; i < 4; i++) {
      let tmp = Array(imagine_per_target)
        .fill('clamp_imagery')
        .concat(Array(no_feedback_per_target).fill('no_feedback'))
      let bad = 1
      while (bad) {
        shuffleArray(tmp)
        bad = 0
        for (let i = 1; i < tmp.length; i++) {
          if (tmp[i] === 'no_feedback' && tmp[i - 1] === 'no_feedback') {
            bad = 1
          }
        }
      }
      ind_pools[i] = tmp
    }

    out = []
    for (let i = 0; i < ind_pools[0].length; i++) {
      let angles = angleHelper(ref_angle)
      let arr = [0, 1, 2, 3]
      shuffleArray(arr)
      for (let j = 0; j < 4; j++) {
        out.push(makeTrial(radius, angles[j], angle, ind_pools[j][i]))
      }
    }
    bad_t = 0
    for (let i = 1; i < out.length; i++) {
      if (out[i].trial_type === 'no_feedback' && out[i - 1].trial_type === 'no_feedback') {
        bad_t = 1
      }
    }
  }
}
