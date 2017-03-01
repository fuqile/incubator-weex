import { watchAppear, fireLazyload } from '../utils'

const supportedEvents = [
  'click', 'longpress', 'appear', 'disappear'
  // 'touchstart', 'touchmove', 'touchend'
]

const scrollableTypes = ['scroller', 'list']

let lazyloadWatched = false
function watchLazyload () {
  lazyloadWatched = true
  ; [
    'scroll',
    'transitionend',
    'webkitTransitionEnd',
    'animationend',
    'webkitAnimationEnd',
    'resize'
  ].forEach(evt => {
    window.addEventListener(evt, function () {
      fireLazyload()
    })
  })
}

function _getParentScroller (vnode) {
  if (!vnode) return null
  if (scrollableTypes.indexOf(vnode.weexType) > -1) {
    return vnode
  }
  return _getParentScroller(vnode.$parent)
}

export default {
  beforeCreate () {
    if (!lazyloadWatched) {
      watchLazyload()
    }
  },
  created () {
    this._prerender()
  },
  mounted () {
    watchAppear(this)
  },

  beforeUpdate () {
    this._prerender()
  },

  methods: {
    _getTopContext () {
      let ctx = this
      let vnode = ctx.$options._parentVnode
      while (vnode) {
        ctx = vnode.context
        vnode = ctx.$options._parentVnode
      }
      return ctx
    },

    _getScopeId () {
      // return closest scopeId.
      let scopeId = this.$options._scopeId
      let ctx = this
      while (!scopeId) {
        ctx = ctx.$options.parent
        if (!ctx) return null
        scopeId = ctx.$options._scopeId
      }
      return scopeId
    },

    _getParentScroller () {
      return _getParentScroller(this.$vnode)
    },

    _createEventMap (extras = []) {
      const eventMap = {}
      supportedEvents.concat(extras).forEach(name => {
        eventMap[name] = event => this.$emit(name, event)
      })
      return eventMap
    },

    _fireLazyload () {
      const scroller = this._getParentScroller()
      fireLazyload(scroller && scroller.$el || document.body)
    },

    _prerender () {
      this._mergeStyles()
      // process prerender hooks for components' own treatment.
      this.beforeRender && this.beforeRender()
    }
  }
}
