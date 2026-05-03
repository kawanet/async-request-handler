// Test entry for the Express 5 line.

import {describe} from "node:test";
import express from "express5";

import {runBasicTests} from "./lib/basic.ts";

describe("basic.express5.test.ts", () => {
    runBasicTests(express);
});
