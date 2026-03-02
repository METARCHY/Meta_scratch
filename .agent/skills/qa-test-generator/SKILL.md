---
name: qa-test-generator
description: Provides instructions for writing Unit and Integration tests tailored to your project. The agent will not mark a task as "Done" until all tests pass. Use when writing test suites, ensuring code quality, or evaluating code changes against testing standards.
---

# QA & Test Generator

## Overview

This skill ensures that agents enforce a strict standard of testing for the project. By following these guidelines, you will write reliable, comprehensive Unit and Integration tests tailored to the project's framework, and you will refuse to mark a task as "Done" until testing criteria are met and tests pass.

## Core Responsibilities

1. **Test-Driven or Test-Complete Development**
   - Whenever you write or modify application code, you MUST also write or update the corresponding tests.
   - You MUST run the tests to verify they pass before considering a task completed.
   - A task is NOT "Done" until all relevant tests pass successfully.

2. **Unit Testing**
   - Focus on testing isolated functions, components, and hooks.
   - Use the project's standard testing libraries (e.g., Jest, React Testing Library, or Vitest).
   - Mock external dependencies and side effects appropriately.

3. **Integration Testing**
   - Focus on how different parts of the application work together.
   - Test data flows from the UI down to the data access layer.

## Workflow: Writing and Verifying Tests

When asked to implement a feature or add tests:

1. **Analyze Requirements**
   - Identify the code that needs testing.
   - Determine the critical paths, edge cases, and expected failures.

2. **Setup Test Files**
   - Create test files adjacent to the source code (e.g., `ComponentName.test.tsx` or `utils.spec.ts`) unless the project uses a centralized `__tests__` directory.
   - Import necessary testing utilities and the module under test.

3. **Draft the Tests**
   - Write clear, descriptive test names.
   - Follow the Arrange-Act-Assert (AAA) pattern.
   - Ensure comprehensive coverage of the new or modified logic.

4. **Run the Tests**
   - Execute the tests using the appropriate terminal command (e.g., `npm test`, `npm run test:unit`, `npx playwright test`).
   - If tests fail, debug and fix the implementation or adjust the tests if they are flawed.

5. **Final Validation**
   - Do NOT inform the user that the task is complete until the console output confirms all tests pass.
