
  var eventSplitter = /\s+/


  /**
   * @name Events
   * @class 事件分发类。
   * @constructor
   * @example
   * var object = new Events();
   * object.on('expand', function(){ alert('expanded'); });
   * object.trigger('expand');
   */
  function Events() {
  }

  /**
   * 绑定事件接口。
   * @param {String} events 事件名称。
   * @param {Function} Function 处理函数。
   * @param {Object} context 执行上下文。
   */
  // Bind one or more space separated events, `events`, to a `callback`
  // function. Passing `"all"` will bind the callback to all events fired.
  Events.prototype.on = function(events, callback, context) {
    var cache, event, list
    if (!callback) return this

    cache = this.__events || (this.__events = {})
    events = events.split(eventSplitter)

    while (event = events.shift()) {
      list = cache[event] || (cache[event] = [])
      list.push(callback, context)
    }

    return this
  }


  /**
   * 解除事件绑定。
   * @param  {String}   events   事件名称。
   * @param  {Function} callback 绑定的回调函数。
   * @param  {Object}   context  执行上下文。
   */
  // Remove one or many callbacks. If `context` is null, removes all callbacks
  // with that function. If `callback` is null, removes all callbacks for the
  // event. If `events` is null, removes all bound callbacks for all events.
  Events.prototype.off = function(events, callback, context) {
    var cache, event, list, i

    // No events, or removing *all* events.
    if (!(cache = this.__events)) return this
    if (!(events || callback || context)) {
      delete this.__events
      return this
    }

    events = events ? events.split(eventSplitter) : keys(cache)

    // Loop through the callback list, splicing where appropriate.
    while (event = events.shift()) {
      list = cache[event]
      if (!list) continue

      if (!(callback || context)) {
        delete cache[event]
        continue
      }

      for (i = list.length - 2; i >= 0; i -= 2) {
        if (!(callback && list[i] !== callback ||
            context && list[i + 1] !== context)) {
          list.splice(i, 2)
        }
      }
    }

    return this
  }


  /**
   * 触发事件。
   * @param  {String} events 事件名称。
   */
  // Trigger one or many events, firing all bound callbacks. Callbacks are
  // passed the same arguments as `trigger` is, apart from the event name
  // (unless you're listening on `"all"`, which will cause your callback to
  // receive the true name of the event as the first argument).
  Events.prototype.trigger = function(events) {
    var cache, event, all, list, i, len, rest = [], args, returned = {status: true}
    if (!(cache = this.__events)) return this

    events = events.split(eventSplitter)

    // Fill up `rest` with the callback arguments.  Since we're only copying
    // the tail of `arguments`, a loop is much faster than Array#slice.
    for (i = 1, len = arguments.length; i < len; i++) {
      rest[i - 1] = arguments[i]
    }

    // For each event, walk through the list of callbacks twice, first to
    // trigger the event, then to trigger any `"all"` callbacks.
    while (event = events.shift()) {
      // Copy callback lists to prevent modification.
      if (all = cache.all) all = all.slice()
      if (list = cache[event]) list = list.slice()

      // Execute event callbacks.
      callEach(list, rest, this, returned)

      // Execute "all" callbacks.
      callEach(all, [event].concat(rest), this, returned)
    }

    return returned.status
  }


  /**
   * 混入receiver的 原型。
   * @param  {Object} receiver
   */
  // Mix `Events` to object instance or Class function.
  Events.mixTo = function(receiver) {
    receiver = receiver.prototype || receiver
    var proto = Events.prototype

    for (var p in proto) {
      if (proto.hasOwnProperty(p)) {
        receiver[p] = proto[p]
      }
    }
  }


  // Helpers
  // -------

  var keys = Object.keys

  if (!keys) {
    keys = function(o) {
      var result = []

      for (var name in o) {
        if (o.hasOwnProperty(name)) {
          result.push(name)
        }
      }
      return result
    }
  }

  // Execute callbacks
  function callEach(list, args, context, returned) {
    var r
    if (list) {
      for (var i = 0, len = list.length; i < len; i += 2) {
        r = list[i].apply(list[i + 1] || context, args)

        // trigger will return false if one of the callbacks return false
        r === false && returned.status && (returned.status = false)
      }
    }
  }

  // add alias
  Events.prototype.addEventListener = Events.prototype.bind = Events.prototype.on;
  Events.prototype.removeEventListener = Events.prototype.unbind = Events.prototype.off;
  Events.prototype.dispatchEvent = Events.prototype.fire = Events.prototype.trigger;