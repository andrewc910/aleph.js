// import sass from "https://deno.land/x/aleph/plugins/sass.ts";
// import wasm from "https://deno.land/x/aleph/plugins/wasm.ts";
import { Logger } from "../../pipes/logger.ts";

export default {
  pipelines: {
    web: [
      new Logger(),
    ],
    api: [
      new Logger(),
    ],
  },
};
