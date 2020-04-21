import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'
/**
 * 此处是最初的Vue，由此处可以看到Vue是一个构造函数，而(this instanceof Vue)则是判断是否在项目中使用了new Vue
 * 
 */
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

/**
 * initMixin(Vue)对Vue进行初始化挂载由init.js可以看到挂在了_int属性
 * stateMixin(Vue) 对Vue进行挂载了set、del等方法
 * eventsMixin(Vue)
 */

initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
