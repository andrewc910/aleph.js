// Handles finding the proper data and returning the request. The meat
// of routing happens here. Router is an interface, Routes are data
// store objects, this is what does the heavy lifting.
export class Router {
  // #apiRoutes = new Routes() // Datastore for api routes
  // #routes = new Routes() // datastore for page routes
  // #pipeline = new Pipeline

  constructor() {}

  updateApiRoutes() {}

  updatePageRoutes() {}

  remove() {}

  hmr() {
    const { conn, r: bufReader, w: bufWriter, headers } = req
    ws.acceptWebSocket({ conn, bufReader, bufWriter, headers }).then(async socket => {
        const watcher = project.createFSWatcher()
        watcher.on('add', (moduleId: string, hash: string) => socket.send(JSON.stringify({
            type: 'add',
            moduleId,
            hash
        })))
        watcher.on('remove', (moduleId: string) => {
            watcher.removeAllListeners('modify-' + moduleId)
            socket.send(JSON.stringify({
                type: 'remove',
                moduleId
            }))
        })
        for await (const e of socket) {
            if (util.isNEString(e)) {
                try {
                    const data = JSON.parse(e)
                    if (data.type === 'hotAccept' && util.isNEString(data.id)) {
                        const mod = project.getModule(data.id)
                        if (mod) {
                            watcher.on('modify-' + mod.id, (hash: string) => socket.send(JSON.stringify({
                                type: 'update',
                                moduleId: mod.id,
                                hash,
                                updateUrl: util.cleanPath(`${project.config.baseUrl}/_aleph/${mod.id.replace(/\.js$/, '')}.${hash!.slice(0, hashShort)}.js`)
                            })))
                        }
                    }
                } catch (e) { }
            } else if (ws.isWebSocketCloseEvent(e)) {
                break
            }
        }
        project.removeFSWatcher(watcher)
    })
  }

  public() {
    const info = Deno.lstatSync(filePath)
    const lastModified = info.mtime?.toUTCString() ?? new Date().toUTCString()
    if (lastModified === req.headers.get('If-Modified-Since')) {
        resp.status(304).send('')
        continue
    }

    const body = Deno.readFileSync(filePath)
    resp.setHeader('Last-Modified', lastModified)
    resp.send(body, getContentType(filePath))
    continue
  }

  api() {
    project.callAPI(req, { pathname, search: url.search })
  }

  dist() {
    if (pathname.startsWith('/_aleph/data/') && pathname.endsWith('/data.js')) {
      const [p, s] = util.splitBy(
        util.trimSuffix(
          util.trimPrefix(pathname, '/_aleph/data'),
          '/data.js'
        ), 
        '@'
      )
      const [status, data] = await project.getSSRData({ pathname: p, search: s })
      if (status === 200) {
          resp.send(`export default ` + JSON.stringify(data), 'application/javascript; charset=utf-8')
      } else {
          resp.status(status).send('')
      }
      continue
    } else if (pathname.endsWith('.css')) {
      const filePath = path.join(project.buildDir, util.trimPrefix(pathname, '/_aleph/'))
      if (existsFileSync(filePath)) {
          const body = await Deno.readFile(filePath)
          resp.send(body, 'text/css; charset=utf-8')
          continue
      }
  } else {
      const reqSourceMap = pathname.endsWith('.js.map')
      const mod = project.getModuleByPath(reqSourceMap ? pathname.slice(0, -4) : pathname)
      if (mod) {
          const etag = req.headers.get('If-None-Match')
          if (etag && etag === mod.hash) {
              resp.status(304).send('')
              continue
          }

          let body = ''
          if (reqSourceMap) {
              body = mod.jsSourceMap
          } else {
              body = mod.jsContent
              if (project.isHMRable(mod.id)) {
                  body = injectHmr({ ...mod, jsContent: body })
              }
          }
          resp.setHeader('ETag', mod.hash)
          resp.send(body, `application/${reqSourceMap ? 'json' : 'javascript'}; charset=utf-8`)
          continue
      }
    }
  }

  ssr() {
    const [status, html] = await application.getPageHtml({ pathname, search: url.search })
    resp.status(status).send(html, 'text/html; charset=utf-8')
  }
}