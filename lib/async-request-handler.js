"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IF = exports.CATCH = exports.ASYNC = void 0;
const NOP = (req, res, next) => next();
const ENOP = (err, req, res, next) => next();
function ASYNC(handler, ...handlers) {
    for (const mw of handlers) {
        const args = ("function" === typeof mw) && +mw.length;
        if (mw && args < 4) {
            handler = JOIN(handler, mw);
        }
        else if (args === 4) {
            handler = IFERROR(handler, mw);
        }
        else if (mw != null) {
            throw new TypeError("not a standard handler: " + mw);
        }
    }
    return SAFE(handler);
}
exports.ASYNC = ASYNC;
function JOIN(A, B) {
    A = SAFE(A);
    B = SAFE(B);
    return (req, res, next) => A(req, res, (err) => (err ? (next && next(err)) : B(req, res, next)));
}
function IFERROR(A, E) {
    A = SAFE(A);
    E = CATCH(E);
    return (req, res, next) => A(req, res, (err) => (err ? E(err, req, res, next) : (next && next())));
}
function SAFE(handler) {
    if (!handler)
        handler = NOP;
    return async (req, res, next) => {
        try {
            return await handler(req, res, _next);
        }
        catch (e) {
            if (_next)
                return _next(e);
        }
        function _next(e) {
            const fn = next;
            next = null;
            if (fn)
                return fn(e);
        }
    };
}
function CATCH(handler) {
    if (!handler)
        handler = ENOP;
    return async (err, req, res, next) => {
        try {
            return await handler(err, req, res, _next);
        }
        catch (e) {
            if (_next)
                return _next(e || err);
        }
        function _next(e) {
            const fn = next;
            next = null;
            if (fn)
                return fn(e);
        }
    };
}
exports.CATCH = CATCH;
function IF(COND, THEN, ELSE) {
    if (!THEN)
        THEN = NOP;
    if (!ELSE)
        ELSE = NOP;
    return (req, res, next) => Promise.resolve()
        .then(() => COND(req))
        .then(result => result ? THEN(req, res, next) : ELSE(req, res, next));
}
exports.IF = IF;
