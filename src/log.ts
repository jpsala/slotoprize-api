/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/restrict-plus-operands */

import { format } from "date-fns"
import { queryExec } from "./db"

/* eslint-disable @typescript-eslint/no-var-requires */
const fs   = require ('fs')
const ansi = require ('ansicolor') // that comes with ololog
const { /* cyan, yellow, red, blue, */ bright } = require('ansicolor')
// const bullet = require('string.bullet')

/*  ------------------------------------------------------------------------ */
let saveToDB = false
export const log = require('ololog').configure({
  // locate: { shift: 1 },
  locate: true,
  time: {
    yes: true,
    format: 'locale',
    locale: 'en-AR',
    options: { timeZone: 'America/Argentina/Buenos_Aires' },
    print: x => bright.white(format(x, 'MM-dd HH:mm') + ' | ')
  },
  tag: (lines, {
    save = false,
  }) => {
    // const levelStr = level && (levelColor[level] || (s => s))(level.toUpperCase())
    saveToDB = save
    return lines
  },
  /*  Injects a function after the "render" step            */
  
  'render+' (text, { consoleMethod = '' }) {
        // const text = data.lines
        if (text) {
          console.log('consoleMethod', consoleMethod)
            const strippedText = ansi.strip (text).trim () + '\n' // remove ANSI codes

        /*  Writes to the file only if .info or .error or .warn has been specified.  */

          if (consoleMethod || saveToDB) {
            try {
              queryExec('insert into log(text) values(?)', [strippedText]).catch(e => {
                console.log('error saving logs to db', e)
              })
            } catch (e) {
              console.log('error saving logs to db', e)
            }


            fs.appendFileSync ('info.log', strippedText)

        /*  Writes .error and .warn calls to a separate file   */

            if ((consoleMethod === 'error') || (consoleMethod === 'warn' )) 
                fs.appendFileSync ('error.log', strippedText)
          }
        }

        return text
    }
})

/*  ------------------------------------------------------------------------ */

// log ("this isn't going to a file!")

// log.info ("goes to info.log")
// log.warn ("goes to info.log and error.log (a warning)")
// log.error ("goes to info.log and error.log (an error)")

// log.red.info ("ANSI codes are stripped when writing to a file")