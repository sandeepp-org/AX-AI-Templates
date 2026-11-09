- utils to util name change.
- api server more research needed future roadmap.
- file logger in logger as new features(future roadmap).
- cleanup skills
  - merge js-build-standard, js-typescript-conventions, and js-naming-conventions into js-code-style(done)
- js-decision-guidance rename to generic and used for plan and add plan to file.
- commit skills in separate repo.// need to be done later
- js-install-latest need to as point in chore
- create docker skill instead of rule
- mdc->md
- git-package-workflow it should be a skill // ignore-> using-util-package
- nexus-project this is app level thing move into app.
- skill.md -> small thing and refer to readme.md
- plan.md-> from building to update everything tracked decision making(reasioning).(like story of your code) why chooses that path every thing expalined in the plan.md. -->

- codereview skill need to create how we can do it exploration.
- test case plan also during plan making of packages.
- thought process should be added in plan.md
- prefer phase wise development for pacakges.
- function should small concise.
- classes should also small readable(try to keep all logic outside).
- project-context skills mapping to understand packages where and how to use agent should be able to understand and use pacakges where ever required if for similar thing we have pacakges not for exact thing suggest to build or raw user can choose from it.
- future-roadmap.md need to add for pacakges for future improvment.

- double check db connection management in logger
- test should be more deeper like practical test cases.
  - singleton test
  - transport test
  - function test
  - child logger test
- utils-events small packages for every transport
  - util-stream-redis
  - util-stream-in-memory-> redis

@Keshav

- Agentic memory ()
- Eval and observility for agent.
- Analytics integration ex-splunk,apd,elk,datadog
- Feed back -> for observility use elk
- For agentic thing we can go for langsmith.

@DONE

- SSE call
- When pacakges deleted it automatically add pacakges (shell script)
- Shell script for changes in packages automatically pushing into main.
- Consistency in folder structure interface
- Playground experienment of api and strucuture.
- Frontend test application-demo.
- Rule and skill optimization with agents.
- Prevent deleting a package if it is a dependency of any package/app; enforce core mandatory packages.
- Session management in the SSE.
- Mongodb transaction support feature.
- Remove unneccessory intefaces in redis.
- Infrasetup guide should be added in packages if needed for uitlizing that for example mogodb options and their setup guide and for redis option how we can do it aws secret manager add in skill it should be done every time.

@Review Plan

- skills
- rule
- process of development using agentic ai
- test files
- mongo-db package
