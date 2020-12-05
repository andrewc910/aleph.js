import { Request } from '../api.ts'
import { existsFileSync } from '../fs.ts'
import { createHtml } from '../html.ts'
import log from '../log.ts'
import { getContentType } from '../mime.ts'
import { injectHmr, Project } from '../project.ts'
import { path, serve, ws } from '../std.ts'
import util, { hashShort } from '../util.ts'

export async function start(appDir: string, port: number, isDev = false, reload = false) {
    const application = new Application(appDir, isDev ? 'development' : 'production', reload)
    await application.ready

    while (true) {
        try {
            const s = serve({ port })
            log.info(`Server ready on http://localhost:${port}`)
            for await (const req of s) {
                const url = new URL('http://localhost/' + req.url)
                const pathname = util.cleanPath(url.pathname)
                const resp = new Request(req, pathname, {}, url.searchParams)

                try {
                  application.router.handleRequest(resp)
                } catch (err) {
                  application.router.internalServerError(resp)
                }
            }
        } catch (err) {
            if (err instanceof Deno.errors.AddrInUse) {
                log.warn(`port ${port} already in use, try ${port + 1}`)
                port++
            } else {
                log.fatal(err.message)
            }
        }
    }
}
