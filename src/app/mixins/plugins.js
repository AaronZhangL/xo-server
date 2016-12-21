import createLogger from 'log'
import { forEach, map, startsWith } from 'lodash'
import { join } from 'path'
import { readdir } from 'fs-promise'

const { warn } = createLogger('plugins')

// ===================================================================

const LOOKUP_PATHS = [
  '/usr/local/lib/node_modules',
  join(__dirname, '../../../node_modules')
]
const PREFIX = 'xo-server-'
const PREFIX_LENGTH = PREFIX.lenght

const listPlugins = () => {
  const plugins = { __proto__: null }

  return Promise.all(map(LOOKUP_PATHS, path => readdir(path).then(
    basenames => forEach(basenames, basename => {
      if (startsWith(basename)) {
        const name = basename.slice(PREFIX_LENGTH)
        const path = join(path, basename)

        const previous = plugins[name]
        if (name in plugins) {
          warning(`duplicate plugins ${name}`, {
            name,
            paths: [
              previous.path,
              path
            ].sort()
          })

          return
        }

        let plugin
        try {
          plugin = require(path)
        } catch (error) {
          warning(`failed to import plugin ${name}`, {
            error,
            name,
            path
          })
          return
        }

        let version
        try {
          ({ version } = require(join(path, 'package.json')))
        } catch (_) {}

        // Supports both “normal” CommonJS and Babel's ES2015 modules.
        const {
          default: factory = plugin,
          configurationSchema,
          configurationPresets
        } = plugin

        plugins[name] = {
          configurationPresets,
          configurationSchema,
          factory,
          version
        }
      }
    }),
    error => {
      if (error.code !== 'ENOENT') {
        warning('plugins', 'failed to read directory', {
          error,
          path
        })
      }
    }
  )))
}

// -------------------------------------------------------------------

export default class Plugins {
  constructor (app, { safeMode }) {
    this._plugins = {}

    app.on('start', () => {
      if (!safeMode) {
        return this.discoverPlugins()
      }
    })
  }

  discoverPlugins () {
    return Promise.all(map(listPlugins, async (plugin, name) => {

    }))
  }
}
