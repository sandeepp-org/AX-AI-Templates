# AX-AI-Templates

Starter templates the AX AI platform creates new delivery repositories from. One folder per template.

| Folder        | What it is                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------- |
| `mern-stack/` | MongoDB, Express, React and Node.js starter: Hello World connected to one health API, domain-driven |

## Using a template

Each folder is a complete project with its own README. To start from one:

```bash
git clone https://github.com/sandeepp-org/AX-AI-Templates.git
cp -R AX-AI-Templates/mern-stack my-project
cd my-project && git init
```

## Adding a template

1. Add a folder at the top level, named in kebab-case after the stack (`flutter-app`, `python-api`).
2. Give it a `README.md` that covers requirements, quick start and folder structure.
3. Make sure it installs, builds, lints and passes its tests from a clean clone.
4. Never commit `.env` files or credentials; ship `.env.example` only.
5. Add a row to the table above.
