const _ = require('lodash')
const utils = require('./utils')

module.exports = (options = {}) => {
  Object.defineProperty(options, utils.validationSymbol, {
    value: true,
    writable: false
  })

  const isDev = process.env.RAKIT_URL != null

  return _.flow(
    options =>
      _.defaultsDeep(options, {
        srcDir: 'application/nuxt',
        generate: { dir: 'storage/nuxt' },
        axios: { baseURL: '/' }
      }),
    // Force some other options. These are mandatory.
    options =>
      _.mergeWith(
        options,
        {
          mode: 'spa',
          modules: [require.resolve('./module'), '@nuxtjs/axios'],
          axios: { proxy: isDev },
          proxy: isDev ? [
              [
                ['**/*', `!${process.env.RENDER_PATH}`],
                { target: process.env.RAKIT_URL }
              ]
            ]
            : null
        },
        (obj, src) => {
          if (_.isArray(obj)) {
            return obj.concat(src)
          }
        }
      )
  )(options)
}
