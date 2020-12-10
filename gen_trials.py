import random
import json
from timeit import default_timer
from contextlib import ContextDecorator


class time_fn(ContextDecorator):
    def __enter__(self):
        self.t0 = default_timer()

    def __exit__(self, *args):
        print(f'fn took {default_timer() - self.t0} seconds.')


def make_trial(target_radius, target_angle, clamp_angle, trial_type, section):
    return {'target_radius': target_radius,
            'target_angle': target_angle,
            'clamp_angle': clamp_angle,
            'trial_type': trial_type,
            'section': section}


def angle_helper(ref):
    return [ref, ref + 90, ref + 180, ref + 270]


def generate_trials(seed=1, sign=1):

    random.seed(seed)
    radius = 250
    #sign = random.choice([-1, 1])
    ref_angle = random.randint(5, 85)
    clamp_angle = 15 * sign
    imagine_per_target = 30
    no_feedback_per_target = 10

    trials = []

    # part 1: 8 trials with online feedback
    for repeat in range(2):
        angles = angle_helper(ref_angle)
        random.shuffle(angles)
        for angle in angles:
            trials.append(make_trial(radius, angle, clamp_angle,
                                     'online_feedback', 'warmup_vis'))

    # part 2: 20 baseline trials, no feedback
    for repeat in range(5):
        angles = angle_helper(ref_angle)
        random.shuffle(angles)
        for angle in angles:
            trials.append(make_trial(radius, angle, clamp_angle,
                                     'no_feedback', 'warmup_invis'))

    # part 3: main event
    # insert one criterion trial, will repeat until success
    trials.append(make_trial(radius, angles[0], clamp_angle,
                             'clamp_imagery', 'imagine_criterion'))

    # now generate 4 * 12 = 96 trials of imagery
    # constraints:
    #  - in each set of 4 trials, one no-feedback reach + 3 imagined reaches (i.e. 75% imagery)
    #  - in each set of 4 trials, see all targets once
    #  - Each target has a no-feedback reach every 16 trials
    #  - never two consecutive no-feedback reaches
    #  - never two no-feedback reaches to same target in consecutive blocks
    #

    mega_blocks = 6
    # make all angles and shuffle randomly
    # Generate all 6 * 4 = 24 no-feedback reaches
    # Make sure never consecutive vals
    no_feedback_angles = angle_helper(ref_angle) * mega_blocks
    bad = True
    while bad:
        bad = False
        random.shuffle(no_feedback_angles)
        # make sure no consecutive values
        for i in range(1, len(no_feedback_angles)):
            if no_feedback_angles[i] == no_feedback_angles[i - 1]:
                bad = True
                break

        # make sure one of each per megablock
        for i in range(6):
            start = i * 4
            stop = i * 4 + 4
            sub = set(no_feedback_angles[start:stop])
            if len(sub) < 4:
                bad = True
                break

    # now we have all the no-feedback reaches generated
    # next, generate the entire set of trials
    # all we need to constrain now is that we see
    # all targets once, that there are no consecutive reaches,
    # and that the first trial is an imagery

    out = []
    for no_feedback_angle in no_feedback_angles:
        bad = True
        print(len(out))
        while bad:
            bad = False
            angles = angle_helper(ref_angle)
            random.shuffle(angles)
            # first trial not moving
            if not out and angles.index(no_feedback_angle) == 0:
                bad = True
                continue

            # dictify
            potential_partials = [{'trial_type': 'clamp_imagery',
                                   'target_angle': ang} for ang in angles]

            for pot in potential_partials:
                if pot['target_angle'] == no_feedback_angle:
                    pot['trial_type'] = 'no_feedback'

            if not out:
                out.extend(potential_partials)
                break

            else:  # check last addition
                if out[-1]['trial_type'] == 'no_feedback' and potential_partials[0]['trial_type'] == 'no_feedback':
                    bad = True
                    continue
                else:
                    out.extend(potential_partials)
                    bad = False
                    break
            bad = True

    # stick the rest of the details on out
    for t in out:
        trials.append(make_trial(radius, t['target_angle'], clamp_angle,
                                 t['trial_type'], 'imagine'))

    # part 4: 16 washout trials, no feedback
    for repeat in range(4):
        angles = angle_helper(ref_angle)
        random.shuffle(angles)
        for angle in angles:
            trials.append(make_trial(radius, angle, clamp_angle,
                                     'no_feedback', 'washout'))

    # part 5: 2 questionnaire trials
    trials.append(make_trial(radius, angle, clamp_angle,
                             'no_feedback', 'questionnaire_reach'))
    trials.append(make_trial(radius, angle, clamp_angle,
                             'clamp_imagery', 'questionnaire_reach'))
    return trials


res = {}
tfn = time_fn()
with tfn:
    res[1] = generate_trials(seed=1, sign=1)

with tfn:
    res[2] = generate_trials(seed=1, sign=-1)

with tfn:
    res[3] = generate_trials(seed=3, sign=1)

with tfn:
    res[4] = generate_trials(seed=3, sign=-1)


with open(f'src/assets/trial_settings.json', 'w') as f:
    json.dump(res, f)
