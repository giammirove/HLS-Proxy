#! /usr/bin/env node

const argv_vals = require('./lib/process_argv.js')

const use_tls = (argv_vals["--tls-cert"] && argv_vals["--tls-key"]) || argv_vals["--tls"]

const normalize_host = (host, port) => {
  if (!host) return null

  const parts = host.split(':')

  if (parts.length > 1) {
    host = parts[0]

    const public_port = parseInt(parts[1], 10)
    if (!isNaN(public_port))
      port = public_port
  }

  if (argv_vals["--avoid-port"]) {
    return host;
  }
  return `${host}:${port}`
}

const server = (use_tls)
  ? require('../servers/start_https.js')({
    port: argv_vals["--port"],
    tls_cert: argv_vals["--tls-cert"],
    tls_key: argv_vals["--tls-key"],
    tls_pass: argv_vals["--tls-pass"]
  })
  : require('../servers/start_http.js')({
    port: argv_vals["--port"]
  })

const middleware = require('../proxy.js')({
  is_secure: use_tls,
  host: normalize_host(argv_vals["--host"], argv_vals["--port"]),
  req_headers: argv_vals["--req-headers"],
  req_options: argv_vals["--req-options"],
  hooks: argv_vals["--hooks"],
  cache_segments: argv_vals["--prefetch"],
  max_segments: argv_vals["--max-segments"],
  cache_timeout: argv_vals["--cache-timeout"],
  cache_key: argv_vals["--cache-key"],
  cache_storage: argv_vals["--cache-storage"],
  cache_storage_fs_dirpath: argv_vals["--cache-storage-fs-dirpath"],
  debug_level: argv_vals["-v"],
  acl_whitelist: argv_vals["--acl-whitelist"],
  http_proxy: argv_vals["--http-proxy"]
})

if (middleware.connection)
  server.on('connection', middleware.connection)

if (middleware.request)
  server.on('request', middleware.request)

