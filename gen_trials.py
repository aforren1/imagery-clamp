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

    # part 1: 20 trials with online feedback
    for repeat in range(5):
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

    bad_t = 1

    while bad_t:
        ind_pools = []
        for i in range(4):
            tmp = (['clamp_imagery'] * imagine_per_target +
                   ['no_feedback'] * no_feedback_per_target)
            bad = 1
            while bad:
                bad = 0
                random.shuffle(tmp)
                for count, val in enumerate(tmp):
                    if count > 0 and tmp[count] == 'no_feedback' and tmp[count - 1] == 'no_feedback':
                        bad = 1
            ind_pools.append(tmp)

        out = []
        bad_t = 0
        for i in range(len(ind_pools[0])):
            arr = [0, 1, 2, 3]
            angles = angle_helper(ref_angle)
            random.shuffle(arr)
            for count, val in enumerate(arr):
                out.append(make_trial(radius, angles[val],
                                      clamp_angle, ind_pools[val][i],
                                      'imagine'))
                lo = len(out)
                if lo > 1:
                    if out[-1]['trial_type'] == 'no_feedback' and out[-2]['trial_type'] == 'no_feedback':
                        bad_t = 1
                        continue

    trials.extend(out)

    # part 4: 40 washout trials, no feedback
    for repeat in range(5):
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


with open(f'trial_settings.json', 'w') as f:
    json.dump(res, f)
