local devel: `npm run start` (no data saving, but everything else)
(`netlify dev` to try bundled version + netlify fns)

Production test: `npm run build && netlify dev`

## Order of Events

- Intro instructions
- 20 trials of baseline reaches to targets, no feedback
- 20 trials of reaches to targets, with online feedback (so participants get used to seeing a cursor)
- Introduce imagery instructions + clamp instructions (Olivia and I will write those up soon)
- 160 trials of the manipulation period, with 75% being 15˚ (+/- counterbalanced across subs) clamp imagine trials, and 25% being no-feedback actual reaches. How this will work is the color that the target turns, which is the "go" cue, will dictate if people should imagine moving to the target (e.g. from white to ~blue~ magenta) or actually move to the target (e.g. from white to green). We can have periodic reminders about the color meanings and also to remind them to always reach (or imagine reaching) straight to the target every trial
- 40 washout no feedback reach trials (straight to target),

## Notes (copied)

- 4 targets (equidistant around the invisible workspace ring; can randomize where they are specifically for each subject, but avoid cardinal axes)
- Can trial order be pseudorandomized, so that each target is presented in each 4-trial block, there are not 2 temporally consecutive actual-reach trials, and a single target doesn't have actual-reach trials on 2 consecutive blocks?
- Can mouse position throughout all trials (reach & no-reach) from target onset to offset be recorded? If it would be easier or it collecting mouse position samples at a fixed rate is interfering with other things the code has to do, I think it would be enough to just create a new entry in mouse position and time lists/arrays/whatever when a mouse movement occurs while the target is visible.
- The imagined-reach trials during the manipulation period should provide feedback. If possible, the rate at which the cursor moves should be the average speed that the participant reached to the targets during the baseline reaches to target with and without feedback.

One ref (for how other folks do clamps):
https://github.com/alan-s-lee/OnPoint/blob/master/public/index.js
https://github.com/alan-s-lee/OnPoint/blob/master/public/index.js#L804

And one of the papers:
https://www.nature.com/articles/s42003-018-0021-y

Approximate reaching movement by two sigmoid-y components and (offset, peak velocity, reach duration)
