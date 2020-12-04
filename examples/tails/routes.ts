import { Logger } from "../../pipes/logger.ts";
import { Router as TailsRouter } from "../../controller/router.ts";
import { BasePipe } from "../../pipes/base_pipe.ts";

export default class Router extends TailsRouter {
  drawRoutes() {
    this.pipeline("web", () => {
      return [
        new Logger(),
      ];
    });

    this.routes("api", () => {
      this.get("/about", "TestController", "about");
    });
  }
}
