import { ServerRequest } from "https://deno.land/std@0.78.0/http/server.ts";

export abstract class BasePipe {
  abstract call(request: ServerRequest): void;
}
