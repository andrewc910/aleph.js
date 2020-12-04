import { ServerRequest } from "https://deno.land/std@0.78.0/http/server.ts";
import { BasePipe } from "./base_pipe.ts";
import logger from "../log.ts";

export class Logger extends BasePipe {
  call(request: ServerRequest): void {
    logger.info(
      `Host: ${
        request.headers.get("host")
      } Method: ${request.method} URL: ${request.url}`,
    );
    // const cookies = request.headers.get("cookie")
    // if (cookies) {
    //   logger.info(`Cookies: ${cookies.split("=")}`);
    // }
    logger.info(`cookies; ${request.headers.get("cookie")}`);
    // console.log(request);
  }
}
