/* @flow */

import { warn } from 'core/util/index'

export * from './attrs'
export * from './class'
export * from './element'

/**
 * Query an element selector if it's not an element already.
 */

/**
 * 2020-04-22 16:25
 * 根据上面尤雨溪大神的解释，query方法其实是判断这个传递进来的是否为一个dom元素
 * 如果传递进来的是一个字符串，那么我们去通过document.querySelector(el)去获取到相应的element，如果没有获取到，那么我们会报一个warning以及一个空的div否则传递出去一个element
 * 如果传递进来的是一个element，那么我们直接return
 * 总之，这个方法是将传递进来的el进行一个查询，并且无论是字符串还是element，都会返回这个element
 */
export function query (el: string | Element): Element {
  if (typeof el === 'string') {
    const selected = document.querySelector(el)
    if (!selected) {
      process.env.NODE_ENV !== 'production' && warn(
        'Cannot find element: ' + el
      )
      return document.createElement('div')
    }
    return selected
  } else {
    return el
  }
}
