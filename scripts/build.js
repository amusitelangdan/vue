const fs = require('fs') // 文件系统，用于以模仿标准POSIX函数的方式与文件系统化进行交互
const path = require('path') // path模块提供了一些用于处理文件与目录的路径的实用工具
const zlib = require('zlib') // zlib莫夸死提供通过Gzip、Deflate/Inflate、和Brotli实现的压缩功能
const rollup = require('rollup') // rollup用于打包
const terser = require('terser') // 新一代代码压缩工具，用来代替uglify-js

/**
 * @param 判断是否存在dist文件，如果不存在则新建dist文件
 */
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist')
}

/**
 * @param 打包配置文件
 */
let builds = require('./config').getAllBuilds()

// filter builds via command line arg
/**
 * @param process.argv属性返回一个数组，其中包含当启动Node.js进程时传入的命令行参数。
 * 第一个元素时procss.execPath。如果需要访问argv[0]的原始值，
 * 第二个元素将是正在执行的Javascript文件的路径。
 * 其余元素将是任何其他命令行参数
 * process.argv[2]： 命令行参数
 * 如果没有命令行参数默认情况下过滤掉weex版本
 */
if (process.argv[2]) {
  /**
   * @param 将字符串转换为filters数组
   * @param filterguolv： 通过命令行参数对构建配置进行过滤
   */
  const filters = process.argv[2].split(',')
  builds = builds.filter(b => {
    return filters.some(f => b.output.file.indexOf(f) > -1 || b._name.indexOf(f) > -1)
  })
} else {
  // 默认情况下过滤掉weex版本
  // filter out weex builds by default
  builds = builds.filter(b => {
    return b.output.file.indexOf('weex') === -1
  })
}

// 执行build函数
build(builds)

/**
 * 
 * @param  build设置默认为0 做定时器
 * 拿到total也就是过滤之后的builds的长度
 * 定义一个next方法
 */
function build (builds) {
  let built = 0
  const total = builds.length
  const next = () => {
    buildEntry(builds[built]).then(() => {
      built++
      if (built < total) {
        next()
      }
    }).catch(logError)
  }

  next()
}

/**
 * 
 * @param {buildEntry}
 * 参数默认接受一个builds里面的一个配置项
 * output : 获取配置项中的output并拿到output中的file和banner
 * isProd 判断是否为生产环境
 * rollup打包
 * banner：打包时写入注释，告诉此时vue的版本号
 */
function buildEntry (config) {
  const output = config.output
  const { file, banner } = output
  const isProd = /(min|prod)\.js$/.test(file)
  return rollup.rollup(config)
    .then(bundle => bundle.generate(output))
    .then(({ output: [{ code }] }) => {
      if (isProd) {
        const minified = (banner ? banner + '\n' : '') + terser.minify(code, {
          toplevel: true,
          output: {
            ascii_only: true
          },
          compress: {
            pure_funcs: ['makeMap']
          }
        }).code
        return write(file, minified, true)
      } else {
        return write(file, code)
      }
    })
}

/**
 * write 打包，写入文件显示打包进程
 * @param {dest} 文件名 
 * @param {code} code 
 * @param {zip} 是否开启压缩 
 */
function write (dest, code, zip) {
  return new Promise((resolve, reject) => {
    function report (extra) {
      /**
       * 显示打包进程
       */
      console.log(blue(path.relative(process.cwd(), dest)) + ' ' + getSize(code) + (extra || ''))
      resolve()
    }
    /**
     * 写入文件
     */
    fs.writeFile(dest, code, err => {
      if (err) return reject(err)
      /**
       * 是否压缩为gzipped
       */
      if (zip) {
        zlib.gzip(code, (err, zipped) => {
          if (err) return reject(err)
          report(' (gzipped: ' + getSize(zipped) + ')')
        })
      } else {
        report()
      }
    })
  })
}
/**
 * 
 * @param 文件大小
 */
function getSize (code) {
  return (code.length / 1024).toFixed(2) + 'kb'
}

function logError (e) {
  console.log(e)
}

function blue (str) {
  return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m'
}
