# Academics

The enrollment thread and the academic structure it hangs from. Each slice adds one strand to a thread that already runs, and each one ships real and working. (`basis: Tracer Bullet thickens a working thread instead of finishing one layer at a time`)

## Skeleton

### 7. Core enrollment loop
The thin thread through every layer: a person signs in, an admin creates a class with a join code, a student joins with that code, the teacher sees the roster. This slice is the walking skeleton.
**Done when:** a real account signs in, a created class exposes a join code that works, a student joins with it, and the roster updates for the teacher, on the deployed apps.
- [x] Design it (spec): `/architect core enrollment loop`
- [ ] Build it: `/develop core enrollment loop`
  - [ ] Verified sign up and sign in, the seeded admin, and admin created teacher accounts (AC-1, AC-2)
  - [ ] The data migration: enrollment status, the index swap, and the placeholder subject seed (AC-3)
  - [ ] Admin creates classes with a teacher, capacity and join code (AC-4)
  - [ ] Join, leave and the waitlist promotion, plus the roster and my classes reads (AC-5, AC-6, AC-7, AC-8)
  - [ ] Role guards, rate limiting, and the web screens through the dev proxy (AC-6, AC-9)
- [ ] Verify it: `/check verify core enrollment loop`
Spec [0006](../specs/0006-core-enrollment-loop/index.md)

(_basis: Tracer Bullet merges the walking skeleton into the first real slice, so there is no separate throwaway skeleton row. Enrollment rules, such as joining a full class or rejoining after leaving, are behavior a person has to decide, so this needs a spec._)

## Slice 2

### 8. Accounts that hold up · needs a decision
Verification, password reset and a profile with an avatar, so accounts can be trusted and people stop looking like initials.
**Done when:** a new account verifies by email, a forgotten password resets, and a signed in user can change their name, password and avatar.
- [ ] Design it (spec): `/architect accounts that hold up`

(_basis: sending mail means picking a provider, and that choice has no home yet._)

## Slice 3

### 9. Departments & subjects
The academic structure classes hang from, managed by admins with filters and pagination.
**Done when:** an admin creates, edits and archives departments and subjects, and a subject shows the classes and teachers attached to it.
- [ ] Build it: `/develop departments & subjects`

(_basis: plain records over the tables the data model spec already defines, so no separate decision is owed._)

## Slice 4

### 10. Class scheduling & capacity
Session times, rooms, capacity limits, and more than one teacher on a class.
**Done when:** a teacher or admin schedules sessions against a class, sets a capacity, assigns several teachers, and a student sees the schedule in their own local time.
- [ ] Build it: `/develop class scheduling & capacity`

(_basis: how session times are stored and displayed is settled by the data model spec, so this slice only builds the screens and rules._)

## Slice 5

### 11. Faculty and student directory
A paginated directory with search by name or email, so people can be found without asking around.
**Done when:** an admin searches and filters the directory, opens one person, and sees their classes and teaching load.
- [ ] Build it: `/develop faculty and student directory`

## Slice 6

### 12. Course materials
Files attached to a class and reachable only by that class.
**Done when:** a teacher uploads a file to a class, members of that class can open it, and anyone outside the class cannot.
- [ ] Build it: `/develop course materials`

(_basis: the storage provider is already decided in the stack spec, and who may download follows the enrollment rules from the core loop._)
