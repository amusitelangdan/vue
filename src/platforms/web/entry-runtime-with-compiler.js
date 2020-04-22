/* @flow */

import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'

/**
 * 此处其实不是最初的Vue，而是经过了多次在原型上赋属性的操作之后的Vue
 */
import Vue from './runtime/index'
import { query } from './util/index'
import { compileToFunctions } from './compiler/index'
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from './util/compat'

const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})

/**
 * 2020-04-22 16:15
 * Vue是通过$mount的实例方法去挂在vm的，由下面可以看到此时的Vue在原型上已经是有了$mount，那么我们需要找一下最初的定义，此处的Vue是通过runtime/index中引入，所以我们去那里看看
 * 这里在const mount下方又重新附了一个方法，
 * 此时$mount的方法接收一个el，他的可传参数为string和Element，hydrating接收一个boolean
 * Component是flow中类似于ts中interface的东东，可在flow/component.js 中查看它的定义，
*/

/**
 * 2020-04-22 16:24
 * $mount做了什么？
 * 上面说了这个方法接受的形参，这里写一下这个方法做了什么
 * 第一步： 首先调用query方法，query方法是在util/index中的，这里写一下一个简洁版：这个方法是将传递进来的el进行一个查询，并且无论是字符串还是element，都会返回这个element
 * 
 * 第二步：判断这个el是不是body，或者documentElement，（不能直接在body挂载）
 * 
 * 第三步： 获取vm上的$options
 * 
 * 这里需要说明一下，Vue是不管是用了template模版语法还是render函数，在进行解析的时候都会进行转换，转为render函数，这里有一个疑问？为什么还要写template语法呢？
 * 
 * 第四步： 判断options上是否有render，如果没有，判断是否有template(如果连template都没有好意思？)
 * 如果没有render有template，判断template是否为string类型，如果是字符串类型，那么判断一下template第一个字符串是否为#，在都满足的情况下调用idToTemplate(template)
 * 那么idToTemplate()是干什么的？
 * idToTemplate 调用了cached函数，这个函数是在core/util/index路径下的，他的参数是一个箭头函数，这个箭头函数return的是一个element，
 * 那么cached函数是做什么的？让我们进入core/util/index看一看,好了，我这看到他其实是在shared里util里面😂，他的主要作用是创建纯函数的缓存版本
 * 
 * 如果template是一个dom节点template就设置为template.innerHTML
 * 
 * 如果没有template但有el，那么会执行一下getOuterHTML(el)
 * getOuterHTML(el)是干什么滴？
 * 判断el元素是否有outerHTML
 * 
 * 
 */

const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component { 
  el = el && query(el)

  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  const options = this.$options
  // resolve template/el and convert to render function
  if (!options.render) {
    let template = options.template
    if (template) {
      if (typeof template === 'string') {
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) {
        template = template.innerHTML
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      template = getOuterHTML(el)
    }
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }

      const { render, staticRenderFns } = compileToFunctions(template, {
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  return mount.call(this, el, hydrating)
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
/**
 * 2020-04-22 17:11
 * 首先判断el元素是否有outerHTML，正常的元素的outerHTML则是传入el元素自身。说明有些情况下元素会没有outerHTML,从注示上可以看于对于ie浏览器中SVG无素是获取不到outerHTML,此时就需要通过一个hack处理，创建一个container为div的空元素，
 * 深度克隆el元素，通过appendChild方法把克隆后的el元素添加到cantainer容器中，成为子节点。最后返回的container中的innerHTML,这样的操作等同于获取了元素的outerHTML.
 * 在只有el的情况下，又作为template转化的模版，也要作为mountComponent函数的替换元素的情况下，el必须是一个Dom元素。通过el获取到了template模版之后，调用compileToFunctions转化成render函数。最后调用缓存的mount函数进行渲染Dom结构体
 */
function getOuterHTML (el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions

export default Vue
