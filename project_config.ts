import { existsDirSync, existsFileSync } from "./fs.ts";
import log from "./log.ts";
import { BasePipe } from "./pipes/base_pipe.ts";
import { Routing } from "./routing.ts";
import { path } from "./std.ts";
import { Plugin, SSROptions } from "./types.ts";
import util, { reLocaleID } from "./util.ts";

/**
* Config for Tails.js application. Handels loading & processing
* user config files.
*/
export class ProjectConfig {
  /** `srcDir` to put your application source code (default is '/'). */
  srcDir: string;
  /** `env` appends env variables (use `Deno.env.get(key)` to get an env variable) */
  env: Record<string, string>;
  /** `buildTarget` specifies the build target for **tsc** (possible values: '**ES2015**' - '**ES2020**' | '**ESNext**', default is **ES2015** for `production` and **ES2018** for `development`). */
  buildTarget: string;
  /** A list of plugin of PostCSS. */
  postcss: {
    plugins: (string | { name: string; options: Record<string, any> })[];
  };
  /** `baseUrl` specifies the path prefix for the application (default is '/'). */
  baseUrl: string;
  /** `defaultLocale` specifies the default locale of the application (default is '**en**'). */
  defaultLocale: string;
  /** The options for **SSR**. */
  ssr: boolean | SSROptions;
  /** `outputDir` specifies the output directory for `build` command (default is '**dist**'). */
  outputDir: string;
  /** A list of locales. */
  locales: Array<string>;
  /** Enable sourceMap in **production** mode (default is **false**). */
  sourceMap: boolean;
  /** A list of plugin. */
  plugins: Array<Plugin>;

  __file?: string;

  pipes: {
    web: Array<BasePipe>;
    api: Array<BasePipe>;
  };

  readonly appRoot: string;
  readonly mode: "development" | "production";

  /** `reactUrl` specifies the **react** download URL (default is 'https://esm.sh/react@16.14.0'). */
  readonly reactUrl: string;
  /** `reactDomUrl` specifies the **react-dom** download URL (default is 'https://esm.sh/react-dom@16.14.0'). */
  readonly reactDomUrl: string;
  readonly importMap: Readonly<{ imports: Record<string, string> }>;

  routing?: Routing;

  constructor(
    appDir: string,
    mode: "development" | "production",
  ) {
    this.appRoot = path.resolve(appDir);
    this.mode = mode;
    this.srcDir = this.userSrcDir();
    this.outputDir = "/dist";
    this.baseUrl = "/";
    this.defaultLocale = "en";
    this.env = {};
    this.importMap = { imports: {} };
    this.locales = [];
    this.ssr = {
      fallback: "_fallback.html",
    };
    this.buildTarget = mode === "development" ? "es2018" : "es2015";
    this.sourceMap = false;
    this.reactUrl = "https://esm.sh/react@17.0.1";
    this.reactDomUrl = "https://esm.sh/react-dom@17.0.1";
    this.plugins = [];
    this.postcss = {
      plugins: [
        "autoprefixer",
      ],
    };
    this.pipes = {
      web: [],
      api: [],
    };
  }

  async loadConfig() {
    const config: Record<string, any> = {};
    await this.loadImportMap();
    await this.loadConfigFiles(config);
    await this.setUserConfiguration(config);
  }

  private async loadImportMap() {
    const importMapFile = path.join(this.appRoot, "import_map.json");
    if (existsFileSync(importMapFile)) {
      const { imports } = JSON.parse(await Deno.readTextFile(importMapFile));
      Object.assign(
        this.importMap,
        { imports: Object.assign({}, this.importMap.imports, imports) },
      );
    }

    const { ALEPH_IMPORT_MAP } = globalThis as any;
    if (ALEPH_IMPORT_MAP) {
      const { imports } = ALEPH_IMPORT_MAP;
      Object.assign(
        this.importMap,
        { imports: Object.assign({}, this.importMap.imports, imports) },
      );
    }
  }

  private async loadConfigFiles(config: Record<string, any>) {
    for (
      const name of Array.from(["aleph.config", "config"]).map((name) =>
        ["ts", "js", "mjs", "json"].map((ext) => `${name}.${ext}`)
      ).flat()
    ) {
      const p = path.join(this.appRoot, name);
      if (existsFileSync(p)) {
        if (name.endsWith(".json")) {
          const conf = JSON.parse(await Deno.readTextFile(p));
          if (util.isPlainObject(conf)) {
            Object.assign(config, conf);
            Object.assign(this, { __file: name });
          }
        } else {
          let { default: conf } = await import("file://" + p);
          if (util.isFunction(conf)) {
            conf = await conf();
          }
          if (util.isPlainObject(conf)) {
            Object.assign(config, conf);
            Object.assign(this, { __file: name });
          }
        }
        break;
      }
    }
  }

  private async setUserConfiguration(config: Record<string, any>) {
    const { navigator } = globalThis as any;
    const {
      srcDir,
      ouputDir,
      baseUrl,
      buildTarget,
      sourceMap,
      defaultLocale,
      locales,
      ssr,
      env,
      plugins,
      postcss,
      pipelines,
    } = config;
    if (util.isNEString(srcDir)) {
      Object.assign(this, { srcDir: util.cleanPath(srcDir) });
    }

    if (util.isNEString(ouputDir)) {
      Object.assign(this, { ouputDir: util.cleanPath(ouputDir) });
    }

    if (util.isNEString(baseUrl)) {
      Object.assign(this, { baseUrl: util.cleanPath(encodeURI(baseUrl)) });
    }

    if (/^es(20\d{2}|next)$/i.test(buildTarget)) {
      Object.assign(this, { buildTarget: buildTarget.toLowerCase() });
    }

    if (typeof sourceMap === "boolean") {
      Object.assign(this, { sourceMap });
    }

    if (util.isNEString(defaultLocale)) {
      navigator.language = defaultLocale;
      Object.assign(this, { defaultLocale });
    }

    if (util.isArray(locales)) {
      Object.assign(
        this,
        {
          locales: Array.from(
            new Set(locales.filter((l) => reLocaleID.test(l))),
          ),
        },
      );
      locales.filter((l) => !reLocaleID.test(l)).forEach((l) =>
        log.warn(`invalid locale ID '${l}'`)
      );
    }

    if (typeof ssr === "boolean") {
      Object.assign(this, { ssr });
    } else if (util.isPlainObject(ssr)) {
      const fallback = util.isNEString(ssr.fallback)
        ? util.ensureExt(ssr.fallback, ".html")
        : "404.html";
      const include = util.isArray(ssr.include)
        ? ssr.include.map((v) => util.isNEString(v) ? new RegExp(v) : v).filter(
          (v) => v instanceof RegExp,
        )
        : [];
      const exclude = util.isArray(ssr.exclude)
        ? ssr.exclude.map((v) => util.isNEString(v) ? new RegExp(v) : v).filter(
          (v) => v instanceof RegExp,
        )
        : [];
      const staticPaths = util.isArray(ssr.staticPaths)
        ? ssr.staticPaths.map((v) => util.cleanPath(v))
        : [];
      Object.assign(this, { ssr: { fallback, include, exclude, staticPaths } });
    }

    if (util.isPlainObject(env)) {
      Object.assign(this, { env });
    }

    if (util.isNEArray(plugins)) {
      Object.assign(this, { plugins });
    }

    if (util.isPlainObject(postcss) && util.isArray(postcss.plugins)) {
      Object.assign(this, { postcss });
    } else if (existsFileSync(path.join(this.appRoot, "postcss.config.json"))) {
      const text = await Deno.readTextFile(
        path.join(this.appRoot, "postcss.config.json"),
      );
      try {
        const postcss = JSON.parse(text);
        if (util.isPlainObject(postcss) && util.isArray(postcss.plugins)) {
          Object.assign(this, { postcss });
        }
      } catch (e) {
        log.warn("bad postcss.config.json", e.message);
      }
    }

    if (util.isPlainObject(pipelines)) {
      const pipes: Record<string, Array<BasePipe>> = {};
      Object.keys(pipelines).forEach((pipeline) => {
        if (util.isArray(pipelines[pipeline])) {
          console.log(`${pipeline} passed`);
          pipes[pipeline] = pipelines[pipeline];
        }
      });

      Object.assign(this, { pipes });
    }
  }

  private userSrcDir(): string {
    return existsDirSync(path.join(this.appRoot, "/src/pages")) ? "/src" : "/";
  }
}
