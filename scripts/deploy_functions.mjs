import { existsSync, readdirSync } from 'fs'
import { promisify } from 'util'
import { exec as execCb } from 'child_process'
import { exit } from 'process'
import { homedir } from 'os'
import { outputFile } from 'fs-extra'
import { supa_url } from './utils.mjs'

const exec = promisify(execCb)
const folders = readdirSync('./supabase/functions').filter(file => !file.startsWith('_') && file !== 'demo')

const token = process.env.SUPABASE_TOKEN || ''
const projectRef = supa_url.split('.')[0].replace('https://', '')

try {
  console.log('projectRef', projectRef)
  await outputFile('./supabase/.temp/project-ref', projectRef)
  if (!token) {
    console.error('SUPABASE_TOKEN is not set')
    exit(1)
  }
  await outputFile(`${homedir()}/.supabase/access-token`, token)
  // for in folders
  for (const folder of folders) {
    const file = `./supabase/functions/${folder}/.no_verify_jwt`
    let command = `supabase functions deploy ${folder}`
    let no_verify_jwt = false
    if (existsSync(file)) {
      command += ' --no-verify-jwt'
      no_verify_jwt = true
    }
    console.log(`Upload ${folder}${no_verify_jwt ? ' no_verify_jwt' : ''}`)
    await exec(command).then((r) => {
      if (r.stderr) {
        console.error(folder, r.stderr)
        exit(1)
      }
      return r
    })
    console.log('Done ✅')
  }
}
catch (e) {
  console.error(e) // should contain code (exit code) and signal (that caused the termination).
  exit(1)
}
