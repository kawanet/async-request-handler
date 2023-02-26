#!/usr/bin/env mocha -R spec

import * as express from "express";
import * as supertest from "supertest";
import type * as types from "../";

const TITLE = __filename.split("/").pop();

describe(TITLE, () => {
    let ASYNC: typeof types.ASYNC;

    before(async () => {
        const loaded = await import("../esm/async-request-handler.mjs" as string);
        ASYNC = loaded.ASYNC;
    });

    it("ASYNC(handler)", async () => {
        const app = express().get("/ok", ASYNC((req, res, next) => res.status(200).end()));

        await supertest(app).get("/ok").expect(200);

        await supertest(app).get("/ng").expect(404);
    });
});
