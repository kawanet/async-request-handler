// Test entry for the Express 4 line.

import express from "express4"
import {describe} from "node:test"
import {runBasicTests} from "./lib/basic.ts"

describe("basic.express4.test.ts", () => {
    runBasicTests(express)
})
