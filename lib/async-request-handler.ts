// async-handler.ts

import {ErrorRequestHandler, Request, RequestHandler} from "express";

const NOP: RequestHandler = (req, res, next) => next();
const ENOP: ErrorRequestHandler = (err, req, res, next) => next();

/**
 * returns async RequestHandler which concatenates the first `handler` and more `handlers` including ErrorRequestHandler.
 */

export function ASYNC(handler: RequestHandler, ...handlers: (RequestHandler | ErrorRequestHandler)[]): RequestHandler {
    for (const mw of handlers) {
        const args = ("function" === typeof mw) && +mw.length;

        if (mw && args < 4) {
            handler = JOIN(handler, mw as RequestHandler);
        } else if (args === 4) {
            handler = IFERROR(handler, mw as ErrorRequestHandler);
        } else if (mw != null) {
            throw new TypeError("not a standard handler: " + mw);
        }
    }

    return SAFE(handler);
}

/**
 * returns async RequestHandler which combines the pair of handlers.
 */

function JOIN(A: RequestHandler, B: RequestHandler): RequestHandler {
    A = SAFE(A);
    B = SAFE(B);

    return (req, res, next) => A(req, res, (err?: any) => (err ? (next && next(err)) : B(req, res, next)));
}

/**
 * returns async RequestHandler that `E` RequestHandler catches an error thrown by `A` RequestHandler.
 */

function IFERROR(A: RequestHandler, E?: ErrorRequestHandler): RequestHandler {
    A = SAFE(A);
    E = CATCH(E);

    return (req, res, next) => A(req, res, (err?: any) => (err ? E(err, req, res, next) : (next && next())));
}

/**
 * returns async RequestHandler which catches Promise rejection thrown from `handler`.
 */

function SAFE(handler: RequestHandler): RequestHandler {
    if (!handler) handler = NOP;

    return async (req, res, next) => {
        try {
            return await handler(req, res, _next);
        } catch (e) {
            if (_next) return _next(e);
        }

        function _next(e?: any) {
            const fn = next;
            next = null;
            if (fn) return fn(e);
        }
    };
}

/**
 * returns async ErrorRequestHandler which catches Promise rejection thrown from `handler`.
 */

export function CATCH(handler: ErrorRequestHandler): ErrorRequestHandler {
    if (!handler) handler = ENOP;

    return async (err, req, res, next) => {
        try {
            return await handler(err, req, res, _next);
        } catch (e) {
            if (_next) return _next(e || err);
        }

        function _next(e?: any) {
            const fn = next;
            next = null;
            if (fn) return fn(e);
        }
    };
}

/**
 * returns async ErrorRequestHandler which runs one of `THEN` or `ELSE` handlers after `COND` tester returns a boolean.
 */

export function IF(COND: (req: Request) => (boolean | Promise<boolean>), THEN: RequestHandler, ELSE?: RequestHandler): RequestHandler {
    if (!THEN) THEN = NOP;
    if (!ELSE) ELSE = NOP;

    return (req, res, next) => Promise.resolve()
        .then(() => COND(req))
        .then(result => result ? THEN(req, res, next) : ELSE(req, res, next));
}
