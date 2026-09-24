# Platform

What turns a working classroom tool into something a university can actually run: numbers people trust, a record of what happened, a way for other systems in, and everyone covered. (`basis: these are the capabilities you selected beyond the reference feature set`)

## Slice 7

### 13. Role aware analytics dashboard · needs a decision
Each role opens onto the numbers that matter to them, computed from real records rather than a hardcoded summary.
**Done when:** an admin sees enrollment, class and faculty totals, a teacher sees their own classes with counts, a student sees their classes, and every figure matches the underlying rows.
- [ ] Design it (spec): `/architect role aware analytics dashboard`

(_basis: what each figure means, such as whether an archived class counts as active, is a product decision nobody has made yet._)

## Slice 8

### 14. Audit log · needs a decision
A record of who changed what, so administrative actions can be accounted for.
**Done when:** creating, editing and archiving key records writes an entry naming the actor and the time, and an admin can filter the log by actor, record and date.
- [ ] Design it (spec): `/architect audit log`

(_basis: which actions are worth recording, and how long entries are kept, needs deciding before the writes are scattered through the code._)

## Slice 9

### 15. Public API · needs a decision
Tokens and documented endpoints, so another department system can read the data without a person signing in.
**Done when:** an issued token can read the endpoints it is scoped to, a revoked token is refused, and the published docs list every endpoint with its scope.
- [ ] Design it (spec): `/architect public API`

## Slice 10

### 16. Product analytics and consent · needs a decision
Usage events, and the consent that has to come before them.
**Done when:** page and key action events are recorded after consent, the notice can be accepted or refused, and refusing stops the tracking.
- [ ] Design it (spec): `/architect product analytics and consent`

(_basis: the event list and the consent behavior are one decision, and tracking without consent would break your privacy page before it exists._)

## Slice 11

### 17. Legal pages
The privacy policy and terms, reachable from where people look for them.
**Done when:** both pages are published in every supported locale, linked from the footer and the sign in screen, and describe the data the app really stores.
- [ ] Build it: `/develop legal pages`

(_basis: the consent mechanics are decided with product analytics, so this row is content, routes and links._)

## Slice 12

### 18. Accessibility pass
Every surface checked against the bar once the surfaces exist, rather than assumed.
**Done when:** keyboard reach, focus order, labels, contrast and error announcements pass on every screen, with whatever is found fixed.
- [ ] Build it: `/develop accessibility pass`

(_basis: WCAG AA is already a rule in your `AGENTS.md`, and a closing pass catches what accumulated while features were being built._)
