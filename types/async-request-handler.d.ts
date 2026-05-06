/**
 * async-request-handler
 *
 * @see https://www.npmjs.com/package/async-request-handler
 */

import type {ErrorRequestHandler, Request, RequestHandler} from "express";

export {} // external module indicator

/**
 * Returns an async `RequestHandler` that runs `handler` first and then
 * each of `handlers` in order. A handler with arity 4 is treated as an
 * `ErrorRequestHandler` and only runs when an upstream handler errors.
 * Any unhandled Promise rejection from any handler is forwarded to
 * `next(err)` instead of crashing the request.
 *
 * @param handler  Initial RequestHandler.
 * @param handlers Additional RequestHandler / ErrorRequestHandler instances chained after `handler`.
 */
export declare function ASYNC(handler: RequestHandler, ...handlers: (RequestHandler | ErrorRequestHandler)[]): RequestHandler;

/**
 * Returns an async `ErrorRequestHandler` that catches Promise rejections
 * thrown from `handler` and forwards them to `next(err)`.
 *
 * @param handler ErrorRequestHandler that may return a rejected Promise.
 */
export declare function CATCH(handler: ErrorRequestHandler): ErrorRequestHandler;

/**
 * Returns an async `RequestHandler` that dispatches to `THEN` when `COND(req)`
 * resolves truthy, or to `ELSE` when it resolves falsy. `COND` may return
 * either a boolean or a `Promise<boolean>`.
 *
 * @param COND Predicate over the incoming request.
 * @param THEN RequestHandler invoked when `COND` is truthy.
 * @param ELSE Optional RequestHandler invoked when `COND` is falsy. Defaults to a no-op.
 */
export declare function IF(COND: (req: Request) => (boolean | Promise<boolean>), THEN: RequestHandler, ELSE?: RequestHandler): RequestHandler;
