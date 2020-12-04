import { ServerRequest } from "https://deno.land/std@0.78.0/http/server.ts";
import { Logger } from "./pipes/logger.ts";

abstract class BasePipe {
  abstract call(request: ServerRequest): void;
}

class Controller {
  [key: string]: any

  constructor() {
    console.log("construct controller");
  }

  log(msg: string) {
    console.log(msg);
  }
}

class TestController extends Controller {
  index() {
    console.log("test controller index");
  }

  create() {
    console.log("test controller create");
  }
}

interface Route {
  module: typeof Controller;
  method: string;
}

interface Paths {
  get?: Record<string, Route>;
  post?: Record<string, Route>;
  put?: Record<string, Route>;
  patch?: Record<string, Route>;
  delete?: Record<string, Route>;
  head?: Record<string, Route>;
  connect?: Record<string, Route>;
  options?: Record<string, Route>;
  trace?: Record<string, Route>;
}

type Pipeline = Array<BasePipe>;

interface Routes {
  [key: string]: {
    middleware: Pipeline;
    paths: Paths;
  };
}

abstract class Router {
  _routes: Routes;
  _paths: Paths;

  constructor() {
    this._routes = {
      web: {
        middleware: [],
        paths: {},
      },
      api: {
        middleware: [],
        paths: {},
      },
    };
    this._paths = {};
  }

  pipeline(pipe: string, callback: () => Array<BasePipe>): void {
    if (this._routes[pipe]) {
      this._routes[pipe].middleware.concat(callback());
    }

    this._routes[pipe] = { middleware: callback(), paths: {} };
  }

  routes(pipeline: string, callback: () => void) {
    if (this._routes[pipeline]) {
      this._paths = this._routes[pipeline].paths;
      callback();
    } else {
      // TODO: Pipeline doesn't exist
      throw new Error();
    }
  }

  get(
    path: string,
    module: typeof Controller,
    method: string,
  ): void {
    if (this._paths.get) {
      this._paths.get[path] = { module, method };
    } else {
      this._paths.get = {};
      this._paths.get[path] = { module, method };
    }
  }

  post(
    path: string,
    module: typeof Controller,
    method: string,
  ): void {
    if (this._paths.post) {
      this._paths.post[path] = { module, method };
    } else {
      this._paths.post = {};
      this._paths.post[path] = { module, method };
    }
  }
}

class Routerr extends Router {
  drawRoutes() {
    this.pipeline("web", () => {
      return [
        new Logger(),
      ];
    });

    this.pipeline("api", () => {
      return [
        new Logger(),
      ];
    });

    this.pipeline("static", () => {
      return [
        new Logger(),
      ];
    });

    this.routes("web", () => {
      this.get("/", TestController, "index");
      this.post("/", TestController, "create");
    });
  }
}

const router = new Routerr();
router.drawRoutes();
console.log(router._routes);
