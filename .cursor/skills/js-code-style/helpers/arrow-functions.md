## Arrow Functions Only (helper for `js-code-style`)

Use arrow function expressions for **all** function definitions. Never use the `function` keyword.

**Wrong:**

```typescript
function getUserById(id: string) {
  return db.users.findOne({ id });
}

export default function App() {
  return <div />;
}
```

**Right:**

```typescript
const getUserById = (id: string) => {
  return db.users.findOne({ id });
};

const App = () => {
  return <div />;
};
```

This applies everywhere: top-level functions, callbacks, React components, Express handlers, utility helpers — no exceptions.
