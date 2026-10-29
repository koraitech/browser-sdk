# Contributing

First of all, thanks for contributing!

This document provides some basic guidelines for contributing to this repository. To propose
improvements, feel free to submit a pull request.

## Submitting issues

Github issues are welcome, feel free to submit error reports and feature requests! Make sure to add
enough details to explain your use case.

## Pull Requests

Have you fixed a bug or written a new feature and want to share it? Many thanks!

In order to ease/speed up our review, here are some items you can check/improve when submitting your
pull request:

- Keep commits small and focused, rebase your branch if needed.
- Write unit and e2e tests for the code you wrote.
- Write meaningful [Commit messages and Pull Request
  titles](#commit-messages-and-pull-request-titles)

CI runs on GitHub Actions for every pull request: typecheck, lint, format, build and unit tests
must pass before merging.

## Modules usage convention

Use index.ts files to expose a single, minimal API in directories where modules are used together.
Do not use index.ts when a directory contains independent modules.
An index.ts file should not have exports only used for spec files.

## Commit messages and Pull Request titles

Messages should be concise but explanatory. We are using a convention inspired by [gitmoji][2], to
label our Commit messages and Pull Request titles:

### User-facing changes

💥 - Breaking change.

✨ - New feature.

🐛 - Bug fix.

⚡️ - Performance improvement.

📝 - Documentation.

⚗ - Experimental.

### Internal changes

👷 - Updating project setup (continuous integration, build system, package dependencies...).

♻️ - Refactoring code.

🎨 - Improving structure / format of the code.

✅ - Updating tests.

👌 - Updating code due to code review changes.

[2]: https://gitmoji.dev/
