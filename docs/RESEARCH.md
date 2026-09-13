# Ghost Recon Buddy: research and collection plan

Research date: September 12, 2026. This is an initial source audit, not an exhaustive internet crawl.

## What we can obtain publicly

| Data                        | Public evidence found                                            | Confidence in completing coverage    | Remaining work                                                                                      |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Base weapon names and cases | Province guides, wiki leads, Prima walkthrough                   | Strong starting coverage             | Reconcile names, variants, errors, missing items and current availability                           |
| Weapon-specific attachments | Historical damage sheet establishes selected barrel combinations | Partial                              | Capture every Gunsmith slot per weapon; class-level lists do not establish individual compatibility |
| Displayed stat bars         | Guides and in-game screens                                       | Obtainable with systematic capture   | Preserve UI units and capture conditions; never interpret a bar as physical damage                  |
| Real performance            | Community damage sheet, tests, bullet-drop resource              | Useful but uneven                    | Recover exact conditions, repeat on current builds, separate target and alert state                 |
| Per-attachment effects      | Multiple community testing reports                               | Incomplete and sometimes conflicting | Compare full configurations; no assumption that effects add or multiply universally                 |
| Mission names and summaries | Base campaign and DLC mission indexes                            | Strong starting coverage             | Write original summaries, map prerequisites/rewards, add special operations and updates             |
| Apparel / cosmetics         | Not yet audited                                                  | Unknown                              | Inventory every category; distinguish item ownership, unlock method and present availability        |
| Exact internal values       | Engine research repository discovered                            | Not established                      | Determine whether lawful local-file inspection yields trustworthy complete definitions              |

No defensible percentage of the full game is established. A count of imported entries must not be called a coverage percentage. No official, complete, machine-readable game-data API was established in this search.

## Source register

1. [Wildlands Damage Sheet](https://docs.google.com/spreadsheets/d/1w0KRBZSdb3SFBZVAncBGit3ixPSsSMWpEiOkDSlqrZw/edit). Directly inspected selected sniper rows. Useful mode and barrel comparisons; many context fields are absent from the imported rows. Only a small factual subset is transcribed in this release. The other tabs and original methodology need a separate audit.
2. [Tsuyara's 2018 methodology discussion](https://www.reddit.com/r/GhostRecon/comments/9ia12e/pve_weapon_damage_sheet_20/). Credits Wildlands_Ghost. Includes estimates and explicit uncertainty. Do not turn estimated barrel effects into universal constants.
3. [Mikkihiiri9's attachment guide](https://www.reddit.com/r/Wildlands/comments/1vs55qq/ghost_recon_wildlands_weapon_attachment_guide_2026/). Distinguishes the author's handling/recoil experiments from inherited damage/ballistic claims. Dates in search results and relative page timestamps differ; preserve exact access dates and verify revision dates before a full import.
4. [Bullet Drop Compendium](https://bulletdrop.netlify.app/), discovered via [this Reddit reference](https://www.reddit.com/r/GhostRecon/comments/14599w4/bullet_drop_compendium_not_my_oc/). Landing URL resolved but rendered no readable chart data through this research tool. Raw data, charts, scope calibration and license are unverified. Do not mix Wildlands with Breakpoint.
5. [Province weapon/accessory guide](https://gameplay.tips/guides/434-ghost-recon-wildlands.html). Good inventory lead; visible typos and omissions mean it cannot define completeness. Imported a limited subset of weapon/province facts.
6. [Prima weapon unlock guide](https://primagames.com/tips/ghost-recon-wildlands-weapon-list-how-unlock-new-guns). Cross-checks for selected entries; not bulk copied.
7. [Guides4Gamers mission index](https://guides4gamers.com/ghost-recon-wildlands/quests/). Includes base game, Fallen Ghosts, Narco Road and bonus packs. Imported six Itacua titles with short original summaries. Full walkthrough text is not copied.
8. [Ubisoft Last Rites announcement](https://www.ubisoft.com/en-us/news/ignt.62412/ghost-recon-wildlands-last-rites). Confirms new mission content and gameplay changes in 2026. Historical sources cannot automatically establish current behavior.
9. [Firejumper93's engine documentation](https://github.com/Firejumper93/GhostReconWildlands-AnvilNext2.0-Documentation). Research lead, not an authoritative damage dump. Overview discovered; detailed extraction work not performed.

## Specific conflicts to resolve

The 2018 discussion reports a different magazine reload penalty from the 2026 attachment guide. Barrel effects also have explicit uncertainty in the older discussion. Platform, patch, weapon, measurement method and rounding could explain discrepancies; none of those explanations is established yet. Preserve each original claim and conditions. Do not average disagreements into a fake consensus.

## Collection order

1. Establish a canonical inventory: base weapons, unique variants, DLC, rewards, store/event items. Distinct variants get distinct IDs and a parent relationship in the next schema version.
2. Audit the remaining damage spreadsheet tabs. Record sheet tab, exact cells, formulas versus observations, author, access date and methodology. Prepare an adapter for each layout; do not ingest arbitrary spreadsheets blindly.
3. Capture the Gunsmith compatibility matrix from the user's owned game. Start with the user's most-used weapons and then expand by class. Record slot restrictions and interactions, not just a list of attachment names.
4. Capture screenshots of displayed bars independently of empirical measurements.
5. Collect repeatable trials using TESTING-PROTOCOL.md. Prioritize competing loadouts with clear gameplay consequences.
6. Complete missions, prerequisites, rewards, DLC and current availability with original summaries and citations.
7. Audit apparel and cosmetics; historical availability is different from current obtainability.
8. Introduce scenario recommendations only after enough matching evidence exists.

## Recommendations we should eventually support

Stealth base clearing, extended firefights, close-range control, long-range shooting and vehicle engagements each need different evidence. Let a user set mode, range, target, noise constraints and owned weapons. Explain each recommendation using the matching measured result, trade-offs and uncertainty. If no comparable evidence exists, say so. Mission-specific recommendations need mission constraints recorded separately from community opinions.

## What we need beyond public pages

- The user's platform, game build, modes and owned content.
- In-game captures of Gunsmith slots and special-variant restrictions.
- Repeatable gameplay measurements with unedited evidence and trial counts.
- Access or permission from authors when bulk spreadsheet/chart redistribution is not clearly licensed. Link freely available originals and retain attribution; public visibility alone is not a reuse license.
- Potentially local game-data inspection if documented and appropriate. No executable code from community repositories was run and no game files were obtained in this task.

## Initial implementation limits

The first release intentionally supports one historical comparator: body shots to kill, Unidad Heavy, the sheet's semi-auto column, barrel configuration and Tier One/non-tier modes. Build, platform, distance, alert state, weapon level, perks, suppressor state, complete loadout and sample count remain explicitly unknown. The UI makes no universal damage score or best-weapon claim. The initial validation disallows multiple observations for a comparison cell so contradictory data cannot silently choose the first result. A future schema must group richer test contexts and surface conflicting observations before widening this comparator.
