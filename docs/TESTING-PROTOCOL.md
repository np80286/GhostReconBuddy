# In-game measurement protocol

This protocol collects video-game behavior only. No in-game trials have been performed for this repository yet.

## Record before every session

Game, executable/build number, platform, capture date, campaign/expansion, campaign versus Ghost Mode versus Ghost War, difficulty, Tier One enabled and tier, weapon upgrade level, character skills/medals, squad/rebel involvement, frame rate and capture frame rate, input device and relevant aiming settings.

Capture the exact weapon variant and EVERY Gunsmith slot. Screenshot the complete configuration. Record suppressor state, firing mode, aim perspective and weapon/ammunition state. Unknown fields remain null. Never assume a stock configuration from an incomplete screenshot.

## Compare one change at a time

Establish a baseline. Change one attachment, repeat the same controlled engagement, then return to baseline to check drift. Record the full before and after configuration, including incompatible combinations. Do not assume that two individual attachment effects combine additively.

Use the same target class, health state, armor, hit zone, distance, alert state, line of sight and surface penetration conditions. Enemy damage and vehicle damage require separate datasets. Stealth and engaged enemies require separate datasets. Exclude trials affected by allies, prior damage or uncertain hits, preserving a reason for exclusion.

## Measurements

- Shots to kill: count confirmed hits to the same zone; record each trial, not just the average.
- Reload: distinguish empty and tactical reloads; define start/end frames and magazine size.
- Aim-down-sights time: define transition frames; separate sensitivity from animation speed.
- Rate of fire: use enough consecutive shots to estimate interval; state method and uncertainty.
- Recoil and spread: use a fixed scene, distance, perspective, burst length and input; distinguish vertical/horizontal movement from random dispersion.
- Bullet drop: record optic, reticle, zoom, range, sighting reference, barrel, muzzle, rangefinder and range skills. Preserve original chart/capture coordinates.
- Detection: distinguish shot audibility from impacts, visibility and global alert transitions.

Plan at least ten usable trials per controlled comparison initially, retaining all individual observations. This is a starting collection target, not a statistical guarantee. Increase trials when variability or borderline differences require it.

## Replacing derived bands

The application may display an asterisked damage interval when the historical
workbook records body hits but not a direct damage row. That interval is a
mathematical bound against the workbook's 1,000-HP reference target, not a new
trial. Do not copy the midpoint into the catalog as measured damage.

To replace a derived band, capture the exact build and configuration, establish
the target's health/model, preserve the individual hit results, and document
the calculation or direct extraction that produces the replacement value. If
the new experiment uses a different target or health model, retain it as a
separate observation instead of treating it as a correction. DPS based only on
RPM is theoretical until recoil, burst control, misses, and target movement are
represented by a separately defined field-performance measure.

## Acceptance and revalidation

Store operator, evidence file/link, time range, conditions, trial count and uncertainty. Mark a result community-reported until a documented repeat supports it. Preserve conflicting trials and alternative findings. A patch changes applicability; never silently rewrite an older observation as current. Situation recommendations must reference applicable experiments and explain their limits.
