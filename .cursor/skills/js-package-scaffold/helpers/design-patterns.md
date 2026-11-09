# Design patterns reference (GOF 23)

Optional reference when **js-package-scaffold** or package work needs pattern names. Apply when they solve a real problem; avoid over-engineering.

## Creational (5)

| Pattern              | Intent / When to Use in Packages                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| **Abstract Factory** | Families of related objects; e.g. different logger providers (Console, Mongo) sharing a common interface |
| **Builder**          | Complex object construction step-by-step; e.g. config objects with many optional fields                  |
| **Factory Method**   | Defer object creation to subclasses; e.g. `LoggerFactory.create()`, pluggable providers                  |
| **Prototype**        | Clone objects instead of creating from scratch; e.g. duplicating config templates                        |
| **Singleton**        | Single instance (use sparingly; prefer dependency injection)                                             |

## Structural (7)

| Pattern       | Intent / When to Use in Packages                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------ |
| **Adapter**   | Bridge incompatible interfaces; e.g. Express adapters for framework-agnostic core                |
| **Bridge**    | Separate abstraction from implementation; e.g. logger interface vs concrete providers            |
| **Composite** | Tree structures; treat part and whole uniformly; e.g. nested config, route trees                 |
| **Decorator** | Add behavior dynamically without subclassing; e.g. logging wrapper, caching layer                |
| **Facade**    | Simple interface to complex subsystem; e.g. `createApiRouter` hides Express + Swagger setup      |
| **Flyweight** | Share state across many objects to save memory; e.g. shared schema instances                     |
| **Proxy**     | Lazy loading, access control, logging; e.g. deferred heavy imports, `bootstrap()` dynamic import |

## Behavioral (11)

| Pattern                     | Intent / When to Use in Packages                                                        |
| --------------------------- | --------------------------------------------------------------------------------------- |
| **Chain of Responsibility** | Pass request along handler chain; e.g. middleware pipeline, validation chain            |
| **Command**                 | Encapsulate request as object; e.g. undo/redo, queued operations                        |
| **Interpreter**             | Interpret grammar or expressions; e.g. query parsers, rule engines                      |
| **Iterator**                | Traverse collections without exposing internals; e.g. paginated results, streams        |
| **Mediator**                | Reduce coupling between components; e.g. event bus, orchestration layer                 |
| **Memento**                 | Capture and restore object state; e.g. snapshot/rollback, audit trails                  |
| **Observer**                | Notify dependents of state changes; e.g. event emitters, reactive streams               |
| **State**                   | Object behavior changes with internal state; e.g. connection lifecycle, workflow stages |
| **Strategy**                | Interchangeable algorithms; e.g. validation strategies, storage backends                |
| **Template Method**         | Define algorithm skeleton; subclasses fill steps; e.g. base service with hooks          |
| **Visitor**                 | Add operations to objects without modifying them; e.g. serializers, transformers        |

## Summary

- **Creational**: How to create objects (Factory, Builder, Singleton, etc.)
- **Structural**: How to compose objects (Adapter, Facade, Proxy, etc.)
- **Behavioral**: How objects collaborate (Observer, Strategy, Chain of Responsibility, etc.)
