// import * as iconv from 'mysql2/node_modules/iconv-lite'
import 'jest-extended'
module.exports = {
  plugins: [
    {
      name: "typescript",
      options: {
        useBabel: false,
        tsLoader: {
          transpileOnly: true,
          experimentalWatchApi: true
        },
        forkTsChecker: {
          tsconfig: "../tsconfig.json",
          tslint: false,
          watch: "./src",
          typeCheck: true
        }
      }
    }
  ]
}
// iconv.encodingExists('foo')
