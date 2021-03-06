const path = require('path')
const fs = require('fs-extra')

module.exports = function () {
  if (this.options.dev) {
    this.extendRoutes((routes, resolve) => {
      const index = routes.find(route => route.path === '/' || (route.name && route.name.match(/^index-\w+$/)))
      routes.push(
        Object.assign({}, index, {
          name: '__rakit_nuxt__',
          path: process.env.RENDER_PATH
        })
      )
    })
    return
  }

  const publicPath = path.resolve('public' + this.options.build.publicPath)

  this.nuxt.hook('generate:done', async () => {
    const { html } = await this.nuxt.renderer.renderRoute('/', { url: '/' })

    fs.moveSync(
      path.resolve(this.options.generate.dir + this.options.build.publicPath),
      publicPath,
      { overwrite: true }
    )

    fs.writeFileSync(path.resolve(publicPath, 'index.html'), html)
    fs.removeSync(path.resolve(this.options.generate.dir))
  })
}
