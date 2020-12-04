import { ServerRequest } from "https://deno.land/std@0.78.0/http/server.ts";
import { BasePipe } from "./base_pipe.ts";

export class Pipeline {
  #pipes: Array<BasePipe>;

  constructor(pipes: Array<BasePipe>) {
    this.#pipes = pipes;
  }

  call(request: ServerRequest) {
    this.#pipes.forEach((pipe) => {
      pipe.call(request);
    });
  }
}
