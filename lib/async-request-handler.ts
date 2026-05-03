// async-handler.ts

import type {ErrorRequestHandler, Request, RequestHandler} from "express";

const NOP: RequestHandler = (req, res, next) => next();
const ENOP: ErrorRequestHandler = (err, req, res, next) => next();

/**
 * Returns an async RequestHandler that runs `handler` first and then each
 * of `handlers` in order. A handler with arity 4 is treated as an
 * ErrorRequestHandler and only runs when an upstream handler errors.
 * Any unhandled Promise rejection is forwarded to `next(err)`.
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
 * Returns an async RequestHandler that runs `A`, then `B` if `A` did not
 * call `next(err)`. Both halves are wrapped in SAFE so a thrown or rejected
 * Promise becomes a `next(err)` instead of an unhandled rejection.
 */

function JOIN(A: RequestHandler, B: RequestHandler): RequestHandler {
    A = SAFE(A);
    B = SAFE(B);

    return (req, res, next) => A(req, res, (err?: any) => (err ? (next && next(err)) : B(req, res, next)));
}

/**
 * Returns an async RequestHandler that runs `A`; if `A` calls `next(err)`,
 * the ErrorRequestHandler `E` is invoked to handle the error.
 */

function IFERROR(A: RequestHandler, E?: ErrorRequestHandler): RequestHandler {
    A = SAFE(A);
    E = CATCH(E);

    return (req, res, next) => A(req, res, (err?: any) => (err ? E(err, req, res, next) : (next && next())));
}

/**
 * Returns an async RequestHandler that catches Promise rejections thrown
 * from `handler` and forwards them to `next(err)` exactly once.
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
 * Returns an async ErrorRequestHandler that catches Promise rejections
 * thrown from `handler` and forwards them to `next(err)` exactly once.
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
 * Returns an async RequestHandler that dispatches to `THEN` when `COND(req)`
 * resolves truthy, or to `ELSE` when it resolves falsy. `COND` may return
 * a boolean or a Promise<boolean>.
 */

export function IF(COND: (req: Request) => (boolean | Promise<boolean>), THEN: RequestHandler, ELSE?: RequestHandler): RequestHandler {
    if (!THEN) THEN = NOP;
    if (!ELSE) ELSE = NOP;

    return (req, res, next) => Promise.resolve()
        .then(() => COND(req))
        .then(result => result ? THEN(req, res, next) : ELSE(req, res, next));
}
