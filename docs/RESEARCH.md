# Ghost Recon Buddy: research and collection plan

Research updated: September 20, 2026. This is an evolving source audit, not an
exhaustive internet crawl or a substitute for controlled current-build tests.

## What we can obtain publicly

| Data                                  | Public evidence found                                                        | Confidence in completing coverage    | Remaining work                                                                                          |
| ------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Bolivia weapon-case names and classes | Guides4Gamers' 51-case index, province guides and Prima walkthrough          | Complete for that bounded source     | Reconcile disputed province labels and current availability; do not treat it as the full game inventory |
| Weapon-specific attachments           | Historical damage sheet has barrel test rows for all 51 Bolivia case weapons | Partial                              | Capture every Gunsmith slot per weapon; class-level lists do not establish individual compatibility     |
| Displayed stat bars                   | Guides and in-game screens                                                   | Obtainable with systematic capture   | Preserve UI units and capture conditions; never interpret a bar as physical damage                      |
| Real performance                      | Community damage sheet, tests, bullet-drop resource                          | Useful but uneven                    | Recover exact conditions, repeat on current builds, separate target and alert state                     |
| Per-attachment effects                | Multiple community testing reports                                           | Incomplete and sometimes conflicting | Compare full configurations; no assumption that effects add or multiply universally                     |
| Mission names and summaries           | Base campaign and DLC mission indexes                                        | Strong starting coverage             | Write original summaries, map prerequisites/rewards, add special operations and updates                 |
| Apparel / cosmetics                   | Not yet audited                                                              | Unknown                              | Inventory every category; distinguish item ownership, unlock method and present availability            |
| Exact internal values                 | Engine research repository discovered                                        | Not established                      | Determine whether lawful local-file inspection yields trustworthy complete definitions                  |

The audited Guides4Gamers page lists 51 weapon cases on Bolivia. The archived
workbook expands the catalog to 182 weapons and variants, 251 historical
configuration rows, and 70 direct damage profiles. The workbook inventory is
substantially broader than the case list, but it is still a historical snapshot:
current availability, post-workbook additions, and exact build applicability
need continuing audit.

## Source register

1. [Wildlands Damage Sheet](https://docs.google.com/spreadsheets/d/1w0KRBZSdb3SFBZVAncBGit3ixPSsSMWpEiOkDSlqrZw/edit), credited in the app to Tsuyara / Wildlands_Ghost. Imported Tier One and non-tier head/body hit counts, firing mode, barrel rows, rate of fire, magazine and reload fields for all 182 identifiable weapon records from the six class tabs. The additional damage/DPS chart provides 70 direct weapon profiles after name reconciliation. Every normalized configuration retains its workbook tab and row.
2. [Tsuyara's 2018 methodology discussion](https://www.reddit.com/r/GhostRecon/comments/9ia12e/pve_weapon_damage_sheet_20/). Credits Wildlands_Ghost. Includes estimates and explicit uncertainty. Do not turn estimated barrel effects into universal constants.
3. [Mikkihiiri9's attachment guide](https://www.reddit.com/r/Wildlands/comments/1vs55qq/ghost_recon_wildlands_weapon_attachment_guide_2026/). Distinguishes the author's handling/recoil experiments from inherited damage/ballistic claims. Dates in search results and relative page timestamps differ; preserve exact access dates and verify revision dates before a full import.
4. [Bullet Drop Compendium](https://bulletdrop.netlify.app/), discovered via [this Reddit reference](https://www.reddit.com/r/GhostRecon/comments/14599w4/bullet_drop_compendium_not_my_oc/). Landing URL resolved but rendered no readable chart data through this research tool. Raw data, charts, scope calibration and license are unverified. Do not mix Wildlands with Breakpoint.
5. [Province weapon/accessory guide](https://gameplay.tips/guides/434-ghost-recon-wildlands.html). Good inventory lead; visible typos and omissions mean it cannot define completeness. Imported a limited subset of weapon/province facts.
6. [Prima weapon unlock guide](https://primagames.com/tips/ghost-recon-wildlands-weapon-list-how-unlock-new-guns). Cross-checks for selected entries; not bulk copied.
7. [Guides4Gamers mission index](https://guides4gamers.com/ghost-recon-wildlands/quests/). Includes base game, Fallen Ghosts, Narco Road and bonus packs. Imported six Itacua titles with short original summaries. Full walkthrough text is not copied.
8. [Ubisoft Last Rites announcement](https://www.ubisoft.com/en-us/news/ignt.62412/ghost-recon-wildlands-last-rites). Confirms new mission content and gameplay changes in 2026. Historical sources cannot automatically establish current behavior.
9. [Firejumper93's engine documentation](https://github.com/Firejumper93/GhostReconWildlands-AnvilNext2.0-Documentation). Research lead, not an authoritative damage dump. Overview discovered; detailed extraction work not performed.
10. [Guides4Gamers weapon cases](https://guides4gamers.com/ghost-recon-wildlands/pois/weapon-cases/). Audited against the complete, bounded 51-case Bolivia inventory and its category labels. The page does not provide every province in the text used for this release.
11. [Darkdally attribution trail](https://steamcommunity.com/app/460930/discussions/0/1743358239831447032/). A preserved community discussion linking Darkdally's scale-testing work to the historical workbook lineage. It is provenance context, not permission to erase the workbook's uncertainty or assign every value to one contributor.
12. [Numeric weapon and game data by Siim](https://steamcommunity.com/sharedfiles/filedetails/?id=1607297504). Independent historical tests covering 117 weapons, APC damage, detection distances, and bullet-drop rankings. The documented context is offline play with maxed skills and medals; the author warns that in-game stat bars are unreliable and separately credits Darkdally.
13. [Ghost Recon Wiki weapon index](https://ghostrecon.fandom.com/wiki/Weapons_of_Wildlands). Used for weapon identity, class, and variant cross-checking, not measured damage.
14. [Internet Movie Firearms Database: Wildlands](https://www.imfdb.org/wiki/Ghost_Recon_Wildlands). Used for real-world firearm identity and naming context, kept separate from in-game performance claims.
15. [Prima Official Guide archival copy](https://epics.top/uploads/dl/Prima_Official_Game_Guide.pdf). Retained as an archival comparison lead; it does not overwrite measured workbook values.
16. [Wildlands interactive map by Rogerhn](https://rogerhn.github.io/projects/wildlands/). Used for selected province and weapon-case cross-checks. Its Dragunov province conflicts with an older guide, so both claims remain visible until an in-game capture resolves them.

The sheet import preserves each configuration's source tab and row, including
extended and large magazine values stored under merged headers. Unknown or
ambiguous workbook values remain text or empty fields. When a numeric body-hit
count exists but the separate damage chart has no row, the UI may calculate a
bounded estimate from the workbook's 1,000-HP reference:

```text
minimum damage = ceil(1000 / hits)
maximum damage = ceil(1000 / (hits - 1)) - 1
```

For a one-hit result, only the lower bound (`≥1000`) is known. When numeric RPM
also exists, the interface calculates a perfect-cadence DPS interval from that
damage band. These values carry an asterisk and “derived” labeling; they are not
stored as direct damage profiles and do not model recoil, misses, movement,
armor differences, range, or attachment effects. Tier One weapon upgrade
levels, platform, exact build, and several other test conditions are not
consistently recorded. PostgreSQL stores the raw archive plus queryable,
release-versioned configuration rows and direct damage profiles.

## Specific conflicts to resolve

The 2018 discussion reports a different magazine reload penalty from the 2026 attachment guide. Barrel effects also have explicit uncertainty in the older discussion. Platform, patch, weapon, measurement method and rounding could explain discrepancies; none of those explanations is established yet. Preserve each original claim and conditions. Do not average disagreements into a fake consensus.

The Dragunov / SVD location is also disputed: the province guide places it in Villa Verde, while the interactive map reports Caimanes. The catalog preserves both locations until an in-game capture resolves the conflict.

## Collection order

1. Resolve the documented Dragunov province disagreement and audit current availability of the 51 weapon cases.
2. Audit current availability and parent/base relationships for the 182 imported
   records: boss rewards, unique variants, DLC, rewards, and store/event items.
3. Retest high-interest partial records—especially weapons currently represented
   by derived bands—using `TESTING-PROTOCOL.md` so estimates can be replaced by
   direct current-build evidence.
4. Capture the Gunsmith compatibility matrix from the user's owned game. Start
   with the user's most-used weapons and then expand by class. Record slot
   restrictions and interactions, not just attachment names.
5. Capture displayed bars independently of empirical measurements.
6. Complete missions, prerequisites, rewards, DLC, and current availability
   with original summaries and citations.
7. Audit apparel and cosmetics; historical availability differs from current
   obtainability.
8. Introduce scenario recommendations only after enough matching evidence
   exists.

## Recommendations we should eventually support

Stealth base clearing, extended firefights, close-range control, long-range shooting and vehicle engagements each need different evidence. Let a user set mode, range, target, noise constraints and owned weapons. Explain each recommendation using the matching measured result, trade-offs and uncertainty. If no comparable evidence exists, say so. Mission-specific recommendations need mission constraints recorded separately from community opinions.

## What we need beyond public pages

- The user's platform, game build, modes and owned content.
- In-game captures of Gunsmith slots and special-variant restrictions.
- Repeatable gameplay measurements with unedited evidence and trial counts.
- Access or permission from authors when bulk spreadsheet/chart redistribution is not clearly licensed. Link freely available originals and retain attribution; public visibility alone is not a reuse license.
- Potentially local game-data inspection if documented and appropriate. No executable code from community repositories was run and no game files were obtained in this task.

## Initial implementation limits

The current decision workspace compares the archived sheet's body-hit results,
direct damage profiles, RPM, reload, and magazine values across Tier One and
non-tier modes. Full-auto timing is theoretical, and derived damage/DPS bands
are mathematical bounds rather than fresh trials. Build, platform, distance,
alert state, weapon level, perks, suppressor state, complete loadout, and sample
count remain explicitly unknown. The validation layer prevents unknown values
from becoming zero and prevents incompatible or conflicting observations from
silently becoming a recommendation. A future schema must add field-level
assertions, variant ancestry, richer test contexts, and visible conflicts.
