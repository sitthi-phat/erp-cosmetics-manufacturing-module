/**
 * QA DEF-02 fix: testMatch used to only cover src/backend/**\/*.test.ts (Engineer's own
 * colocated tests), so all 27 of QA's automated spec files under tests/ were silently never
 * run by `npx jest`/`npm test`. This now uses Jest "projects" so:
 *   - unit-level specs (Engineer colocated + QA's tests/unit/*.spec.ts) run by default, no DB
 *     needed, so CI never breaks when no MySQL is available.
 *   - integration-level specs (tests/integration/**\/*.spec.ts, including the concurrency/
 *     subfolder) need a live DB via src/backend/app.ts + supertest - they only run when
 *     RUN_DB_TESTS=1 is set (`RUN_DB_TESTS=1 npx jest`), so a missing DB never fails the default
 *     `npx jest` run.
 *   - e2e specs (tests/e2e/*.spec.ts) use @playwright/test, NOT Jest - run via `npm run test:e2e`.
 * @type {import('jest').Config}
 */
const unitProject = {
  displayName: "unit",
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: [
    "<rootDir>/src/backend/**/*.test.ts",
    "<rootDir>/prisma/**/*.test.ts",
    "<rootDir>/tests/unit/**/*.spec.ts"
  ],
  moduleNameMapper: {
    "^@backend/(.*)$": "<rootDir>/src/backend/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1"
  }
};

const integrationProject = {
  displayName: "integration",
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["<rootDir>/tests/integration/**/*.spec.ts"],
  moduleNameMapper: {
    "^@backend/(.*)$": "<rootDir>/src/backend/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1"
  }
};

const projects = process.env.RUN_DB_TESTS === "1" ? [unitProject, integrationProject] : [unitProject];

module.exports = {
  projects,
  clearMocks: true
};
