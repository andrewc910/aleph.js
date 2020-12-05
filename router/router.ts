// Main router. Project/application interfaces with this.
// Handles dispatching requests to the proper method in RouteHandler
export class Router {
  // #routeHandler = new RouteHandler()

  constructor() {}

  update() {
    // if api
      // this.routeHandler.updateApiRoutes
    
    // this.routeHandler.update
  }

  remove() {}

  handleRequest() {
    // hmr_assets
    if (pathname === '/_hmr') {
      // this.routeHandler.hmr()
    }

    // serve public files
    const filePath = path.join(application.appRoot, 'public', decodeURI(pathname))
    if (existsFileSync(filePath)) {
      // this.routeHandler.public()
    }

    // api/controllers
    if (pathname.startsWith('/api/')) {
      // this.routeHandler.api()
    }

    // dist files
    if (pathname.startsWith('/_tails/')) {
      // this.routeHandler.dist()
    }

    // ssr here
    // this.routeHandler.ssr()
  }
}