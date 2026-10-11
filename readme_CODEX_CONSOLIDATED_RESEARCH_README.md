# Ghost Recon Buddy — Consolidated Codex Research & Implementation Handoff

> This document consolidates the original Ghost Recon Buddy README plus the later
> research/TODO/experiment notes into one working handoff for Codex.
>
> The existing application architecture and evidence discipline are good. The goal is
> to extend them, not redesign the project or convert community claims directly into
> facts.

## 1. Current project baseline

Ghost Recon Buddy is a source-backed Ghost Recon Wildlands reference focused on weapon
configuration and actual gameplay performance.

Current project characteristics that should be preserved:

- 182 Wildlands weapons and variants from the archived workbook inventory.
- Historical Tier One and non-tier results across 251 weapon/configuration rows.
- 70 directly recorded damage profiles.
- Derived damage bands for otherwise-partial records based on recorded body hits
  against the workbook's normalized 1,000-HP reference target.
- Full archive of the source Wildlands damage workbook, including formulas/source cells.
- Structured PostgreSQL tables tied to source rows and immutable catalog releases.
- Current weapon comparison/ranking workspace.
- Field Wiki with direct real-world weapon matches.
- Info / Experiments page for hypotheses, partial evidence, and test plans.
- Sources provenance ledger.
- Controlled testing documentation.
- Static public deployment plus optional PostgreSQL path.

Existing project principles are correct and must remain:

```text
Unknown data stays unknown.
Missing data is not zero.
Missing compatibility does not mean incompatible.
Derived/inferred values are not direct measurements.
Historical community tests retain incomplete-context warnings.
Real-world identity/reference data must remain separate from gameplay performance data.
```

Do not weaken these guardrails while adding new metrics.

---

# 2. Core evidence model

Before adding more community-derived mechanics, normalize source/evidence vocabulary.

Recommended source types:

```text
MEASURED
CURRENT_BUILD_TEST
ARCHIVED_TEST
COMMUNITY_TEST
COMMUNITY_CLAIM
INFERRED
GAME_UI
REFERENCE_ONLY
UNKNOWN
```

Recommended confidence:

```text
HIGH
MEDIUM
LOW
```

Recommended experiment status:

```text
RESEARCH_LEAD
NEEDS_TEST
TESTING
PARTIAL
SUPPORTED
CONFLICTING
NOT_REPRODUCED
REJECTED
CURRENT_BUILD_VERIFIED
```

Every experimental or non-direct claim should preserve, where available:

```text
sourceUrls
sourceDate
sourceType
confidence
platform
gameVersion
weapon
weaponVariant
weaponUpgradeLevel
tierMode
tierLevel
difficulty
skills
medals
attachments
fireMode
targetFaction
targetClass
bodyRegion
alertState
range
targetType
trialCount
result
notes
evidence
```

Do not delete conflicting historical claims when newer evidence appears. Preserve both
and attach their context.

---

# 3. Important terminology / data semantics

## Normalized 1,000-HP reference

The archived damage work uses a normalized/reference health scale. Do not imply that
Ubisoft internally stores the tested enemy as literal `1000 HP`.

Use wording such as:

```text
1,000-HP normalized reference target
```

or:

```text
normalized reference health scale
```

## Inferred damage

Example:

```text
SR25 Jungle = 1 body STK
```

supports:

```text
damage >= tested target health threshold
```

It does NOT prove:

```text
SR25 Jungle damage = HTI damage
```

Audit UI/rankings/calculations so threshold-derived values never become exact values.

---

# 4. TTK — implement carefully

TTK is useful, but there are now multiple concepts that must remain separate.

## Calculated ideal TTK

Where body STK and cyclic RPM are known:

```text
Calculated Ideal TTK = (STK - 1) * 60 / RPM
```

The first shot occurs at time zero.

Only calculate where source data supports both STK and RPM.

Never infer missing RPM.

Recommended UI wording:

```text
Calculated Ideal Body TTK
```

with context:

```text
Assumes consecutive body hits under the stated combat/test conditions.
```

## Measured TTK

The archived workbook/community testing may contain observed TTK values.

Keep separate fields/concepts:

```text
calculatedIdealTTK
archivedMeasuredTTK
currentBuildMeasuredTTK
```

If both calculated and measured values exist, show both.

A discrepancy is useful research data and may reveal hidden mechanics.

## Known TTK research targets

- Ritmo: community claims strong TTK; RPM currently needs verification.
- Mendeleyev: community claims strong SMG TTK; RPM currently needs verification.
- LVOA-C Bad News: current Buddy data strongly suggests very fast ideal TTK.
- M4A1 vs MK17: higher raw damage does not necessarily mean faster TTK.
- G2: very high RPM does not automatically mean fastest TTK because STK matters.

---

# 5. Critical hidden/counterintuitive mechanics to investigate

These deserve first-class treatment in Ghost Recon Buddy because they may make normal
FPS intuition and Ubisoft stat bars misleading.

## 5.1 Semi-auto may hit harder than full-auto

Archived PvE damage testing preserves separate semi/full damage/STK observations for
some weapons.

Research questions:

- Does semi-auto still produce higher per-shot infantry damage than full-auto?
- Is this universal or weapon/class-specific?
- Does burst mode behave differently?
- Does Tier Mode change this relationship?
- Does weapon upgrade level change it?
- Does it apply to vehicles?

Potential fields:

```text
semiAutoDamage
fullAutoDamage
burstDamage
semiAutoSTK
fullAutoSTK
burstSTK
fireModeDamageSource
```

This must be resolved before presenting one universal TTK value for selectable-fire
weapons.

## 5.2 Rapid successive hits may change effective damage

Historical testing suggests rapidly landing consecutive rounds may reduce required STK
compared with slowly spaced hits.

Possible explanations include:

- hidden successive-hit bonus
- timing-window mechanic
- game-state transition
- another undocumented damage rule

Do not assume the mechanism.

Test:

```text
slow semi-auto
maximum-rate semi-auto
full-auto
```

with identical weapon, target, body region, range, and alert state.

Potential fields:

```text
successiveHitEffect
successiveHitWindow
successiveHitMultiplier
successiveHitSource
```

## 5.3 Horizontal and vertical recoil are separate problems

Do not collapse recoil into one number.

Potential fields:

```text
verticalRecoil
horizontalRecoil
firstShotKick
recoilRecovery
recoilPatternHeight
recoilPatternWidth
burstControl
fullAutoControl
```

Historical testing suggests some grips may trade horizontal movement for vertical climb,
or vice versa.

UI should explain tradeoffs plainly:

```text
Less side-to-side movement, but more upward climb.
```

## 5.4 Weight may reduce recoil

Older community testing suggests heavier attachment combinations can reduce recoil.

Treat as a testable hypothesis, not a verified mechanic.

## 5.5 Rangefinder may affect trajectory separately from velocity

Archived testing claims the rangefinder can reduce bullet drop without behaving like a
normal muzzle-velocity increase.

Potential fields:

```text
velocityModifier
trajectoryModifier
rangefinderTrajectoryEffect
```

## 5.6 Suppressor effects may be split across systems

Historical testing reports suppressors changing bullet speed without trajectory changing
as expected.

Test independently:

```text
velocity
drop/trajectory
damage/STK
detection distance
```

Do not use one generic "range" field.

## 5.7 Magazine / underbarrel / barrel choices may alter reload unexpectedly

Archived testing reports reload-time effects that do not cleanly match the game's
Handling bar.

Measure attachment-specific reload effects rather than deriving them from UI stats.

## 5.8 In-game stat bars may rescale or mislead

Treat Ubisoft's displayed bars as game UI, not measured physical values.

Buddy should continue to prioritize controlled behavior over bar length.

Potential future badge:

```text
UI_MISLEADING
```

---

# 6. Damage over distance — treat as unresolved

Do NOT implement a generic damage-falloff curve yet.

Evidence now points in conflicting directions:

- Siim's APC testing reported vehicle hit counts unchanged by distance.
- Historical PvE infantry testers reported little/no meaningful STK change over tested
  ranges, with possible edge cases such as pistols/extreme range.
- Other descriptions of the in-game Range stat imply damage retention over distance.

This may mean:

```text
vehicle damage != infantry damage
```

or:

```text
falloff is absent / class-specific / breakpoint-based / target-specific
```

Research questions:

- Does infantry damage change with distance?
- Does vehicle damage change with distance?
- Are pistols an exception?
- Are shotguns an exception because of pellet spread rather than raw falloff?
- Does penetration change with distance even when raw damage does not?
- Are destructible objects a separate damage system?

Suggested distances:

```text
25 m
50 m
100 m
200 m
300 m
400 m
```

Potential fields:

```text
referenceRange
targetSystem
distanceDamageFalloff
minDamageRange
maxDamageRange
damageAt100m
damageAt200m
damageAt300m
falloffModel
falloffSource
```

A valid verified result may be:

```text
distanceDamageFalloff = NONE_OBSERVED
```

for a specific target system and tested range.

---

# 7. Vehicle performance must be independent from infantry damage

Do not infer vehicle effectiveness from infantry damage or STK.

High-interest weapons:

- SR25 Jungle
- HTI
- BFG-50A / BFG Extranjeros

Historical Siim APC testing suggests:

- APC damage appeared unchanged by distance.
- front/side/rear APC hit zones behaved similarly.
- turret was reportedly invulnerable.
- player vehicle-destruction skills/medals affected results.
- some weapons showed target-specific behavior.

These are research leads, not current-build truth.

Potential fields:

```text
vehicleDamage
helicopterSTK
lightVehicleSTK
armoredVehicleSTK
vehicleModifier
vehicleDamageSource
vehicleHitZone
vehicleSkillLevel
testVehicle
```

Also separate:

```text
infantry
vehicle
destructibleObject
```

because SR25 Jungle behavior suggests those target systems may not share one damage
model.

---

# 8. Tier One / weapon upgrade scaling

The archive already contains historical Tier and non-tier rows, but the exact Level
1–30 upgrade curve requires controlled interpretation.

Critical questions:

- What is the infantry-damage increase per weapon-upgrade level?
- Is the curve linear?
- Is scaling class-specific?
- Does Level 30 affect infantry but not certain vehicles?
- Is vehicle scaling weapon-specific?
- Do skills/medals mask or override weapon-upgrade effects?
- How do Level 1 and Level 30 compare with Tier Mode off?
- How does enemy Tier scaling interact with weapon upgrades?
- Did patches change the behavior?

Historical APC tests report no Level-1→30 vehicle damage improvement for some weapons,
while other community tests report improvements for others.

Therefore mark this:

```text
CONFLICTING / NEEDS_TEST
```

Recommended test dimensions:

```text
weapon
weaponUpgradeLevel
tierMode
tierLevel
playerSkills
medals
enemyAlertState
targetType
range
attachments
fireMode
STK
vehicleHitCount
measuredDamage
gameVersion
```

Never apply one universal "Level 30 = +X%" multiplier without evidence.

---

# 9. Combat state / alert state

Do not reduce Wildlands combat behavior to only `unalerted` vs `alerted`.

Historical testing suggests several distinct damage states may exist.

Research labels:

```text
UNAWARE
DETECTION_TRANSITION
EARLY_COMBAT
FULLY_ENGAGED
```

These are research labels, not official Ubisoft terminology.

Questions:

- Is an unaware target effectively subject to one-shot/boosted damage?
- Does a suspicious/newly alerted target retain a damage bonus?
- Is there an early-combat multiplier?
- At what point does "normal" fully engaged damage begin?
- Does the state differ by faction/enemy class?

All TTK and STK tests must state combat state where practical.

---

# 10. Enemy / target taxonomy and body regions

TTK and inferred damage are meaningless without target context.

Track:

```text
targetFaction
targetClass
targetHealthReference
armorClass
difficulty
tierLevel
enemyAlertState
bodyRegion
```

At minimum distinguish:

```text
Santa Blanca regular
Santa Blanca heavy
Unidad regular
Unidad heavy
```

Body regions to test:

```text
head
upper torso
lower torso
arm
upper leg
lower leg
```

Historical reports suggest headshot multipliers and limb multipliers differ by enemy
type.

Do not generalize "one-shot headshot" into one universal mechanic.

---

# 11. Ballistics research

Do not use the in-game Range bar as a proxy for trajectory.

Priority weapons:

- 416
- AUG A3
- Bren
- SR25 Jungle
- BFG Extranjeros

Potential fields:

```text
muzzleVelocity
drop100m
drop200m
drop300m
drop400m
testOptic
testMethod
barrel
suppressor
rangefinder
ballisticsSource
```

Keep independent:

```text
velocity
trajectory/drop
damage falloff
penetration
```

Historical Siim testing identified unusually flat trajectories for some weapons and
reported suppressor/rangefinder behavior worth reproducing.

---

# 12. Recoil / handling research

Potential fields:

```text
verticalRecoil
horizontalRecoil
firstShotKick
recoilRecovery
burstControl
fullAutoControl
handlingSource
```

Initial high-interest weapons:

- TAR-21
- ACR
- M4A1
- Mk18
- L85

Testing protocol:

- fixed optic
- fixed wall/distance
- no manual compensation
- repeated fixed-size bursts or full-mag patterns
- measure height and width separately
- one attachment change at a time

Do not convert subjective "feels good" reports into numeric facts.

---

# 13. Stealth / sound detection

Potential fields:

```text
suppressedDetectionDistance
unsuppressedDetectionDistance
suspectedDetectionDistance
nearImpactAlertBehavior
suppressorPenalty
stealthSource
```

Historical Siim test targets:

```text
Class       Unsuppressed   Suppressed
Sniper      ~130 m         ~48-49 m
Shotgun     ~109 m         ~41 m
LMG         ~109 m         ~40 m
Rifle       ~93-94 m       ~34 m
SMG         ~60 m          ~23 m
Pistol      ~48-49 m       ~18 m
```

Do NOT publish these as current-build facts until reproduced.

Investigate:

- weapon-specific exceptions
- alert state
- suspected enemies
- time of day
- difficulty/Tier state
- nearby bullet-impact alerts

---

# 14. Penetration

Treat penetration as independent from:

```text
damage
caliber
DPS
Range bar
```

Current research lead:

- 556xi has community claims of unusually strong penetration.

Do not promote this into verified data yet.

Standardized penetration materials could include:

```text
wood
sheet metal
glass
vehicle panels
concrete
railings
multiple aligned targets
```

Record:

```text
penetrates
damage after penetration
layers penetrated
distance
angle
```

---

# 15. Attachment matrix

Attachments need measured behavior rather than assumptions.

Potential dimensions:

```text
damage
STK
velocity
trajectory
reload
vertical recoil
horizontal recoil
detection distance
penetration
```

High-interest attachment tests:

- short / standard / long barrel
- standard / extended / large magazine
- angled grip
- vertical/other foregrips
- grenade launcher
- suppressor
- rangefinder

Historical estimates of barrel damage changes are research leads only.

---

# 16. Unique / DLC / named variants

Do not automatically assume a named variant inherits every base-weapon property.

Audit variants for:

```text
same RPM?
same damage?
same fire-mode behavior?
same reload?
same ballistics?
same recoil?
same penetration?
same vehicle multiplier?
```

Represent inheritance as verified/unknown rather than assumed.

Examples include families such as:

```text
M4A1 / M4A1 Tactical / other named M4A1 variants
AK-12 / AK12 Victory
TAR-21 / TAR-21 Predator
MK17 / MK17 named variants
```

---

# 17. Real-world weapon mapping

Keep real-world identity/reference mapping separate from game-stat identity.

Relationship vocabulary:

```text
DIRECT
VARIANT
FAMILY
ANALOG
NOT_PRESENT
```

Examples already discussed:

```text
M4A1 -> M4A1 = DIRECT
M4 -> M4A1 = VARIANT
SR-25 -> SR25 = DIRECT
M110 SASS -> SR25 = FAMILY
AN-94 -> none in Wildlands = NOT_PRESENT
```

Alias normalization:

```text
M4AI -> M4A1
SR25 -> SR-25
M110 -> M110 SASS
```

Do not let alias/family normalization imply identical gameplay stats.

M110 should be specifically audited against catalog/source/DLC records before adding any
direct in-game match.

---

# 18. Data completeness report

Build a machine-generated research-gap view.

For every weapon, identify missing:

```text
STK
damage
RPM
measured TTK
reload
magazine
fire-mode data
ballistics
recoil
stealth
penetration
vehicle behavior
upgrade scaling
source provenance
```

This can drive the experiments backlog instead of manually discovering holes.

Useful output examples:

```text
Ritmo — missing RPM; cannot calculate TTK.
Mendeleyev — missing RPM; cannot validate community TTK claim.
556xi — penetration claim exists; no controlled penetration measurement.
```

---

# 19. Experiments page — make it a first-class laboratory

The existing Info / Experiments page is the correct destination for unresolved claims.

Each card should show:

```text
Claim
Why it matters
Current evidence
Current Buddy signal
Source(s)
Confidence
Status
Exact test plan
Result when tested
```

Suggested counterintuitive badges:

```text
COUNTERINTUITIVE
HIDDEN_MECHANIC
UI_MISLEADING
TARGET_SPECIFIC
CONTEXT_DEPENDENT
ATTACHMENT_TRADEOFF
CURRENT_BUILD_VERIFIED
HISTORICAL_ONLY
```

These badges must link to evidence/experiment context and never become unsourced trivia.

---

# 20. High-priority experiment backlog

## Experiment 1 — Semi-auto vs full-auto damage

Priority:

```text
CRITICAL
```

Candidate weapons:

- M4A1
- TAR-21
- ACR
- AK-12
- MK17

Measure:

```text
semiAutoSTK
fullAutoSTK
semiAutoDamageBand
fullAutoDamageBand
```

Start non-Tier and use identical conditions.

## Experiment 2 — Successive-hit damage

Priority:

```text
CRITICAL
```

Compare:

```text
slow semi-auto
maximum-rate semi-auto
full-auto
```

Same weapon/target/range/body region/combat state.

## Experiment 3 — Calculated vs measured TTK

Priority:

```text
CRITICAL
```

For weapons with known STK/RPM:

1. calculate ideal TTK
2. measure actual kill timing
3. compare
4. investigate large discrepancies

## Experiment 4 — Infantry damage vs distance

Priority:

```text
CRITICAL
```

Test:

```text
25 / 50 / 100 / 200 / 300 / 400 m
```

Across:

- pistol
- SMG
- AR
- sniper

Pay special attention to pistols as a possible exception.

## Experiment 5 — Weapon Level 1 vs Level 30

Priority:

```text
CRITICAL
```

Separate target systems:

```text
infantry
armored vehicle/APC
light vehicle
helicopter
destructible object
```

## Experiment 6 — Recoil direction matrix

Priority:

```text
HIGH
```

Measure vertical and horizontal spread separately for:

- stock
- angled grip
- vertical/other foregrips
- light/heavy attachment configurations

## Experiment 7 — Rangefinder trajectory

Priority:

```text
HIGH
```

Same rifle/config, rangefinder ON/OFF, at:

```text
100 / 200 / 300 / 400 / 500 m
```

Measure trajectory and velocity separately.

## Experiment 8 — Suppressor split test

Priority:

```text
HIGH
```

Measure independently:

```text
bullet travel time
drop
infantry STK
detection distance
```

## Experiment 9 — Vehicle damage vs distance

Priority:

```text
HIGH
```

Reproduce the historical APC result on current build.

## Experiment 10 — Vehicle hit-zone behavior

Priority:

```text
HIGH
```

Compare front/side/rear/turret where possible.

## Experiment 11 — Combat-state damage

Priority:

```text
HIGH
```

Attempt to isolate:

```text
UNAWARE
DETECTION_TRANSITION
EARLY_COMBAT
FULLY_ENGAGED
```

## Experiment 12 — Hit-region multipliers

Priority:

```text
HIGH
```

Measure head/torso/limb behavior across regular/heavy Santa Blanca and Unidad enemies.

## Experiment 13 — Barrel matrix

Priority:

```text
HIGH
```

Short / standard / long barrel:

```text
damage
STK
velocity
trajectory
reload
vertical recoil
horizontal recoil
```

## Experiment 14 — Detection-distance reproduction

Priority:

```text
HIGH
```

Reproduce historical class thresholds and look for weapon-specific exceptions.

## Experiment 15 — Reload attachment matrix

Priority:

```text
MEDIUM
```

Test magazine sizes, underbarrels, GL, and barrel lengths.

Separate empty vs partial/tactical reload where measurable.

## Experiment 16 — Penetration matrix

Priority:

```text
MEDIUM/HIGH
```

Standardized material/angle/distance testing.

---

# 21. Community claims to retain as research leads

Do not hard-code these as truth without verification.

Current examples:

- LVOA-C Bad News appears strongly supported as a very fast-killing AR.
- G2 appears strongly supported as extremely high RPM.
- TAR-21 appears competitive, but handling/recoil claims require testing.
- Ritmo TTK remains unverified until RPM is known.
- Mendeleyev TTK remains unverified until RPM is known.
- 556xi penetration remains unverified.
- 416 / AUG A3 / Bren trajectory comparisons require controlled reproduction.
- SR25 Jungle / HTI / BFG vehicle behavior suggests target-specific damage systems.

---

# 22. Contextual rankings instead of one “best gun”

Do not build one universal best-weapon score.

Prefer:

```text
Fastest Calculated TTK
Fastest Measured TTK
Best Stealth
Best Long-Range AR
Flattest Trajectory
Lowest Vertical Recoil
Lowest Horizontal Recoil
Best Overall Control
Highest Penetration
Best Vehicle Damage
Best CQB
Best General Purpose
Best Semi-Auto Damage
Best Suppressed Weapon
```

Long-term product principle:

```text
Best for what?
```

Recommendations should become more assertive only when the matching evidence exists.

---

# 23. Suggested Codex implementation order

## Phase 1 — audit before changing data

1. Inspect current schema and UI for existing semi/full-auto fields.
2. Inspect archived workbook for existing measured TTK.
3. Generate a data-completeness report.
4. Audit exact vs inferred damage handling.
5. Audit existing Tier/non-Tier and weapon-level metadata.
6. Audit current experiment/provenance model.

## Phase 2 — safe calculated features

7. Add calculated ideal TTK only where STK + RPM are known.
8. Keep calculated TTK separate from measured TTK.
9. Add sorting/comparison by calculated TTK.
10. Add missing-data handling and explanatory tooltips.
11. Explicitly explain semi/full damage notation where it already exists.

## Phase 3 — experiments infrastructure

12. Expand Info / Experiments data model/status vocabulary.
13. Add the CRITICAL/HIGH experiment cards from this document.
14. Add combat-state, fire-mode, body-region, target-system, skills/medals, and
    weapon-upgrade-level context.
15. Add counterintuitive-mechanic badges only as source-backed experiment callouts.

## Phase 4 — controlled research

16. Reproduce semi-auto vs full-auto damage.
17. Reproduce successive-hit behavior.
18. Compare calculated vs measured TTK.
19. Test infantry distance/falloff.
20. Test Level 1 vs Level 30 separately for infantry and vehicles.
21. Test vehicle distance/hit zones.
22. Test recoil vertical/horizontal behavior.
23. Test rangefinder and suppressor ballistics independently.
24. Reproduce stealth detection thresholds.
25. Test penetration.

## Phase 5 — richer recommendations

26. Add verified ballistics/recoil/stealth/vehicle/penetration dimensions.
27. Audit unique variant inheritance.
28. Expand context-aware rankings.
29. Use evidence completeness/confidence to determine when recommendations may be
    presented assertively.

---

# 24. Codex operating instructions

When working from this document:

- Inspect the repo before implementing.
- Prefer reuse of existing schema/components/functions.
- Do not fabricate missing weapon values.
- Do not convert historical/community claims directly into production facts.
- Preserve provenance and test context.
- Preserve immutable-release behavior.
- Keep bundled/static snapshot and PostgreSQL paths consistent.
- Keep missing values as unknown/not recorded.
- Run existing validation/check scripts after changes.
- Add tests/guardrails when introducing calculated metrics.
- If schema work is required, propose the smallest compatible migration first.
- Report which exact files/components/functions will change before large refactors.

The immediate objective is not to solve every Wildlands mechanic at once.

The immediate objective is:

```text
make the existing evidence clearer,
add safe calculated TTK,
strengthen experiment infrastructure,
and turn unresolved mechanics into reproducible tests.
```

## Implementation and research status — 2026-10-11

The first implementation slice is published in the working tree as catalog release
`0.8.0-structured-research-lab`:

- Calculated ideal body TTK is shown only when matching fire-mode STK and RPM are
  recorded. Semi-auto, full-auto, and archived workbook TTK remain separate.
- The experiment catalog has normalized statuses, priority, per-source type and
  confidence, explicit context/result fields, and status/priority filters.
- Five critical experiment plans are represented in the app: fire-mode damage,
  successive-hit timing, calculated versus archived/measured TTK, infantry distance,
  and weapon-level scaling.
- A generated completeness report shows which performance dimensions have structured
  catalog data and which remain missing.
- The data validator and testing protocol cover the new fields and preserve the
  evidence boundaries above.

Remaining work is evidence-led:

- **Controlled trials required:** execute the experiment backlog in sections 20 and
  21 in the game, record raw observations and full context, then review evidence before
  changing catalog conclusions. No current-build results have been entered yet.
- **Experiment coverage:** add plans for the remaining backlog in section 20, including
  recoil direction, rangefinder/suppressor effects, vehicle distance and hit zones,
  combat state, hit regions, barrels, detection distance, reload attachments, and
  penetration.
- **Data audits:** review exact versus threshold-inferred damage in rankings and
  comparisons; inspect Tier/non-Tier and weapon-upgrade metadata; audit inheritance for
  unique and DLC variants.
- **Recommendations:** add context-aware rankings and verified ballistics, recoil,
  stealth, vehicle, or penetration dimensions only after matching evidence is recorded.

The open GitHub issue list was empty when this status was reviewed. Treat the bullets
above as the current project backlog; gameplay trials need a player with access to the
game and should not be marked complete by code-only validation.

---

# 25. Primary research sources already identified

These are research inputs, not equal-strength evidence.

```text
Archived PvE weapon damage / TTK research
https://www.reddit.com/r/GhostRecon/comments/9ia12e/pve_weapon_damage_sheet_20/

Earlier PvE damage discussion
https://www.reddit.com/r/GhostRecon/comments/9dh1uh/pve_weapon_damage_sheet/

Siim numeric weapon/game testing
https://steamcommunity.com/sharedfiles/filedetails/?id=1607297504

Ghost Recon Buddy live site
https://www.paisleydevelopment.com/GhostReconBuddy/

Ghost Recon Buddy repo
https://github.com/np80286/GhostReconBuddy
```

Continue adding sources to the existing provenance ledger rather than burying them only
inside prose.

---

# Final direction

Ghost Recon Buddy is already architecturally pointed in the right direction.

The project should evolve from:

```text
weapon stat/reference table
```

toward:

```text
source-backed Wildlands decision and research system
```

without losing its strongest existing behavior:

```text
unknown stays unknown
historical claims retain context
measured and inferred values remain distinct
and every surprising claim can be traced back to evidence.
```
