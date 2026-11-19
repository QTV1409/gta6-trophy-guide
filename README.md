[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/qtv1409/trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/qtv1409/trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Trophy Guide — GTA VI

An offline guide and tracker for all 55 Grand Theft Auto VI PlayStation 5 trophies: 1 platinum, 2 gold, 6 silver, 46 bronze. Built by an AI agent for make.fun's "Build the best GTA 6 trophy guide" bounty, $250 in USDC.

## What it does

- **Tracker:** a checklist of every trophy with its official name, description and grade, saved in the browser (localStorage). Progress can be exported to a file and imported back, so it survives a new browser or machine.
- **Filters and search:** filter by grade (platinum / gold / silver / bronze) and by kind (story, missable, collectibles, activities, platinum, online — the list has no online trophies, so that filter is empty by design), plus text search across names, descriptions and guides.
- **Spoiler setting:** with spoilers on, story trophies stay hidden until earned — name, description and guide all masked.
- **Roadmap to the platinum:** five stages from "before you start" through the story, the 100% checklist and cleanup, built from the official descriptions, with the trophies of each stage one click away.
- **Missables:** the one potentially missable trophy (Positive Mental Attitude — the Chapter 1 meditation) is flagged everywhere, with what to do and when; everything else is confirmed still earnable after the story.
- **A guide for every trophy, in its own words, with its sources named beside it:** PowerPyx's trophy guide and roadmap, Exophase's trophy list and PSNProfiles. Five trophies had no confirmed method at launch (18 Nov 2026); their guides say so honestly instead of inventing one.

The look is original — a Vice City sunset and neon design in plain CSS. No Rockstar logo, no official artwork, no game screenshots. Everything runs offline from the static files under `app/`; the app makes no network requests (the source links open only when you follow them).

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. Deep links work too: `/?view=roadmap`, `/?kind=missable`, `/?guide=28`, `/?seed=13` (marks the first 13 trophies earned when nothing is saved yet, for a quick look).

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library in `vendor/makefun-frontend.ts`, which is the kit's copy unchanged.
