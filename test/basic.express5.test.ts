// Test entry for the Express 5 line.

import {describe} from "node:test";
import express5 from "express5";

import {runBasicTests, type ExpressModule} from "./lib/basic.ts";

// Runtime tests cover both Express 4 and 5. Type-level dual coverage
// is intentionally out of scope, so this cast pins express5 to the
// Express 4 baseline that the shared runner type-checks against.
const express = express5 as unknown as ExpressModule;

describe("basic.express5.test.ts", () => {
    runBasicTests(express);
});
