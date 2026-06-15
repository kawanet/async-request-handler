// Test entry for the Express 4 line.

import {describe} from "node:test"
import express from "express4"

import {runBasicTests} from "./lib/basic.ts"

describe("basic.express4.test.ts", () => {
    runBasicTests(express)
})
