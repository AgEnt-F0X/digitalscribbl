// Superdesign CLI wrapper — passes argv to the CLI byte-exact.
//
// Why: PowerShell 5.1 mangles native arguments that contain double quotes,
// which silently truncated long -p prompts to their first fragment (the design
// agent then invented content it had never been told). Node's spawnSync with an
// explicit argv array has no shell layer, so nothing is reinterpreted.
//
// Usage:
//   node .superdesign/sd.js <command> [args...] [--prompt-file <path>] [--pages-file <path>]
//
//   --prompt-file  contents are passed as the next argument (for -p)
//   --pages-file   contents are passed as the next argument (for --pages)

const fs = require('fs')
const { spawnSync } = require('child_process')

const CLI =
  'C:/Users/rudra/AppData/Local/npm-cache/_npx/1fcb7780cda5ca66/node_modules/@superdesign/cli/bin/superdesign.js'

const argv = process.argv.slice(2)
const out = []

for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--prompt-file') {
    out.push('-p', fs.readFileSync(argv[++i], 'utf8').replace(/\r\n/g, '\n').trim())
  } else if (argv[i] === '--pages-file') {
    out.push('--pages', fs.readFileSync(argv[++i], 'utf8').replace(/\r\n/g, '\n').trim())
  } else {
    out.push(argv[i])
  }
}

const r = spawnSync(process.execPath, [CLI, ...out], { stdio: 'inherit', cwd: process.cwd() })
process.exit(r.status === null ? 1 : r.status)
