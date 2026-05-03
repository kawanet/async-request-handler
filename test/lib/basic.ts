// basic: ASYNC / CATCH / IF middleware behavior covering the documented use cases.

import {describe, it} from "node:test";
import supertest from "supertest";

import {ASYNC, CATCH, IF} from "../../lib/async-request-handler.ts";

// Accept the express default export by structure: v4 / v5 differ in types,
// but the call-site shape (`express()`, `app.use(...)`) is compatible.
export type ExpressModule = any;

export function runBasicTests(express: ExpressModule): void {
    describe("basic", () => {
        const OK = ASYNC((req, res, next) => res.send("OK"));

        const ONE = ASYNC((req, res, next) => {
            res.header({"x-one": "ONE"});
            next();
        });

        const TWO = ASYNC((req, res, next) => {
            res.header({"x-two": "TWO"});
            next();
        });

        it("ASYNC(handler)", async () => {
            const app = express().use(OK);

            await supertest(app).get("/").expect("OK");
        });

        it("ASYNC(handler, null, handler)", async () => {
            const app = express();
            app.use(ASYNC(ONE, null, OK));

            await supertest(app).get("/").expect("OK").expect("x-one", "ONE");
        });

        it("IF(COND,THEN)", async () => {
            const app = express();
            app.use(IF(req => req.path === "/true", (req, res) => res.send("TRUE")));
            app.use(OK);

            await supertest(app).get("/true").expect("TRUE");
            await supertest(app).get("/false").expect("OK");
        });

        it("IF(COND,null,ELSE)", async () => {
            const app = express();
            app.use(IF(req => req.path === "/true", null, (req, res) => res.send("FALSE")));
            app.use(OK);

            await supertest(app).get("/true").expect("OK");
            await supertest(app).get("/false").expect("FALSE");
        });

        it("IF(COND,THEN,ELSE)", async () => {
            const app = express();
            app.use(IF(async req => Promise.resolve().then(() => (req.path === "/true")), ONE, TWO));
            app.use(OK);

            await supertest(app).get("/true").expect("OK").expect("x-one", "ONE");
            await supertest(app).get("/false").expect("OK").expect("x-two", "TWO");
        });

        it("CATCH(errorHandler)", async () => {
            const app = express();
            app.use(ASYNC((req, res, next) => {
                throw new Error("ERROR");
            }));
            app.use(CATCH((err, req, res, next) => {
                res.header({"x-one": "ERROR"});
                next(err);
            }));
            app.use(CATCH((err, req, res, next) => {
                res.header({"x-two": "ERROR"});
                next();
            }));
            app.use(CATCH((err, req, res, next) => {
                res.status(500).send("ERROR"); // never comes here
            }));
            app.use(OK);

            await supertest(app).get("/").expect("OK").expect("x-one", "ERROR").expect("x-two", "ERROR");
        });

        it("CATCH(errorHandler) with Promise rejection", async () => {
            const app = express();
            app.use(ASYNC((req, res, next) => {
                return Promise.reject(Error("ERROR"));
            }));
            app.use(CATCH((err, req, res, next) => {
                res.status(500).send("ERROR");
            }));
            app.use(OK);

            await supertest(app).get("/").expect("ERROR");
        });

        it("ASYNC(handler,errorHandler)", async () => {
            const app = express();
            app.use(ASYNC(
                (req, res, next) => {
                    throw new Error("ERROR");
                },
                (err, req, res, next) => {
                    res.header({"x-one": "ERROR"});
                    next(err);
                },
                (err, req, res, next) => {
                    res.header({"x-two": "ERROR"});
                    next();
                },
                (err, req, res, next) => {
                    res.status(500).send("ERROR"); // never comes here
                }
            ));
            app.use(OK);

            await supertest(app).get("/").expect("OK").expect("x-one", "ERROR").expect("x-two", "ERROR");
        });

        it("ASYNC(handler,errorHandler) with Promise rejection", async () => {
            const app = express();
            app.use(ASYNC(
                (req, res, next) => {
                    return Promise.reject(Error("ERROR"));
                },
                (err, req, res, next) => {
                    res.status(500).send("ERROR");
                }
            ));
            app.use(OK);

            await supertest(app).get("/").expect("ERROR");
        });
    });
}
