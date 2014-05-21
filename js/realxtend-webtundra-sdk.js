/** Copyright realXtend project - http://realxtend.org/

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

var define = define || function define(moduleName, deps, module) {
    if (module !== undefined)
        console.warn("You are trying to define a module " + moduleName + " not supported in the Meshmoon WebRocket SDK build");
};

;
;


;(function(undefined) {
  var
    CLASSY_VERSION = '1.4',
    root = this,
    old_class = root.Class,
    disable_constructor = false;

  /* we check if $super is in use by a class if we can.  But first we have to
     check if the JavaScript interpreter supports that.  This also matches
     to false positives later, but that does not do any harm besides slightly
     slowing calls down. */
  var probe_super = (function(){$super();}).toString().indexOf('$super') > 0;
  function usesSuper(obj) {
    return !probe_super || /\B\$super\b/.test(obj.toString());
  }

  /* helper function to set the attribute of something to a value or
     removes it if the value is undefined. */
  function setOrUnset(obj, key, value) {
    if (value === undefined)
      delete obj[key];
    else
      obj[key] = value;
  }

  /* gets the own property of an object */
  function getOwnProperty(obj, name) {
    return Object.prototype.hasOwnProperty.call(obj, name)
      ? obj[name] : undefined;
  }

  /* instanciate a class without calling the constructor */
  function cheapNew(cls) {
    disable_constructor = true;
    var rv = new cls;
    disable_constructor = false;
    return rv;
  }

  /* the base class we export */
  var Class = function() {};

  /* restore the global Class name and pass it to a function.  This allows
     different versions of the classy library to be used side by side and
     in combination with other libraries. */
  Class.$noConflict = function() {
    try {
      setOrUnset(root, 'Class', old_class);
    }
    catch (e) {
      // fix for IE that does not support delete on window
      root.Class = old_class;
    }
    return Class;
  };

  /* what version of classy are we using? */
  Class.$classyVersion = CLASSY_VERSION;

  /* extend functionality */
  Class.$extend = function(properties) {
    var super_prototype = this.prototype;

    /* disable constructors and instanciate prototype.  Because the
       prototype can't raise an exception when created, we are safe
       without a try/finally here. */
    var prototype = cheapNew(this);

    /* copy all properties of the includes over if there are any */
    if (properties.__include__)
      for (var i = 0, n = properties.__include__.length; i != n; ++i) {
        var mixin = properties.__include__[i];
        for (var name in mixin) {
          var value = getOwnProperty(mixin, name);
          if (value !== undefined)
            prototype[name] = mixin[name];
        }
      }

    /* copy class vars from the superclass */
    properties.__classvars__ = properties.__classvars__ || {};
    if (prototype.__classvars__)
      for (var key in prototype.__classvars__)
        if (!properties.__classvars__[key]) {
          var value = getOwnProperty(prototype.__classvars__, key);
          properties.__classvars__[key] = value;
        }

    /* copy all properties over to the new prototype */
    for (var name in properties) {
      var value = getOwnProperty(properties, name);
      if (name === '__include__' ||
          value === undefined)
        continue;

      prototype[name] = typeof value === 'function' && usesSuper(value) ?
        (function(meth, name) {
          return function() {
            var old_super = getOwnProperty(this, '$super');
            this.$super = super_prototype[name];
            try {
              return meth.apply(this, arguments);
            }
            finally {
              setOrUnset(this, '$super', old_super);
            }
          };
        })(value, name) : value
    }

    /* dummy constructor */
    var rv = function() {
      if (disable_constructor)
        return;
      var proper_this = root === this ? cheapNew(arguments.callee) : this;
      if (proper_this.__init__)
        proper_this.__init__.apply(proper_this, arguments);
      proper_this.$class = rv;
      return proper_this;
    }

    /* copy all class vars over of any */
    for (var key in properties.__classvars__) {
      var value = getOwnProperty(properties.__classvars__, key);
      if (value !== undefined)
        rv[key] = value;
    }

    /* copy prototype and constructor over, reattach $extend and
       return the class */
    rv.prototype = prototype;
    rv.constructor = rv;
    rv.$extend = Class.$extend;
    rv.$withData = Class.$withData;
    return rv;
  };

  /* instanciate with data functionality */
  Class.$withData = function(data) {
    var rv = cheapNew(this);
    for (var key in data) {
      var value = getOwnProperty(data, key);
      if (value !== undefined)
        rv[key] = value;
    }
    return rv;
  };

  /* export the class */
  root.Class = Class;
})();




/**
    Tundra SDK.
    @module TundraSDK
    @static
*/
var TundraSDK =
{
    /**
        Framework contains the instantiated client and its APIs.

        <b>Note:</b> All the properties are null before a client instance is constructed.
        @class TundraSDK.framework
        @static
    */
    framework :
    {
        /**
            @property client
            @type TundraClient
            @static
        */
        client      : null,
        /**
            @property network
            @type Network
            @static
        */
        network     : null,
        /**
            @property scene
            @type Scene
            @static
        */
        scene       : null,
        /**
            @property renderer
            @type IRenderSystem
            @static
        */
        renderer    : null,
        /**
            @property frame
            @type FrameAPI
            @static
        */
        frame       : null,
        /**
            @property events
            @type EventAPI
            @static
        */
        events      : null,
        /**
            @property asset
            @type AssetAPI
            @static
        */
        asset       : null,
        /**
            @property input
            @type InputAPI
            @static
        */
        input       : null,
        /**
            @property ui
            @type UiAPI
            @static
        */
        ui          : null,
        /**
            @property console
            @type ConsoleAPI
            @static
        */
        console     : null
    },

    /**
        @property plugins
        @type Array<ITundraPlugin>
        @static
    */
    plugins : [],

    /**
        Registers a plugin to the Tundra SDK. These plugins will get loaded to the client once instantiated.
        <b>Note:</b> Does not check if this plugin has already been registered!
        @method registerPlugin
        @param {ITundraPlugin} plugin The instantiated plugin.
    */
    registerPlugin : function(plugin)
    {
        if (plugin === undefined || plugin === null)
            return;
        plugin._setFramework(this.framework);
        this.plugins.push(plugin);
    },

    /**
        Returns a registered plugin by name.
        @method plugin
        @param {String} name Name of the plugin.
        @return {ITundraPlugin|null} The plugin or null if not found. 
    */
    plugin : function(name)
    {
        for (var i = 0; i < this.plugins.length; i++)
            if (this.plugins[i].name === name)
                return this.plugins[i];
        return null;
    },

    /**
        Tundra application contains utilities and properties for setup of dynamic script applications.
        @class TundraSDK.browser
        @static
    */
    browser :
    {
        /**
            If the underlying browser is Google Chrome.
            @property isChrome
            @type Boolean
            @static
        */
        isChrome    : navigator !== undefined ? navigator.userAgent.indexOf("Chrome") > -1 : false,
        /**
            If the underlying browser is Microsoft Internet Explorer.
            @property isExplorer
            @type Boolean
            @static
        */
        isExplorer  : navigator !== undefined ? navigator.userAgent.indexOf("MSIE") > -1 : false,
        /**
            If the underlying browser is Mozilla Firefox.
            @property isFirefox
            @type Boolean
            @static
        */
        isFirefox   : navigator !== undefined ? navigator.userAgent.indexOf("Firefox") > -1 : false,
        /**
            If the underlying browser is Apple Safari.
            @property isSafari
            @type Boolean
            @static
        */
        isSafari    : navigator !== undefined ? navigator.userAgent.indexOf("Safari") > -1 : false,
        /**
            If the underlying browser is Opera.
            @property isOpera
            @type Boolean
            @static
        */
        isOpera     : navigator !== undefined ? (navigator.userAgent.indexOf("Presto") > -1 || 
                                                 navigator.userAgent.indexOf("Opera")  > -1 ||
                                                 navigator.userAgent.indexOf("OPR/")   > -1) : false,
    },

    /**
        Stop debugger when check function fails.

        @property debugOnCheckFail
        @type Boolean
        @default false
        @static
    */
    debugOnCheckFail : false,
    /**
        Stop debugger when check function fails.

        @property debugOnCheckFail
        @type Boolean
        @default false
        @static
    */
    throwOnCheckFail : false,

    checkDefined : function()
    {
        if (!TundraSDK.debugOnCheckFail && !TundraSDK.throwOnCheckFail)
            return;
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] === undefined) {
                if (TundraSDK.debugOnCheckFail)
                    debugger;
                else if (TundraSDK.throwOnCheckFail)
                    throw ("undefined value, arg #" + i);
            }
        }
    },

    check : function()
    {
        if (!TundraSDK.debugOnCheckFail && !TundraSDK.throwOnCheckFail)
            return;

        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] !== true) {
                if (TundraSDK.debugOnCheckFail)
                    debugger;
                else if (TundraSDK.throwOnCheckFail)
                    throw ("untrue value" + arguments[i] + ", arg #" + i);
            }
        }
    }
};

// Global scope exposure of TundraSDK
window.TundraSDK = TundraSDK;


;


var _hackLogLevelPending = null;

/**
    Tundra log utility.

    @class TundraLogger
    @constructor
    @param {String} name Log channel name.
*/
var TundraLogger = Class.$extend(
{
    __init__ : function(name)
    {
        this.name = name;
        this.prefix = "[" + name + "]:";
    },

    _createArguments : function(args, includeLineInfo)
    {
        var out = [].slice.call(args);
        out.splice(0, 0, this.prefix);
        if (includeLineInfo === true)
            out.splice(0, 0, this._callerLine());
        return out;
    },

    _createArgumentsString : function(argsArray)
    {
        var parts = [];
        for (var i = 0; i < argsArray.length; i++)
        {
            var obj = argsArray[i];
            if (Array.isArray(obj))
                parts.push("[" + obj.join(", ") + "]");
            else if (typeof obj === "object")
                parts.push(JSON.stringify(obj));
            else
                parts.push(obj.toString());
        }
        return parts.join(" ");
    },

    _callerLineLink : function(numInStack)
    {
        if (numInStack === undefined)
            numInStack = 4;
        var line = (new Error).stack.split("\n")[numInStack];
        line = line.substring(line.indexOf("at ")+3);
        return line.substring(line.lastIndexOf("(")+1, line.length-1);
    },

    /**
        This function takes in any number of objects like console.log().
        @method info
    */
    info : function()
    {
        log.info.apply(null, this._createArguments(arguments));
    },

    /**
        This function takes in any number of objects like console.log().
        Logs additionally to the UI console if created.
        @method infoC
    */
    infoC : function()
    {
        var args = this._createArguments(arguments);
        log.info.apply(null, args);
        if (TundraSDK.framework.console != null)
            TundraSDK.framework.console.logInfo(this._createArgumentsString(args));
    },

    /**
        This function takes in any number of objects like console.log().
        @method warn
    */
    warn : function()
    {
        log.warn.apply(null, this._createArguments(arguments));
    },

    /**
        This function takes in any number of objects like console.log().
        Logs additionally to the UI console if created.
        @method warnC
    */
    warnC : function()
    {
        var args = this._createArguments(arguments);
        log.warn.apply(null, args);
        if (TundraSDK.framework.console != null)
            TundraSDK.framework.console.logWarning(this._createArgumentsString(args));
    },

    /**
        This function takes in any number of objects like console.log().
        @method error
    */
    error : function()
    {
        log.error.apply(null, this._createArguments(arguments));
    },

    /**
        This function takes in any number of objects like console.log().
        Logs additionally to the UI console if created.
        @method errorC
    */
    errorC : function()
    {
        var args = this._createArguments(arguments);
        log.error.apply(null, args);
        if (TundraSDK.framework.console != null)
            TundraSDK.framework.console.logError(this._createArgumentsString(args));
    },

    /**
        This function takes in any number of objects like console.log().
        @method debug
    */
    debug : function()
    {
        log.debug.apply(null, this._createArguments(arguments));
    },

    /**
        This function takes in any number of objects like console.log().
        @method trace
    */
    trace : function()
    {
        log.trace.apply(null, this._createArguments(arguments));
    }
});

/**
    Logging utilities.
    @class TundraLogging
    @constructor
*/
var TundraLogging =
{
    /**
        Logging level.
        @property Level
        @static
        @example
            {
                "TRACE"  : 0,
                "DEBUG"  : 1,
                "INFO"   : 2,
                "WARN"   : 3,
                "ERROR"  : 4,
                "SILENT" : 5
            }
    */
    Level :
    {
        "TRACE"  : 0,
        "DEBUG"  : 1,
        "INFO"   : 2,
        "WARN"   : 3,
        "ERROR"  : 4,
        "SILENT" : 5
    },

    loggers : [],

    /**
        Creates/fetches a logger by name, eg. TundraLogging.getLogger("MyRenderer");
        @static
        @method getLogger
        @param {String} name Log channel name.
        @return {TundraLogger}
    */
    getLogger : function(name)
    {
        for (var i = 0; i < this.loggers.length; i++)
        {
            if (this.loggers[i].name === name)
                return this.loggers[i];
        }

        var logger = new TundraLogger(name);
        this.loggers.push(logger);
        return logger;
    },

    /**
        Enable all log levels.
        @static
        @method enableAll
    */
    enableAll : function()
    {
        log.enableAll();
    },

    /**
        Disable all log levels.
        @static
        @method disableAll
    */
    disableAll : function()
    {
        log.disableAll();
    },

    /**
        Set log level.
        @static
        @method setLevel
        @param {TundraLogging.Level} level
    */
    setLevel : function(level)
    {
        log.setLevel(level);
        log.debug("[Logging]: Setting log level to", this.levelString(level));
    },

    levelString : function(level)
    {
        if (typeof level === "string")
            return level;
        else if (typeof level === "number")
        {
            for (var l in TundraLogging.Level)
                if (level === TundraLogging.Level[l])
                    return l;
        }

        return "Invalid loglevel " + level.toString();
    }
};




/**
    String utilities.
    @class CoreStringUtils
    @constructor
*/
var CoreStringUtils =
{
    /**
        Returns if str1 starts with str2.
        @method startsWith
        @param {String} str1 String to examine.
        @param {String} str2 String to match to the start of str1.
        @param {Boolean} ignoreCase Case sensitivity.
        @return {Boolean}
    */
    startsWith : function(str1, str2, ignoreCase)
    {
        if (ignoreCase === true)
            return (str1.toLowerCase().indexOf(str2.toLowerCase()) === 0);
        else
            return (str1.indexOf(str2) === 0);
    },

    /**
        Returns if str1 ends with str2.
        @method endsWith
        @param {String} str1 String to examine.
        @param {String} str2 String to match to the end of str1.
        @param {Boolean} ignoreCase Case sensitivity.
        @return {Boolean}
    */
    endsWith : function(str1, str2, ignoreCase)
    {
        var index = str1.length - str2.length;
        if (ignoreCase === true)
            return (index > -1 && str1.toLowerCase().substring(index) === str2.toLowerCase());
            //return (index >= 0 && str1.toLowerCase().indexOf(str2.toLowerCase(), index) > -1);
        else
            return (index > -1 && str1.substring(index) === str2);
            //return (index >= 0 && str1.indexOf(str2, index) > -1);
    },

    /**
        Trims all white space from input string.
        @method trim
        @param {String} str String to trim.
        @return {String} Resulting string.
    */
    trim : function(str)
    {
        return (str.trim ? str.trim() : str.replace(/^\s+/, '').replace(/\s+$/, ''));
    },
   
    /**
        Trims all white space from the left end of input string.
        @method trimLeft
        @param {String} str String to trim.
        @return {String} Resulting string.
    */
    trimLeft : function(str)
    {
        return (str.trimLeft ? str.trimLeft() : str.replace(/^\s+/, ''));
    },

    /**
        Trims all instances of trimStr from the left side of the string.
        @method trimStringLeft
        @param {String} str String to trim.
        @param {String} trimStr String to trim.
        @return {String} Resulting string.
    */
    trimStringLeft : function(str, trimStr)
    {
        var trimLen = trimStr.length;
        while (str.length > 0 && str.substring(0, trimLen) === trimStr)
            str = str.substring(trimLen);
        return str;
    },

    /**
        Trims all white space from the right end of input string.
        @method trimRight
        @param {String} str String to trim.
        @return {String} Resulting string.
    */
    trimRight : function(str)
    {
        return (str.trimRight ? str.trimRight() : str.replace(/\s+$/, ''));
    },

    /**
        Trims all instances of trimStr from the left side of the string.
        @method trimStringRight
        @param {String} str String to trim.
        @param {String} trimStr String to trim.
        @return {String} Resulting string.
    */
    trimStringRight : function(str, trimStr)
    {
        var trimLen = trimStr.length;
        while (str.length > 0 && str.substring(str.length-trimLen) === trimStr)
            str = str.substring(0, str.length-trimLen);
        return str;
    },

    /**
        Reads a line until a line ending (\n, \r\n), optionally tab (\t) or a custom string separator.
        @method readLine
        @param {String} str Source string for the operation.
        @param {String} [separator=undefined] Custom string separator where to break the string.
        @param {Boolean} [tabBreaks=false] If tab '\t' should break the string.
        @param {Boolean} [trimResult=false] Trim the start and end of the result string.
        @return {String} The resulting string. If nothing can be found to break with, the original string is returned.
    */
    readLine : function(str, separator, tabBreaks, trimResult)
    {
        if (tabBreaks === undefined)
            tabBreaks = false;
        if (trimResult === undefined)
            trimResult = false;

        var indexSplit = null;
        var indexEnd1 = str.indexOf("\n");
        var indexEnd2 = str.indexOf("\r\n");
        var indexEnd3 = (tabBreaks === true ? str.indexOf("\t") : -1);
        var indexCustom = (separator != null ? str.indexOf(separator) : -1);
        if (indexSplit == null || (indexEnd1 !== -1 && indexEnd1 < indexSplit))
            indexSplit = indexEnd1;
        if (indexSplit == null || (indexEnd2 !== -1 && indexEnd2 < indexSplit))
            indexSplit = indexEnd2;
        if (indexSplit == null || (indexEnd3 !== -1 && indexEnd3 < indexSplit))
            indexSplit = indexEnd3;
        if (indexSplit == null || (indexCustom !== -1 && indexCustom < indexSplit))
            indexSplit = indexCustom;
        var ret = (indexSplit !== -1 ? str.substring(0, indexSplit) : "");
        if (trimResult === true)
            ret = this.trim(ret);
        return ret;
    },

    /**
        Returns the lower-cased file extension including the starting dot, eg. ".png".

        @param {String} str Input string.
        @return {String}
    */
    extension : function(str)
    {
        return str.substring(str.lastIndexOf(".")).toLowerCase();
    },

    /**
        This function removes comments from text input. Useful for all
        sorts of text based core/script pre-processing to remove comments.

            - Lines that contain '//' will be replaced with empty string.
              - Must have only whitespace before the '//' characters.
            - Block comments /<asterix> comment <asterix>/ will be replaced with empty string.

        @method removeComments
        @param {String} str Input string.
        @return {String} Result string.
    */
    removeComments : function(str)
    {
        if (str == null || str.length === 0)
            return str;

        // Block comments /* comment */
        /// @todo Could not find a working js regexp for this. Might be faster.
        var commentBlockIndex = str.indexOf("/*");
        if (commentBlockIndex !== -1)
        {
            var commentBlockEndIndex = str.indexOf("*/", commentBlockIndex+2);
            while (commentBlockIndex !== -1 && commentBlockEndIndex !== -1)
            {
                var preBlock = str.substring(0, commentBlockIndex);
                var postBlock = str.substring(commentBlockEndIndex+2);

                str = preBlock + postBlock;
                commentBlockIndex = str.indexOf("/*");
                if (commentBlockIndex !== -1)
                    commentBlockEndIndex = str.indexOf("*/", commentBlockIndex+2);
            }
        }

        // Forward slash comments.
        // - There have only whitespace before the // characters.
        // - The whole matched line will be replaced with empty string.
        var forwardSlashCommentRegExp = /^\s*\/\/.*/gm;
        if (forwardSlashCommentRegExp.test(str))
            str = str.replace(forwardSlashCommentRegExp, "");

        return str;
    }
};




/**
    Render system interface. Can be selected via client startup parameters.

    Implementations can optionally be to register with {{#crossLink "TundraClient/registerRenderSystem:method"}}TundraClient.registerRenderSystem{{/crossLink}}.
    This way the renderer can be loaded by name. Usually selecting the renderer is done by passing the renderer to client startup parameters.

    @class IRenderSystem
    @constructor
    @param {String} name Render system name.
*/
var IRenderSystem = Class.$extend(
{
    __init__ : function(name)
    {
        this.name = name;
    },

    __classvars__ :
    {
        register : function(clientPrototype)
        {
            var renderer = new this();
            if (clientPrototype.registerRenderSystem(renderer))
                return renderer;
            return null;
        }
    },

    _load : function(params)
    {
        TundraLogging.getLogger("IRenderSystem").info("Loading " + this.name + " render system");
        this.load(params);
    },

    /**
        Loads the render system.

        @method load
        @param {Object} params Client startup parameters.
    */
    load : function(params)
    {
    },

    _unload : function()
    {
        TundraLogging.getLogger("IRenderSystem").info("Unloading " + this.name + " render system");
        this.unload();
    },

    /**
        Unloads the render system.

        @method unload
    */
    unload : function()
    {
    },

    /**
        Called after all modules are loaded and all APIs have been post initialized.

        @method postInitialize
    */
    postInitialize : function()
    {
    },

    /**
        Set active camera component.

        @method setActiveCamera
        @param {EC_Camera} cameraComponent
    */
    setActiveCamera : function(cameraComponent)
    {
        TundraLogging.getLogger("IRenderSystem").warn("setActiveCamera() not implemented.");
    },

    /**
        Get the active camera component.

        @method activeCamera
        @return {EC_Camera}
    */
    activeCamera : function()
    {
        TundraLogging.getLogger("IRenderSystem").warn("activeCamera() not implemented.");
        return null;
    },

    /**
        Get the active camera entity.

        @method activeCameraEntity
        @return {Entity}
    */
    activeCameraEntity : function()
    {
        TundraLogging.getLogger("IRenderSystem").warn("activeCameraEntity() not implemented.");
        return null;
    },

    /**
        Create a new scene node for this renderer.

        @method createSceneNode
        @return {Object}
    */
    createSceneNode : function()
    {
        TundraLogging.getLogger("IRenderSystem").warn("createSceneNode() not implemented.");
        return null;
    },

    /**
        Update scene node with a Transform.

        @method createSceneNode
        @param {Object} sceneNode Node to update.
        @param {Transform} transform Transform to set to node.
    */
    updateSceneNode : function(sceneNode, transform)
    {
        TundraLogging.getLogger("IRenderSystem").warn("updateSceneNode() not implemented.");
    },

    /**
        Executes a raycast from origin to direction. Returns all hit objects.

        @method raycastAllFrom
        @param {Object} origin Rendering system implementation specific object. Usually a float3 vector.
        @param {Object} direction Rendering system implementation specific object. Usually a normalized float3 directional vector.
        @param {Number} [selectionLayer=1] Entity selection layer.
        @return {Array<RaycastResult>}
    */
    raycastAllFrom : function(origin, direction, selectionLayer)
    {
        TundraLogging.getLogger("IRenderSystem").warn("raycastAllFrom() not implemented.");
        return null;
    },

    /**
        Executes a raycast from origin to direction. Returns first hit object.

        @method raycastFrom
        @param {Object} origin Rendering system implementation specific object. Usually a float3 vector.
        @param {Object} direction Rendering system implementation specific object. Usually a normalized float3 directional vector.
        @param {Number} [selectionLayer=1] Entity selection layer.
        @return {RaycastResult}
    */
    raycastFrom : function(origin, direction, selectionLayer)
    {
        TundraLogging.getLogger("IRenderSystem").warn("raycastFrom() not implemented.");
        return null;
    },

    /**
        Executes a raycast to the renderers scene using the currently active camera 
        and screen coordinates. Returns all hit objects.

        @method raycastAll
        @param {Number} [x=current-mouse-x] Screen x coordinate.
        @param {Number} [y=current-mouse-y] Screen y coordinate.
        @param {Number} [selectionLayer=1] Entity selection layer.
        @return {Array<RaycastResult>}
    */
    raycastAll : function(x, y, selectionLayer)
    {
        TundraLogging.getLogger("IRenderSystem").warn("raycastAll() not implemented.");
        return null;
    },

    /**
        Executes a raycast to the renderers scene using the currently active camera 
        and screen coordinates. Returns the first hit object.

        @method raycast
        @param {Number} [x=current-mouse-x] Screen x coordinate.
        @param {Number} [y=current-mouse-y] Screen y coordinate.
        @param {Number} [selectionLayer=1] Entity selection layer.
        @return {RaycastResult}
    */
    raycast : function(x, y, selectionLayer)
    {
        TundraLogging.getLogger("IRenderSystem").warn("raycast() not implemented.");
        return null;
    }
});




/**
    DOM integration interface.

    Implementation can be set active with {{#crossLink "TundraClient/setDomIntegration:method"}}TundraClient.setDomIntegration{{/crossLink}}.

    @class IDomIntegration
    @constructor
    @param {String} name Render system name.
*/
var IDomIntegration = Class.$extend(
{
    __init__ : function(name)
    {
        this.name = name;
    },

    __classvars__ :
    {
        register : function(clientPrototype)
        {
            var integration = new this();
            if (clientPrototype.registerDomIntegration(integration))
                return integration;
            return null;
        }
    },

    _load : function()
    {
        TundraSDK.framework.client.log.info("Loading " + this.name + " DOM integration system");
        this.load();
    },

    /**
        Loads the DOM integration system.
        @method load
    */
    load : function()
    {
    },

    _unload : function()
    {
        TundraSDK.framework.client.log.info("Unloading " + this.name + " DOM integration system");
        this.unload();
    },

    /**
        Unloads the DOM integration system.
        @method unload
    */
    unload : function()
    {
    }
});


;
define("lib/three", function(){});



var EasingCurve = Class.$extend(
{
    __init__ : function(p1, p2)
    {
        this.p0 = new THREE.Vector2(0, 0);
        this.p1 = p1 || new THREE.Vector2(0.0, 0.5);
        this.p2 = p2 || new THREE.Vector2(1.0, 0.5);
        this.p3 = new THREE.Vector2(1, 1);
    },

    /** 
        Get easing curve adjusted time.
        @param {Number} time Time in the range of [0,1].
        @return Easing curve time in the range of [0,1].
    */
    getTime : function(time)
    {
        time = Math.min(Math.max(time, 0.0), 1.0);

        var leftHalf = this.p0.clone().lerp(this.p1, time);
        var centerHalf = this.p1.clone().lerp(this.p2, time);
        var rightHalf = this.p2.clone().lerp(this.p3, time);

        leftHalf.lerp(centerHalf, time)
        centerHalf.lerp(rightHalf, time);
        return leftHalf.lerp(centerHalf, time).x;
    }
});




/**
    Inteface for creating Tundra JavaScript applications.

    @class IApplication
    @constructor
    @param {String} name Name of the application.

    @example
        // This application would be in a separate file that gets loaded at runtime via EC_Script.
        // The EC_Script component should be setup as run only on client and the scriptRef should point to a .webtundrajs
        // file, which will have the effect of the native Tundra desktop clients not loading it.

        // Example application on how to extend the IApplication interface.
        var MyApplication = IApplication.$extend(
        {
            __init__ : function()
            {
                // Call the base implementation constructor to setup your app correctly.
                this.$super("My Cool Application");

                // Access IApplication properties.
                console.log("This is my app name      :", this.name);
                console.log("This is my script ref    :", this.assetRef)
                console.log("This is my parent entity :", this.entity.toString());

                // Start implementing your application.
                TundraSDK.framework.scene.onEntityCreated(this, this.onEntityCreated);
            },

            // Override onScriptDestroyed from IApplication to handle shutdown.
            // This is a good place to remove your UI elements from the DOM etc.
            onScriptDestroyed : function()
            {
                console.log(this.name, "application is being closed!");
            },

            onEntityCreated : function(entity)
            {
                console.log("Hey a entity was created:", entity.toString());
            }
        })(); // Immediately start the app when this application script file is executed.
*/
var IApplication = Class.$extend(
{
    __init__ : function(name)
    {
        if (name == null)
        {
            TundraSDK.framework.client.log.warn("[IApplication]: Constructor called without a valid application name!", true);
            name = "Unknown Application";
        }
        TundraSDK.framework.client.log.info("Starting " + name + " application");

        /**
            Logger for this application.
            @property log
            @type TundraLogger
        */
        this.log = TundraLogging.getLogger(name);
        /**
            Framework.
            @property framework
            @type TundraSDK.framework
        */
        this.framework = TundraSDK.framework;
        /**
            Name of the application
            @property name
            @type String
        */
        this.name = name;
        /**
            Script reference of this application.
            @property assetRef
            @type String
        */
        this.assetRef = IApplication.assetRef;
        /**
            Parent entity of the application. This is the entity the {{#crossLink "EC_Script"}}{{/crossLink}} running this application is attached to.
            @property entity
            @type Entity
        */
        this.entity = IApplication.entity;
        /**
            Parent component of the application. This is the {{#crossLink "EC_Script"}}{{/crossLink}} component running this script.
            @property component
            @type EC_Script
        */
        this.component = IApplication.component;

        this.eventSubscriptions = [];

        /**
            If this is a startup application or one that was sent from a server.
            @property startupApplication
            @type Boolean
        */
        this.startupApplication = IApplication.startupApplication;

        // Register instance to the script asset.
        try
        {
            if (IApplication.parentScriptAsset !== undefined && IApplication.parentScriptAsset !== null)
                IApplication.parentScriptAsset._setApplication(this);
        }
        catch(e)
        {
            console.error("[IApplication]: Failed to register " + this.name + ": " + e);
            if (e.stack !== undefined)
                console.error(e);
        }
    },

    __classvars__ :
    {
        entity              : null,
        component           : null,
        assetRef            : null,
        startupApplication  : null,
        parentScriptAsset   : null,

        _setupStatic : function(entity, component, assetRef, startupApplication, parentScriptAsset)
        {
            IApplication.assetRef = assetRef;
            IApplication.entity = entity;
            IApplication.component = component;
            IApplication.startupApplication = startupApplication;
            IApplication.parentScriptAsset = parentScriptAsset;
        },

        _resetStatic : function()
        {
            IApplication.entity = null;
            IApplication.component = null;
            IApplication.assetRef = null;
            IApplication.startupApplication = null;
            IApplication.parentScriptAsset = null;
        }
    },

    _onScriptDestroyed : function()
    {
        this.onScriptDestroyed();

        this.name = null;
        this.assetRef = null;
        this.entity = null;
        this.component = null;
        this.startupApplication = null;
        this.framework = null;

        this.unsubscribeEvents();
    },

    /**
        Called when the script is being unloaded.
        IApplication implementations should override this if it wants to handle this event.

        @method onScriptDestroyed
    */
    onScriptDestroyed : function()
    {
    },

    /**
        Call this function with any event subscriptions you call.
        Once added to the IApplication state it will automatically
        unsubscribe the events when the application is shut down.

        @method subscribeEvent
        @param {EventSubscription} Event subscription returned by EventAPI registration functions.
    */
    subscribeEvent : function(eventSubscription)
    {
        this.eventSubscriptions.push(eventSubscription);
    },

    /**
        Unsubscribes all currently known application event subscriptions.
        @method unsubscribeEvents
    */
    unsubscribeEvents : function()
    {
        for (var i = 0; i < this.eventSubscriptions.length; i++)
            TundraSDK.framework.events.unsubscribe(this.eventSubscriptions[i]);
        this.eventSubscriptions = [];
    }
});

// Global scope exposure of applications that do not use requirejs
window.IApplication = IApplication;




/**
    Inteface for creating JavaScript camera logic applications.

    @class ICameraApplication
    @extends IApplication
    @constructor
    @param {String} name Name of the application.
    @param {Boolean} initIApplication If intiailizing the camera logic should be done.
    If set to true, calls the IApplication constructor, which in all apps you might not
    want to do at this stage.
*/
var ICameraApplication = IApplication.$extend(
{
    __init__ : function(name, initIApplication)
    {
        if (initIApplication === undefined)
            initIApplication = true;
        if (initIApplication === true)
            this.$super(name);

        this.cameraEntity = null;
        this.cameraApplicationState = {
            applicationName         : "",
            animateActivation       : false,
            animationT              : 0.0,
            animationDuration       : 2.0,
            animationStartTransform : null,
            animationEndTransform   : null,
            previousCameraEntity    : null,
            onUpdateSub             : null,
            animationStart : null,
            animationStop  : null,
            easing : new EasingCurve()
        };
    },

    __classvars__ :
    {
        cameraApplicationTooltip : null,

        showCameraApplicationInfoTooltipEnabled : true,

        showCameraApplicationInfoTooltip : function(text, timeoutMsec)
        {
            var loginScreenPlugin = TundraSDK.plugin("LoginScreenPlugin");
            if (loginScreenPlugin != null && loginScreenPlugin.isLoadingScreenVisible())
                return;
            if (!ICameraApplication.showCameraApplicationInfoTooltipEnabled)
                return;

            if (timeoutMsec === undefined)
                timeoutMsec = 2000;

            if (ICameraApplication.cameraApplicationTooltip == null)
            {
                ICameraApplication.cameraApplicationTooltip = $("<div/>", { id : "webtundra-camera-application-tooltip" });
                ICameraApplication.cameraApplicationTooltip.css(ICameraApplication.cameraTooltipCSS);
                ICameraApplication.cameraApplicationTooltip.position({
                    my: "center top",
                    at: "center-100 top+10",
                    of: TundraSDK.framework.client.container
                });
                ICameraApplication.cameraApplicationTooltip.hide();

                TundraSDK.framework.ui.addWidgetToScene(ICameraApplication.cameraApplicationTooltip);
                ICameraApplication.cameraApplicationTooltip.fadeIn();
            }
            // Applications have a way to override this 
            var tooltipText = text + " Camera";
            if (ICameraApplication.overrideCameraApplicationInfoTooltipText)
                tooltipText = ICameraApplication.overrideCameraApplicationInfoTooltipText(tooltipText);
            ICameraApplication.cameraApplicationTooltip.text(tooltipText);

            // Cancel existing timeout
            if (ICameraApplication.cameraApplicationTooltip.tooltipTimeoutId !== undefined)
                clearTimeout(ICameraApplication.cameraApplicationTooltip.tooltipTimeoutId);

            // Start new timeout
            ICameraApplication.cameraApplicationTooltip.tooltipTimeoutId = setTimeout(function() {
                if (ICameraApplication.cameraApplicationTooltip != null)
                {
                    ICameraApplication.cameraApplicationTooltip.fadeOut(function() {
                        $(this).remove();
                    });
                    ICameraApplication.cameraApplicationTooltip.tooltipTimeoutId = undefined;
                    ICameraApplication.cameraApplicationTooltip = null;
                }
            }, timeoutMsec);
        },

        overrideCameraApplicationInfoTooltipText : function(text)
        {
            return text;
        },

        cameraTooltipCSS : {
            "border"           : "1px solid grey",
            "text-align"       : "center",
            "min-width"        : 200,
            "border-radius"    : 4,
            "padding"          : 3,
            "padding-left"     : 5,
            "padding-right"    : 5,
            "position"         : "absolute",
            "width"            : "auto",
            "font-family"      : "Arial",
            "font-size"        : "14pt",
            "font-weight"      : "bold",
            "color"            : "color: rgb(56,56,56)",
            "background-color" : "rgba(248, 248, 248, 0.85)"
        }
    },

    _onScriptDestroyed : function()
    {
        this.$super();

        this.resetCameraApplication();
    },

    startCameraApplication : function(applicationName, entityName, verticalFov, addToUserInterfaceSwitcher)
    {
        if (applicationName === undefined)
        {
            console.error("[ICameraApplication]: createCameraEntity must pass applicationName eg. 'Avatar' and entity name eg. 'AvatarCamera'!")
            return;
        }
        if (addToUserInterfaceSwitcher === undefined)
            addToUserInterfaceSwitcher = true;

        if (this.cameraEntity == null)
        {
            this.cameraApplicationState.applicationName = applicationName;

            this.cameraEntity = TundraSDK.framework.scene.createLocalEntity(["Name", "Placeable", "Camera"]);
            this.cameraEntity.name = entityName;

            if (verticalFov !== undefined && typeof verticalFov === "number")
                this.cameraEntity.camera.verticalFov = verticalFov;

            this.subscribeEvent(TundraSDK.framework.renderer.onActiveCameraChanged(this, this._onActiveCameraChanged));

            if (addToUserInterfaceSwitcher === true)
                TundraSDK.framework.client.registerCameraApplication(applicationName, this);
        }
        return this.cameraEntity;
    },

    resetCameraApplication : function()
    {
        this._subCameraAnimationFrameUpdates(true);
        this.cameraEntity = null;
    },

    animateBeforeActivation : function(animate)
    {
        if (typeof animate === "boolean")
            this.cameraApplicationState.animateActivation = animate;
    },

    _subCameraAnimationFrameUpdates : function(unsubOnly)
    {
        if (unsubOnly === undefined)
            unsubOnly = false;

        if (this.cameraApplicationState.onUpdateSub != null)
            TundraSDK.framework.events.unsubscribe(this.cameraApplicationState.onUpdateSub);

        if (unsubOnly === false)
            this.cameraApplicationState.onUpdateSub = TundraSDK.framework.frame.onUpdate(this, this._onCameraAnimationUpdate);
        else if (this.cameraEntity != null && this.cameraEntity.camera != null)
            this.cameraEntity.camera._animating = false;
    },

    _onCameraStepAnimation : function(t)
    {
        var state = this.cameraApplicationState;

        var pos = state.animationStart.pos.clone();
        pos.lerp(state.animationStop.pos.clone(), t);

        var quat = state.animationStart.rot.clone();
        quat.slerp(state.animationStop.rot.clone(), t);
        quat.normalize();

        this.cameraEntity.placeable.setPosition(pos);
        this.cameraEntity.placeable.setRotation(quat);

        /** This is a hack to set the same degree angle vector to transform that
            was set before we started  animating. Using the final quat to do this
            breaks rotation (sometimes flips -180/180 to z-axis). */
        if (t >= 1)
            this.cameraEntity.placeable.setRotation(state.animationStop.rotDegrees);
    },

    _onCameraAnimationUpdate : function(frametime)
    {
        var state = this.cameraApplicationState;

        if (state.animationT < state.animationDuration)
        {
            var t = state.easing.getTime(state.animationT / state.animationDuration);
            this._onCameraStepAnimation(t);

            state.animationT += frametime;
        }
        else
        {
            this._onCameraStepAnimation(1.0);
            this._subCameraAnimationFrameUpdates(true);

            this.onCameraActived(this.cameraEntity, state.previousCameraEntity);

            state.animationT = 0.0;
            state.previousCameraEntity = null;
            state.animationStart = null;
            state.animationStop = null;
            return;
        }
    },

    _activateCameraApplication : function()
    {
        if (this.cameraEntity != null && this.cameraEntity.camera != null)
            this.cameraEntity.camera.setActive();
    },

    _onActiveCameraChanged : function(activatedCameraComponent, previousCameraComponent)
    {
        if (activatedCameraComponent === undefined || activatedCameraComponent === null)
            return;

        if (activatedCameraComponent === this.cameraEntity.camera)
            this._onCameraActived(this.cameraEntity, (previousCameraComponent !== undefined ? previousCameraComponent.parentEntity : undefined));
        else if (previousCameraComponent === this.cameraEntity.camera)
        {
            this._subCameraAnimationFrameUpdates(true);
            this.onCameraDeactived(this.cameraEntity, activatedCameraComponent.parentEntity);
        }
    },

    _onCameraActived : function(cameraEntity, previousCameraEntity)
    {
        ICameraApplication.showCameraApplicationInfoTooltip(this.cameraApplicationState.applicationName);

        // We can only animate if previous camera entity has a valid placeable
        if (this.cameraApplicationState.animateActivation === false || previousCameraEntity == null || 
            previousCameraEntity.placeable == null || cameraEntity.placeable == null)
            this.onCameraActived(cameraEntity, previousCameraEntity);
        else
        {
            // Animations not implemented if one of the cameras are parented!
            if (typeof cameraEntity.placeable.parentRef !== "string" || typeof previousCameraEntity.placeable.parentRef !== "string" ||
                cameraEntity.placeable.parentRef !== "" || previousCameraEntity.placeable.parentRef !== "")
            {
                this.onCameraActived(cameraEntity, previousCameraEntity);
                return;
            }

            // Currently auto animating is disabled
            //this.onCameraActived(cameraEntity, previousCameraEntity);

            this.cameraApplicationState.animationT = 0.0;
            this.cameraApplicationState.previousCameraEntity = previousCameraEntity;

            this.cameraApplicationState.animationStart =
            {
                pos : previousCameraEntity.placeable.worldPosition(),
                rot : previousCameraEntity.placeable.worldOrientation(),
            };
            this.cameraApplicationState.animationStop =
            {
                pos         : cameraEntity.placeable.worldPosition(),
                rot         : cameraEntity.placeable.worldOrientation(),
                rotDegrees  : cameraEntity.placeable.transform.rot.clone()
            };

            /*console.log(" ");
            console.log("START", previousCameraEntity.placeable.transform.rot.toString()); //this.cameraApplicationState.animationStart.rot.toString());
            console.log("END  ", cameraEntity.placeable.transform.rot.toString());*/

            // Set start position and rotation
            cameraEntity.placeable.setPosition(this.cameraApplicationState.animationStart.pos);
            cameraEntity.placeable.setRotation(this.cameraApplicationState.animationStart.rot);
            cameraEntity.camera._animating = true;

            this._subCameraAnimationFrameUpdates(false);
        }
    },

    onCameraActived : function(cameraEntity, previousCameraEntity)
    {
        /// Implementation overrides.
    },

    onCameraDeactived : function(cameraEntity, activatedCameraEntity)
    {
        /// Implementation overrides.
    }
});

// Global scope exposure of applications that do not use requirejs
window.ICameraApplication = ICameraApplication;




function BitArray(size, value){
  if(value === undefined) value = 0;
  this.size = size;
  this.field = new Array(~~((size - 1) / BitArray.ELEMENT_WIDTH) + 1);
  for(var i = 0; i < this.field.length; i++) 
    this.field[i] = value == 0 ? 0 : (value << BitArray.ELEMENT_WIDTH) - 1;
}

// will fail for values higher than 30
BitArray.ELEMENT_WIDTH = 24;

// Set a bit (1/0)
BitArray.prototype.set = function(position, value){
  if (value == 1)
    this.field[~~(position/BitArray.ELEMENT_WIDTH)] |= 1 << (position % BitArray.ELEMENT_WIDTH);
  else if(this.field[~~(position/BitArray.ELEMENT_WIDTH)] & 1 << (position % BitArray.ELEMENT_WIDTH))
    this.field[~~(position/BitArray.ELEMENT_WIDTH)] ^= 1 << (position % BitArray.ELEMENT_WIDTH);
}

// Read a bit (1/0)
BitArray.prototype.get = function(position){
  return (this.field[~~(position/BitArray.ELEMENT_WIDTH)] & 1 << (position % BitArray.ELEMENT_WIDTH)) > 0 ? 1 : 0;
}

// Iterate over each bit
BitArray.prototype.each = function(method){
  for (var index = 0; index < this.size; index++) method(this.get(index), index);
}

// Returns the field as a string like "0101010100111100," etc.
BitArray.prototype.toString = function(){
  var string = this.field.map(function(ea){
    var binary = ea.toString(2);
    binary = (new Array(BitArray.ELEMENT_WIDTH - binary.length + 1).join('0')) + binary;
    return binary;
  }).reverse().join('');
  return string.split('').reverse().join('').slice(0,this.size);
}

  ;


/**
    Utility class to parse JavaScript Arraybuffer data.

    @class DataDeserializer
    @constructor
    @param {ArrayBuffer} buffer Source data buffer.
    @param {Number} pos Data position to proceed reading from.
*/
var DataDeserializer = Class.$extend(
{
    __init__ : function(buffer, pos, length)
    {
        if (buffer !== undefined)
            this.setBuffer(buffer, pos, length);
    },

    __classvars__ :
    {
        /**
            Reads a byte from bits.
            @static
            @method readByteFromBits
            @param {BitArray} bits Source bits. See {{#crossLink "DataDeserializer/readBits:method"}}readBits(){{/crossLink}}.
            @param {Number} pos Position to start reading the byte.
            @return {Number} Read byte.
        */
        readByteFromBits : function(bits, bitIndex)
        {
            var byte = 0;
            for (var bi=0; bi<8; ++bi)
            {
                var bit = bits.get(bitIndex+bi);
                if (bit === 1)
                    byte |= (1 << bi);
                else
                    byte &= ~(1 << bi);
            }
            return byte;
        }
    },

    /**
        Set new data source and position.
        @method setBuffer
        @param {ArrayBuffer} buffer Source data buffer.
        @param {Number} pos Data position to proceed reading from.
    */
    setBuffer : function(buffer, pos, length)
    {
        // Firefox DataView does not correctly support length as 'undefined'
        if (length === undefined)
            this.data = new DataView(buffer, pos);
        else
            this.data = new DataView(buffer, pos, length);
        this.pos = 0;
    },

    /**
        Read bytes as a new buffer.
        @method readUint8Array
        @param {Number} numBytes Number of bytes to read.
        @return {Uint8Array} Read buffer.
    */
    readUint8Array : function(numBytes)
    {
        //var buffer = this.data.buffer.subarray(this.pos, numBytes);
        var buffer = new Uint8Array(this.data.buffer, this.pos, numBytes);
        this.pos += numBytes;
        return buffer;
    },

    /**
        Returns the currently read bytes.
        @method readBytes
        @return {Number} Number of read bytes.
    */
    readBytes : function()
    {
        return this.pos;
    },

    /**
        Returns how many bytes are left.
        @method bytesLeft
        @return {Number} Number of bytes left.
    */
    bytesLeft : function()
    {
        return (this.data.byteLength - this.pos);
    },

    /**
        Skips bytes. Use negative numBytes to go backwards.
        @method skipBytes
        @param {Number} numBytes Number of bytes to skip.
    */
    skipBytes : function(numBytes)
    {
        this.pos += numBytes;
    },

    /**
        Reads a u8 and returns true if >0, otherwise false.
        @method readBoolean
        @return {Boolean} Read boolean.
    */
    readBoolean : function()
    {
        return (this.readU8() > 0 ? true : false);
    },

    // Make this work but don't document to encourage use.
    readBool : function()
    {
        return this.readBoolean();
    },

    /**
        Reads a single UTF8 code point aka char code in JavaScript.

        Code adapted from https://github.com/realXtend/WebTundraNetworking/blob/master/src/DataDeserializer.js
        @method readUtf8CharCode
        @return {Number} Char code of the character.
    */
    readUtf8CharCode : function()
    {
        var char1 = this.readU8();
        if (char1 < 0x80)
        {
            return char1;
        }
        else if (char1 < 0xe0)
        {
            var char2 = this.readU8();
            return (char2 & 0x3f) | ((char1 & 0x1f) << 6);
        }
        else if (char1 < 0xf0)
        {
            var char2 = this.readU8();
            var char3 = this.readU8();
            return (char3 & 0x3f) | ((char2 & 0x3f) << 6) | ((char1 & 0xf) << 12);
        }
        else if (char1 < 0xf8)
        {
            var char2 = this.readU8();
            var char3 = this.readU8();
            var char4 = this.readU8();
            return (char4 & 0x3f) | ((char3 & 0x3f) << 6) | ((char2 & 0x3f) << 12) | ((char1 & 0x7) << 18);
        }
        else if (char1 < 0xfc) {
            var char2 = this.readU8();
            var char3 = this.readU8();
            var char4 = this.readU8();
            var char5 = this.readU8();
            return (char5 & 0x3f) | ((char4 & 0x3f) << 6) | ((char3 & 0x3f) << 12) | ((char2 & 0x3f) << 18) | ((char1 & 0x3) << 24);
        }
        else
        {
            var char2 = this.readU8();
            var char3 = this.readU8();
            var char4 = this.readU8();
            var char5 = this.readU8();
            var char6 = this.readU8();
            return (char6 & 0x3f) | ((char5 & 0x3f) << 6) | ((char4 & 0x3f) << 12) | ((char3 & 0x3f) << 18) | ((char2 & 0x3f) << 24) | ((char1 & 0x1) << 30);
        }
    },

    /**
        Reads string bytes and convert to string with String.fromCharCode()
        until delimStr or delimCharCode is encountered.

        This function is useful for reading null or newline terminated strings.
        Pass delimStr as '\n' or delimCharCode as 10 for null terminated string.
        @method readStringUntil
        @param {String} delimStr String delimiter.
        @param {Number} delimCharCode Charcode delimiter.
        @return {String} Read string.
    */
    readStringUntil : function(delimStr, delimCharCode)
    {
        var str = "";
        while(this.bytesLeft() > 0)
        {
            var charCode = this.readU8();
            var c = String.fromCharCode(charCode);
            if (delimCharCode !== undefined && charCode === delimCharCode)
                break;
            else if (delimStr !== undefined && c === delimStr)
                break;
            str += c;
        }
        return str;
    },

    /**
        Reads string with lenght.
        @method readString
        @param {Number} length String length.
        @return {String} Read string.
    */
    readString : function(length, utf8)
    {
        if (typeof utf8 !== "boolean")
            utf8 = false;

        var str = "";
        if (length > 0)
        {
            var endPos = this.pos + length;
            while (this.pos < endPos)
            {
                if (utf8)
                    str += String.fromCharCode(this.readUtf8CharCode(endPos - this.pos));
                else
                    str += String.fromCharCode(this.readU8());
            }
        }
        return str;
    },

    /**
        Reads u8 lenght string.
        @method readStringU8
        @return {String} Read string.
    */
    readStringU8 : function(utf8)
    {
        return this.readString(this.readU8(), utf8);
    },

    /**
        Reads u16 lenght string.
        @method readStringU16
        @return {String} Read string.
    */
    readStringU16 : function(utf8)
    {
        return this.readString(this.readU16(), utf8);
    },

    /**
        Reads u32 lenght string.
        @method readStringU32
        @return {String} Read string.
    */
    readStringU32 : function(utf8)
    {
        return this.readString(this.readU32(), utf8);
    },

    /**
        Reads s8.
        @method readS8
        @return {byte} s8
    */
    readS8 : function()
    {
        var s8 = this.data.getInt8(this.pos);
        this.pos += 1;
        return s8;
    },

    /**
        Reads u8.
        @method readU8
        @return {unsigned byte} u8
    */
    readU8 : function()
    {
        var u8 = this.data.getUint8(this.pos);
        this.pos += 1;
        return u8;
    },

    /**
        Reads s16.
        @method readS16
        @return {short} s16
    */
    readS16 : function()
    {
        var s16 = this.data.getInt16(this.pos, true);
        this.pos += 2;
        return s16;
    },

    /**
        Reads u16.
        @method readU16
        @return {unsigned short} u16
    */
    readU16 : function()
    {
        var u16 = this.data.getUint16(this.pos, true);
        this.pos += 2;
        return u16;
    },

    /**
        Reads s32.
        @method readS32
        @return {long} s32
    */
    readS32 : function()
    {
        var s32 = this.data.getInt32(this.pos, true);
        this.pos += 4;
        return s32;
    },

    /**
        Reads u32.
        @method readU32
        @return {unsigned long} u32
    */
    readU32 : function()
    {
        var u32 = this.data.getUint32(this.pos, true);
        this.pos += 4;
        return u32;
    },

    /**
        Reads f32.
        @method readFloat32
        @return {float} f32
    */
    readFloat32 : function()
    {
        var f32 = this.data.getFloat32(this.pos, true);
        this.pos += 4;
        return f32;
    },

    /**
        Reads f64.
        @method readFloat64
        @return {double} f64
    */
    readFloat64 : function()
    {
        var f64 = this.data.getFloat64(this.pos, true);
        this.pos += 8;
        return f64;
    },

    /**
        Reads three f32 to a object { x : <f32>, y : <f32>, z : <f32> }.
        @method readFloat32Vector3
        @return {Object}
    */
    readFloat32Vector3 : function()
    {
        return {
            x : this.readFloat32(),
            y : this.readFloat32(),
            z : this.readFloat32()
        };
    },

    /**
        Reads four f32 to a object { x : <f32>, y : <f32>, z : <f32>, w : <f32> }.
        @method readFloat32Vector4
        @return {Object}
    */
    readFloat32Vector4 : function()
    {
        return {
            x : this.readFloat32(),
            y : this.readFloat32(),
            z : this.readFloat32(),
            w : this.readFloat32()
        };
    },

    /**
        Reads VLE.
        @method readVLE
        @return {Number} Read VLE value.
    */
    readVLE : function()
    {
        // Copied from https://github.com/realXtend/WebTundraNetworking/blob/master/src/DataDeserializer.js
        var low = this.readU8();
        if ((low & 128) == 0)
            return low;
        low = low & 127;
        var med = this.readU8();
        if ((med & 128) == 0)
            return low | (med << 7);
        med = med & 127;
        var high = this.readU16();
        return low | (med << 7) | (high << 14);
    },

    /**
        Reads bytes as bits.
        @method readBits
        @param {Number} bytes How many bytes to read as bits.
        @return {BitArray} Read bits. See http://github.com/bramstein/bit-array
    */
    readBits : function(bytes)
    {
        var bitIndex = 0;
        var bits = new BitArray(bytes*8, 0);
        for (var byteIndex=0; byteIndex<bytes; ++byteIndex)
        {
            var byte = this.readU8();
            for (var i=0; i<8; ++i)
            {
                var bit = (~~byte & 1 << i) > 0 ? 1 : 0;
                bits.set(bitIndex, bit);
                bitIndex++;
            }
        }
        return bits;
    }
});




/**
    Interface for a network message handler. Implementations can be registered
    with TundraSDK.framework.network.registerMessageHandler().

    @class INetworkMessageHandler
    @constructor
*/
var INetworkMessageHandler = Class.$extend(
{
    __init__ : function(name)
    {
        this.name = name;
    },

    /**
        Returns if this message handler can handle a message with the given id.
        @param {Number} id Message id.
        @return {Boolean}
    */
    canHandle : function(id)
    {
        return false;
    },

    /**
        Returns if this message handler can handle a message with the given id.
        @param {Number} id Message id.
        @param {DataDeserializer} ds Data deserializer that has the messages data.
        @return {INetworkMessage|null} Returns the message that was created during the handling or null if you don't want it to leak further.
    */
    handle : function(id, ds)
    {
        return false;
    }
});




/**
    Utility class to fill in JavaScript Arraybuffer data.

    @class DataSerializer
    @constructor
    @param {Number} numBytes Size of the destination array buffer.
    @param {DataSerializer.ArrayType} [arrayType=Uint8] Type of the underlying typed array.
*/
var DataSerializer = Class.$extend(
{
    __init__ : function(numBytes, arrayType)
    {
        if (typeof numBytes !== "number")
        {
            TundraSDK.framework.client.logWarning("[DataSerializer]: You are creating a data serializer with undefined size! Initializing size to 0 bytes.");
            numBytes = 0;
        }
        if (arrayType === undefined || arrayType === null || typeof arrayType !== "number")
            arrayType = DataSerializer.ArrayType.Uint8;

        if (arrayType === DataSerializer.ArrayType.Uint8)
            this.array = new Uint8Array(numBytes);
        else if (arrayType === DataSerializer.ArrayType.Uint16)
            this.array = new Uint16Array(numBytes);
        else if (arrayType === DataSerializer.ArrayType.Uint32)
            this.array = new Uint32Array(numBytes);
        else if (arrayType === DataSerializer.ArrayType.Float32)
            this.array = new Float32Array(numBytes);
        else if (arrayType === DataSerializer.ArrayType.Float64)
            this.array = new Float64Array(numBytes);
        else
        {
            TundraSDK.framework.client.logError("[DataSerializer]: Unknown 'arrayType' " + arrayType + ". Use on of the supported ones from DataSerializer.ArrayType");
            return;
        }

        this.data = new DataView(this.array.buffer);
        this.pos = 0;
    },

    __classvars__ :
    {
        ArrayType :
        {
            Uint8   : 0,
            Uint16  : 1,
            Uint32  : 2,
            Float32 : 3,
            Float64 : 4
        },

        /**
            Returns UTF8 byte size for a string.

            Code adapted from https://github.com/realXtend/WebTundraNetworking/blob/master/src/DataSerializer.js
            @method utf8StringByteSize
            @param {String} str String to calculate.
            @return {Number} Number of bytes.
        */
        utf8StringByteSize : function(str)
        {
            var numBytes = 0;
            for (var i = 0, len = str.length; i < len; ++i)
                numBytes += DataSerializer.utf8CharCodeByteSize(str.charCodeAt(i));
            return numBytes;
        },

        /**
            Returns UTF8 byte size for a char code.

            Code adapted from https://github.com/realXtend/WebTundraNetworking/blob/master/src/DataSerializer.js
            @method utf8CharCodeByteSize
            @param {Number} charCode Character code to calculate.
            @return {Number} Number of bytes.
        */
        utf8CharCodeByteSize : function(charCode)
        {
            if (charCode < 0x80)
                return 1;
            else if (charCode < 0x800)
                return 2;
            else if (charCode < 0x10000)
                return 3;
            else if (charCode < 0x200000)
                return 4;
            else if (charCode < 0x4000000)
                return 5;
            else
                return 6;
        },

        vleHeaderSizeBytes : function(value)
        {
            if (value < 128)
                return 1;
            else if (value < 16384)
                return 2;
            else
                return 4;
        }
    },

    /**
        Returns the destination array buffer.
        @method getBuffer
        @return {ArrayBuffer} Destination array buffer.
    */
    getBuffer : function()
    {
        return this.array.buffer;
    },

    /**
        Returns the currently written byte count.
        @method filledBytes
        @return {Number} Number of written bytes.
    */
    filledBytes : function()
    {
        return this.pos;
    },

    /**
        Returns how many bytes are left for writing new data.
        @method bytesLeft
        @return {Number} Number of bytes left for writing.
    */
    bytesLeft : function()
    {
        return (this.data.byteLength - this.pos);
    },

    skipBytes : function(numBytes)
    {
        this.pos += numBytes;
    },

    /**
        Writes boolean as u8, 0 if false, 1 otherwise.
        @method writeBoolean
        @param {Boolean} bool Write boolean.
    */
    writeBoolean : function(bool)
    {
        this.writeU8(bool === true ? 1 : 0);
    },

    /**
        Writes an Uint8Array.
        @method writeUint8Array
        @param {Uint8Array} buffer
    */
    writeUint8Array : function(buffer)
    {
        for (var i = 0, len = buffer.length; i < len; ++i)
            this.writeU8(buffer[i]);
    },

    /**
        Writes UTF8 bytes for given char code.

        Code adapted from https://github.com/realXtend/WebTundraNetworking/blob/master/src/DataSerializer.js
        @method writeUtf8Char
        @param {Number} charCode Character code to write.
    */
    writeUtf8Char : function(charCode)
    {
        if (charCode < 0x80)
            this.writeU8(charCode);
        else if (charCode < 0x800)
        {
            this.writeU8(0xc0 | ((charCode >> 6) & 0x1f));
            this.writeU8(0x80 | (charCode & 0x3f));
        }
        else if (charCode < 0x10000)
        {
            this.writeU8(0xe0 | ((charCode >> 12) & 0xf));
            this.writeU8(0x80 | ((charCode >> 6) & 0x3f));
            this.writeU8(0x80 | (charCode & 0x3f));
        }
        else if (charCode < 0x200000)
        {
            this.writeU8(0xf0 | ((charCode >> 18) & 0x7));
            this.writeU8(0x80 | ((charCode >> 12) & 0x3f));
            this.writeU8(0x80 | ((charCode >> 6) & 0x3f));
            this.writeU8(0x80 | (charCode & 0x3f));
        }
        else if (charCode < 0x4000000)
        {
            this.writeU8(0xf8 | ((charCode >> 24) & 0x3));
            this.writeU8(0x80 | ((charCode >> 18) & 0x3f));
            this.writeU8(0x80 | ((charCode >> 12) & 0x3f));
            this.writeU8(0x80 | ((charCode >> 6) & 0x3f));
            this.writeU8(0x80 | (charCode & 0x3f));
        }
        else
        {
            this.writeU8(0xfc | ((charCode >> 30) & 0x1));
            this.writeU8(0x80 | ((charCode >> 24) & 0x3f));
            this.writeU8(0x80 | ((charCode >> 18) & 0x3f));
            this.writeU8(0x80 | ((charCode >> 12) & 0x3f));
            this.writeU8(0x80 | ((charCode >> 6) & 0x3f));
            this.writeU8(0x80 | (charCode & 0x3f));
        }
    },

    /**
        Writes a size header and UTF8 bytes for given string.

        Code adapted from https://github.com/realXtend/WebTundraNetworking/blob/master/src/DataSerializer.js
        @method writeStringWithHeader
        @param {Number} headerSizeBytes Size of bytes for the header size, eg. 2 == U16 size header is written. Valid options: 1, 2, 4.
        @param {String} str String to write.
        @param {Boolean} utf8 If should write as UTF8 bytes.
    */
    writeStringWithHeader : function(headerSizeBytes, str, utf8)
    {
        /// @todo Implement not writing as UTF8.
        if (typeof utf8 !== "boolean")
            utf8 = false;

        // Leave room to write size header
        var sizePos = this.pos;
        this.pos += headerSizeBytes;

        // Calculate num bytes and write string
        var numBytes = 0;
        for (var i = 0, len = str.length; i < len; ++i)
        {
            var charCode = str.charCodeAt(i);
            numBytes += DataSerializer.utf8CharCodeByteSize(charCode);
            this.writeUtf8Char(charCode);
        }

        // Write size header
        var preHeaderPos = this.pos;
        this.pos = sizePos;
        if (headerSizeBytes == 1)
            this.writeU8(numBytes);
        else if (headerSizeBytes == 2)
            this.writeU16(numBytes);
        else if (headerSizeBytes == 4)
            this.writeU32(numBytes);
        this.pos = preHeaderPos;
    },

    /**
        Writes a string with a VLE header depending on the string lenght. Supports UTF8 strings.

        @method writeStringVLE
        @param {String} str String to write.
    */
    writeStringVLE : function(str, utf8)
    {
        this.writeStringWithHeader(DataSerializer.vleHeaderSizeBytes(str.length), str, utf8);
    },

    /**
        Write string with a u8 length header. Supports UTF8 strings.

        The input string has to have max length of u8, this won't be checked during runtime.
        @method writeStringU8
        @param {String} str String to write.
    */
    writeStringU8 : function(str, utf8)
    {
        this.writeStringWithHeader(1, str, utf8);
    },

    /**
        Write string with a u16 length header. Supports UTF8 strings.

        The input string has to have max length of u16, this won't be checked during runtime.
        @method writeStringU16
        @param {String} str String to write.
    */
    writeStringU16 : function(str, utf8)
    {
        this.writeStringWithHeader(2, str, utf8);
    },

    /**
        Write string with a u32 length header. Supports UTF8 strings.

        The input string has to have max length of u32, this won't be checked during runtime.
        @method writeStringU32
        @param {String} str String to write.
    */
    writeStringU32 : function(str, utf8)
    {
        this.writeStringWithHeader(4, str, utf8);
    },

    /**
        Writes s8.
        @method writeS8
        @param {byte} s8
    */
    writeS8 : function(s8)
    {
        this.data.setInt8(this.pos, s8);
        this.pos += 1;
    },

    /**
        Writes u8.
        @method writeU8
        @param {unsigned byte} u8
    */
    writeU8 : function(u8)
    {
        this.data.setUint8(this.pos, u8);
        this.pos += 1;
    },

    /**
        Writes s16.
        @method writeS16
        @param {short} s16
    */
    writeS16 : function(s16)
    {
        this.data.setInt16(this.pos, s16, true);
        this.pos += 2;
    },

    /**
        Writes u16.
        @method writeU16
        @param {unsigned short} u16
    */
    writeU16 : function(u16)
    {
        this.data.setUint16(this.pos, u16, true);
        this.pos += 2;
    },

    /**
        Writes s32.
        @method writeS32
        @param {long} s32
    */
    writeS32 : function(s32)
    {
        this.data.setInt32(this.pos, s32, true);
        this.pos += 4;
    },

    /**
        Writes u32.
        @method writeU32
        @param {unsigned long} u32
    */
    writeU32 : function(u32)
    {
        this.data.setUint32(this.pos, u32, true);
        this.pos += 4;
    },

    /**
        Writes f32.
        @method writeFloat32
        @param {float} f32
    */
    writeFloat32 : function(f32)
    {
        this.data.setFloat32(this.pos, f32, true);
        this.pos += 4;
    },

    /**
        Writes f64.
        @method writeFloat64
        @param {double} f64
    */
    writeFloat64 : function(f64)
    {
        this.data.setFloat64(this.pos, f64, true);
        this.pos += 8;
    },

    /**
        Writes VLE.
        @method writeVLE
        @param {Number} value Value to write as VLE.
    */
    writeVLE : function(value)
    {
        // Copied from https://github.com/realXtend/WebTundraNetworking/blob/master/src/DataSerializer.js
        if (value < 128)
            this.writeU8(value);
        else if (value < 16384)
        {
            this.writeU8((value & 127) | 128);
            this.writeU8(value >> 7);
        }
        else
        {
            this.writeU8((value & 127) | 128);
            this.writeU8(((value >> 7) & 127) | 128);
            this.writeU16(value >> 14);
        }
    },

    /**
        Writes bytes as bits.
        @method writeBits
        @param {Number} bytes How many bytes to write as bits.
        @return {BitArray} Read bits. See http://github.com/bramstein/bit-array
    */
    writeBits : function(bytes)
    {
        /*
        var bitIndex = 0;
        var bits = new BitArray(bytes*8, 0);
        for (var byteIndex=0; byteIndex<bytes; ++byteIndex)
        {
            var byte = this.readU8();
            for (var i=0; i<8; ++i)
            {
                var bit = (~~byte & 1 << i) > 0 ? 1 : 0;
                bits.set(bitIndex, bit);
                bitIndex++;
            }
        }
        return bits;
        */
    }
});




/**
    Interface for a network message.

    @class INetworkMessage
    @constructor
*/
var INetworkMessage = Class.$extend(
{
    __init__ : function(id, name)
    {
        this.id = id;
        this.name = (name !== undefined ? name : INetworkMessage.Ids[id]);
    },

    __classvars__ :
    {
        /**
            Message id.
            @static
            @property id
            @type Number
        */
        id   : 0,
        /**
            Message name.
            @static
            @property name
            @type String
        */
        name : "",

        /**
            Map for Tundra protocol message ids to message names.
            @property Ids
            @type Object
            @static
            @example
                {
                    // Login
                    100 : "LoginMessage",
                    101 : "LoginReplyMessage",
                    102 : "ClientJoinedMessage",
                    103 : "ClientLeftMessage",
                    // Scene
                    110 : "CreateEntityMessage",
                    111 : "CreateComponentsMessage",
                    112 : "CreateAttributesMessage",
                    113 : "EditAttributesMessage",
                    114 : "RemoveAttributesMessage",
                    115 : "RemoveComponentsMessage",
                    116 : "RemoveEntityMessage",
                    117 : "CreateEntityReplyMessage",       // @note server to client only
                    118 : "CreateComponentsReplyMessage",   // @note server to client only
                    119 : "RigidBodyUpdateMessage",
                    // Enity action
                    120 : "EntityActionMessage",
                    // Assets
                    121 : "AssetDiscoveryMessage",
                    122 : "AssetDeletedMessage"
                }
        */
        Ids :
        {
            // Login
            100 : "LoginMessage",
            101 : "LoginReplyMessage",
            102 : "ClientJoinedMessage",
            103 : "ClientLeftMessage",
            // Scene
            110 : "CreateEntityMessage",
            111 : "CreateComponentsMessage",
            112 : "CreateAttributesMessage",
            113 : "EditAttributesMessage",
            114 : "RemoveAttributesMessage",
            115 : "RemoveComponentsMessage",
            116 : "RemoveEntityMessage",
            117 : "CreateEntityReplyMessage",       // @note server to client only
            118 : "CreateComponentsReplyMessage",   // @note server to client only
            119 : "RigidBodyUpdateMessage",
            // Enity action
            120 : "EntityActionMessage",
            // Assets
            121 : "AssetDiscoveryMessage",
            122 : "AssetDeletedMessage"
        }
    },

    /**
        Returns the data array buffer. This function return null for messages that are being used for
        deserialization or if serialize has not called yet.
        @return {ArrayBuffer|null} Array buffer or null if serialize has not been called.
    */
    getBuffer : function()
    {
        if (this.ds !== undefined && this.ds !== null && this.ds instanceof DataSerializer)
            return this.ds.getBuffer();
        return null;
    },

    /**
        Deserializes message from data.
        @method deserialize
        @param {DataDeserializer} ds Data deserializer.
    */
    deserialize : function(ds)
    {
        this.ds = ds;
    },

    /**
        Serializes message to data. Call getBuffer to get written data array buffer.
        @method serialize
        @param {Number} numBytes Number of bytes to reserve for writing the data.
    */
    serialize : function(numBytes)
    {
        this.ds = new DataSerializer(numBytes);
    }
});




/**
    Tundra protocol contains utilities and properties for the handling the Tundra protocol.
    @class Network
    @constructor
*/
var Network = Class.$extend(
{
    __init__ : function(params)
    {
        this.log = TundraLogging.getLogger("Network");

        this.messageHandlers = [];
    },

    __classvars__ :
    {
        /**
            Map for Tundra Entity Component ids to component names.
            @property components
            @type Object
            @static
            @example
                {
                    // Tundra core components
                    1   : "EC_Avatar",                  21  : "EC_RttTarget",
                    2   : "EC_Billboard",               23  : "EC_RigidBody",
                    5   : "EC_Script",                  24  : "EC_VolumeTrigger",
                    6   : "EC_Sound",                   25  : "EC_DynamicComponent",
                    7   : "EC_SoundListener",           26  : "EC_Name",
                    8   : "EC_EnvironmentLight",        27  : "EC_ParticleSystem",
                    9   : "EC_Fog",                     28  : "EC_Highlight",
                    10  : "EC_Sky",                     29  : "EC_HoveringText",
                    11  : "EC_Terrain",                 30  : "EC_TransformGizmo",
                    12  : "EC_WaterPlane",              31  : "EC_Material",
                    13  : "EC_InputMapper",             33  : "EC_ProximityTrigger",
                    14  : "EC_AnimationController",     34  : "EC_PlanarMirror",
                    15  : "EC_Camera",                  35  : "EC_WidgetCanvas",
                    16  : "EC_Light",                   36  : "EC_WebView",
                    17  : "EC_Mesh",                    37  : "EC_MediaPlayer",
                    18  : "EC_OgreCompositor",          38  : "EC_SkyX",
                    19  : "EC_OgreCustomObject",        39  : "EC_Hydrax",
                    20  : "EC_Placeable",               40  : "EC_LaserPointer",

                    41  : "EC_SlideShow",               52  : "EC_GraphicsViewCanvas",
                    42  : "EC_WidgetBillboard",         108 : "EC_StencilGlow",
                    43  : "EC_PhysicsMotor"
                }
        */
        components :
        {
            // Tundra core components
            1   : "EC_Avatar",                  21  : "EC_RttTarget",
            2   : "EC_Billboard",               23  : "EC_RigidBody",
            5   : "EC_Script",                  24  : "EC_VolumeTrigger",
            6   : "EC_Sound",                   25  : "EC_DynamicComponent",
            7   : "EC_SoundListener",           26  : "EC_Name",
            8   : "EC_EnvironmentLight",        27  : "EC_ParticleSystem",
            9   : "EC_Fog",                     28  : "EC_Highlight",
            10  : "EC_Sky",                     29  : "EC_HoveringText",
            11  : "EC_Terrain",                 30  : "EC_TransformGizmo",
            12  : "EC_WaterPlane",              31  : "EC_Material",
            13  : "EC_InputMapper",             33  : "EC_ProximityTrigger",
            14  : "EC_AnimationController",     34  : "EC_PlanarMirror",
            15  : "EC_Camera",                  35  : "EC_WidgetCanvas",
            16  : "EC_Light",                   36  : "EC_WebView",
            17  : "EC_Mesh",                    37  : "EC_MediaPlayer",
            18  : "EC_OgreCompositor",          38  : "EC_SkyX",
            19  : "EC_OgreCustomObject",        39  : "EC_Hydrax",
            20  : "EC_Placeable",               40  : "EC_LaserPointer",

            41  : "EC_SlideShow",               52  : "EC_GraphicsViewCanvas",
            42  : "EC_WidgetBillboard",         108 : "EC_StencilGlow",
            43  : "EC_PhysicsMotor"
        }
    },

    /**
        Register a network message handler. Note: Does not check if the handler is already registered!

        @method registerMessageHandler
        @param {INetworkMessageHandler} handler
    */
    registerMessageHandler : function(handler)
    {
        if (!(handler instanceof INetworkMessageHandler))
        {
            this.log.error("registerMessageHandler called with a non INetworkMessageHandler object:", hadler);
            return;
        }
        this.messageHandlers.push(handler);
    },

    /**
        Sends an message to the active WebSocket connection.

        This function will delete and null out the passed message object after it has been sent.
        This is done to help out the garbage collection. You cannot use the message object after this function call.
        @method send
        @param {INetworkMessage} message Message to send.
    */
    send : function(message)
    {
        if (TundraSDK.framework.client.websocket === null)
        {
            this.log.error("Cannot send message, no active WebSocket connection!");
            return;
        }
        if (!(message instanceof INetworkMessage))
        {
            this.log.error("Cannot send message, given object is not an instance of INetworkMessage!");
            return;
        }

        var buffer = message.getBuffer();
        if (buffer !== null)
            TundraSDK.framework.client.websocket.send(buffer);
        else
            this.log.error("Cannot send message as it's buffer is null! Are you sure it's an outgoing message and serialize() has been called?");

        delete message;
        message = null;
    },

    /**
        Handles incoming message from input buffer. Handlers for messages can be registered via registerMessageHandler.

        @method receive
        @param {ArrayBuffer} buffer Source data buffer.
    */
    receive : function(buffer)
    {
        var ds = new DataDeserializer(buffer, 0);
        var id = ds.readU16();
       
        /** @todo Figure out if it makes sense to let multiple registered
            handlers to handle the same message id. In this case we would
            need to create copies of the data for each. */
        for (var i=0; i<this.messageHandlers.length; i++)
        {
            if (this.messageHandlers[i].canHandle(id))
            {
                this.messageHandlers[i].handle(id, ds);
                return;
            }
        }

        var msg = new INetworkMessage(id);
        this.log.warn("Received an unhandled network message", msg.name, msg.id);
    }
});


;


/**
    Event subscription data object returned from {{#crossLink "EventAPI/subscribe:method"}}{{/crossLink}}.

    @class EventSubscription
    @constructor
    @param {String} channel Subscription channel name.
    @param {String} id Subscription id.
*/
var EventSubscription = Class.$extend(
{
    __init__ : function(channel, id)
    {
        /**
            Subscription channel name.
            @property channel
            @type String
        */
        this.channel = channel;
        /**
            Subscription id.
            @property id
            @type String
        */
        this.id = id;
    }
});




/**
    EventAPI that provides subscribing and unsubscribing from Web Tundra events.

    Usually objects in Web Tundra provide onSomeEvent functions to subscribe, use those if they exist.
    These functions will return you EventSubscription objects that you can pass into EventAPIs unsubscribe functions.

    If you are implementing a function that uses the EventAPI be sure to return the EventSubscription object to the
    caller that gets returned from subscribe().

    @class EventAPI
    @constructor
*/
var EventAPI = Class.$extend(
{
    __init__ : function(params)
    {
        // Private, don't doc.
        //this.mediator = new Mediator();
        this.signals = {};
    },

    /**
        Sends a event to all subscribers.

        You can pass up to 10 data paramers of arbitrary JavaScript type.
        Parameters will be sent until a 'undefined' parameter is found, so don't use it as a parameter because it will
        cut your arguments from that point onward. If 10 parameters is not enough for you use complex objects, the you
        can have whatever data you want in them and the number of args is not a limiting factor.

        In practise only pass the parametrs you want to send(), the rest will automatically be undefined which will mark
        the amount of your parameters sent to the subscribers.

        @example
            var sub = TundraSDK.framework.events.subscribe("MyCustomEvent", null, function(msg, list, isSomething) {
                console.log(msg);         // "Hello Subscriber!"
                console.log(list);        // [ 12, 15 ]
                console.log(isSomething); // false
            });

            TundraSDK.framework.events.send(sub, "Hello Subscriber!", [ 12, 15 ], false);
            TundraSDK.framework.events.send("MyCustomEvent", "Hello Subscriber!", [ 12, 15 ], false);

        @method send
        @param {EventSubscription|String} channel Subscription data or channel name.
        @param {Object} [param1=undefined] Data parameter to be sent.
        @param {Object} [param2=undefined] Data parameter to be sent.
        @param {Object} [param3=undefined] Data parameter to be sent.
        @param {Object} [param4=undefined] Data parameter to be sent.
        @param {Object} [param5=undefined] Data parameter to be sent.
        @param {Object} [param6=undefined] Data parameter to be sent.
        @param {Object} [param7=undefined] Data parameter to be sent.
        @param {Object} [param8=undefined] Data parameter to be sent.
        @param {Object} [param9=undefined] Data parameter to be sent.
        @param {Object} [param10=undefined] Data parameter to be sent.
        @return {EventSubscription} Subscription data.
    */
    send : function(subParam1, param1, param2, param3, param4, param5, param6, param7, param8, param9, param10)
    {
        var channel = (typeof subParam1 == "string" ? subParam1 : subParam1.channel);

        // If the signal is not found, this is not an error.
        // It just means no one has subscribed to it yet, so
        // we dont need to post it.
        var signal = this.signals[channel];
        if (signal === undefined)
            return;

        // Early out
        if (!this._hasActiveListeners(signal))
            return;

        if (param1 === undefined)
            signal.dispatch();
        else if (param2 === undefined)
            signal.dispatch(param1);
        else if (param3 === undefined)
            signal.dispatch(param1, param2);
        else if (param4 === undefined)
            signal.dispatch(param1, param2, param3);
        else if (param5 === undefined)
            signal.dispatch(param1, param2, param3, param4);
        else if (param6 === undefined)
            signal.dispatch(param1, param2, param3, param4, param5);
        else if (param7 === undefined)
            signal.dispatch(param1, param2, param3, param4, param5, param6);
        else if (param8 === undefined)
            signal.dispatch(param1, param2, param3, param4, param5, param6, param7);
        else if (param9 === undefined)
            signal.dispatch(param1, param2, param3, param4, param5, param6, param7, param8);
        else if (param10 === undefined)
            signal.dispatch(param1, param2, param3, param4, param5, param6, param7, param8, param9);
        else
            signal.dispatch(param1, param2, param3, param4, param5, param6, param7, param8, param9, param10);
    },

    /**
        Subsribes a callback to a channel event.
        @example
            var sub = TundraSDK.framework.events.subscribe("MyCustomEvent", null, function(msg, list, isSomething) {
                console.log(msg);         // "Hello Subscriber!"
                console.log(list);        // [ 12, 15 ]
                console.log(isSomething); // false
            });

            TundraSDK.framework.events.send(sub, "Hello Subscriber!", [ 12, 15 ], false);
            TundraSDK.framework.events.send("MyCustomEvent", "Hello Subscriber!", [ 12, 15 ], false);

        @method subscribe
        @param {String} channel Subscription channel name.
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
    */
    subscribe : function(channel, context, callback)
    {
        var signal = this.signals[channel];
        if (signal === undefined)
        {
            signal = new signals.Signal();
            signal._eventapi_priority = -1;
            signal._eventapi_id = -1;
            signal._eventapi_subscribers = {};
            this.signals[channel] = signal;
        }
        signal._eventapi_priority++;
        signal._eventapi_id++;

        var binding = signal.add(callback, context, signal._eventapi_priority);
        signal._eventapi_subscribers[signal._eventapi_id] = signal._bindings.length-1;

        //var mediatorSub = this.mediator.subscribe(channel, callback, {}, context);
        //var eventSub = ;
        return new EventSubscription(channel, signal._eventapi_id);
    },

    /**
        Subsribes a callback to a channel event.
        @example
            var sub = TundraSDK.framework.events.subscribe("MyCustomEvent", null, function() {
            });
            // Once you don't want the callbacks anymore.
            TundraSDK.framework.events.unsubscribe(sub);

        @method unsubscribe
        @param {EventSubscription} subscription Subscription data.
        @return {Boolean} If unsubscription was successful.
    */
    /**
        Subsribes a callback to a channel event. Prefer using the EventSubscription overload
        that will reset your sub id so that it cannot be used to unsubscribe again.
        @example
            var sub = TundraSDK.framework.events.subscribe("MyCustomEvent", null, function() {
            });
            // Once you don't want the callbacks anymore.
            TundraSDK.framework.events.unsubscribe(sub.channel, sub.id);
            // ... or
            TundraSDK.framework.events.unsubscribe("MyCustomEvent", sub.id);
            // Manually reset the id so this sub data cannot be used again to unsubscribe.
            sub.id = undefined;

        @method unsubscribe
        @param {String} channel Subscription channel name.
        @param {String} id Subscription id.
        @return {Boolean} If unsubscription was successful.
    */
    unsubscribe : function(param1, param2)
    {
        var channel = undefined;
        var id = undefined;
        if (param1 instanceof EventSubscription)
        {
            channel = param1.channel;
            id = param1.id;

            // Mark that this sub has now been unsubbed.
            // This data should go back to the callers object
            // and if it calls this function again, nothing happens.
            param1.id = undefined;
        }
        else
        {
            channel = param1;
            id = param2;
        }
        if (channel === undefined || channel === null)
            return false;
        if (id === undefined || id === null)
            return false;

        var signal = this.signals[channel];
        if (signal === undefined)
            return false;

        var bindingIndex = signal._eventapi_subscribers[id];
        if (bindingIndex !== undefined && signal._bindings[bindingIndex] !== undefined)
        {
            // We cannot remove the binding until all are unsubscribed.
            // This would break our internal-to-signaljs index tracking.
            // Free and mark as inactive until this happens.
            signal._bindings[bindingIndex]._destroy();
            signal._bindings[bindingIndex].active = false;
            signal._eventapi_subscribers[id] = undefined            

            if (!this._hasActiveListeners(signal))
            {
                signal.dispose();
                signal = undefined;
                delete this.signals[channel];
            }
        }

        return true;
    },

    /**
        Removes all event subscribers from a channel. Be careful with this, best option would be to let your APIs users unsubscribe when they see fit.
        @method remove
        @param {String} channel Subscription channel name.
    */
    remove : function(channel)
    {
        var signal = this.signals[channel];
        if (signal !== undefined)
        {
            signal.dispose();
            signal = undefined;
            delete this.signals[channel];
        }
    },

    _numActiveListeners : function(signal)
    {
        var num = 0;
        for (var i = signal.getNumListeners() - 1; i >= 0; i--) 
        {
            if (signal._bindings[i].active)
                num++;
        };
        return num;
    },

    _hasActiveListeners : function(signal)
    {
        for (var i = signal.getNumListeners() - 1; i >= 0; i--) 
        {
            if (signal._bindings[i].active)
                return true;
        };
        return false;
    }
});




/**
    ConsoleAPI that is accessible from {{#crossLink "TundraClient/console:property"}}TundraClient.console{{/crossLink}}

    Provides registering and subscribing console commands.
    @class ConsoleAPI
    @constructor
*/
var ConsoleAPI = Class.$extend(
{
    __init__ : function(params)
    {
        this.commands = [];

        TundraSDK.framework.client.onLogInfo(this, this.logInfo);
        TundraSDK.framework.client.onLogWarning(this, this.logWarning);
        TundraSDK.framework.client.onLogError(this, this.logError);

        this.registerCommand("help", "Prints all available console commands", null, this, this.help);
    },

    /**
        Prints all available console commands to the UI console. Invoked by the 'help' console command.
        @method help
    */
    help : function()
    {
        if (this.commands.length <= 0)
            return;

        var longestCommand = 0;
        for (var i = 0; i < this.commands.length; ++i)
            if (this.commands[i].name.length > longestCommand)
                longestCommand = this.commands[i].name.length;

        var html = "";
        for (var i = 0; i < this.commands.length; ++i)
        {
            var commandData = this.commands[i];
            if (commandData.name === undefined || commandData.name === null)
                continue;
            var prettyName = commandData.name;
            while (prettyName.length < longestCommand)
                prettyName += " ";
            html += "  " + prettyName + (commandData.description !== "" ? " - " + commandData.description : "") + "<br/>";
            if (commandData.parameterDescription !== "")
            {
                var padding = "";
                while (padding.length < longestCommand)
                    padding += " ";
                html += padding + "     <span style='color:black;'>" + commandData.parameterDescription + "</span><br/>";
            }
        }

        var c = TundraSDK.framework.client;
        if (c.ui.console == null)
            return;

        var currentText = c.ui.console.html();
        c.ui.console.html(currentText + "<span style='color:brown;'>" + html + "</span>");
        if (c.ui.console.is(":visible"))
            c.ui.console.animate({ scrollTop: c.ui.console.prop("scrollHeight") }, { queue : false, duration : 350 });
    },

    /**
        Returns the closest matching console command.
        @method commandSuggestion
        @param {String} name Console command name you want to get suggestion for.
        @return {String|null} Null if suggestion is the same as input param or no suggestion was found, otherwise the suggestion as a string.
    */
    commandSuggestion : function(name)
    {
        var nameLower = name.toLowerCase();
        for (var i = 0; i < this.commands.length; ++i)
            if (this.commands[i].name.toLowerCase() === nameLower)
                return null;
        for (var i = 0; i < this.commands.length; ++i)
            if (this.commands[i].name.toLowerCase().indexOf(nameLower) === 0)
                return this.commands[i].name;
        return null;
    },

    getCommandData : function(name)
    {
        var nameLower = name.toLowerCase();
        for (var i = 0; i < this.commands.length; ++i)
            if (this.commands[i].name.toLowerCase() === nameLower)
                return this.commands[i];
        return null;
    },

    /**
        Register a new console command. If a console command with this name (case-insensitive) has already been registered, your callback will be connected.

            function onDoMagic(parameterArray)
            {
                var str  = parameterArray[0]; // Expecting a string
                var num  = parseInt(parameterArray[1]); // Expecting a number
                var bool = (parameterArray[2] === "true" ? true : false); // Expecting a boolean
            }

            TundraSDK.framework.console.registerCommand("doMagic", "Does magical things!", "string, number, boolean", null, onDoMagic);

        @method registerCommand
        @param {String} name Console command name.
        @param {String} description Description on what the command does.
        @param {String|null} parameterDescription Description of the parameters needed for invokation as a string eg.
        "number, string, boolean". Pass in null or empty string if you don't want parameters. Note: These are just hints
        to the user, don't make any assumptions about the correctness of the parameters in your callback.
        @param {Object} receiverContext Context of in which the callback function is executed. Can be null.
        @param {Function} receiverCallback Function to be called. There will be single parameter of an Array to your callback when the
        command is invoked. All the parameters will be of type string. You need to do conversions if needed.
        @return {null|EventSubscription} Subscription data or null if failed to subscribe to the command.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    registerCommand : function(name, description, parameterDescription, receiverContext, receiverCallback)
    {
        if (typeof name !== "string")
        {
            TundraSDK.framework.client.logError("[ConsoleAPI]: registerCommand 'name' parameter must be a non empty string!", true);
            return null;
        }
        var existing = this.getCommandData(name);
        if (existing != null)
            return this.subscribeCommand(name, receiverContext, receiverCallback);

        if (description === undefined || description === null)
            description = "";
        if (parameterDescription === undefined || parameterDescription === null)
            parameterDescription = "";

        var index = this.commands.length;
        this.commands.push({
            "channel"     : "ConsoleAPI." + index,
            "index"       : index,
            "name"        : name,
            "description" : description,
            "parameterDescription" : parameterDescription
        });

        return this.subscribeCommand(name, receiverContext, receiverCallback);
    },

    /**
        Subscribe to a existing console command.

            TundraSDK.framework.console.registerCommand("doStuff", null, function() {
                TundraSDK.framework.client.logInfo("Doing stuff!");
            });

        @method subscribeCommand
        @param {String} name Console command name.
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called. There will be single parameter of an Array to your callback when the
        command is invoked. All the parameters will be of type string. You need to do conversions if needed.
        @return {null|EventSubscription} Subscription data or null if failed to subscribe to the command.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    subscribeCommand : function(name, context, callback)
    {
        if (callback === undefined || callback === null)
            return null;

        var commandData = this.getCommandData(name);
        if (commandData != null)
            return TundraSDK.framework.events.subscribe(commandData.channel, context, callback);
        return null;
    },

    /**
        Tries to parse a raw string for a console command name and potential parameters and executes it.
        @method executeCommandRaw
        @param {String} Raw console command string with porential parameters eg. "drawDebug (true, 12)" or "drawDebug true, 12".
        @return {Boolean} If a command could be executed with the input. */
    executeCommandRaw : function(str)
    {
        str = CoreStringUtils.trim(str);
        var name = str;
        var params = "";
        if (str.indexOf("(") != -1)
        {
            name = CoreStringUtils.trim(str.substring(0, str.indexOf("(")));
            params = CoreStringUtils.trim(str.substring(str.indexOf("(")+1));
        }
        if (params === "" && str.indexOf(" ") != -1)
        {
            name = CoreStringUtils.trim(str.substring(0, str.indexOf(" ")));
            params = CoreStringUtils.trim(str.substring(str.indexOf(" ")+1));
        }
        if (params.indexOf(")") != -1)
            params = params.substring(0, params.indexOf(")"));

        name = CoreStringUtils.trim(name);
        params = (params !== "" ? CoreStringUtils.trim(params).split(",") : [])
        var result = this.executeCommand(name, params);
        if (!result)
            TundraSDK.framework.client.logError("Could not find console command '" + name + "'");
        return result;
    },

    /**
        Executes a console command by name.
        @method executeCommand
        @param {String} name Console command name to execute.
        @param {Array} parameters Array of parameter strings (or other typed objects if you know the command handler knows how to deal with them).
        @return {Boolean} True if command could be found by the name and was executed, false otherwise. */
    executeCommand : function(name, parameters)
    {
        var commandData = this.getCommandData(name);
        if (commandData != null)
            TundraSDK.framework.events.send(commandData.channel, parameters);
        return (commandData != null);
    },

    /**
        Log information to the UI console. See also {{#crossLink "TundraClient/logInfo:method"}}TundraClient.logInfo{{/crossLink}}.
        @method logInfo
        @param {String} message Message string.
    */
    logInfo : function(message)
    {
        var c = TundraSDK.framework.client;
        if (c.ui != null && c.ui.console != null)
        {
            var currentText = c.ui.console.html();
            c.ui.console.html(currentText + message + "<br />");
            if (c.ui.console.is(":visible"))
                c.ui.console.animate({ scrollTop: c.ui.console.prop("scrollHeight") }, { queue : false, duration : 350 });
        }
    },

    /**
        Log information to the UI console. See also {{#crossLink "TundraClient/logWarning:method"}}TundraClient.logWarning{{/crossLink}}.
        @method logWarning
        @param {String} message Message string.
    */
    logWarning : function(message)
    {
        var c = TundraSDK.framework.client;
        if (c.ui != null && c.ui.console != null)
        {
            var currentText = c.ui.console.html();
            c.ui.console.html(currentText + "<span style='color: rgb(119,101,0);'>" + message + "</span><br />");
            if (c.ui.console.is(":visible"))
                c.ui.console.animate({ scrollTop: c.ui.console.prop("scrollHeight") }, { queue : false, duration : 350 });
        }
    },

    /**
        Log information to the UI console. See also {{#crossLink "TundraClient/logError:method"}}TundraClient.logError{{/crossLink}}.
        @method logError
        @param {String} message Message string.
    */
    logError : function(message)
    {
        var c = TundraSDK.framework.client;
        if (c.ui != null && c.ui.console != null)
        {
            var currentText = c.ui.console.html();
            c.ui.console.html(currentText + "<span style='color: red;'>" + message + "</span><br />");
            if (c.ui.console.is(":visible"))
                c.ui.console.animate({ scrollTop : c.ui.console.prop("scrollHeight") }, { queue : false, duration : 350 });
        }
    }
});




/**
    AttributeChange contains enumeration of attribute/component change types for replication.
    @example
        var changeMode = AttributeChange.LocalOnly;</pre>
    @class AttributeChange
*/
var AttributeChange = Class.$extend(
{
    __init__ : function()
    {
    },

    __classvars__ :
    {
        /**
            Use the current sync method specified in the IComponent this attribute is part of.
            @property Default
            @final
            @static
            @type Number
            @default 0
        */
        Default         : 0,
        /**
            The value will be changed, but no notifications will be sent (even locally).
            This is useful when you are doing batch updates of several attributes at a
            time and want to minimize the amount of re-processing that is done.
            @property Disconnected
            @final
            @static
            @type Number
            @default 1
        */
        Disconnected    : 1,
        /**
            The value change will be signalled locally immediately after the change occurs,
            but it is not sent to the network.
            @property LocalOnly
            @final
            @static
            @type Number
            @default 2
        */
        LocalOnly       : 2,
        /**
            Replicate: After changing the value, the change will be signalled locally and this
            change is transmitted to the network as well.
            @property Replicate
            @final
            @static
            @type Number
            @default 3
        */
        Replicate       : 3
    }
});




/**
    Color object that holds red, green, blue and alpha values.
    Range for the color components is [0,1].

    @class Color
    @constructor
    @param {Number} [r=0] Red.
    @param {Number} [g=0] Green.
    @param {Number} [b=0] Blue.
    @param {Number} [a=0] Alpha.
*/
var Color = Class.$extend(
{
    __init__ : function(r, g, b, a)
    {
        /**
            Red
            @property r
            @type Number
        */
        this.r = r || 0;
        /**
            Green
            @property g
            @type Number
        */
        this.g = g || 0;
        /**
            Blue
            @property b
            @type Number
        */
        this.b = b || 0;
        /**
            Alpha
            @property a
            @type Number
        */
        this.a = a || 0;
    },

    __classvars__ :
    {
        /**
            Constructs a color from string. Supports rgb(x,x,x) and #xxxxxx.
            @static
            @method fromString
            @param {String} str
            @return {Color}
        */
        fromString : function(str)
        {
            // rgb(255,0,0)
            if (/^rgb\((\d+), ?(\d+), ?(\d+)\)$/i.test(str))
            {
                var parts = /^rgb\((\d+), ?(\d+), ?(\d+)\)$/i.exec(str);
                var r = parseInt(parts[1]);
                var g = parseInt(parts[2]);
                var b = parseInt(parts[3]);

                // [0,255] to [0,1]
                if (r > 1.0) r =  Math.min(255, r) / 255;
                if (g > 1.0) g =  Math.min(255, g) / 255;
                if (b > 1.0) b =  Math.min(255, b) / 255;
                return new Color(r, g, b);
            }
            // #ff0000
            else if ( /^\#([0-9a-f]{6})$/i.test(str))
            {
                var parts = /^\#([0-9a-f]{6})$/i.exec(str);
                return Color.fromHex(parseInt(parts[1], 16));
            }
            else
                console.error("[Color]: fromString() string format not supported:", str);
            return null;
        },

        /**
            Constructs a color from hex value.
            @static
            @method fromHex
            @param {Number} hex
            @return {Color}
        */
        fromHex : function(hex)
        {
            hex = Math.floor(hex);
            var r = ( hex >> 16 & 255 ) / 255;
            var g = ( hex >> 8 & 255 ) / 255;
            var b = ( hex & 255 ) / 255;
            return new Color(r, g, b);
        }
    },

    /**
        Returns a clone of this color.
        @method clone
        @return {Color}
    */
    clone : function()
    {
        return new Color(this.r, this.g, this.b, this.a);
    },

    setRGBA : function(_r, _g, _b, _a)
    {
        this.r = _r || this.r;
        this.g = _g || this.g;
        this.b = _b || this.b;
        this.a = _a || this.a;
    },

    /**
        Returns this color as THREE.Color. Note: Three.Color does not have the alpha color component.
        @method toThreeColor
        @return {THREE.Color}
    */
    toThreeColor : function()
    {
        var threeColor = new THREE.Color();
        threeColor.setRGB(this.r, this.g, this.b);
        return threeColor;
    },

    toHex : function()
    {

    },

    /**
        Returns this Color as a string for logging purpouses.
        @method toString
        @return {String} The Color as a string.
    */
    toString: function()
    {
        return "rgba(" + this.r + ", " + this.g + ", " + this.b + ", " + this.a + ")";
    }
});




/**
    Transform object that contains position, rotation and scale.

    @class Transform
    @constructor
    @param {Three.Vector3} [pos=THREE.Vector3(0,0,0)] Position.
    @param {Three.Vector3} [rot=THREE.Vector3(0,0,0)] Rotation in degrees.
    @param {Three.Vector3} [scale=THREE.Vector3(1,1,1)] Scale.
*/
var Transform = Class.$extend(
{
    __init__ : function(pos, rot, scale)
    {
        this.log = TundraLogging.getLogger("Transform");

        if (pos !== undefined && !(pos instanceof THREE.Vector3))
            this.log.warn("Constructor 'pos' parameter is not a THREE.Vector3", pos);
        if (rot !== undefined && !(pos instanceof THREE.Vector3))
            this.log.warn("Constructor 'rot' parameter is not a THREE.Vector3", rot);
        if (scale !== undefined && !(pos instanceof THREE.Vector3))
            this.log.warn("Constructor 'scale' parameter is not a THREE.Vector3", scale);

        // "Private" internal data. Actual access from 'pos', 'rot' and 'scale'.
        this._pos = (pos instanceof THREE.Vector3 ? pos : new THREE.Vector3(0,0,0));
        this._rot = (rot instanceof THREE.Vector3 ? rot : new THREE.Vector3(0,0,0));
        this._scale = (scale instanceof THREE.Vector3 ? scale : new THREE.Vector3(1,1,1));

        // Automatic euler/quaternion updates when our Tundra angle rotation is changed.
        this._rotEuler = new THREE.Euler(THREE.Math.degToRad(this._rot.x),
            THREE.Math.degToRad(this._rot.y), THREE.Math.degToRad(this._rot.z),
            "ZYX" // This is important for Quaternions to be correctly produced from our euler.
        );

        /**
            Position
            @property pos
            @type THREE.Vector3
        */
        /**
            Specifies the rotation of this transform in *degrees*, using the Euler XYZ convention.
            @property rot
            @type THREE.Vector3
        */
        /**
            Scale
            @property scale
            @type THREE.Vector3
        */
        Object.defineProperties(this, {
            "pos" : {
                get : function ()      { return this._pos; },
                set : function (value) { this.setPosition(value); }
            },
            "rot" : {
                get : function ()      { return this._rot; },
                set : function (value) { this.setRotation(value); }
            },
            "scale" : {
                get : function ()      { return this._scale; },
                set : function (value) { this.setScale(value); }
            }
        });
    },

    /**
        Adjusts this transforms orientation so its looking at the passed in position.
        @method lookAt
        @param {THREE.Vector3} eye
        @param {THREE.Vector3} target
    */
    lookAt : function(eye, target)
    {
        if (this._orientationMatrix === undefined)
            this._orientationMatrix = new THREE.Matrix4();
        this._orientationMatrix.makeTranslation(0,0,0);
        this._orientationMatrix.lookAt(eye, target, TundraSDK.framework.renderer.axisY);

        this.setRotation(new THREE.Quaternion().setFromRotationMatrix(this._orientationMatrix));
    },

    /**
        Returns orientation of this Transform as a quaternion.
        @method orientation
        @return {THREE.Quaternion} Orientation.
    */
    orientation : function()
    {
        this._updateEuler();

        var quat = new THREE.Quaternion();
        quat.setFromEuler(this._rotEuler, false);
        return quat;
    },

    _updateEuler : function()
    {
        this._rotEuler.set(
            THREE.Math.degToRad(this._rot.x % 360.0),
            THREE.Math.degToRad(this._rot.y % 360.0),
            THREE.Math.degToRad(this._rot.z % 360.0)
        );
    },

    /**
        Returns orientation of this Transform as euler angle.
        @method euler
        @return {THREE.Euler} Orientation.
    */
    euler : function()
    {
        this._updateEuler();
        return this._rotEuler.clone();
    },

    /**
        Set position.
        @method setPosition
        @param {THREE.Vector3} vector Position vector.
    */
    /**
        Set position.
        @method setPosition
        @param {Number} x
        @param {Number} y
        @param {Number} z
    */
    setPosition : function(x, y, z)
    {
        if (x instanceof THREE.Vector3)
        {
            this._pos.copy(x);
        }
        else if (typeof x === "number" && typeof y === "number" && typeof z === "number")
        {
            this._pos.x = x;
            this._pos.y = y;
            this._pos.z = z;
        }
        else
            this.log.error("setPosition must be called with a single Three.Vector3 or x,y,z with type of number.", x, y, z);
    },

    /**
        Set rotation.
        @method setRotation
        @param {THREE.Vector3} vector Rotation vector in angles.
    */
    /**
        Set rotation.
        @method setRotation
        @param {THREE.Quaternion} quaternion Rotation quaternion.
    */
    /**
        Set rotation.
        @method setRotation
        @param {THREE.Euler} euler Rotation in radians.
    */
    /**
        Set rotation.
        @method setRotation
        @param {Number} x X-axis degrees.
        @param {Number} y Y-axis degrees.
        @param {Number} z Z-axis degrees.
    */
    setRotation : function(x, y, z)
    {
        if (x instanceof THREE.Vector3)
            this._rot.copy(x);
        else if (x instanceof THREE.Quaternion)
        {
            /// @todo Is this now incorrect as this._rotEuler order is "ZYX"?
            this._rotEuler.setFromQuaternion(x.normalize(), undefined, false);
            this._rot.x = THREE.Math.radToDeg(this._rotEuler.x) % 360.0;
            this._rot.y = THREE.Math.radToDeg(this._rotEuler.y) % 360.0;
            this._rot.z = THREE.Math.radToDeg(this._rotEuler.z) % 360.0;
        }
        else if (x instanceof THREE.Euler)
        {
            this._rot.x = THREE.Math.radToDeg(x.x) % 360.0;
            this._rot.y = THREE.Math.radToDeg(x.y) % 360.0;
            this._rot.z = THREE.Math.radToDeg(x.z) % 360.0;
        }
        else if (typeof x === "number" && typeof y === "number" && typeof z === "number")
        {
            this._rot.x = x;
            this._rot.y = y;
            this._rot.z = z;
        }
        else
            this.log.error("setRotation must be called with a single Three.Vector3, THREE.Quaternion or x,y,z with type of number.", x, y, z);
    },

    setScale : function(x, y, z)
    {
        if (x instanceof THREE.Vector3)
        {
            this._scale.copy(x);
        }
        else if (typeof x === "number" && typeof y === "number" && typeof z === "number")
        {
            this._scale.x = x;
            this._scale.y = y;
            this._scale.z = z;
        }
        else
            this.log.error("setScale must be called with a single Three.Vector3 or x,y,z with type of number.", x, y, z);
        return false;
    },

    /**
        Returns a clone of this transform.
        @method clone
        @return {Transform} Transform.
    */
    clone : function()
    {
        return new Transform(this.pos.clone(), this.rot.clone(), this.scale.clone());
    },

    /**
        Returns this Transform as a string for logging purposes.
        @method toString
        @return {String} The Transform as a string.
    */
    toString : function(compressed)
    {
        if (compressed === undefined)
            compressed = false;
        var str = this.pos.x +   " " + this.pos.y +   " " + this.pos.z + " | " +
                  this.rot.x +   " " + this.rot.y +   " " + this.rot.z + " | " +
                  this.scale.x + " " + this.scale.y + " " + this.scale.z;
        if (!compressed)
            str = "Transform(" + str + ")";
        return str;
    }
});




/**
    Attributes are networks syncronized variables in entity components.

    This class is responsible, in combination with {{#crossLink "IComponent"}}IComponent{{/crossLink}},
    of the deserializing the network data sent by the server.

    This class should never be instantiated directly. If you are implementing a component use
    {{#crossLink "IComponent/declareAttribute:method"}}IComponent.declareAttribute{{/crossLink}}
    to declare your components static structure.

    @class Attribute
*/
var Attribute = Class.$extend(
{
    __init__ : function(owner, index, name, value, typeId)
    {
        /**
            Component that owns this attribute.
            @property owner
            @type IComponent
        */
        this.owner = owner;
        /**
            Attribute index. Unique for the parent component.
            @property index
            @type Number
        */
        this.index = index;
        /**
            Attribute name.
            @property name
            @type String
        */
        this.name = name;
        /**
            Attribute id. Currently unused in Web Tundra.
            @property id
            @type Number
            @default undefined
        */
        this.id = undefined;
        /**
            Attribute value.
            @property value
            @type Object
        */
        this.value = value;
        /**
            Attribute type id.
            @property typeId
            @type Number
        */
        this.typeId = typeId;
        /**
            Attribute type name.
            @property typeName
            @type String
        */
        this.typeName = Attribute.toTypeName(typeId);
        /**
            Attribute size in bytes. For String, AssetReference, AssetReferenceList,
            EntityReference, QVariant and QVariantList size will be 'undefined'.
            Exact size is determined during network deserialization.
            @property sizeBytes
            @type Number
        */
        this.sizeBytes = Attribute.sizeInBytes(typeId);
        /**
            Attribute header size. Reading the header will determine the attribute byte
            size during network deserialization. Note that sizeBytes will still be 'undefined'
            even after the size has been resolved.
            @property headerSizeBytes
            @type Number
        */
        this.headerSizeBytes = Attribute.headerSizeInBytes(typeId);
    },

    __classvars__ :
    {
        None                : 0,
        /**
            Attribute type id for String.

                typeof attribute.get() === "string";

            @property String
            @final
            @static
            @type Number
            @default 1
        */
        String              : 1,
        /**
            Attribute type id for Int.

                typeof attribute.get() === "number";

            @property Int
            @final
            @static
            @type Number
            @default 2
        */
        Int                 : 2,
        /**
            Attribute type id for Real.

                typeof attribute.get() === "number";

            @property Real
            @final
            @static
            @type Number
            @default 3
        */
        Real                : 3,
        /**
            Attribute type id for Color.

                typeof attribute.get() === "object";
                attribute.get() instanceof Color === true;

            @property Color
            @final
            @static
            @type Number
            @default 4
        */
        Color               : 4,
        /**
            Attribute type id for Float2.

                typeof attribute.get() === "object";
                attribute.get() instanceof THREE.Vector2 === true;

            @property Float2
            @final
            @static
            @type Number
            @default 5
        */
        Float2              : 5,
        /**
            Attribute type id for Float3.

                typeof attribute.get() === "object";
                attribute.get() instanceof THREE.Vector3 === true;

            @property Float3
            @final
            @static
            @type Number
            @default 6
        */
        Float3              : 6,
        /**
            Attribute type id for Float4.

                typeof attribute.get() === "object";
                attribute.get() instanceof THREE.Vector4 === true;

            @property Float4
            @final
            @static
            @type Number
            @default 7
        */
        Float4              : 7,
        /**
            Attribute type id for Bool.

                typeof attribute.get() === "boolean";

            @property Bool
            @final
            @static
            @type Number
            @default 8
        */
        Bool                : 8,
        /**
            Attribute type id for UInt.

                typeof attribute.get() === "number";

            @property UInt
            @final
            @static
            @type Number
            @default 9
        */
        UInt                : 9,
        /**
            Attribute type id for Quat.

                typeof attribute.get() === "number";
                attribute.get() instanceof THREE.Quaternion === true;

            @property Quat
            @final
            @static
            @type Number
            @default 10
        */
        Quat                : 10,
        /**
            Attribute type id for AssetReference.

                typeof attribute.get() === "string";

            @property AssetReference
            @final
            @static
            @type Number
            @default 11
        */
        AssetReference      : 11,
        /**
            Attribute type id for AssetReferenceList.

                typeof attribute.get() === "object";
                typeof attribute.get()[0] === "string";
                Array.isArray(attribute.get()) === true;

            @property AssetReferenceList
            @final
            @static
            @type Number
            @default 12
        */
        AssetReferenceList  : 12,
        /**
            Attribute type id for EntityReference.

                typeof attribute.get() === "string";

            @property EntityReference
            @final
            @static
            @type Number
            @default 13
        */
        EntityReference     : 13,
        /**
            Attribute type id for QVariant.

                typeof attribute.get() === "string";

            @property QVariant
            @final
            @static
            @type Number
            @default 14
        */
        QVariant            : 14,
        /**
            Attribute type id for QVariantList.

                typeof attribute.get() === "object";
                typeof attribute.get()[0] === "string";
                Array.isArray(attribute.get()) === true;

            @property QVariantList
            @final
            @static
            @type Number
            @default 15
        */
        QVariantList        : 15,
        /**
            Attribute type id for Transform.

                typeof attribute.get() === "object";
                attribute.get() instanceof Transform === true;

            @property String
            @final
            @static
            @type Transform
            @default 16
        */
        Transform           : 16,
        /**
            Attribute type id for QPoint.

                typeof attribute.get() === "object";
                attribute.get() instanceof THREE.Vector2 === true;

            @property QPoint
            @final
            @static
            @type Number
            @default 17
        */
        QPoint              : 17,

        /**
            Returns list of available attribute type names.

            <b>Note:</b> This function creates a new list that you can manipulate. You can use {{#crossLink "Attribute/typeNameList:property"}}{{/crossLink}}
            for faster access but be sure that you don't modify the list!
            @method typeNames
            @static
            @return {Array} Available attribute type names list.
        */
        typeNames : function()
        {
            var clone = [];
            for (var i=0; i<Attribute.typeNameList.length; ++i)
                clone.push(Attribute.typeNameList[i]);
            return clone;
        },

        /**
            Returns list of available attribute type ids.

            <b>Note:</b> This function creates a new list that you can manipulate. You can use {{#crossLink "Attribute/typIdList:property"}}{{/crossLink}}
            for faster access but be sure that you don't modify the list!
            @method typeIds
            @static
            @return {Array} Available attribute type ids list.
        */
        typeIds : function()
        {
            var clone = [];
            for (var i=0; i<Attribute.typIdList.length; ++i)
                clone.push(Attribute.typIdList[i]);
            return clone;
        },

        /**
            Returns attribute type name for a type id.
            @method toTypeName
            @static
            @param {Number} typeId Attribute type id.
            @return {String} Attribute type name.
        */
        toTypeName : function(typeId)
        {
            if (typeof typeId !== "number")
            {
                TundraLogging.getLogger("Attribute").error("toTypeName function called with non number 'typeId'", typeId);
                return null;
            }
            switch (typeId)
            {
                case 1: return "String";
                case 2: return "Int";
                case 3: return "Real";
                case 4: return "Color";
                case 5: return "Float2";
                case 6: return "Float3";
                case 7: return "Float4";
                case 8: return "Bool";
                case 9: return "Uint";
                case 10: return "Quat";
                case 11: return "AssetReference";
                case 13: return "EntityReference";
                case 12: return "AssetReferenceList";
                case 15: return "QVariantList";
                case 14: return "QVariant";
                case 16: return "Transform";
                case 17: return "QPoint";
            }
            return null;
        },

        /**
            Returns attribute type id for a type name.
            @method toTypeId
            @static
            @param {String} typeName Attribute type name.
            @return {Number} Attribute type id.
        */
        toTypeId : function(typeName)
        {
            if (typeof typeName !== "string")
            {
                TundraLogging.getLogger("Attribute").error("toTypeId function called with non string 'typeName'", typeName);
                return null;
            }
            var typeNameLower = typeName.toLowerCase();
            if (typeNameLower === "string") return 1;
            else if (typeNameLower === "int") return 2;
            else if (typeNameLower === "eeal") return 3;
            else if (typeNameLower === "color") return 4;
            else if (typeNameLower === "float2") return 5;
            else if (typeNameLower === "float3") return 6;
            else if (typeNameLower === "float4") return 7;
            else if (typeNameLower === "bool") return 8;
            else if (typeNameLower === "uint") return 9;
            else if (typeNameLower === "quat") return 10;
            else if (typeNameLower === "assetreference") return 11;
            else if (typeNameLower === "entityreference") return 12;
            else if (typeNameLower === "assetreferencelist") return 13;
            else if (typeNameLower === "qvariantlist") return 14;
            else if (typeNameLower === "qvariant") return 15;
            else if (typeNameLower === "transform") return 16;
            else if (typeNameLower === "qpoint") return 17;
            return null;
        },

        /**
            List of all available attribute type names.

            <b>Note:</b> If you need a mutable list use {{#crossLink "Attribute/typeNames:method"}}{{/crossLink}}.
            @property typeNameList
            @final
            @static
            @type Array
        */
        typeNameList :
        [
                "String",       "Int",      "Real",             "Color",
                "Float2",       "Float3",   "Float4",           "Bool",
                "Uint",         "Quat",     "EntityReference",  "AssetReferenceList",
                "QVariantList", "QVariant", "Transform",        "QPoint"
        ],

        /**
            List of all available attribute type ids.

            <b>Note:</b> If you need a mutable list use {{#crossLink "Attribute/typeIds:method"}}{{/crossLink}}.
            @property typIdList
            @final
            @static
            @type Array
        */
        typIdList :
        [
             1,  2,  3,  4,  5,  6,  7,  8,
             9,  10, 11, 12, 13, 14, 15, 16, 17
        ],

        /**
            Returns the size of an attribute in bytes. For String, AssetReference, AssetReferenceList,
            EntityReference, QVariant and QVariantList this function returns 'undefined'.
            @method sizeInBytes
            @static
            @param {Number} typeId Attribute type id.
            @return {Number|undefined} Size in bytes or undefined.
        */
        sizeInBytes : function(typeId)
        {
            switch (typeId)
            {
                // String
                case 1:
                    return undefined;
                // Int
                case 2:
                    return 4;
                // Real
                case 3:
                    return 4;
                // Color
                case 4:
                    return 4*4;
                // Float2
                case 5:
                    return 2*4;
                // Float3
                case 6:
                    return 3*4;
                // Float4
                case 7:
                    return 4*4;
                // Bool
                case 8:
                    return 1;
                // Uint
                case 9:
                    return 4;
                // Quat
                case 10:
                    return 4*4;
                // AssetReference
                case 11:
                // EntityReference
                case 13:
                // AssetReferenceList
                case 12:
                // QVariantList
                case 15:
                // QVariant
                case 14:
                    return undefined;
                // Transform
                case 16:
                    return 9*4;
                // QPoint
                case 17:
                    return 2*4;
            }
            TundraLogging.getLogger("Attribute").error("Unknown attribute type id " + typeId + ". Cannot resolve size in bytes!");
            return undefined;
        },

        /**
            Returns the pre-known header size for an attribute type,
            if one is needed for the network deserialization.
            @method headerSizeInBytes
            @static
            @param {Number} typeId Attribute type id.
            @return {Number} Size in bytes.
        */
        headerSizeInBytes : function(typeId)
        {
            switch (typeId)
            {
                /* String ref with 2 byte header as the length. */
                // String
                case 1:
                    return 2;

                /* String ref with 1 byte header as the length. */
                // AssetReference
                case 11:
                // EntityReference
                case 13:
                    return 1;

                /* String list with 1 byte header as the list lenght.
                   Each string has their own 1 byte header as the lenght. */
                // AssetReferenceList
                case 12:
                // QVariantList
                case 15:
                    return 1;

                /* QVariant is just converted to a string so,
                   string value with 1 byte header as the length. */
                // QVariant
                case 14:
                    return 1;
            }
            return 0;
        },

        /**
            Returns a default "empty" value for a type id.
            @method defaultValueForType
            @static
            @param {Number} typeId Attribute type id.
            @return {Object}
        */
        defaultValueForType : function(typeId)
        {
            switch (typeId)
            {
                // String
                case 1:
                    return "";
                // Int
                case 2:
                // Uint
                case 9:
                    return 0;
                // Real
                case 3:
                    return 0.0;
                // Color
                case 4:
                    return new Color();
                // Float2
                case 5:
                // QPoint
                case 17:
                    return new THREE.Vector2(0, 0);
                // Float3
                case 6:
                    return new THREE.Vector3(0, 0, 0);
                // Float4
                case 7:
                    return new THREE.Vector4(0, 0, 0, 0);
                // Bool
                case 8:
                    return false;
                // Quat
                case 10:
                    return new THREE.Quaternion();
                // AssetReference
                case 11:
                // EntityReference
                case 13:
                // QVariant
                case 14:
                    return "";
                // AssetReferenceList
                case 12:
                // QVariantList
                case 15:
                    return [];
                // Transform
                case 16:
                    return new Transform();
            }
            TundraLogging.getLogger("Attribute").error("defaultValueForType() Unknown attribute type id " + typeId);
            return null;
        }
    },

    _reset : function()
    {
        this.owner = null;
        this.index = null;
        this.name = null;
        this.id = null;
        this.value = null;
        this.typeId = null;
        this.typeName = null;
        this.sizeBytes = null;
        this.headerSizeBytes = null;
    },

    /**
        Returns full infromation about this attribute as a string.
        @method toString
        @return {String} Data string.
    */
    toString : function()
    {
        return "index=" + this.index + " name=" + this.name + " typeId=" + this.typeId +
               " typeName=" + this.typeName + " size=" + this.sizeBytes + " header=" + this.headerSizeBytes + " value=" + this.value.toString();
    },

    /**
        Returns attribute value.

        <b>Note:</b> This function can return a reference depending on the attribute type.
        Even if it is a reference the any change signaling wont happen if the value is changes.
        You must use {{#crossLink "Attribute/set:method"}}set(){{/crossLink}} to make a
        permanent signaled and (potentially) network replicated change.

        Use {{#crossLink "Attribute/getClone:method"}}getClone(){{/crossLink}} if you want to be
        sure you are not changing the internal state by modifying a reference.

        @method get
        @return {Object} Attribute value.
    */
    get : function()
    {
        return this.value;
    },

    /**
        Returns clone of the attribute value. This ensures you are not changing
        the internal state by accidentally modifying a reference.

        See also {{#crossLink "Attribute/get:method"}}get(){{/crossLink}}.
        @method getClone
        @return {Object} Clone of the attribute value.
    */
    getClone : function()
    {
        // Handles Transform and Color with our clone() implemention.
        // Handles QPoint, Float2, Float3, Float4, and Quat with three.js clone() implemention.
        if (typeof this.value.getClone === "function")
            return this.value.getClone();
        if (typeof this.value.clone === "function")
            return this.value.clone();

        // Handles QVariant, String, AssetReference, EntityReference, Bool, Int, UInt and Real
        var typeOfValue = typeof this.value;
        if (typeOfValue === "string" || typeOfValue === "boolean" || typeOfValue === "number")
            return this.value;
        // Handles AssetReferenceList and QVariantList
        else if (Array.isArray(this.value))
        {
            var attrClone = new Array();
            for (var i = 0; i < this.value.length; i++)
                attrClone.push(this.value[i]);
            return attrClone;
        }

        TundraLogging.getLogger("Attribute").warn("getClone() not implemented for type", this.typeName, typeOfValue);
        TundraLogging.getLogger("Attribute").warn(this);
        return this.value;
    },

    /**
        Set attribute value.

        @method set
        @param {Object} New attribute value.
        @param {AttributeChange} [change=AttributeChange.Default] Attribute change signaling mode.
        Note: Only AttributeChange.LocalOnly is supported at the moment!
        @return {Boolean} True if set was successful, false othewise.
    */
    set : function(value, change)
    {
        if (change === undefined || change === null)
            change = AttributeChange.Default;
        if (typeof change !== "number")
        {
            TundraLogging.getLogger("Attribute").error("set called with non-number change type: " + change);
            return false;
        }

        // Read default change type from parent component.
        if (change === AttributeChange.Default)
            change = (this.owner != null && this.owner.replicated ? AttributeChange.Replicate : AttributeChange.LocalOnly);

        this.value = value;

        if (this.owner != null && change !== AttributeChange.Disconnected)
            this.owner._attributeChanged(this, change);
        return true;
    },

    /**
        Registers a callback for changed event originating for this attribute.

        Also see {{#crossLink "IComponent/onAttributeChanged:method"}}{{/crossLink}} for a more generic change event on a component.

        @example
            var entity = TundraSDK.framework.scene.entityById(12);
            if (entity == null || entity.placeable == null)
                return;

            entity.placeable.getAttribute("transform").onChanged(null, function(newAttributeValue) {
                // instenceof newAttributeValue === Transform
                console.log("Transform changed to: " + newAttributeValue.toString());
            });

        @method onAttributeChanged
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription|null} Subscription data or null if parent entity or component not set.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onChanged : function(context, callback)
    {
        if (this.owner == null || !this.owner.hasParentEntity())
        {
            TundraLogging.getLogger("Attribute").error("Cannot subscribe onChanged, parent component or parent entity not set!");
            return null;
        }

        return TundraSDK.framework.events.subscribe("Scene.AttributeChanged." + this.owner.parentEntity.id.toString() + "." +
            this.owner.id.toString() + "." + this.index.toString(), context, callback);
    },

    headerFromBinary : function(ds)
    {
        if (this.headerSizeBytes > 0)
        {
            if (this.headerSizeBytes === 1)
                return ds.readU8();
            else if (this.headerSizeBytes === 2)
                return ds.readU16();
        }
        return undefined;
    },

    dataFromBinary : function(ds, len)
    {
        /// @todo Pass utf8=true when invoking readString* funcs.
        /// It will be added to Tundra at some point. 'String' type is already UTF8.

        // Parse data
        switch (this.typeId)
        {
            // String
            case 1:
            {
                this.set(ds.readString(len, true), AttributeChange.LocalOnly);
                break;
            }
            // AssetReference
            case 11:
            // EntityReference
            case 13:
            // QVariant
            case 14:
            {
                this.set(ds.readString(len), AttributeChange.LocalOnly);
                break;
            }
            // Int
            case 2:
            {
                this.set(ds.readS32(), AttributeChange.LocalOnly);
                break;
            }
            // Real
            case 3:
            {
                this.set(ds.readFloat32(), AttributeChange.LocalOnly);
                break;
            }
            // Color
            case 4:
            {
                this.value.r = ds.readFloat32();
                this.value.g = ds.readFloat32();
                this.value.b = ds.readFloat32();
                this.value.a = ds.readFloat32();
                this.set(this.value, AttributeChange.LocalOnly);
                break;
            }
            // Float2
            case 5:
            {
                this.value.x = ds.readFloat32();
                this.value.y = ds.readFloat32();
                this.set(this.value, AttributeChange.LocalOnly);
                break;
            }
            // Float3
            case 6:
            {
                this.value.x = ds.readFloat32();
                this.value.y = ds.readFloat32();
                this.value.z = ds.readFloat32();
                this.set(this.value, AttributeChange.LocalOnly);
                break;
            }
            // Float4
            case 7:
            {
                this.value.x = ds.readFloat32();
                this.value.y = ds.readFloat32();
                this.value.z = ds.readFloat32();
                this.value.w = ds.readFloat32();
                this.set(this.value, AttributeChange.LocalOnly);
                break;
            }
            // Bool
            case 8:
            {
                this.set(ds.readBoolean(), AttributeChange.LocalOnly);
                break;
            }
            // Uint
            case 9:
            {
                this.set(ds.readU32(), AttributeChange.LocalOnly);
                break;
            }
            // Quat
            case 10:
            {
                this.value.x = ds.readFloat32();
                this.value.y = ds.readFloat32();
                this.value.z = ds.readFloat32();
                this.value.w = ds.readFloat32();
                this.set(this.value, AttributeChange.LocalOnly);
                break;
            }
            // AssetReferenceList
            case 12:
            // QVariantList
            case 15:
            {
                this.value = [];
                for (var i=0; i<len; ++i)
                    this.value.push(ds.readStringU8());
                this.set(this.value, AttributeChange.LocalOnly);
                break;
            }
            // Transform
            case 16:
            {
                this.value.pos.x = ds.readFloat32();
                this.value.pos.y = ds.readFloat32();
                this.value.pos.z = ds.readFloat32();

                this.value.rot.x = ds.readFloat32();
                this.value.rot.y = ds.readFloat32();
                this.value.rot.z = ds.readFloat32();

                this.value.scale.x = ds.readFloat32();
                this.value.scale.y = ds.readFloat32();
                this.value.scale.z = ds.readFloat32();

                this.set(this.value, AttributeChange.LocalOnly);
                break;
            }
            // QPoint
            case 17:
            {
                this.value.x = ds.readS32();
                this.value.y = ds.readS32();
                this.set(this.value, AttributeChange.LocalOnly);
                break;
            }
        }
    },

    fromBinary : function(ds)
    {
        // Parse header if size is unknown for this type.
        var len = (this.sizeBytes !== undefined ? this.sizeBytes : this.headerFromBinary(ds));
        if (len === undefined)
        {
            TundraLogging.getLogger("Attribute").error("Size and header size of '" + this.name + "' seems to be unknown, did you mess up the IComponent.declareAttribute() calls?");
            return;
        }
        this.dataFromBinary(ds, len);
    }
});




/**
    IComponent is the interface all component implementations will extend. Provides a set of utility functions for all components.

    Handles automatic network deserialization for declared components. Implementations can override
    {{#crossLink "IComponent/reset:method"}}{{/crossLink}}, {{#crossLink "IComponent/update:method"}}{{/crossLink}}
    and {{#crossLink "IComponent/attributeChanged:method"}}{{/crossLink}}.

    @class IComponent
    @constructor
    @param {Number} id Component id.
    @param {Number} typeId Component type id.
    @param {String} typeName Component type name.
    @param {String} name Component name.
*/
var IComponent = Class.$extend(
{
    __init__ : function(id, typeId, typeName, name)
    {
        /**
            Components logger instance, with channel name as the component type name.
            @property log
            @type TundraLogger
        */
        this.log = TundraLogging.getLogger(IComponent.propertyName(typeName, false));

        /**
            Component id.
            @property id
            @type Number
        */
        this.id = id;
        /**
            Component type id.
            @property typeId
            @type Number
        */
        this.typeId = typeId;
        /**
            Component type name.
            @property typeName
            @type String
        */
        this.typeName = typeName;
        /**
            Component name.
            @property name
            @type String
        */
        this.name = name;

        /**
            Is this component replicated over the network.
            @property replicated
            @type Boolean
        */
        this.replicated = true;
        /**
            Is this component local. Same as !comp.replicated.
            @property local
            @type Boolean
        */
        this.local = false;
        /**
            Is this component temporary, meaning it won't be serialized when scene is stored to disk.
            @property temporary
            @type Boolean
        */
        this.temporary = false;
        /**
            Parent entity.
            @property parentEntity
            @type Entity
        */
        this.parentEntity = null;
        /**
            Parent scene.
            @property parentScene
            @type Scene
        */
        this.parentScene = null;
        /**
            Flag for if this component has a real implementation or is it just
            the IComponent base implementation.
            @property notImplemented
            @type Boolean
        */
        this.notImplemented = false;
        /**
            Attributes for this component.
            @example
                // There are three ways of accessing a attribute
                var value = comp.myAttributeName.get();
                value = comp.attribute("myAttributeName").get();
                value = comp.attributeByIndex(index).get();
            @property attributes
            @type Array<Attribute>
        */
        this.attributes = {};
        /**
            Count of attributes in this component.
            @property attributeCount
            @type Number
        */
        this.attributeCount = 0;

        this.attributeIndexes = {}; // Don't document
        this.blockSignals = false;  // Don't document
    },

    __classvars__ :
    {
        ensureComponentNamePrefix : function(typeName)
        {
            return (typeName.substring(0,3).toLowerCase() === "ec_" ? typeName : "EC_" + typeName);
        },

        propertyName : function(typeName, lowerCase)
        {
            if (lowerCase === undefined)
                lowerCase = true;
            // "EC_Placeable" -> "Placeable"
            var propertyName = typeName;
            if (propertyName.substring(0,3).toLowerCase() === "ec_")
                propertyName = propertyName.substring(3);
            // "EC_Placeable" -> "placeable"
            if (lowerCase)
                propertyName = propertyName.substring(0,1).toLowerCase() + propertyName.substring(1);
            return propertyName;
        },

        propertyNameLowerCase : function(typeName)
        {
            return this.propertyName().toLowerCase();
        }
    },

    _reset : function()
    {
        // Call the implementation reset.
        this.reset();

        this.attributeIndexes = {};
        this.attributeCount = 0;
        this.blockSignals = false;

        for (var attributeName in this.attributes)
        {
            var attribute = this.attributes[attributeName];
            if (attribute !== undefined && attribute !== null)
                attribute._reset();
            attribute = null;
        }
        this.attrs = {};

        this.parentEntity = null;
        this.parentScene = null;
    },

    /**
        Returns if this component has a parent entity.
        @method hasParentEntity
        @return {Boolean}
    */
    hasParentEntity : function()
    {
        return (this.parentEntity !== null);
    },

    /**
        Returns if this component has a parent scene.
        @method hasParentScene
        @return {Boolean}
    */
    hasParentScene : function()
    {
        return (this.parentScene !== null);
    },

    /**
        Resets component state, if this gets called it means the component is being destroyed.
        The component should unload any CPU/GPU memory that it might have allocated.

        Override in component implementations.
        @method reset
    */
    reset : function()
    {
        /// @note Virtual no-op function. Implementations can override.
    },

    _update : function()
    {
        // @note Internal update that calls the implementation update.
        this.update();
    },

    update : function()
    {
        /// @note Virtual no-op function. Implementations can override.
    },

    /**
        Registers a callback for attribute changed event originating from this component.

        @example
            function onAttributeChanged(entity, component, attributeIndex, attributeName, attributeValue)
            {
                // entity == Entity
                // component == IComponent or one of its implementations.
                // attributeIndex == Attribute index that changed
                // attributeName == Attribute name that changed
                // attributeValue == New value
                console.log("Entity", entity.id, entity.name, "components", component.typeName, "attribute", attributeName, "changed to:", attributeValue.toString());
            }

            var entity = TundraSDK.framework.scene.entityById(12);
            if (entity != null && entity.mesh != null)
                entity.mesh.onAttributeChanged(null, onAttributeChanged);

        @method onAttributeChanged
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription|null} Subscription data or null if parent entity/component is not set.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onAttributeChanged : function(context, callback)
    {
        if (this.parentEntity == null || this.parentEntity.id < 0)
        {
            console.log("ERROR: Entity.onAttributeChanged called on a non initialized component! No valid parent entity!");
            return null;
        }

        /// @note The event is triggered in Scene._publishAttributeChanged not in Entity!
        return TundraSDK.framework.events.subscribe("Scene.AttributeChanged." + this.parentEntity.id.toString() + "." + this.id.toString(), context, callback);
    },

    /**
        Returns this component as a string for logging purposes.
        @method toString
        @return {String} The component type name and name as string.
    */
    toString : function()
    {
        return this.id + " " + this.typeName + (this.name.length > 0 ? " name = " + this.name : "");
    },

    /**
        Returns if this components structure is dynamic.
        @method isDynamic
        @return {Boolean} True if dynamic, false otherwise (default base IComponent implementation returns false).
    */
    isDynamic : function()
    {
        return false;
    },

    /**
        Set parent entity for this component. This function is automatically called by Scene/Entity.
        @method setParent
        @param {Entity} entity Parent entity.
    */
    setParent : function(entity)
    {
        this.parentEntity = (entity !== undefined ? entity : null);
        this.parentScene = (entity !== undefined ? entity.parentScene : null);
    },

    /**
        Do not call this unless you are creating a component. Component implementations
        constructor should call this function and declare all network synchronized attributes.
        @method declareAttribute
        @param {Number} index Attribute index.
        @param {String} name Attribute name.
        @param {Object} value Initial attribute value.
        @param {Number} typeId Attribute type id, see {{#crossLink "core/scene/Attribute"}}Attribute{{/crossLink}}
        @todo then name given here is the attribute ID, not the human-readable name! Add human-readable name parameter also.
        static type properties.
    */
    declareAttribute : function(index, name, value, typeId)
    {
        var attribute = new Attribute(this, index, name, value, typeId);
        this.attributes[name] = attribute
        this.attributeIndexes[index] = name;
        this.attributeCount = Object.keys(this.attributes).length;

        // Do not define get/set methods for attribute names
        // that are already reserved by IComponent or the implementing
        // component. For example EC_Name "name" attribute.
        if (this[name] === undefined)
        {
            var getSet   = {};
            getSet[name] =
            {
                get : function ()      { return attribute.getClone(); },
                set : function (value) { attribute.set(value); }, /// @todo Implement 'value' type check here or inside IAttribute.set()?
                configurable : this.isDynamic()
                /// @todo See what should be set for 'enumerable'
            };
            Object.defineProperties(this, getSet);
        }
    },

    /**
        Sets a new value to an attribute. Replicates to the network depending on the change mode.
        @method setAttribute
        @param {String} name Attribute name.
        @param {Object} value New value.
        @param {AttributeChange} [change=AttributeChange.Default] Attribute change signaling mode.
    */
    setAttribute : function(name, value, change)
    {
        var attribute = this.attributes[name];
        if (attribute !== undefined)
            attribute.set(value, change);
    },

    /**
        Returns an attribute by ID. Does NOT return the attribute value, but the attribute object itself.
        @method attributeById
        @param {String} name Attribute name.
        @return {Attribute} Attribute or undefined if attribute does not exist.
    */
    attributeById : function(name)
    {
        if (name === undefined || name === null)
            return undefined;
        return this.attributes[name];
    },

    /**
        Alias for attributeById.
        @method attribute
        @param {String} name Attribute name.
        @return {Attribute} Attribute or undefined if attribute does not exist.
    */
    attribute : function(name) { return this.attributeById(name); },

    /// @deprecated use attributeById or attribute @todo remove asap.
    getAttribute : function(name) { return this.attributeById(name); },

    /**
        Returns if this component has an attribute.
        @method hasAttribute
        @param {String} name Attribute name.
        @return {Boolean}
    */
    hasAttribute : function(name)
    {
        return (this.attribute(name) !== undefined);
    },

    /**
        Returns attribute for a index.
        @method attributeByIndex
        @param {Number} index Attribute index.
        @return {Attribute} Attribute or undefined if attribute does not exist.
    */
    attributeByIndex : function(index)
    {
        return this.attributeById(this.attributeIndexes[index]);
    },

    /// @deprecated use attributeByIndex @todo remove asap.
    getAttributeByIndex : function(index) { return this.attributeByIndex(index); },

    /// @todo Document.
    deserializeFromBinary : function(ds)
    {
        if (this.attributeCount <= 0 && !this.isDynamic())
            return -1;

        // This is a full component update. Block attributeChanged() invocations!
        // The component implementation will get update() call when all attributes
        // are initialized and parent entity is set

        this.blockSignals = true;
        try
        {
            if (!this.isDynamic())
            {
                this._deserializeFromBinaryStatic(ds);
            }
            else
            {
                this._deserializeFromBinaryDynamic(ds);
            }
        }
        catch(e)
        {
            TundraSDK.framework.client.logError("[Attribute]: deserializeFromBinary exception: " + e);
        }
        this.blockSignals = false;
    },

    _deserializeFromBinaryStatic : function(ds)
    {
        for (var i=0; i<this.attributeCount; ++i)
        {
            var attribute = this.attributeByIndex(i);
            attribute.fromBinary(ds);
        }
    },

    _deserializeFromBinaryDynamic : function(ds)
    {
        // The code pushing this deserializer needs to set readLimitBytes
        // for this logic to know when to stop parsing. This is needed
        // if the deserializer has more data than just this dynamic component.
        if (ds.readLimitBytes !== undefined)
        {
            var bytesReadPre = ds.readBytes();
            while (ds.readBytes() - bytesReadPre < ds.readLimitBytes)
            {
                var index = ds.readU8();
                var typeId = ds.readU8();
                var name = ds.readStringU8();

                // Declare new attribute and read data
                this.declareAttribute(index, name, Attribute.defaultValueForType(typeId), typeId);
                this.deserializeAttributeFromBinary(index, ds);
            }
        }
        else
        {
            console.error("[Attribute]: DataDeserializer for parsing dynamic component structure does not have 'readLimitBytes' property. " +
                "This information is needed to know when to stop parsing.");
        }
    },

    deserializeAttributeFromBinary : function(index, ds)
    {
        if (this.attributeCount <= 0)
            return;

        var attribute = this.attributeByIndex(index);
        if (attribute !== undefined && attribute !== null)
            attribute.fromBinary(ds);
    },

    createAttributeFromBinary : function(index, ds)
    {
        if (!this.isDynamic())
        {
            TundraSDK.framework.client.logError("[IComponent]: createAttributeFromBinary called to a non dynamic component!", true);
            return;
        }

        var typeId = ds.readU8();
        var name = ds.readStringU8();

        // Declare new attribute and read data.
        this.declareAttribute(index, name, Attribute.defaultValueForType(typeId), typeId);
        this.deserializeAttributeFromBinary(index, ds);

        // Fire dynamic component attribute added event.
        if (typeof this._attributeAdded === "function")
            this._attributeAdded(index);
    },

    _attributeChanged : function(attribute, change)
    {
        /// @todo Construct message and send to network!
        //if (change === AttributeChange.Replicate)

        if (this.blockSignals)
            return;

        if (this.parentEntity == null || this.parentEntity.parentScene == null)
        {
            TundraSDK.framework.client.logError("[IComponent]: Cannot send attribute update event, parent entity or scene is null!", true);
            return;
        }
        if (attribute === undefined || attribute === null)
            return;

        this.attributeChanged(attribute.index, attribute.name, attribute.get());

        if (this.parentEntity !== null && this.parentEntity.parentScene !== null)
            this.parentEntity.parentScene._publishAttributeChanged(this.parentEntity, attribute);
    },

    /**
        Component implementations can override this function to receive information when a particular attribute has changed.

        @method attributeChanged
        @param {Number} index Attribute index.
        @param {String} name Attribute name.
        @param {Object} value New attribute value.
    */
    attributeChanged : function(index, name, value)
    {
        /// @note Virtual no-op function. Implementations can override.
    },
});




/// @todo Move entity action related utility functions to this class (as static in __classvars__)

/**
    Dummy class containing enumeration of attribute/component change types for replication.
    <pre>var changeMode = AttributeChange.LocalOnly;</pre>
    @class AttributeChange
*/
var EntityAction = Class.$extend(
{
    __init__ : function()
    {
        this.name = undefined;
        this.executionTypeName = undefined;
        this.executionType = EntityAction.Invalid;
        this.parameters = [];

        this.entity = undefined;
        this.entityId = undefined;
    },

    __classvars__ :
    {
        /**
            @property Invalid
            @final
            @static
            @type Number
            @default 0
        */
        Invalid       : 0,
        /**
            Execute entity action locally.
            @property Local
            @final
            @static
            @type Number
            @default 1
        */
        Local         : 1,
        /**
            Execute entity action on server.
            @property Server
            @final
            @static
            @type Number
            @default 2
        */
        Server        : 2,
        /**
            Execute entity action on all peer clients.
            @property Peers
            @final
            @static
            @type Number
            @default 4
        */
        Peers         : 4
    }
});




/**
    Entity action message.

    @class EntityActionMessage
    @extends INetworkMessage
    @constructor
*/
var EntityActionMessage = INetworkMessage.$extend(
{
    __init__ : function()
    {
        this.$super(EntityActionMessage.id, "EntityActionMessage");

        /**
            Entity action.
            @property entityAction
            @type EntityAction
        */
        this.entityAction = new EntityAction();
    },

    __classvars__ :
    {
        id   : 120,
        name : "EntityActionMessage",
        staticNumBytes : (2 + 4 + 1 + 1 + 1)
    },

    deserialize : function(ds)
    {
        /// @todo Pass utf8=true to readString* funcs once implemented in Tundra.

        this.entityAction.entityId = ds.readU32();
        this.entityAction.name = ds.readStringU8();
        this.entityAction.executionType = ds.readU8();
        var paramLen = ds.readU8();
        for (var i=0; i<paramLen; ++i)
            this.entityAction.parameters[i] = ds.readString(ds.readVLE());
        delete ds;
    },

    /**
        Serializes EntityAction object into this message.

        @method serialize
        @param {EntityAction} entityAction
    */
    serialize : function(entityAction)
    {
        if (entityAction.entityId === undefined && entityAction.entity === undefined)
        {
            TundraSDK.framework.client.logError("[EntityActionMessage]: serialize() called with entity action that does not have entityId or entity set!");
            return;
        }

        /** @note This code already supports sending UTF8 strings as the name and parameters.
            Tundra server wont parse these strings correctly so don't use UTF8.
            If you stick with ASCII this code will work correctly.
        */

        var dataNumBytes = DataSerializer.utf8StringByteSize(entityAction.name);
        dataNumBytes += (entityAction.parameters.length * 4);
        for (var i=0, len = entityAction.parameters.length; i < len; ++i)
            dataNumBytes += DataSerializer.utf8StringByteSize(entityAction.parameters[i]);

        this.$super(EntityActionMessage.staticNumBytes + dataNumBytes);

        this.ds.writeU16(this.id);
        this.ds.writeU32((entityAction.entityId !== undefined ? entityAction.entityId : entityAction.entity.id));
        this.ds.writeStringU8(entityAction.name);
        this.ds.writeU8(entityAction.executionType);
        this.ds.writeU8(entityAction.parameters.length);
        for (var i=0, len = entityAction.parameters.length; i < len; ++i)
            this.ds.writeStringVLE(entityAction.parameters[i]);
    }
});




/**
    Entity that resides in a {{#crossLink "core/scene/Scene"}}{{/crossLink}}.
    @class Entity
    @constructor
*/
var Entity = Class.$extend(
{
    __init__ : function()
    {
        this.log = TundraLogging.getLogger("Entity");

        /**
            Entity id
            @property id
            @type Number
        */
        this.id = -1;
        /**
            Entity name. Will return the name attribute value from EC_Name if it exists, otherwise empty string.
            for the change to be replicated to the server via EC_Name.
            @property name
            @type String
        */
        /**
            Entity description. Will return the description attribute value from EC_Name if it exists, otherwise empty string.
            @property description
            @type String
        */
        /**
            Entity description. Will return the description attribute value from EC_Name if it exists, otherwise empty string.
            @property description
            @type String
        */
        // Hide 'name' and 'description' properties behind getters, no direct access.
        // Redirects ent.name = "something"; into the correct EC_Name functionality.
        Object.defineProperties(this, {
            name : {
                get : function ()      { return this.getName(); },
                set : function (value) { this.setName(value); }
            },
            description : {
                get : function ()      { return this.getDescription(); },
                set : function (value) { this.setDescription(value); }
            },
            group : {
                get : function ()      { return this.getGroup(); },
                set : function (value) { this.setGroup(value); }
            }
        });
        /**
            Is this entity replicated to the network.
            @property replicated
            @type Boolean
        */
        this.replicated = true;
        /**
            Is this entity local only.
            @property local
            @type Boolean
        */
        this.local = false;
        /**
            Is this entity temporary.
            @property temporary
            @type Boolean
        */
        this.temporary = false;
        /**
            Parent scene for this entity.
            @property parentScene
            @type Scene
        */
        this.parentScene = null;
        /**
            Components in this entity.
            To retrieve use {{#crossLink "Entity/getComponent:method"}}Entity.getComponent(){{/crossLink}} or a shorthand property in the entity, for example:
            <pre>
            if (entity.mesh != null)
                entity.mesh.something();</pre>
            @property components
            @type Array
        */
        this.components = [];
    },

    __classvars__ :
    {
        /**
            Entity action execution type
            @example
                {
                    "Local"   : 1,
                    "Server"  : 2,
                    "Peers"   : 4,
                    1 : "Local",
                    2 : "Server",
                    4 : "Peers"
                }
            @property ExecType
            @type {Object}
        */
        ExecType :
        {
            "Invalid" : 0,
            "Local"   : 1,
            "Server"  : 2,
            "Peers"   : 4,
            0 : "Invalid",
            1 : "Local",
            2 : "Server",
            4 : "Peers"
        },
    },

    _nextLocalComponentId : function()
    {
        for (var compId = 100000; compId < 200000; ++compId)
        {
            if (this.getComponentById(compId) == null)
                return compId;
        }
        return -1;
    },

    _nextReplicatedComponentId : function()
    {
        for (var compId = 1; compId < 100000; ++compId)
        {
            if (this.getComponentById(compId) == null)
                return compId;
        }
        return -1;
    },

    /**
        Set name to EC_Name component. Creates the component if necessary.
        To get this property use {{#crossLink "Entity/id:property"}}Entity.id{{/crossLink}}.
        @method setId
        @param {Number} id New id for this entity.
    */
    setId : function(newId)
    {
        this.id = newId;
    },

    /**
        Get name of this Entity from EC_Name component. Empty string if name is not set.
        @return {String}
    */
    getName : function()
    {
        var nameComp = this.getComponent("EC_Name");
        if (nameComp != null)
            return nameComp.getName();
        return "";
    },

    /**
        Set name to EC_Name component. Creates the component if necessary.
        See also {{#crossLink "Entity/name:property"}}name{{/crossLink}}.
        @method setName
        @param {String} name New name for this entity.
        @param {AttributeChange} [change=AttributeChange.Default] Attribute change signaling mode.
    */
    setName : function(newName, change)
    {
        var nameComp = this.getOrCreateComponent("EC_Name", undefined, change);
        nameComp.setName(newName, change);
    },

    /**
        Get description of this Entity from EC_Name component. Empty string if description is not set.
        @return {String}
    */
    getDescription : function()
    {
        var nameComp = this.getComponent("EC_Name");
        if (nameComp != null)
            return nameComp.getDescription();
        return "";
    },

    /**
        Set description to EC_Name component. Creates the component if necessary.
        To get this property use {{#crossLink "Entity/description:property"}}Entity.description{{/crossLink}}.
        @method setDescription
        @param {String} description New description for this entity.
        @param {AttributeChange} [change=AttributeChange.Default] Attribute change signaling mode.
    */
    setDescription : function(description, change)
    {
        var nameComp = this.getOrCreateComponent("EC_Name", undefined, change);
        nameComp.setDescription(description, change);
    },

    /**
        Get group of this Entity from EC_Name component. Empty string if group is not set.
        @return {String}
    */
    getGroup : function()
    {
        var nameComp = this.getComponent("EC_Name");
        if (nameComp != null)
            return nameComp.getGroup();
        return "";
    },

    /**
        Set group to EC_Name component. Creates the component if necessary.
        To get this property use {{#crossLink "Entity/description:property"}}Entity.description{{/crossLink}}.
        @method setGroup
        @param {String} group New group for this entity.
        @param {AttributeChange} [change=AttributeChange.Default] Attribute change signaling mode.
    */
    setGroup : function(group, change)
    {
        var nameComp = this.getOrCreateComponent("EC_Name", undefined, change);
        nameComp.setGroup(group, change);
    },

    /**
        Registers a callback for when this Entity is about to be removed. You can query components
        and other Entity data but changing any state has no effect as the entity will be removed.

        @method onAboutToBeRemoved
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription|null} Subscription data or null if this entity is not yes initialized correctly.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onAboutToBeRemoved : function(context, callback)
    {
        if (this.parentScene == null || this.id < 0)
        {
            this.log.error("onAboutToBeRemoved called on a non initialized entity!");
            return null;
        }

        return TundraSDK.framework.events.subscribe("Entity.AboutToBeRemoved." + this.id.toString(), context, callback);
    },

    /**
        Registers a callback for component created event originating from this entity.

            function onComponentCreated(entity, component)
            {
                // entity == Entity
                // component == IComponent or one of its implementations.
                console.log("Entity", entity.id, entity.name, "got a new component: " + component.typeName);
            }

            var entity = TundraSDK.framework.scene.entityById(12);
            if (entity != null)
                entity.onComponentCreated(null, onComponentCreated);

        @method onComponentCreated
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription|null} Subscription data or null if this entity is not yes initialized correctly.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onComponentCreated : function(context, callback)
    {
        if (this.parentScene == null || this.id < 0)
        {
            this.log.error("onComponentCreated called on a non initialized entity!");
            return null;
        }

        /// @note The event is triggered in Scene._publishComponentCreated not in Entity!
        return TundraSDK.framework.events.subscribe("Scene.ComponentCreated." + this.id.toString(), context, callback);
    },

    /**
        Registers a callback for component removed event originating from this entity.

            function onComponentRemoved(entity, component)
            {
                // entity == Entity
                // component == IComponent or one of its implementations.
            }

            var entity = TundraSDK.framework.scene.entityById(12);
            if (entity != null)
                entity.onComponentRemoved(null, onComponentRemoved);

        @method onComponentRemoved
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription|null} Subscription data or null if this entity is not yes initialized correctly.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onComponentRemoved : function(context, callback)
    {
        if (this.parentScene == null || this.id < 0)
        {
            this.log.error("onComponentRemoved called on a non initialized entity!");
            return null;
        }

        /// @note The event is triggered in Scene._publishComponentRemoved not in Entity!
        return TundraSDK.framework.events.subscribe("Scene.ComponentRemoved." + this.id.toString(), context, callback);
    },

    /**
        Registers a callback for entity actions originating from this entity. See {{#crossLink "Scene/EntityAction:event"}}{{/crossLink}} for event data.

            function onEntityAction(entityAction)
            {
                // entityAction == EntityAction
            }

            var entity = TundraSDK.framework.scene.entityById(12);
            if (entity != null)
                entity.onEntityAction(null, onEntityAction);

        @method onEntityAction
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription|null} Subscription data or null if this entity is not yes initialized correctly.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onEntityAction : function(context, callback)
    {
        if (this.parentScene == null || this.id < 0)
        {
            this.log.error("onEntityAction called on a non initialized entity!");
            return null;
        }

        /// @note The event is triggered in Scene._publishEntityAction not in Entity!
        return TundraSDK.framework.events.subscribe("Scene.EntityAction." + this.id.toString(), context, callback);
    },

    reset : function()
    {
        // Publish that we are about to be removed.
        TundraSDK.framework.events.send("Entity.AboutToBeRemoved." + this.id.toString(), this);

        /// @todo Fix this stupid EC_Placeable always first stuff...
        var placeableId = null;
        var componentIds = [];
        for (var i = 0; i < this.components.length; i++)
        {
            if (this.components[i] != null && this.components[i].typeName !== "EC_Placeable")
                componentIds.push(this.components[i].id);
            else (this.components[i] != null && this.components[i].typeName === "EC_Placeable")
                placeableId = this.components[i].id;
        }
        for (var i = 0; i < componentIds.length; i++)
            this.removeComponent(componentIds[i]);
        if (placeableId != null)
            this.removeComponent(placeableId);
        this.components = [];

        TundraSDK.framework.events.remove("Entity.AboutToBeRemoved." + this.id.toString());
        TundraSDK.framework.events.remove("Scene.EntityAction." + this.id.toString());
    },

    /**
        Utility function for log prints. Converts entity's id and name to a string and returns it.
        @method toString
        @return {String}
    */
    toString : function()
    {
        return this.id + (this.name.length > 0 ? " name = " + this.name : "");
    },

    setParent : function(scene)
    {
        this.parentScene = scene;
    },

    update : function()
    {
        /// @todo Fix this stupid EC_Placeable always first stuff...

        // Update for all components. Update EC_Placeable
        // first as its scene node needs to be there.
        var myPlaceable = this.getComponent("EC_Placeable");
        if (myPlaceable != null)
            myPlaceable.update();
        for (var i=0; i<this.components.length; ++i)
        {
            if (this.components[i] == null)
                continue;
            if (myPlaceable == null || myPlaceable.id !== this.components[i].id)
                this.components[i]._update();
        }

        // Check if someone is missing us as the parent
        // This is very slow
        /*if (this.parentScene != null)
        {
            console.log("Checking parent for", this.toString());
            for (var i = this.parentScene.entities.length - 1; i >= 0; i--)
            {
                var ent = this.parentScene.entities[i];
                if (ent != null)
                {
                    var placeable = ent.getComponent("EC_Placeable");
                    var parentRef = (placeable != null ? placeable.attributes.parentRef.getClone() : undefined);
                    if (parentRef !== undefined && (parentRef === this.name || parentRef === this.id.toString()))
                        placeable.checkParent();
                }
            }
            console.log("--- done");
        }*/
    },

    /**
        Executes an entity action on this entity.
        @method exec
        @param {String|Number} execType Execution type can be a string or a number as long as it maps correctly to {{#crossLink "Entity/ExecType:property"}}Entity.ExecType{{/crossLink}}.
        @param {String} actionName Entity action name.
        @param {Array} [parameters] List of parameters. All elements are converted to string using .toString() on the object.
    */
    exec : function(execType, actionName, stringParameterList)
    {
        if (typeof(execType) === "string")
        {
            var lowerExecType = execType.toLowerCase();
            if (lowerExecType === "local")
                execType = 1;
            else if (lowerExecType === "server")
                execType = 2;
            else if (lowerExecType === "peers")
                execType = 4;
            else
            {
                this.log.error("exec(): Error cannot convert string exec type " + execType + " no a valid Entity.ExecType!");
                return;
            }
        }
        if (execType != 1 && execType != 2 && execType != 4)
        {
            this.log.error("exec(): Invalid Entity.ExecType input parameter: " + execType);
            return;
        }

        var entityAction = {};
        entityAction.entity = this;
        entityAction.executionType = execType;
        entityAction.name = actionName;
        entityAction.parameters = [];

        if (stringParameterList != null)
        {
            for (var i = 0; i < stringParameterList.length; i++)
                entityAction.parameters.push(stringParameterList[i].toString());
        }

        // Local execute
        if (entityAction.executionType === 1)
        {
            if (this.parentScene != null)
                this.parentScene._publishEntityAction(entityAction);
        }
        // Server/Peers
        else
        {
            if (TundraSDK.framework.client.websocket != null)
            {
                var message = new EntityActionMessage();
                message.serialize(entityAction);
                TundraSDK.framework.network.send(message);
            }
        }
    },

    /**
        Adds a component to this entity.
        @method addComponent
        @param {IComponent} component
        @return {Boolean} True if added successfully, false if component could not be found.
    */
    addComponent : function(component)
    {
        if (component === undefined || component === null)
            return false;

        for (var i = this.components.length - 1; i >= 0; i--)
        {
            if (this.components[i] != null && this.components[i].id === component.id)
                return false;
        }

        // Assign component to shorthand property
        // We don't want EC_Name to override the name of the entity. SetName must be used.
        var propertyName = IComponent.propertyName(component.typeName);
        if (component.typeName !== "" && propertyName !== "name")
        {
            this[propertyName] = component;
            if (propertyName !== propertyName.toLowerCase())
                this[propertyName.toLowerCase()] = component;
        }

        // Push to components list and update parent.
        this.components.push(component);
        component.setParent(this);

        // Update the component
        component._update();

        // Send event
        if (this.parentScene != null)
            this.parentScene._publishComponentCreated(this, component);

        return true;
    },

    /**
        Removes a component by id from this entity.
        @method removeComponent
        @param {Number} componentId Component id.
        @return {Boolean} True if removed, false if component could not be found.
    */
    removeComponent : function(componentId)
    {
        for (var i = this.components.length - 1; i >= 0; i--)
        {
            if (this.components[i] != null && this.components[i].id === componentId)
            {
                var comp = this.components[i];
                if (comp != null)
                {
                    // Send event
                    if (this.parentScene != null)
                        this.parentScene._publishComponentRemoved(this, comp);

                    // Reset component
                    comp._reset();
                }
                this.components.splice(i, 1);
                comp = null;
                return true;
            }
        }
        return false;
    },

    /**
        Removes a component by name from this entity.
        @method removeComponentByName
        @param {String} typeName Component type name e.g. "Placeable".
        @param {String} [name=""] Optional component name on top of the type e.g. "MyThing".
        @return {Boolean} True if removed, false if component could not be found with give type/name.
    */
    removeComponentByName : function(typeName, name)
    {
        var findTypeName = IComponent.ensureComponentNamePrefix(typeName);
        for (var i = this.components.length - 1; i >= 0; i--)
        {
            if (this.components[i].typeName === findTypeName)
            {
                if (name != null && this.components[i].name !== name)
                    continue;

                var comp = this.components[i];
                if (comp != null)
                {
                    // Send event
                    TundraSDK.framework.events.send("Scene.ComponentRemoved." + this.id.toString(), this, comp);

                    comp._reset();
                }
                this.components.splice(i, 1);
                comp = null;
                return true;
            }
        }
        return false;
    },

    /**
        Returns a component by type name. Components also have a shorthand property in the entity, for example:
        <pre>
            if (entity.mesh != null)
                entity.mesh.something();</pre>
        @method component
        @param {String} typeName Component type name e.g. "Placeable".
        @param {String} [name=""] Optional component name on top of the type e.g. "MyThing".
        @return {IComponent|null} The component if found, otherwise null.
    */
    component : function(typeName, name)
    {
        if (name === undefined)
            name = null;
        if (typeof typeName !== "string")
        {
            this.log.error("getComponent called with non-string type name for Entity: " + this.toString());
            return null;
        }

        var findTypeName = IComponent.ensureComponentNamePrefix(typeName);
        for (var i = this.components.length - 1; i >= 0; i--)
        {
            if (this.components[i] != null && this.components[i].typeName === findTypeName)
            {
                if (name == null)
                    return this.components[i];
                else if (this.components[i].name === name)
                    return this.components[i];
            }
        }
        return null;
    },

    /// @deprecated use component @todo remove asap.
    getComponent : function(typeName, name) { return this.component(typeName, name); },

    /**
        Returns a component by id.
        @method componentById
        @param {Number} componentId Component id.
        @return {IComponent|null} The component if found, otherwise null.
    */
    componentById : function(componentId)
    {
        for (var i = this.components.length - 1; i >= 0; i--)
        {
            if (this.components[i] != null && this.components[i].id === componentId)
                return this.components[i];
        }
        return null;
    },

    /// @deprecated use componentById @todo remove asap.
    getComponentById : function(componentId) { return this.componentById(componentId); },

    /**
        Creates a local component by given type name and name.
        @method createLocalComponent
        @param {String} typeName Component type name e.g. "Placeable".
        @param {String} [name=""] Optional component name on top of the type e.g. "MyThing".
        @return {IComponent|null} The component if created, otherwise null.
    */
    createLocalComponent : function(typeName, name)
    {
        if (name === undefined)
            name = null;
        return this.createComponent(typeName, name, AttributeChange.LocalOnly);
    },

    /**
        Creates a component by given type name and name.
        This function performs no check if this component already exists!
        Use getOrCreateComponent or getComponent for checking.
        @method createComponent
        @param {String} typeName Component type name e.g. "Placeable".
        @param {String} [name=""] Optional component name on top of the type e.g. "MyThing".
        @param {AttributeChange} [change=AttributeChange.Default] Change signaling mode. Note: Only AttributeChange.LocalOnly is supported at the moment!
        @return {IComponent|null} The component if created, otherwise null.
    */
    createComponent : function(typeName, name, change)
    {
        if (this.parentScene == null)
        {
            this.log.error("Cannot create component, parent scene is null for Entity: " + this.toString());
            return null;
        }

        if (change === undefined || change === null)
            change = AttributeChange.Default;
        if (typeof change !== "number")
        {
            this.log.warn("createComponent called with non AttributeChange.Type change mode, defaulting to AttributeChange.Default.");
            change = AttributeChange.Default;
        }
        if (change !== AttributeChange.LocalOnly)
        {
            /// @todo Read this.local to pick correct Default type once client -> server networking is implemented
            if (change === AttributeChange.Default)
                change = AttributeChange.LocalOnly;
            else
            {
                this.log.warn("createComponent called with localOnly != AttributeChange.LocalOnly. Creating replicated components is not supported at the moment, defaulting to LocalOnly.");
                change = AttributeChange.LocalOnly;
            }
        }

        var createTypeName = IComponent.ensureComponentNamePrefix(typeName);
        var component = this.parentScene.createComponent(createTypeName, name);
        if (component != null)
        {
            if (change == AttributeChange.LocalOnly || change == AttributeChange.Disconnected || change == AttributeChange.Default)
                component.replicated = false;
            else
                component.replicated = true;
            component.local = !component.replicated;
            component.id = (component.replicated ? this._nextReplicatedComponentId() : this._nextLocalComponentId());
        }

        this.addComponent(component);
        return component;
    },

    /**
        Returns or creates a local component by given type name and name.
        If component with the type is found but the name does not match, a new component is created.
        @method getOrCreateLocalComponent
        @param {String} typeName Component type name e.g. "Placeable".
        @param {String} [name=""] Optional component name on top of the type e.g. "MyThing".

        @return {IComponent|null} The component if found or created, otherwise null.
    */
    getOrCreateLocalComponent : function(typeName, name)
    {
        if (name === undefined)
            name = null;
        return this.getOrCreateComponent(typeName, name, AttributeChange.LocalOnly);
    },

    /**
        Returns or creates a component by given type name and name.
        If component with the type is found but the name does not match, a new component is created.
        @method getOrCreateComponent
        @param {String} typeName Component type name e.g. "Placeable".
        @param {String} [name=""] Optional component name on top of the type e.g. "MyThing".
        @param {AttributeChange} [change=AttributeChange.Default] Change signaling mode, in case component has to be created. Note: Only AttributeChange.LocalOnly is supported at the moment!
        @return {IComponent|null} The component if found or created, otherwise null.
    */
    getOrCreateComponent : function(typeName, name, change)
    {
        if (name === undefined)
            name = null;
        if (change === undefined)
            change = null;

        var component = this.getComponent(typeName, name);
        if (component == null)
            component = this.createComponent(typeName, name, change);
        return component
    }
});




/**
    Scene that is accessible from {{#crossLink "TundraClient/scene:property"}}TundraClient.scene{{/crossLink}}

    Manages the current Tundra scene. Functions for querying entities and components. Events for entity and component created/removed etc.
    @class Scene
    @constructor
*/
var Scene = Class.$extend(
{
    __init__ : function(params)
    {
        this.log = TundraLogging.getLogger("Scene");

        /**
            List of Entity objects in this scene
            @property entities
            @type Array
        */
        this.entities = [];
        this.id = 1;
    },

    __classvars__ :
    {
        registeredComponents : {},

        /**
            Returns all the registered component information as a list.
            
            @static
            @method registeredComponentsList
            @return {Array<Object>}
        */
        registeredComponentsList : function()
        {
            var result = [];
            for (var typeId in Scene.registeredComponents)
                result.push(Scene.registeredComponents[typeId]);
            return result;
        },

        /**
            Returns all the registered component information as a list.

            @static
            @method registeredComponent
            @param {Number|String} id Component type id or name.
            @return {Object|undefined}
        */
        registeredComponent : function(id)
        {
            if (typeof id === "string")
            {
                var typeName = IComponent.ensureComponentNamePrefix(id);
                for (var compTypeId in Scene.registeredComponents)
                {
                    if (Scene.registeredComponents[compTypeId].typeName === typeName)
                    {
                        id = compTypeId;
                        break;
                    }
                }
            }
            return Scene.registeredComponents[id];
        },

        /**
            Registers a new component to the client. Once the component is registered it can be instantiated when it is sent from server to the client.

            This function is static and should be called directly with 'Scene.registerComponent(...)' without getting the Scene instance from the client.

            @static
            @method registerComponent
            @param {Number} typeId Component type id. This needs to match the server implementation.
            @param {String} typeName Full type name of the component e.g. "EC_Mesh".
            @param {IComponent} componentClass Object to instantiate when this component needs to be created.
            @return {Boolean} True if component was registered, false if failed.
        */
        registerComponent : function(typeId, typeName, componentClass)
        {
            typeName = IComponent.ensureComponentNamePrefix(typeName);

            if (this.registeredComponents[typeId] !== undefined)
            {
                TundraLogging.getLogger("Scene").error("Component with type id", typeId, "(" + this.registeredComponents[typeId].typeName + ") already registered!");
                return false;
            }
            this.registeredComponents[typeId] = {
                "typeId"    : typeId,
                "typeName"  : typeName,
                "prototype" : componentClass
            };
            if (TundraSDK.framework.scene != null)
                TundraSDK.framework.scene._logComponentRegistration(this.registeredComponents[typeId]);
            return true;
        },

        componentPropertyNames : (function() {
            var result = [];
            for (var compTypeId in Network.components)
                result.push(IComponent.propertyName(Network.components[compTypeId]));
            return result;
        }())
    },

    /**
        Utility function for log prints. Converts entity's id and name to a string and returns it.
        @method toString
        @return {String}
    */
    toString : function()
    {
        return "id=" + this.id + " entities=" + this.entities.length;
    },

    postInitialize : function()
    {
        this.postInitialized = true;
        var comps = Scene.registeredComponentsList();
        for (var i = 0; i < comps.length; i++)
            this._logComponentRegistration(comps[i]);

        TundraSDK.framework.console.registerCommand("dumpScene", "Dumps the scene to browsers developer console",
            "(string) Optional entity name if you want to print a single entity", this, this.onDumpScene);
    },

    _logComponentRegistration : function(compData)
    {
        if (TundraSDK.framework.scene != null && TundraSDK.framework.scene.postInitialized === true)
        {
            var implName = (compData.prototype.implementationName !== undefined ? compData.prototype.implementationName + " " : "");
            TundraSDK.framework.scene.log.debug("Registered " + implName + compData.typeName);
        }
    },

    onDumpScene : function(parameters)
    {
        if (this.entities.length === 0)
        {
            this.log.info("Current scene has no entities");
            return;
        }
        this.log.info("");

        var foundMatch = false;
        var entName = parameters[0];
        for (var i = 0; i < this.entities.length; i++)
        {
            var ent = this.entities[i];
            var match = (entName !== undefined ? entName === ent.name : true);
            if (!match)
                continue;
            foundMatch = true;

            this.log.info(ent.id + " " + ent.name);
            for (var k = 0; k < ent.components.length; k++)
            {
                var comp = ent.components[k];
                this.log.info("  " + comp.id + " " + comp.typeName);
                if (!comp.isDynamic())
                {
                    for (var j = 0; j < comp.attributeCount; j++)
                        this.log.info("    " + comp.getAttributeByIndex(j).toString());
                }
                else
                {
                    for (var attributeIndex in comp.attributeIndexes)
                    {
                        var attribute = comp.getAttributeByIndex(attributeIndex);
                        if (attribute !== undefined && attribute !== null)
                            this.log.info("    " + attribute.toString());
                    }
                }
            }
        }
        if (!foundMatch && entName !== undefined)
            this.log.error("Failed to find entity '" + entName + "'");
    },

    /**
        Private handler of Entity name changes. This will take care of correct EC_Placeable parenting in a central place.
        We could leave it off to EC_Placeable to detect all situations and parent/unparent correctly, but it would require
        multiple iterations over all scene entities. Now we can iterate once per name change.

        This function is called by EC_Name when a name change occurs
    */
    _onEntityNameChanged : function(entity, newName, oldName)
    {
        for (var i = this.entities.length - 1; i >= 0; i--)
        {
            var iter = this.entities[i];
            var parentRef = (iter.placeable != null ? iter.placeable.parentRef : undefined);
            if (parentRef !== undefined && parentRef !== null)
            {
                // Parented to the old name?
                if (oldName !== "" && parentRef !== "" && parentRef === oldName)
                    iter.placeable.removeParent();
                // Needs to be parented to the new name?
                if (newName !== "" && parentRef === newName)
                    iter.placeable.checkParent();
            }
        }
    },

    /**
        Registers a callback for scene resets.

        @example
            TundraSDK.framework.scene.onReset(null, function(scene) {
                console.log("Scene reseted: " + scene.id);
            });

        @method onReset
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onReset : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("Scene.Reset", context, callback);
    },

    /**
        Registers a callback for entity created event.

            function onEntityCreated(entity)
            {
                // entity == Entity
                console.log("Entity", entity.id, entity.name, "created");
            }

            TundraSDK.framework.scene.onEntityCreated(null, onEntityCreated);

        @method onEntityCreated
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onEntityCreated : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("Scene.EntityCreated", context, callback);
    },

    /**
        Registers a callback for entity removed event.

            function onEntityRemoved(entity)
            {
                // entity == Entity
            }

            TundraSDK.framework.scene.onEntityRemoved(null, onEntityRemoved);

        @method onEntityRemoved
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onEntityRemoved : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("Scene.EntityRemoved", context, callback);
    },

    /**
        Registers a callback for component created event.

            function onComponentCreated(entity, component)
            {
                // entity == Entity
                // component == IComponent or one of its implementations.
                console.log("Entity", entity.id, entity.name, "got a new component: " + component.typeName);
            }

            TundraSDK.framework.scene.onComponentCreated(null, onComponentCreated);

        @method onComponentCreated
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onComponentCreated : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("Scene.ComponentCreated", context, callback);
    },

    /**
        Registers a callback for component removed event.
        @example
            function onComponentRemoved(entity, component)
            {
                // entity == Entity
                // component == IComponent or one of its implementations.
            }

            TundraSDK.framework.scene.onComponentRemoved(null, onComponentRemoved);

        @method onComponentRemoved
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onComponentRemoved : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("Scene.ComponentRemoved", context, callback);
    },

    /**
        Registers a callback for all attribute changes in the scene.
        @example
            TundraSDK.framework.scene.onAttributeChanged(null,
                function(entity, component, attributeIndex, attributeName, newValue) {
                    console.log(entity.name, component.id, attributeName, "=", newValue);
            });

        @method onAttributeChanged
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onAttributeChanged : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("Scene.AttributeChanged", context, callback);
    },

    /**
        Registers a callback for entity actions. See {{#crossLink "core/scene/EntityAction"}}{{/crossLink}} for the event parameter.
        @example
            function onEntityAction(entityAction)
            {
                // entityAction == EntityAction
            }

            TundraSDK.framework.scene.onEntityAction(null, onEntityAction);

        @method onEntityAction
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onEntityAction : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("Scene.EntityAction", context, callback);
    },

    _publishEntityCreated : function(entity)
    {
        if (entity == null)
        {
            console.log("ERROR: Scene trying to publish EntityCreated with null entity!");
            return;
        }

        TundraSDK.framework.events.send("Scene.EntityCreated", entity);
    },

    _publishEntityRemoved : function(entity)
    {
        if (entity == null)
        {
            console.log("ERROR: Scene trying to publish EntityRemoved with null entity!");
            return;
        }

        TundraSDK.framework.events.send("Scene.EntityRemoved", entity);

        // This entity will be removed. Unregister all callbacks.
        var idStr = entity.id.toString();
        TundraSDK.framework.events.remove("Scene.ComponentCreated." + idStr);
        TundraSDK.framework.events.remove("Scene.ComponentRemoved." + idStr);
        TundraSDK.framework.events.remove("Scene.AttributeChanged." + idStr);
        TundraSDK.framework.events.remove("Scene.EntityAction." + idStr);
    },

    _publishComponentCreated : function(entity, component)
    {
        if (entity == null)
        {
            console.log("ERROR: Scene trying to publish ComponentCreated with null entity!");
            return;
        }
        if (component == null)
        {
            console.log("ERROR: Scene trying to publish ComponentCreated with null component!");
            return;
        }

        TundraSDK.framework.events.send("Scene.ComponentCreated", entity, component);
        TundraSDK.framework.events.send("Scene.ComponentCreated." + entity.id.toString(), entity, component);
    },

    _publishComponentRemoved : function(entity, component)
    {
        if (entity == null)
        {
            console.log("ERROR: Scene trying to publish ComponentRemoved with null entity!");
            return;
        }
        if (component == null)
        {
            console.log("ERROR: Scene trying to publish ComponentRemoved with null component!");
            return;
        }

        TundraSDK.framework.events.send("Scene.ComponentRemoved", entity, component);
        TundraSDK.framework.events.send("Scene.ComponentRemoved." + entity.id.toString(), entity, component);
    },

    _publishEntityAction : function(entityAction)
    {
        if (entityAction == null)
        {
            console.log("ERROR: Scene trying to publish EntityAction with null entity action object!");
            return;
        }
        if (entityAction.entity == null)
        {
            console.log("ERROR: Scene trying to publish EntityAction with null entity in the action object!");
            return;
        }

        TundraSDK.framework.events.send("Scene.EntityAction", entityAction);
        TundraSDK.framework.events.send("Scene.EntityAction." + entityAction.entity.id.toString(), entityAction);
    },

    _publishAttributeChanged : function(entity, attribute)
    {
        if (entity == null)
        {
            console.log("ERROR: Scene trying to publish AttributeChanged with null entity!");
            return;
        }
        if (attribute.owner == null)
        {
            console.log("ERROR: Scene trying to publish AttributeChanged with null component!");
            return;
        }

        var entId = entity.id.toString();
        var compId = attribute.owner.id.toString();
        var attrIndex = attribute.index;
        var clone = attribute.getClone();

        TundraSDK.framework.events.send("Scene.AttributeChanged",
            entity, attribute.owner, attribute.index, attribute.name, clone);
        TundraSDK.framework.events.send("Scene.AttributeChanged." + entId,
            entity, attribute.owner, attribute.index, attribute.name, clone);
        TundraSDK.framework.events.send("Scene.AttributeChanged." + entId + "." + compId,
            entity, attribute.owner, attribute.index, attribute.name, clone);
        TundraSDK.framework.events.send("Scene.AttributeChanged." + entId + "." + compId + "." + attrIndex,
            clone);
    },

    _initComponentProperties : function(entity)
    {
        for (var cti = Scene.componentPropertyNames.length - 1; cti >= 0; cti--)
        {
            var propertyName = Scene.componentPropertyNames[cti]

            // We dont want EC_Name to override the name of the entity.
            // ent.name = "whee" etc. will be correctly redirected to EC_Name.
            if (propertyName === "name")
                continue;

            entity[propertyName] = null;
            if (propertyName !== propertyName.toLowerCase())
                entity[propertyName.toLowerCase()] = null;
        };
    },

    /**
        Gets and allocates the next local free entity id.
        @method nextFreeIdLocal
        @return {Number} The free id
    */
    nextFreeIdLocal : function()
    {
        for (var entId = 100000; entId < 200000; ++entId)
        {
            if (this.entityById(entId) == null)
                return entId;
        }
        return -1;
    },

    /**
        Gets and allocates the next replicated free entity id.
        @method nextFreeId
        @return {Number} The free id
    */
    nextFreeId  : function()
    {
        for (var entId = 1; entId < 100000; ++entId)
        {
            if (this.entityById(entId) == null)
                return entId;
        }
        return -1;
    },

    /**
        Resets the scene state. Deletes all entities.
        @method reset
    */
    reset : function()
    {
        this.id = 1;
        while (this.entities.length > 0)
        {
            var ent = this.entities[0];
            if (ent != null)
                ent.reset();
            this.entities.splice(0, 1);
        }
        this.entities = [];

        TundraSDK.framework.events.remove("Scene.EntityCreated");
        TundraSDK.framework.events.remove("Scene.EntityRemoved");
        TundraSDK.framework.events.remove("Scene.ComponentCreated");
        TundraSDK.framework.events.remove("Scene.ComponentRemoved");
        TundraSDK.framework.events.remove("Scene.EntityAction");

        TundraSDK.framework.events.send("Scene.Reset", this);
    },

    update : function(frametime)
    {
    },

    /**
        Creates new local entity that contains the specified components. To create an empty entity, omit the components parameter.
        @method createLocalEntity
        @param {Array} [components=Array()] Optional list of component names the entity will use. If omitted or the list is empty, creates an empty entity.
        @param {AttributeChange} [change=AttributeChange.LocalOnly] Change signaling mode. Note: Only AttributeChange.LocalOnly is supported at the moment!
        @param {Boolean} [componentsReplicated=false] Whether created components will be replicated.
        @return {Entity|null} The entity if created, otherwise null.
    */
    createLocalEntity : function(components, change, componentsReplicated)
    {
        if (components === undefined || components === null)
            components = [];
        if (change === undefined || change === null)
            change = AttributeChange.LocalOnly;
        if (componentsReplicated === undefined || componentsReplicated === null || typeof componentsReplicated !== "boolean")
            componentsReplicated = false;

        return this.createEntity(this.nextFreeIdLocal(), components, change, false, componentsReplicated)
    },

    /**
        Creates new entity that contains the specified components. To create an empty entity, omit the components parameter.
        @method createEntity
        @param {Number} [id=0] Id of the new entity. Specify 0 to use the next free ID
        @param {Array} [components=Array()] Optional list of component names the entity will use. If omitted or the list is empty, creates an empty entity.
        @param {AttributeChange} [change=AttributeChange.Default] Change signaling mode. Note: Only AttributeChange.LocalOnly is supported at the moment!
        @param {Boolean} [replicated=true] Whether entity is replicated.
        @param {Boolean} [componentsReplicated=true] Whether created components will be replicated.
        @return {Entity|null} The entity if created, otherwise null.
    */
    createEntity : function(id, components, change, replicated, componentsReplicated)
    {
        if (id === undefined || id === null || typeof id !== "number")
            id = 0;

        if (components === undefined || components === null)
            components = [];

        if (change === undefined || change === null)
            change = AttributeChange.Default;
        if (typeof change !== "number")
        {
            this.log.warn("createEntity called with non AttributeChange.Type change mode, defaulting to AttributeChange.Default.");
            change = AttributeChange.Default;
        }
        if (change != AttributeChange.LocalOnly)
        {
            //this.log.warn("createEntity called with localOnly != AttributeChange.LocalOnly. Creating replicated components is not supported at the moment, defaulting to LocalOnly.");
            change = AttributeChange.LocalOnly;
        }

        if (replicated === undefined || replicated === null || typeof replicated !== "boolean")
            replicated = true;
        if (componentsReplicated === undefined || componentsReplicated === null || typeof componentsReplicated !== "boolean")
            componentsReplicated = true;

        var entity = new Entity();
        entity.replicated = replicated;
        entity.local = !entity.replicated;
        entity.setId((id != 0 ? id : (entity.replicated ? this.nextFreeId() : this.nextFreeIdLocal())));

        // Init component shorthand properties.
        this._initComponentProperties(entity);

        // Add entity: Sets parent scene and updates components.
        this.addEntity(entity);

        // Create components
        for (var i = 0; i < components.length; ++i)
        {
            var compTypeName = IComponent.ensureComponentNamePrefix(components[i]);
            var component = entity.createComponent(compTypeName, null, (componentsReplicated ? AttributeChange.Replicate : AttributeChange.LocalOnly));
        }

        // Update entity once more now that it has all components
        if (components.length > 0)
            entity.update();

        return entity;
    },

    /**
        Adds entity to this scene.
        @method addEntity
        @param {Entity} entity
        @return {Boolean} True if added successfully, otherwise false.
    */
    addEntity : function(entity)
    {
        this.entities.push(entity);
        entity.setParent(this);
        entity.update();

        // Send event
        this._publishEntityCreated(entity);

        return true;
    },

    /**
        Removes entity from this scene by id.
        @method removeEntity
        @param {Number} entityId
        @return {Boolean} True if removed, otherwise false.
    */
    removeEntity : function(entityId)
    {
        for (var i = this.entities.length - 1; i >= 0; i--)
        {
            if (this.entities[i].id === entityId)
            {
                var ent = this.entities[i];
                if (ent != null)
                {
                    // Send event
                    this._publishEntityRemoved(ent);
                    ent.reset();
                }
                this.entities.splice(i, 1);
                ent = null;
                return true;
            }
        }
        return false;
    },

    /**
        Returns entity with given id, or null if not found.
        @method entityById
        @param {Number} entityId
        @return {Entity|null}
    */
    entityById : function(entityId)
    {
        for (var i = this.entities.length - 1; i >= 0; i--)
        {
            if (this.entities[i].id === entityId)
                return this.entities[i];
        }
        return null;
    },

    /**
        Returns entity with given name, or null if not found.
        @method entityByName
        @param {String} name
        @return {Entity|null}
    */
    entityByName : function(name)
    {
        for (var i = this.entities.length - 1; i >= 0; i--)
        {
            if (this.entities[i].name === name)
                return this.entities[i];
        }
        return null;
    },

    /**
        Returns list of entities that contains a component with given type/name.
        @method entitiesWithComponent
        @param {String|Number} type Type name of the component e.g. "Placeable" or type id of the component.
        @param {String} [name=undefined] Optional component name on top of the type e.g. "MyThing".
        @return {Array} List of Entity objects.
    */
    entitiesWithComponent : function(type, name)
    {
        var ents = [];
        if (type == null && name == null)
            return ents;

        var queryById = (typeof type != "string");

        for (var i=this.entities.length-1; i>=0; i--)
        {
            var component = (queryById ? this.entities[i].componentById(type) : this.entities[i].component(type));
            if (component != null)
            {
                if (name == null)
                    ents.push(this.entities[i]);
                else if (component.name == name)
                    ents.push(this.entities[i]);
            }
        }
        return ents;
    },

    /**
        Returns list of entities that contains components with given types.
        @method entitiesWithComponents
        @param {Array} types Array or type names/ids of the component e.g. "Placeable" and "Mesh" or type id of the component.
        @return {Array} List of Entity objects.
    */
    entitiesWithComponents : function(types)
    {
        var ents = [];
        if (types == null || types.length === undefined || types.length <= 0)
            return ents;

        var queryById = (typeof types[0] !== "string");

        for (var i=this.entities.length-1; i>=0; i--)
        {
            for (var ti=0, tilen=types.length; ti<tilen; ++ti)
            {
                var component = (queryById ? this.entities[i].componentById(types[ti]) : this.entities[i].component(types[ti]));
                if (component != null)
                {
                    if (name == null)
                        ents.push(this.entities[i]);
                    else if (component.name == name)
                        ents.push(this.entities[i]);
                }
            }
        }
        return ents;
    },

    /**
        Returns all components from the scene with given type/name.
        @method components
        @param {String|Number} type Type name of the component e.g. "Placeable" or type id of the component.
        @param {String} [name=""] Optional component name on top of the type e.g. "MyThing".
        @return {Array} List of IComponent or its implementation objects.
    */
    components : function(type, name)
    {
        var comps = [];
        var ents = this.entitiesWithComponent(type, name);
        for (var i = ents.length - 1; i >= 0; i--)
            comps.push(ents[i].component(type));
        return comps;
    },

    /**
        Creates a new non-parented Tundra Component by type name.
        The component id will be set to -1, the caller is responsible
        for initializing the id to a sane value.
        @method createComponent
        @param {String} typeName Component type name.
        @param {String} [compName=""] Component name.
        @return {IComponent} The created component.
    */
    createComponent : function(typeName, compName)
    {
        if (typeName === undefined || typeName === null)
            return null;
        if (compName === undefined || compName === null)
            compName = "";
        if (typeof compName !== "string")
        {
            this.log.error("createComponent called with non-string component name.");
            return null;
        }

        var typeId = -1;
        var findTypeName = IComponent.ensureComponentNamePrefix(typeName);
        for (var typeIdIter in Network.components)
        {
            if (Network.components[typeIdIter] === findTypeName)
            {
                typeId = parseInt(typeIdIter);
                break;
            }
        }
        if (typeId == -1)
        {
            this.log.error("createComponent could not find component implementation for '" + typeName + "'");
            return null;
        }
        return this.createComponentById(-1, typeId, compName);
    },

    /**
        Creates a new non-parented Tundra Component by id and with optional attribute binary data.
        Used when exact component information is known, e.g. it was sent from server.
        @method createComponentById
        @param {Number} compId Component id.
        @param {Number} compTypeId Component type id.
        @param {String} [compName=""] Component name.
        @param {DataDeserializer} [ds=undefined] Data deserializer for attribute data.
        If null or undefined deserialization from binary data is skipped.
        @return {IComponent} The created component.
    */
    createComponentById : function(compId, compTypeId, compName, ds)
    {
        if (compName === undefined)
            compName = "";
        if (ds === null)
            ds = undefined;

        // Fin the registered component
        var component = null;
        var componentImpl = Scene.registeredComponent(compTypeId);
        if (componentImpl !== undefined)
        {
            try
            {
                component = this._createComponentImpl(componentImpl, compId, compTypeId, compName);
            }
            catch (e)
            {
                this.log.error("Failed to instantiate registered component " + componentImpl.typeName + ": " + e);
                if (console.error != null)
                    console.error(e);
                return;
            }
        }

        if (component != null)
        {
            // Components can be created without any input binary data.
            if (ds !== undefined)
                component.deserializeFromBinary(ds);
        }
        else
        {
            var typeName = Network.components[compTypeId];
            if (typeName === undefined || typeName === null)
                this.log.warn("Component type name could not be resolved from ID " + compTypeId);

            // Generic component. Attribute parsing not implemented.
            component = new IComponent(compId, compTypeId, typeName, compName);
            component.notImplemented = true;
        }
        return component;
    },

    _createComponentImpl : function(componentImpl, compId, compTypeId, compName)
    {
        return (new componentImpl.prototype(compId, compTypeId, componentImpl.typeName, compName));
    },

    createComponentFromBinary : function(entity, ds)
    {
        // Read needed info to instantiate the correct component
        var compId = ds.readVLE();
        var compTypeId = ds.readVLE();
        var compName = ds.readStringU8();
        var compAttributeBytes = ds.readVLE();
        var bytesReadPre = ds.readBytes();
        ds.readLimitBytes = compAttributeBytes;

        // Create unparented component from binary data.
        var component = this.createComponentById(compId, compTypeId, compName, ds);
        if (component == null)
        {
            this.log.error("Failed to create Component with id " + compId + " and type id " + compTypeId + " from binary data.");
            return;
        }

        /* If the server has more attributes than the client component implementation, we need to skip those bytes.
           This is also the case if a components web implementation does not declare all its attributes on purpose.
           This code right here allows us to have older versions of the component and still keep the component functional,
           although with less attributes than the server has to offer us. */
        var bytesDiff = compAttributeBytes - (ds.readBytes() - bytesReadPre);
        if (bytesDiff > 0)
            ds.skipBytes(bytesDiff);

        // Add the component to the entity.
        return entity.addComponent(component);
    },

    onTundraMessage : function(message)
    {
        /// @note This entity id u16 is probably a sync manger hack for web socket!
        var sceneId = message.ds.readVLE();
        var entityId = message.ds.readVLE();

        // EditAttributesMessage. This is the bulk of Tundra network traffic
        if (message.id === 113)
            this.handleEditAttributesMessage(entityId, message.ds);
        // CreateEntityMessage
        else if (message.id === 110)
            this.handleCreateEntityMessage(entityId, message.ds);
        // RemoveEntityMessage
        else if (message.id === 116)
            this.handleRemoveEntityMessage(entityId);
        // CreateComponentsMessage
        else if (message.id === 111)
            this.handleCreateComponentsMessage(entityId, message.ds);
        // RemoveComponentsMessage
        else if (message.id === 115)
            this.handleRemoveComponentsMessage(entityId, message.ds);
        // CreateAttributesMessage
        else if (message.id === 112)
            this.handleCreateAttributesMessage(entityId, message.ds);
        // RemoveAttributesMessage
        else if (message.id === 114)
            this.handleRemoveAttributesMessage(entityId, message.ds);
    },

    handleEntityActionMessage : function(message)
    {
        message.entityAction.entity = this.entityById(message.entityAction.entityId);
        if (message.entityAction.entity == null)
        {
            if (TundraSDK.framework.client.networkDebugLogging)
                this.log.error("Failed to find entity with id " + message.entityAction.entityId + " to execute Entity action on!", true);
            return;
        }
        this._publishEntityAction(message.entityAction);
    },

    handleCreateEntityMessage : function(entityId, ds)
    {
        // New entity
        var entity = this.createEntity(entityId, [], AttributeChange.Replicate, true, true);
        entity.temporary = ds.readBoolean();

        // Components
        var numComponents = ds.readVLE();
        for (var i=0; i<numComponents; ++i)
        {
            if (!this.createComponentFromBinary(entity, ds))
            {
                this.log.error("Failed to create Component to a newly created Entity " + entityId);
                return;
            }
        }
    },

    handleRemoveEntityMessage : function(entityId)
    {
        if (this.removeEntity(entityId))
            return;

        if (TundraSDK.framework.client.networkDebugLogging)
            this.log.error("Failed to find Entity with id " + entityId + " for removal!");
    },

    handleCreateComponentsMessage : function(entityId, ds)
    {
        var entity = this.entityById(entityId);
        if (entity == null)
        {
            if (TundraSDK.framework.client.networkDebugLogging)
                this.log.error("Failed to create Components. Entity with id " + entityId + " was not found!");
            return;
        }

        // 3 bytes is the absolute minimum bytes this message has to have
        while (ds.bytesLeft() >= 3)
        {
            if (!this.createComponentFromBinary(entity, ds))
            {
                this.log.error("Failed to create Component to a existing Entity " + entityId);
                return;
            }
        }
    },

    handleRemoveComponentsMessage : function(entityId, ds)
    {
        var entity = this.entityById(entityId);
        if (entity == null)
        {
            if (TundraSDK.framework.client.networkDebugLogging)
                this.log.error("Failed to remove Components. Entity with id " + entityId + " was not found!");
            return;
        }

        while (ds.bytesLeft() >= 1)
        {
            var compId = ds.readVLE();
            if (entity.removeComponent(compId))
                continue;

            if (TundraSDK.framework.client.networkDebugLogging)
                this.log.error("Failed to remove Component with id " + compId + " from Entity " + entityId);
            return;
        }
    },

    handleCreateAttributesMessage : function(entityId, ds)
    {
        var entity = this.entityById(entityId);
        if (entity == null)
        {
            if (TundraSDK.framework.client.networkDebugLogging)
                this.log.error("Failed to create Attribute. Entity with id " + entityId + " was not found!");
            return;
        }

        // 3 bytes is the absolute minimum bytes this message has to have
        while (ds.bytesLeft() >= 3)
        {
            var compId = ds.readVLE();
            var component = entity.componentById(compId);
            if (component != null)
            {
                var attributeIndex = ds.readU8();
                component.createAttributeFromBinary(attributeIndex, ds);
            }
            else if (TundraSDK.framework.client.networkDebugLogging)
            {
                this.log.error("Failed to create Attribute from Component with id " + compId + " from Entity " + entityId + ". Component not found!");
                return;
            }
        }
    },

    handleRemoveAttributesMessage : function(entityId, ds)
    {
        var entity = this.entityById(entityId);
        if (entity == null)
        {
            if (TundraSDK.framework.client.networkDebugLogging)
                this.log.error("Failed to remove Attribute. Entity with id " + entityId + " was not found!");
            return;
        }

        // 2 bytes is the absolute minimum bytes this message has to have
        while (ds.bytesLeft() >= 2)
        {
            var compId = ds.readVLE();
            var component = entity.componentById(compId);
            if (component == null)
            {
                if (TundraSDK.framework.client.networkDebugLogging)
                    this.log.error("Failed to remove Attribute with component id " + compId + ". Component not found!");
                return;
            }

            // This message can only be handled by a dynamic component
            if (component.isDynamic())
                component.removeAttribute(ds.readU8());
            else
            {
                this.log.error("Cannot remove Attribute from Component with id " + compId + ". Component is not of dynamic type.");
                return;
            }
        }
    },

    handleEditAttributesMessage : function(entityId, ds)
    {
        var entity = this.entityById(entityId);
        if (entity == null)
        {
            if (TundraSDK.framework.client.networkDebugLogging)
                this.log.error("Failed to update Attributes. Entity with id " + entityId + " was not found!");
            return;
        }

        var array = null;
        var bufferView = null;
        var _ds = null;

        while (ds.bytesLeft() >= 2)
        {
            var compId = ds.readVLE();
            var component = entity.componentById(compId);
            if (component == null)
            {
                if (TundraSDK.framework.client.networkDebugLogging)
                    this.log.error("Failed to update Attributes with component id " + compId + ". Component not found!");
                return;
            }
            var totalBytes = ds.readVLE();

            // If this is base implementation of IComponent skip the data.
            if (component.notImplemented)
            {
                ds.skipBytes(totalBytes);
                continue;
            }

            // Read all bytes to bits for inspection.
            var bitArray = ds.readBits(totalBytes);

            // Control bit
            // 1 = Bitmask
            // 0 = Indices
            if (bitArray.get(0) === 1)
            {
                for(var i=1, bitmaskAttributeIndex=0; i<bitArray.size; ++i, ++bitmaskAttributeIndex)
                {
                    // Change bit
                    // 1 = attribute changed
                    // 0 = no change
                    if (bitArray.get(i) === 0)
                        continue;

                    var bitIndex = i+1;

                    var attribute = component.getAttributeByIndex(bitmaskAttributeIndex);
                    if (attribute === undefined || attribute === null)
                    {
                        // Don't log an error as some component web implementation might not declare all attributes!
                        //this.log.error("EditAttributesMessage 'bitmask' deserialization could not find attribute with index " + bitmaskAttributeIndex);
                        return;
                    }

                    // Read potential header
                    var len = attribute.sizeBytes;
                    if (len === undefined)
                    {
                        array = new Uint8Array(attribute.headerSizeBytes);
                        bufferView = new DataView(array.buffer);
                        for (var hi = 0; hi<attribute.headerSizeBytes; hi++)
                        {
                            var byte = DataDeserializer.readByteFromBits(bitArray, bitIndex);
                            bufferView.setUint8(hi, byte);
                            bitIndex += 8;
                        }
                        _ds = new DataDeserializer(array.buffer);
                        len = attribute.headerFromBinary(_ds);
                        i += (attribute.headerSizeBytes * 8);
                        if (len === undefined)
                            return;
                    }

                    // Read data
                    if (attribute.typeId !== Attribute.AssetReferenceList &&
                        attribute.typeId !== Attribute.QVariantList)
                    {
                        array = new Uint8Array(len);
                        bufferView = new DataView(array.buffer);
                        for (var di = 0; di<len; di++)
                        {
                            var byte = DataDeserializer.readByteFromBits(bitArray, bitIndex);
                            bufferView.setUint8(di, byte);
                            bitIndex += 8;
                        }
                        _ds = new DataDeserializer(array.buffer);
                        var readDataBytes = attribute.dataFromBinary(_ds, len);
                        i += (readDataBytes * 8);
                    }
                    else
                    {
                        // Do string list types by hand here, as we don't
                        // have enough information inside Attribute.dataFromBinary.
                        attribute.value = [];

                        // String list length
                        var totalLenght = 0;
                        for (var di = 0; di<len; di++)
                        {
                            // 255 max length for string
                            array = new Uint8Array(255);
                            bufferView = new DataView(array.buffer);

                            // Read individual string
                            var stringLen = DataDeserializer.readByteFromBits(bitArray, bitIndex);
                            bitIndex += 8;

                            for (var si=0; si<stringLen; ++si)
                            {
                                var byte = DataDeserializer.readByteFromBits(bitArray, bitIndex);
                                bufferView.setUint8(si, byte);
                                bitIndex += 8;
                            }
                            _ds = new DataDeserializer(bufferView.buffer, 0, stringLen);
                            attribute.value.push(_ds.readString(stringLen, false));
                            totalLenght += stringLen + 1;
                        }

                        i += (totalLenght * 8);
                        attribute.set(attribute.value, AttributeChange.LocalOnly);
                    }
                }
            }
            else
            {
                // Unroll bits back to bytes skipping the control bit
                array = new Uint8Array(totalBytes);
                bufferView = new DataView(array.buffer);
                for(var i=1, byteIndex=0; i<bitArray.size; i+=8, ++byteIndex)
                {
                    var byte = DataDeserializer.readByteFromBits(bitArray, i);
                    bufferView.setUint8(byteIndex, byte);
                }

                _ds = new DataDeserializer(array.buffer);
                var changeCount = _ds.readU8();
                for (var ci=0; ci<changeCount; ++ci)
                {
                    var attributeIndex = _ds.readU8();
                    component.deserializeAttributeFromBinary(attributeIndex, _ds);
                }
            }
        }
    }
});




/**
    Asset cache.

    @class AssetCache
    @constructor
*/
var AssetCache = Class.$extend(
{
    __init__ : function()
    {
        this.assets = {};
    },

    /**
        @method get
        @param {String} assetRef
        @return {IAsset}
    */
    get : function(ref)
    {
        return this.assets[ref];
    },

    /**
        @method set
        @param {String} assetRef
        @param {IAsset} asset
    */
    set : function(ref, asset)
    {
        this.assets[ref] = asset;
    },

    /**
        @method remove
        @param {String} assetRef
    */
    remove : function(ref)
    {
        delete this.assets[ref];
    },

    /**
        @method hasAsset
        @param {String} assetRef
        @return {Boolean}
    */
    hasAsset : function(ref)
    {
        return (this.get(ref) !== undefined);
    },

    /**
        @method getAssets
        @return {Array<IAsset>}
    */
    getAssets : function()
    {
        var assetsList = [];
        for (var ref in this.assets)
            assetsList.push(this.assets[ref]);
        return assetsList;
    },

    /**
        Clears the cache.
        @method forgetAssets
    */
    forgetAssets : function()
    {
        this.assets = {};
    }
});




// Main flag to enable profiling
var _enableAssetProfiling = false;
var _profiling  = (!_enableAssetProfiling ? undefined :
{
    // Total assets loaded
    loaded    : 0,
    // Total time spent loading
    timeTotal : 0,
    // List of asset classes to provide e.g "TextureAsset",
    // "OgreMeshAsset" or "all" for everything.
    types : [ "all" ]
});

/**
    IAsset interface that asset implementation will extend.
    @class IAsset
    @constructor
    @param {String} name Unique name of the asset, usually this is the asset reference.
    @param {String} type AssetAPI supported asset type.
*/
var IAsset = Class.$extend(
{
    __init__ : function(name, type)
    {
        /**
            Assets logger instance, with channel name as the asset type name.
            @property log
            @type TundraLogger
        */
        this.log = TundraLogging.getLogger(type);

        /**
            Unique asset reference.
            @property name
            @type String
        */
        this.name = name;
        /**
            AssetAPI supported asset type.
            @property type
            @type String
        */
        this.type = type;
        /**
            If this is a URL reference, baseRef is a URL to the parent folder. Guaranteed to have a trailing slash. <br>
            Can be used to resolve full URL references for potential relative path dependencies.
            @property baseRef
            @type String
        */
        this.baseRef = (name.indexOf("/") != 0 ? name.substring(0, name.lastIndexOf("/")+1) : "");
        if (name.indexOf(".zip#") != -1) 
            this.baseRef = name.substring(0, name.lastIndexOf(".zip#")+5);

        /**
            List of absolute asset references that this asset depends on.
            @property dependencyRefs
            @type Array<String>
        */
        this.dependencyRefs = [];
        /**
            True if this asset type requires cloning when its distributed among its transfers. Default value is false.
            @property requiresCloning
            @type Boolean
        */
        this.requiresCloning = false;
        /**
            True if this asset is the first loaded instance where clones were created. See the requiresCloning property.
            @property isCloneSource
            @type Boolean
        */
        this.isCloneSource = false;
        /**
            True if verbose logging should be done while loading the asset. Default value is false.
            @property logging
            @type Boolean
        */
        this.logging = false;
    },

    __classvars__ :
    {
        cloneCounts : {},
    },

    /**
        Return the current clone count for this asset.
        @return {Number}
    */
    numClones : function()
    {
        var num = IAsset.cloneCounts[this.name];
        if (num === undefined) num = 0;
        return num;
    },

    /**
        Returns a clone asset ref for a clone index.
        @param {Number} index Clone index.
        @return {String}
    */
    cloneName : function(index)
    {
        return this.name + "_clone_" + index;
    },

    /**
        Returns if this asset it loaded. Asset implementation must override this function, base implementation always returns false.

        If false you can hook to the loaded/failed event with {{#crossLink "IAsset/onLoaded:method"}}onLoaded(){{/crossLink}}
        and {{#crossLink "IAsset/onFailed:method"}}onFailed(){{/crossLink}}.
        @method isLoaded
        @return {Boolean}
    */
    isLoaded : function()
    {
        return false;
    },

    /**
        Registers a callback for asset deserialized event. Note that completing deserializing from data
        does not equal the asset being loaded. Data has been processed and potential dependencies should have
        been resolved and possibly requested.

        @method onDeserializedFromData
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onDeserializedFromData : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("IAsset.DeserializedFromData." + this.name, context, callback);
    },

    /**
        Registers a callback for asset loaded event. See {{#crossLink "IAsset/isLoaded:method"}}isLoaded(){{/crossLink}}.

        @method onLoaded
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onLoaded : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("IAsset.Loaded." + this.name, context, callback);
    },

    /**
        Registers a callback for asset dependency failed event.

        Code outside of AssetAPI internals requesting assets do not need to use this event.
        Use {{#crossLink "AssetTransfer/onFailed:method"}}{{/crossLink}} instead.

        @method onDependencyFailed
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onDependencyFailed : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("IAsset.DependencyFailed." + this.name, context, callback);
    },

    /**
        Registers a callback for asset unloaded event. See {{#crossLink "IAsset/isLoaded:method"}}isLoaded(){{/crossLink}}.
        @example
            var asset = TundraSDK.framework.asset.getAsset(assetRef);
            if (asset != null)
            {
                asset.onUnloaded(null, function(asset) {
                    console.log("Asset unloaded:", asset.name);
                });
            }

        @method onUnloaded
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onUnloaded : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("IAsset.Unloaded." + this.name, context, callback);
    },

    /**
        Clones the asset and return the clone.
        @method clone
        @param {undefined|String} newAssetName Name for the produced clone, must be unique to the AssetAPI system. 
        If undefined the new name will be auto generated.
        @return {null|IAsset} Valid asset or null if cloning failed.
    */
    clone : function(newAssetName)
    {
        // It is internally supported to call clone() with undefined name if requires cloning is true
        if (newAssetName === undefined || typeof newAssetName !== "string")
        {
            var cloneNum = this.numClones() + 1;
            newAssetName = this.cloneName(cloneNum);
            IAsset.cloneCounts[this.name] = cloneNum;
        }
        if (newAssetName === undefined || typeof newAssetName !== "string")
        {
            this.log.error("Canno clone() as input parameter 'newAssetName' is not defined!");
            return null;
        }

        var existing = TundraSDK.framework.asset.getAsset(newAssetName);
        if (existing !== undefined && existing !== null)
        {
            this.log.error("Cannot clone() asset '" + this.name + "' to new asset '" + newAssetName + "', it already exists!");
            return null;
        }
        var c = this._cloneImpl(newAssetName);
        if (c !== undefined && c !== null)
            TundraSDK.framework.asset.cache.set(c.name, c);
        else
            this.log.error("Failed to create clone '" + newAssetName + "'");
        return c;
    },

    /**
        This function needs to be overridden by the IAsset implementation for cloning to work.
    */
    _cloneImpl : function(newAssetName)
    {
        this.log.warn("_cloneImpl() not implemented/overridden by this asset type '" + this.type + "'");
        return null;
    },

    /**
        Returns number of dependencies this asset has.

        Asset implementation can override this function, base implementation will return dependencies().length.

        @method numDependencies
        @return {Number}
    */
    numDependencies : function()
    {
        return this.dependencies().length;
    },

    /**
        Returns number of pending (still loading) dependencies for this asset.

        Asset implementation should override this function if it has dependency logic,
        base implementation will return 0.

        @method numPendingDependencies
        @return {Number}
    */
    numPendingDependencies : function()
    {
        return 0;
    },

    /**
        Returns list of absolute asset references that this asset depends on. 
        Base implementation will returns the dependencyRefs property.

        @method dependencies
        @return {Number}
    */
    dependencies : function()
    {
        return this.dependencyRefs;
    },

    /**
        Returns a list of absolute asset refs that are pending (still loading) for this asset.

        Asset implementation should override this function if it has dependency logic,
        base implementation will return and empty array.

        @method dependencies
        @return {Number}
    */
    pendingDependencies : function()
    {
        return [];
    },

    /**
        Deserializes the asset from input data.
        Asset implementation must override this function, base implementation is a no-op.

        @method deserializeFromData
        @param {ArrayBuffer|Text|Xml} data
        @return {Boolean} Return false if loading the asset from input data fails.
        Returning true on success if optional, auto return of 'undefined' is assumed to be a successful load.
    */
    deserializeFromData : function(data)
    {
    },

    /**
        Unloads the asset from memory.
        Asset implementation must override this function, base implementation is a no-op.

        @method unload
    */
    unload : function()
    {
    },

    _deserializeFromData : function(data, dataType)
    {
        // Profiling
        var startTime = undefined;
        if (_profiling !== undefined)
        {
            for (var i = 0; i < _profiling.types.length; i++)
            {
                if (_profiling.types[i] === "all" || _profiling.types[i] === this.type)
                {
                    startTime = new Date();
                    break;
                }
            }
        }

        // Load asset
        var succeeded = this.deserializeFromData(data, dataType);
        if (succeeded === undefined)
            succeeded = true;
        else if (typeof succeeded !== "boolean")
        {
            this.log.error("deserializeFromData returned non boolean type value: " + succeeded +
                " for " + this.name + ". Assuming loading failed, marking to false. Fix your failure code paths to return 'false'.", true);
            succeeded = false;
        }

        // Profiling
        if (_profiling !== undefined && startTime !== undefined)
        {
            var name = this.name.substring(this.name.lastIndexOf("/")+1);
            var diff = (new Date()-startTime);
            _profiling.timeTotal += diff;
            _profiling.loaded += (succeeded ? 1 : 0);
            console.log("Loaded in " + diff +
                " msec [totals: time spent = " + _profiling.timeTotal +
                " msec num = " + _profiling.loaded + "] " + name
            );
        }

        // Deserialized
        if (succeeded)
            TundraSDK.framework.asset._emitAssetDeserializedFromData(this);
        // Loaded?
        if (succeeded && this.isLoaded())
            this._emitLoaded();
        return succeeded;
    },

    _unload : function()
    {
        this.unload();
        this._emiUnloaded();
    },

    _emitDeserializedFromData : function()
    {
        TundraSDK.framework.events.send("IAsset.DeserializedFromData." + this.name, this);
    },

    _emitLoaded : function()
    {
        TundraSDK.framework.events.send("IAsset.Loaded." + this.name, this);
    },

    _emitDependencyFailed : function(dependencyRef)
    {
        TundraSDK.framework.events.send("IAsset.DependencyFailed." + this.name, dependencyRef);
    },

    _emiUnloaded : function()
    {
        TundraSDK.framework.events.send("IAsset.Unloaded." + this.name, this);
    }
});




/**
    Asset transfer represents an web asset transfer operation.

    @class AssetTransfer
    @constructor
*/
var AssetTransfer = Class.$extend(
{
    __init__ : function(factory, ref, proxyRef, type, suffix)
    {
        this.log = TundraLogging.getLogger("AssetTransfer");

        /**
            Factory that will produce this asset.
            @property factory
            @type AssetFactory
        */
        this.factory = factory;
        /**
            Full unique asset reference.
            @property ref
            @type String
        */
        this.ref = ref;
        /**
            HTTP asset proxy request URL. 'undefined' if not fetched from a proxy.
            @property proxyRef
            @type String
        */
        this.proxyRef = proxyRef;
        /**
            Asset type.
            @property type
            @type String
        */
        this.type = type;
        /**
            Requests file suffix.
            @property suffix
            @type String
        */
        this.suffix = suffix;
        /**
            Request data type for the HTTP GET, if null lets the browser auto detect.
            Possible values are "text", "xml", "arraybuffer" or null.
            @property requestDataType
            @type String
        */
        this.requestDataType = undefined;
        /**
            Request timeout. The request will assume to have failed after this time once sent.
            @property requestTimeout
            @type Number
        */
        this.requestTimeout = 10000;
        /**
            True if this transfer is active aka fetching resource from the source.
            @property active
            @type Boolean
        */
        this.active = false;
        /**
            True if this transfer has finished, but the asset is still loading itself.
            This can happen if the asset has dependencies it needs to fetch before/during loading.
            @property loading
            @type Boolean
        */
        this.loading = false;
        /**
            If this asset is aborted. When true the callbacks waiting for this transfer
            to finish won't be invoked once the web request finishes.
            or loading the response data into a IAsset.
            @property active
            @type Boolean
        */
        this.aborted = false;
        /**
            Parent assets that depend on the current transfer of this asset.
            @property parentAssets
            @type IAsset
        */
        this.parentAssets = [];

        // Private, don't doc.
        this.subscribers = [];
        this.subscriptions = [];
    },

    __classvars__ :
    {
        completedFired : {},

        reset : function()
        {
            AssetTransfer.completedFired = {};
        },

        HttpStatus :
        {
            // Informational 1xx
            CONTINUE            : 100,
            SWITCHING_PROTOCOLS : 101,

            // Successful 2xx
            OK                              : 200,
            CREATED                         : 201,
            ACCEPTED                        : 202,
            NON_AUTHORITATIVE_INFORMATION   : 203,
            NO_CONTENT                      : 204,
            RESET_CONTENT                   : 205,
            PARTIAL_CONTENT                 : 206,

            // Redirection 3xx
            MULTIPLE_CHOICES                : 300,
            MOVED_PERMANENTLY               : 301,
            FOUND                           : 302,
            SEE_OTHER                       : 303,
            NOT_MODIFIED                    : 304,
            USE_PROXY                       : 305,
            TEMPORARY_REDIRECT              : 307,

            // Client Error 4xx
            BAD_REQUEST                     : 400,
            UNAUTHORIZED                    : 401,
            PAYMENT_REQUIRED                : 402,
            FORBIDDEN                       : 403,
            NOT_FOUND                       : 404,
            METHOD_NOT_ALLOWED              : 405,
            NOT_ACCEPTABLE                  : 406,
            PROXY_AUTHENTICATION_REQUIRED   : 407,
            REQUEST_TIMEOUT                 : 408,
            CONFLICT                        : 409,
            GONE                            : 410,
            LENGTH_REQUIRED                 : 411,
            PRECONDITION_FAILED             : 412,
            REQUEST_ENTITY_TOO_LARGE        : 413,
            REQUEST_URI_TOO_LONG            : 414,
            UNSUPPORTED_MEDIA_TYPE          : 415,
            REQUEST_RANGE_NOT_SATISFIABLE   : 416,
            EXPECTATION_FAILED              : 417,

            // Server Error 5xx
            INTERNAL_SERVER_ERROR           : 500,
            NOT_IMPLEMENTED                 : 501,
            BAD_GATEWAY                     : 502,
            SERVICE_UNAVAILABLE             : 503,
            GATEWAY_TIMEOUT                 : 504,
            HTTP_VERSION_NOT_SUPPORTED      : 505
        },

        statusCodeName : function(statusCode)
        {
            switch(statusCode)
            {
                case this.HttpStatus.CONTINUE: return "Continue";
                case this.HttpStatus.SWITCHING_PROTOCOLS: return "Switching Protocols";
                case this.HttpStatus.OK: return "OK";
                case this.HttpStatus.CREATED: return "Created";
                case this.HttpStatus.ACCEPTED: return "Accepted";
                case this.HttpStatus.NON_AUTHORITATIVE_INFORMATION: return "Non Authoritative Information";
                case this.HttpStatus.NO_CONTENT: return "No Content";
                case this.HttpStatus.RESET_CONTENT: return "Reset Content";
                case this.HttpStatus.PARTIAL_CONTENT: return "Partial Content";
                case this.HttpStatus.MULTIPLE_CHOICES: return "Multiple Choices";
                case this.HttpStatus.MOVED_PERMANENTLY: return "Moved Permanently";
                case this.HttpStatus.FOUND: return "Found";
                case this.HttpStatus.SEE_OTHER: return "See Other";
                case this.HttpStatus.NOT_MODIFIED: return "Not Modified";
                case this.HttpStatus.USE_PROXY: return "Use Proxy";
                case this.HttpStatus.TEMPORARY_REDIRECT: return "Temporary Redirect";
                case this.HttpStatus.BAD_REQUEST: return "Bad Request";
                case this.HttpStatus.UNAUTHORIZED: return "Unauthorized";
                case this.HttpStatus.PAYMENT_REQUIRED: return "Payment Required";
                case this.HttpStatus.FORBIDDEN: return "Forbidden";
                case this.HttpStatus.NOT_FOUND: return "Not Found";
                case this.HttpStatus.METHOD_NOT_ALLOWED: return "Method Not Allowed";
                case this.HttpStatus.NOT_ACCEPTABLE: return "Not Acceptable";
                case this.HttpStatus.PROXY_AUTHENTICATION_REQUIRED: return "Proxy Authentication Required";
                case this.HttpStatus.REQUEST_TIMEOUT: return "Request Timeout";
                case this.HttpStatus.CONFLICT: return "Conflict";
                case this.HttpStatus.GONE: return "Gone";
                case this.HttpStatus.LENGTH_REQUIRED: return "Length Required";
                case this.HttpStatus.PRECONDITION_FAILED: return "Precondition Failed";
                case this.HttpStatus.REQUEST_ENTITY_TOO_LARGE: return "Request Rntity Too Large";
                case this.HttpStatus.REQUEST_URI_TOO_LONG: return "Request Uri Too Long";
                case this.HttpStatus.UNSUPPORTED_MEDIA_TYPE: return "Unsupported Media Type";
                case this.HttpStatus.REQUEST_RANGE_NOT_SATISFIABLE: return "Request Range Not Satisfiable";
                case this.HttpStatus.EXPECTATION_FAILED: return "Expectation Failed";
                case this.HttpStatus.INTERNAL_SERVER_ERROR: return "Internal Server Error";
                case this.HttpStatus.NOT_IMPLEMENTED: return "Not Implemented";
                case this.HttpStatus.BAD_GATEWAY: return "Bad Gateway";
                case this.HttpStatus.SERVICE_UNAVAILABLE: return "Service Unavailable";
                case this.HttpStatus.GATEWAY_TIMEOUT: return "Gateway Timeout";
                case this.HttpStatus.HTTP_VERSION_NOT_SUPPORTED: return "Http Version Not Supported";
                case 0: return ""; // Request timeout
                default:
                    return "Unknown HTTP status code " + statusCode;
            }
        },

        isHttpSuccess : function(statusCode)
        {
            // For asset transfers the following are errors
            // this.HttpStatus.NO_CONTENT
            // this.HttpStatus.PARTIAL_CONTENT
            switch (statusCode)
            {
                case this.HttpStatus.OK:
                case this.HttpStatus.CREATED:
                case this.HttpStatus.ACCEPTED:
                case this.HttpStatus.NOT_MODIFIED:
                    return true;
                default:
                    return false;
            }
        }
    },

    toString : function()
    {
        return "ref = " + this.ref + " type = " + this.type + " suffix = " + this.suffix + " dataType = " + this.requestDataType;
    },

    /**
        Aborts the transfer, in that it wont handle any request response data.
        For internal use of AssetAPI.
    */
    abort : function()
    {
        this.aborted = true;
    },

    /**
        Adds a parent asset for this transfer if not already added.

        @method addParentAsset
        @param {IAsset} asset Parent asset that depends on this transfer.
    */
    addParentAsset : function(asset)
    {
        if (!(asset instanceof IAsset))
        {
            this.log.error("addParentAsset called with non IAsset object:", asset);
            return;
        }
        for (var i = 0; i < this.parentAssets.length; i++)
            if (this.parentAssets[i].name === asset.name)
                return;
        this.parentAssets.push(asset);
    },

    /**
        Registers a callback for asset transfer and asset load completion.

        @example
            var myContext = { name : "MyContextObject", meshAsset : null, textAsset : null };

            // Passing in metadata for the callback.
            var transfer = TundraSDK.framework.asset.requestAsset("http://www.my-assets.com/meshes/my.mesh");
            if (transfer != null)
            {
                // You can give custom metadata that will be sent to you on completion.
                transfer.onCompleted(myContext, function(asset, metadata) {
                    this.meshAsset = asset;       // this === the given context, in this case 'myContext'
                    console.log("Mesh loaded:", asset.name);
                    console.log("My metadata: ", metadata);
                }, { id : 14, name : "my mesh"}); // This object is the metadata
            }
            // Forcing an asset type for a request.
            transfer = TundraSDK.framework.asset.requestAsset("http://www.my-assets.com/data/my.json", "Text");
            if (transfer != null)
            {
                transfer.onCompleted(myContext, function(asset) {
                    this.textAsset = asset;              // this === the given context, in this case 'myContext'
                    console.log(JSON.parse(asset.data)); // "Text" forced TextAsset type
                });
                transfer.onFailed(myContext, function(transfer, reason, metadata) {
                    console.log("Failed to fetch my json from", transfer.ref, "into", this.name); // this.name === "MyContextObject"
                    console.log("Reason:", + reason);
                    console.log("Metadata id:", metadata); // metadata === 12345
                }, 12345);
            }

        @method onCompleted
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @param {Object} [metadata=undefined] Metadata you want to receive into the callback.
    */
    onCompleted : function(context, callback, metadata)
    {
        this.subscribers.push({
            "type"     : "completed",
            "context"  : context,
            "callback" : callback,
            "metadata" : metadata
        });
    },

    /**
        Registers a callback for asset transfer and asset load completion.

        @example
            var transfer = TundraSDK.framework.asset.requestAsset("http://www.my-assets.com/meshes/my.mesh");
            if (transfer != null)
            {
                transfer.onFailed(null, function(transfer, reason, metadata) {
                    console.log("Failed to fetch my json from", transfer.ref);
                    console.log("Reason:", + reason);
                    console.log("Metadata id:", metadata); // metadata === 12345
                }, 12345);
            }

        @method onFailed
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @param {Object} [metadata=undefined] Metadata you want to receive into the callback.
    */
    onFailed : function(context, callback, metadata)
    {
        this.subscribers.push({
            "type"     : "failed",
            "context"  : context,
            "callback" : callback,
            "metadata" : metadata
        });
    },

    _detectRequestDataType : function()
    {
        var dataType = (this.factory != null ? this.factory.requestDataType(this.suffix) : undefined);
        if (typeof dataType === "string")
            return dataType;

        this.log.warn("AssetFactory for", this.ref, "failed to return data type. Guessing from known types.");

        /** @todo Take an educated guess with type and suffix.
            There should be logic to ask the request data type either 
            from the AssetFactory or the IAsset class it instantiates.
            And/or have option to override the data type in AssetAPI.RequestAsset. */
        if (this.type === "Binary")
            return "arraybuffer";
        else if (this.type === "Text" && this.suffix === ".xml" || this.suffix === ".txml")
            return "xml";
        else if (this.type === "Text" && this.suffix === ".html" || this.suffix === ".html")
            return "document";
        else if (this.type === "Text" && this.suffix === ".json")
            return "json";
        else if (this.type === "Text")
            return "text";
        return undefined;
    },

    _send : function()
    {
        if (this.active === true)
        {
            this.log.error("Transfer is already active, refusing to re-send:", this.ref);
            return;
        }
        this.active = true;

        // If proxy has been set ask it for the data type. We cannot assume it from
        // the asset ref suffix as binary <-> text conversions can occur in the proxy.
        // Proxy also needs to tell us what is the appropriate request timeout.
        if (this.proxyRef !== undefined && TundraSDK.framework.asset.getHttpProxyResolver() !== undefined)
        {
             var transferMetadata = TundraSDK.framework.asset.getHttpProxyResolver().resolveRequestMetadata(this, this.proxyRef);
             if (transferMetadata !== undefined)
             {
                 this.requestDataType = (typeof transferMetadata.dataType === "string" ? transferMetadata.dataType : undefined);
                 this.requestTimeout = (typeof transferMetadata.timeout === "number" ? transferMetadata.timeout : this.requestTimeout);
             }
        }
        if (this.requestDataType === undefined  || this.requestDataType === null || this.requestDataType === "")
            this.requestDataType = this._detectRequestDataType();

        if (this.requestDataType !== "arraybuffer" && this.requestDataType !== "document")
        {
            $.ajax({
                type        : "GET",
                timeout     : this.requestTimeout,
                url         : (this.proxyRef !== undefined ? this.proxyRef : this.ref),
                dataType    : this.requestDataType,
                context     : this,
                success     : this._onTransferCompleted,
                error       : this._onTransferFailed
            });
        }
        else
        {
            var xmlHttpRequest = new XMLHttpRequest();
            xmlHttpRequest.open("GET", (this.proxyRef !== undefined ? this.proxyRef : this.ref), true);
            xmlHttpRequest.responseType = this.requestDataType;
            xmlHttpRequest.timeout = this.requestTimeout;

            xmlHttpRequest.addEventListener("load", this._onTransferCompletedBinary.bind(this), false);
            xmlHttpRequest.addEventListener("timeout", this._onTransferFailedBinary.bind(this), false);
            xmlHttpRequest.addEventListener("error", this._onTransferFailedBinary.bind(this), false);

            xmlHttpRequest.send(null);
        }
    },

    _handleHttpErrors : function(statusCode)
    {
        if (AssetTransfer.isHttpSuccess(statusCode))
            return false;

        TundraSDK.framework.asset.assetTransferFailed(this, "Request failed " + this.ref + ": " +
            statusCode + " " + AssetTransfer.statusCodeName(statusCode));
        return true;
    },

    _onTransferCompleted : function(data, textStatus, jqXHR)
    {
        if (this.aborted === true)
            return;

        if (this._handleHttpErrors(jqXHR.status))
            return;

        this._loadAssetFromData(data);

        // Cleanup
        jqXHR.responseText = null;
        jqXHR.responseXml = null;
        delete jqXHR; jqXHR = null;
        delete data; data = null;
    },

    _onTransferCompletedBinary : function(event)
    {
        if (this.aborted === true)
            return;

        // Proxy asked us to wait?
        var request = event.currentTarget;

        if (this._handleHttpErrors(request.status))
            return;

        this._loadAssetFromData(request.response);

        // Cleanup
        request.response = null;
        delete request; request = null;
    },

    _onTransferFailed : function(jqXHR, textStatus, errorThrown)
    {
        if (this.aborted === true)
            return;

        TundraSDK.framework.asset.assetTransferFailed(this, "Request failed " + this.ref + ": " +
            (jqXHR.status !== 0 ? jqXHR.status : "Request Timed Out") + " " +
            AssetTransfer.statusCodeName(jqXHR.status) +
            (typeof textStatus === "string" ? " (" + textStatus  + ")": "")
        );

        // Cleanup
        jqXHR.responseText = null;
        jqXHR.responseXml = null;
        delete jqXHR; jqXHR = null;
    },

    _onTransferFailedBinary : function(event)
    {
        if (this.aborted === true)
            return;

        // Proxy asked us to wait?
        var request = event.currentTarget;

        TundraSDK.framework.asset.assetTransferFailed(this, "Request failed " + this.ref + ": " +
            (request.status !== 0 ? request.status : "Request Timed Out") + " " +
            AssetTransfer.statusCodeName(request.status)
        );

        // Cleanup
        request.response = null;
        delete request; request = null;
    },

    _loadAssetFromData : function(data)
    {
        TundraSDK.framework.asset.removeActiveTransfer(this);

        var asset = TundraSDK.framework.asset.createEmptyAsset(this.ref, this.type);
        if (asset == null)
        {
            TundraSDK.framework.asset.assetTransferFailed(this, "Failed to create asset of unknown type '" + this.type + "' for '" + this.ref + "'");
            return;
        }

        try
        {
            this._deserializeFromData(asset, data);
        }
        catch(e)
        {
            TundraSDK.framework.asset.assetTransferFailed(this, "Exception while deserializing asset from data: " + e, true);
            if (e.stack !== undefined)
                console.error(e.stack);
            console.log(this);
        }

        this.active = false;
    },

    _deserializeFromData : function(asset, data)
    {
        var succeeded = asset._deserializeFromData(data, this.requestDataType);

        // Load failed synchronously
        if (!succeeded)
            TundraSDK.framework.asset.assetTransferFailed(this, "IAsset.deserializeFromData failed loading asset " + this.ref);
        // Loaded completed synchronously
        else if (asset.isLoaded())
            this._assetLoadCompleted(asset);
        // Load did not fail or complete yet: The asset is fetching dependencies etc.
        else
        {
            this.loading = true;
            this.subscriptions.push(asset.onLoaded(this, this._assetLoadCompleted));
            this.subscriptions.push(asset.onDependencyFailed(this, this._assetDependencyFailed));
        }
    },

    _assetLoadCompleted : function(asset)
    {
        this.loading = false;
        TundraSDK.framework.asset.assetTransferCompleted(this, asset);
    },

    _assetDependencyFailed : function(dependencyRef)
    {
        this.loading = false;
        TundraSDK.framework.asset.assetTransferFailed(this, "Asset request failed: " + this.ref +
            ". Dependency " + dependencyRef + " could not be loaded.");
    },

    _emitCompleted : function(asset)
    {
        for (var i = 0; i < this.subscriptions.length; i++)
            TundraSDK.framework.events.unsubscribe(this.subscriptions[i]);
        this.subscriptions = [];

        // Get fired count from static global object.
        // Used to determine if we need to clone certain assets.
        var fired = AssetTransfer.completedFired[asset.name];
        if (fired === undefined)
            fired = 0;

        for (var i=0; i<this.subscribers.length; ++i)
        {
            try
            {
                var subscriber = this.subscribers[i];
                if (subscriber.type !== "completed")
                    continue;

                // Create clone if applicable
                var responseAsset = null;
                if (asset.requiresCloning && fired > 0)
                    responseAsset = asset.clone();
                else
                    responseAsset = asset;

                fired++; // Increment before for potential exception

                // If context was not provided use this AssetTransfer as the context.
                subscriber.callback.call((subscriber.context !== undefined && subscriber.context !== null ? subscriber.context : this),
                        responseAsset, subscriber.metadata);
            }
            catch(e)
            {
                TundraSDK.framework.client.logError("[AssetTransfer]: Completed handler exception: " + e, true);
                if (e.stack !== undefined)
                    console.error(e.stack);
            }
        }
        AssetTransfer.completedFired[asset.name] = fired;
        this.subscribers = [];
    },

    _emitFailed : function(reason)
    {
        for (var i = 0; i < this.subscriptions.length; i++)
            TundraSDK.framework.events.unsubscribe(this.subscriptions[i]);
        this.subscriptions = [];

        for (var i=0; i<this.subscribers.length; ++i)
        {
            try
            {
                var subscriber = this.subscribers[i];
                if (subscriber.type !== "failed")
                    continue;

                // If context was not provided use this AssetTransfer as the context.
                subscriber.callback.call((subscriber.context !== undefined && subscriber.context !== null ? subscriber.context : this),
                    this, reason, subscriber.metadata);
            }
            catch(e)
            {
                TundraSDK.framework.client.logError("[AssetTransfer]: Failed handler exception: " + e, true);
            }
        }
        this.subscribers = [];
    }
});




/**
    AssetFactory for creating new assets.

    @class AssetFactory
    @constructor
    @param {String} name Name of the factory.
    @param {IAsset} assetClass Asset class that new assets are created from. 
    @param {Object} typeExtensions Map of lower cased file extension to the network request data type.
    If 'undefined' this asset can only be created via forcing the request type to assetType in AssetAPI.requestAsset.
    Or you can do more complex logic by overriding requestDataType and canCreate functions.
    @param {String} defaultDataType Default network request data type for example 'xml', 'text', 'arraybuffer', 'json' etc.
*/
var AssetFactory = Class.$extend(
{
    __init__ : function(assetType, assetClass, typeExtensions, defaultDataType)
    {
        if (typeof assetType !== "string")
            console.error("AssetFactory constructor 'assetType' needs to be a string!");
        if (assetClass === undefined || assetClass === null)
            console.error("AssetFactory constructor 'assetClass' is not a valid object!");
        if (typeExtensions !== undefined && Array.isArray(typeExtensions))
            console.error("AssetFactory constructor 'typeExtensions' must be a object mapping suffix to request data type!");
        else if (typeExtensions !== undefined && typeof typeExtensions !== "object")
            console.error("AssetFactory constructor 'typeExtensions' must be a object mapping suffix to request data type!");

        this.assetType = assetType;
        this.assetClass = assetClass;
        this.typeExtensions = typeExtensions;
        this.defaultDataType = defaultDataType;
    },

    /**
        Returns supported file extensions.
        @return {Array<string>}
    */
    supportedSuffixes : function()
    {
        return Object.keys(this.typeExtensions);
    },

    /**
        Returns the data type for the network request for a particular suffix.

        @method requestDataType
        @param {String} extension File type extension.
        @return {String}
    */
    requestDataType : function(suffix)
    {
        var dataType = this.typeExtensions[suffix.toLowerCase()];
        if (typeof dataType === "string")
            return dataType;
        else if (typeof this.defaultDataType === "string")
            return this.defaultDataType;
        return undefined;
    },

    /**
        Returns if this factory can create assets for a given file extension.
        The extension should start with a dot, eg. ".png".

        @method canCreate
        @param {String} extension File type extension.
        @return {Boolean}
    */
    canCreate : function(assetRef)
    {
        if (this.typeExtensions === undefined || this.typeExtensions === null)
            return false;

        var assetRefLower = assetRef.toLowerCase();
        var supportedSuffixes = Object.keys(this.typeExtensions);
        for (var i=0, len=supportedSuffixes.length; i<len; ++i)
        {
            if (CoreStringUtils.endsWith(assetRef, supportedSuffixes[i]))
                return true;
        }
        return false;
    },

    /**
        Returns a new empty asset for the given assetRef. Null if cannot be created.

        @method createEmptyAsset
        @param {String} assetRef Asset reference for the new asset.
        @return {IAsset|null}
    */
    createEmptyAsset : function(assetRef)
    {
        var asset = new this.assetClass(assetRef);
        this.emptyAssetCreated(asset);
        return asset;
    },

    /**
        Called when a new asset is created. You can implement your own AssetFactory and
        override this function to get notificatin each time a new asset has been created.

        @method emptyAssetCreated
        @param {IAsset} asset Created asset.
    */
    emptyAssetCreated : function(asset)
    {
    }
});




/**
    Represents a WebTundra text based asset, useful for JSON/XML/TXT etc. requests.

    To use this asset type force asset type to "Text" when calling {{#crossLink "AssetAPI/requestAsset:method"}}{{/crossLink}}.
    @class TextAsset
    @extends IAsset
    @constructor
    @param {String} name Unique name of the asset, usually this is the asset reference.
*/
var TextAsset = IAsset.$extend(
{
    __init__ : function(name)
    {
        this.$super(name, "TextAsset");

        /**
            Asset data string.
            @property data
            @type String
        */
        this.data = null;
    },

    isLoaded : function()
    {
        return (this.data !== null);
    },

    deserializeFromData : function(data)
    {
        this.data = data;
    },

    unload : function()
    {
        this.data = null;
    }
});




/**
    Represents a WebTundra binary asset.

    To use this asset type force asset type to "Binary" when calling {{#crossLink "AssetAPI/requestAsset:method"}}{{/crossLink}}.
    @class BinaryAsset
    @extends IAsset
    @constructor
    @param {String} name Unique name of the asset, usually this is the asset reference.
*/
var BinaryAsset = IAsset.$extend(
{
    __init__ : function(name)
    {
        this.$super(name, "BinaryAsset");

        /**
            Asset binary data.
            @property data
            @type ArrayBuffer
        */
        this.data = null;
    },

    isLoaded : function()
    {
        return (this.data !== null);
    },

    deserializeFromData : function(data)
    {
        this.data = data;
    },

    unload : function()
    {
        this.data = null;
    }
});




/**
    AssetAPI that is accessible from {{#crossLink "TundraClient/asset:property"}}TundraClient.asset{{/crossLink}}

    Loads requested assets to the system and manages their lifetime.
    @class AssetAPI
    @constructor
*/
var AssetAPI = Class.$extend(
{
    __init__ : function(params)
    {
        this.log = TundraLogging.getLogger("Asset");

        // Handle startup parameters
        this.localStoragePath = params.asset.localStoragePath != null ? params.asset.localStoragePath : "";
        if (this.localStoragePath != "" && !CoreStringUtils.endsWith(this.localStoragePath, "/"))
            this.localStoragePath += "/";

        /**
            Asset cache where you can find currently loaded assets.

                var asset = TundraSDK.framework.asset.cache.get(assetRef);
                if (asset != null)
                    console.log(asset.name);

            @property cache
            @type AssetCache
        */
        this.cache = new AssetCache();
        /**
            Registered asset factories.

            @property factories
            @type Array<AssetFactory>
        */
        this.factories = [];
        /**
            If transfers should be processed and started automatically by AssetAPI.
            If set to false, you need to manually pump the processing by calling
            AssetAPI.processTransfers() or implementing your own logic that processes
            the AssetAPI.transfers queue.

            @property autoProcessTransfers
            @type Boolean
            @default true
        */
        this.autoProcessTransfers = true;
        /**
            Maximum number of active asset transfers.
            @property transfers
            @type Array of AssetTransfers
            @default 8
        */
        this.maxActiveTransfers = 8;
        /**
            Maximum number of active asset transfers per asset type.

            <b>Note:</b> maxActiveTransfers is respected first. Even if you set a type to have
            higher max transfers, it can never go above maxActiveTransfers.

            @property transfers
            @type Array of AssetTransfers
            @default None are set.
            @example
                TundraSDK.framework.asset.maxActiveTransfersPerType["Binary"] = 5;
        */
        this.maxActiveTransfersPerType = {};

        // Register core asset factories
        this.registerAssetFactory(new AssetFactory("Text", TextAsset, { 
            ".xml"   : "xml",           ".txml"  : "xml",
            ".html"  : "document",      ".htm"   : "document",
            ".json"  : "json",          ".js"    : "json",
            ".txt"   : "text"
        }, "text"));
        this.registerAssetFactory(new AssetFactory("Binary", BinaryAsset, {}, "arraybuffer"));
    },

    __classvars__ :
    {
        /**
            Current HTTP proxy resolver implementation used by AssetAPI.
            @property
            @static
            @default undefined
            @type IHttpProxyResolver
        */
        httpProxyResolver : undefined,

        /**
            Sets a proxy resolver implementation to be used by AssetAPI.
            @method reset
            @static
            @param {IHttpProxyResolver} resolver Resover implementation.
        */
        setHttpProxyResolver : function(resolver)
        {
            this.httpProxyResolver = resolver;
        }
    },

    postInitialize : function()
    {
    },

    /**
        Sets the current proxy resolver implementation.
        @method getHttpProxyResolver
        @param {IHttpProxyResolver|undefined} resolver IHttpProxyResolver instance.
    */
    setHttpProxyResolver : function(resolver)
    {
        return AssetAPI.httpProxyResolver = resolver;
    },

    /**
        Returns the current proxy resolver implementation, or undefined if not set.
        @method getHttpProxyResolver
        @return {IHttpProxyResolver|undefined}
    */
    getHttpProxyResolver : function()
    {
        return AssetAPI.httpProxyResolver;
    },

    /**
        Registers a new asset factory.
        @method registerAssetFactory
        @param {AssetFactory} assetFactory
        @return {Boolean} If registration was successful.
    */
    registerAssetFactory : function(assetFactory)
    {
        if (!(assetFactory instanceof AssetFactory))
        {
            this.log.error("registerAssetFactory called with a non AssetFactory object:", assetFactory);
            return false;
        }
        // Check if this type is registered
        for (var i=0; i<this.factories.length; ++i)
        {
            if (this.factories[i].assetType === assetFactory.assetType)
            {
                this.log.error("AssetFactory with type '" + assetFactory.assetType + "' already registered:", this.factories[i]);
                return false;
            }
        }
        this.factories.push(assetFactory);
        if (assetFactory.typeExtensions !== undefined && assetFactory.supportedSuffixes().length > 0)
            this.log.debug("Registered factory", assetFactory.assetType, assetFactory.supportedSuffixes());
        else
            this.log.debug("Registered factory", assetFactory.assetType);
        return true;
    },

    getAssetFactory : function(assetRef, assetType)
    {
        // This is either or: If the asset type is provided,
        // it must be found with it or its an error.
        if (typeof assetType === "string")
        {
            for (var i=0; i<this.factories.length; i++)
            {
                if (this.factories[i].assetType === assetType)
                    return this.factories[i];
            }
        }
        else
        {
            for (var i=0; i<this.factories.length; i++)
            {
                if (this.factories[i].canCreate(assetRef))
                    return this.factories[i];
            }
        }
        return null;
    },

    /**
        Resets the internal state. Forgets all cached assets permanently.
        @method reset
    */
    reset : function()
    {
        this.forgetAssets(true);
        this.abortTransfers();
        this.defaultStorage = null;

        /**
            Active asset transfers.
            @property transfers
            @type Array of AssetTransfers
        */
        this.transfers = [];

        // Internal, no doc.
        this.readyTransfers = [];
        this.activeTransfers = [];

        this.startMonitoring = false;
        this.tranferCheckT = 0.0;
        this.tranferCheckInterval = 0.1;

        this.noFactoryErrors = {};

        // Reset static asset transfer tracking data.
        AssetTransfer.reset();
    },

    /**
        Returns a relative path to the local asset storage for a given resouce.
        @method getLocalAssetPath
        @param {String} resource
        @return {String} Relative resource path that can be embedded to the DOM or CSS.
    */
    getLocalAssetPath : function(resource)
    {
        return this.localStoragePath + resource;
    },

    /**
        Get loaded asset.
        @method getAsset
        @param {String} assetRef Full asset reference.
        @return {IAsset|undefined} Asset instance or undefined if not loaded.
    */
    getAsset : function(assetRef)
    {
        return this.cache.get(assetRef);
    },

    abortTransfers : function()
    {
        if (this.transfers !== undefined)
        {
            for (var i = 0; i < this.transfers.length; i++)
                this.transfers[i].abort();
        }
        if (this.activeTransfers !== undefined)
        {
            for (var i = 0; i < this.activeTransfers.length; i++)
                this.activeTransfers[i].abort();
        }
    },

    /**
        Forgets all assets from the asset cache. Additionally also unloads all assets from memory, this can be prevented with doUnload=false.
        @method forgetAssets
        @param {Boolean} [doUnload=true]
    */
    forgetAssets : function(doUnload)
    {
        if (doUnload === undefined || doUnload === null)
            doUnload = true;

        var assets = this.cache.getAssets();
        for (var i = 0; i < assets.length; i++)
        {
            var asset = assets[i];
            if (asset != null)
                TundraSDK.framework.events.send("AssetAPI.AssetAboutToBeRemoved", asset);
            if (doUnload && asset != null && typeof asset.unload === "function")
            {
                // Reset the requiresCloning boolean as we really want to unload now.
                // Some assets won't unload if requiresCloning is set due to various reasons.
                asset.requiresCloning = false;
                asset.isCloneSource = false;
                asset.unload();
            }
            asset = null;
        }
        this.cache.forgetAssets();
    },

    update : function(frametime)
    {
        if (frametime !== undefined)
        {
            this.tranferCheckT += frametime;
            if (this.tranferCheckT < this.tranferCheckInterval)
                return;
            this.tranferCheckT = 0.0;
        }

        // Process transfers queue
        if (this.transfers.length > 0 && this.activeTransfers.length < this.maxActiveTransfers)
        {
            if (this.autoProcessTransfers === true)
                this.processTransfers();
        }
        else if (this.transfers.length == 0 && this.startMonitoring)
        {
            this.startMonitoring = false;

            if (TundraSDK.framework.client.websocket !== null)
            {
                /// Wait a bit and check again if we have completed everything
                setTimeout(function() {
                    if (this.transfers.length > 0)
                        return;

                    this.log.infoC("All asset transfers done");
                    this.noFactoryErrors = {};

                    if (TundraSDK.framework.client.networkDebugLogging === true)
                    {
                        var loadedAssets = {};
                        var assets = this.cache.getAssets();
                        for (var i=0, len=assets.length; i<len; i++)
                        {
                            var asset = assets[i];
                            if (loadedAssets[asset.type] === undefined)
                                loadedAssets[asset.type] = 1;
                            else
                                loadedAssets[asset.type] += 1;
                        }
                        for (var assetType in loadedAssets)
                            this.log.debug("   >> " + assetType + " : " + loadedAssets[assetType]);
                    }
                }.bind(this), 500);
            }
        }

        // Ship ready transfers
        if (this.readyTransfers.length > 0)
        {
            for (var i = 0; i < this.readyTransfers.length; i++)
            {
                var transfer = this.readyTransfers[i];
                transfer._emitCompleted(this.getAsset(transfer.ref));
                delete transfer;
            }
            this.readyTransfers = [];
        }
    },

    handleDefaultStorage : function(storageStr)
    {
        var temp = JSON.parse(storageStr);
        this.defaultStorage = temp.storage;
    },

    makeDefaultStorageRelativeRef : function(ref)
    {
        if (this.defaultStorage == null || typeof this.defaultStorage.src !== "string" || !CoreStringUtils.startsWith(ref, this.defaultStorage.src))
            return undefined;
        return ref.substring(this.defaultStorage.src.length);
    },

    /**
        Return if the given asset reference is supported by a registered AssetFactory.
        @method isSupportedAssetRef
        @param {String} assetRef
        @return {Boolean}
    */
    isSupportedAssetRef : function(assetRef)
    {
        return (this.getAssetFactory(assetRef) !== null);
    },

    /**
        Return if the given type is supported by a registered AssetFactory.
        @method isSupportedAssetType
        @param {String} type
        @return {Boolean}
    */
    isSupportedAssetType : function(type)
    {
        return (this.getAssetFactory(undefined, type) !== null);
    },

    /*
        Request a dependency asset. Used for IAsset implementation to request dependencies.
        This function differs from AssetAPI.requestAsset in that it will setup dependency refs to parent asset
        (IAsset.dependencyRefs) and add the parent asset to the new transfer automatically (AssetTransfer.parentAssets).
        
        This function also puts this dependency transfer at the front of the pending transfers queue, 
        so the dependency is loaded as soon as possible.

        <b>Note:</b> AssetAPI does not track/monitor asset dependency completions automatically, 
        only the number of dependencies it has, the refs and manages the parent asset for transfers.
        Each asset is responsible for actually executing the requests and handling their completion.

        @method requestDependencyAsset
        @param {IAsset} parentAsset Parent asset requesting this dependency.
        @param {String} ref Dependency asset reference.
        @param {String} [forcedAssetType=undefined] Can be used to override the auto detected asset type.
    */
    requestDependencyAsset : function(parentAsset, ref, forcedAssetType)
    {
        if (!(parentAsset instanceof IAsset))
        {
            this.log.error("requestDependencyAsset called with non IAsset object as 'parentAsset':", parentAsset);
            return null;
        }

        /** @todo Verify that this does not get broken if multiple things request the same dependency.
            All that should happen it gets prepended multiple times to transfers and multiple parentAssets are set. */
        var lenPre = this.transfers.length;
        var transfer = this.requestAsset(ref, forcedAssetType);
        if (transfer == null)
            return transfer;

        // Set parent asset
        transfer.addParentAsset(parentAsset);

        // Prepend dep to transfer queue.    
        if (this.transfers.length > lenPre)
        {
            var removeTransfer = this.transfers.splice(this.transfers.length-1, 1)[0];
            if (removeTransfer.ref !== transfer.ref)
            {
                this.log.error("Something went wrong in injecting transfer to the start of the queue: " +
                    transfer.ref + " removed from last index: " + removeTransfer.ref)
            }
            this.transfers.splice(0, 0, removeTransfer);
        }
        // Append dependency to IAsset.dependencyRefs
        if (parentAsset !== undefined && parentAsset.dependencyRefs !== undefined)
        {
            var depRefExists = false;
            for (var i = parentAsset.dependencyRefs.length - 1; i >= 0; i--)
            {
                depRefExists = (parentAsset.dependencyRefs[i] === transfer.ref);
                if (depRefExists)
                    break;
            }
            if (!depRefExists)
                parentAsset.dependencyRefs.push(transfer.ref);
        }
        return transfer;
    },

    /**
        Request asset.

        @example
            var myContext = { name : "MyContextObject", meshAsset : null, textAsset : null };

            // Passing in metadata for the callback.
            var transfer = TundraSDK.framework.asset.requestAsset("http://www.my-assets.com/meshes/my.mesh");
            if (transfer != null)
            {
                // You can give custom metadata that will be sent to you on completion.
                transfer.onCompleted(myContext, function(asset, metadata) {
                    this.meshAsset = asset;       // this === the given context, in this case 'myContext'
                    console.log("Mesh loaded:", asset.name);
                    console.log("My metadata: ", metadata);
                }, { id : 14, name : "my mesh"}); // This object is the metadata
            }
            // Forcing an asset type for a request.
            transfer = TundraSDK.framework.asset.requestAsset("http://www.my-assets.com/data/my.json", "Text");
            if (transfer != null)
            {
                transfer.onCompleted(myContext, function(asset) {
                    this.textAsset = asset;              // this === the given context, in this case 'myContext'
                    console.log(JSON.parse(asset.data)); // "Text" forced TextAsset type
                });
                transfer.onFailed(myContext, function(transfer, reason, metadata) {
                    console.log("Failed to fetch my json from", transfer.ref, "into", this.name); // this.name === "MyContextObject"
                    console.log("Reason:", + reason);
                    console.log("Metadata id:", metadata); // metadata === 12345
                }, 12345);
            }

        @method requestAsset
        @param {String} ref Asset reference
        @param {String} [forcedAssetType=undefined] Can be used to override the auto detected asset type.
        @return {AssetTransfer} Transfer for this request. Connect to it with
        {{#crossLink "AssetTransfer/onCompleted:method"}}onCompleted(){{/crossLink}} and {{#crossLink "AssetTransfer/onFailed:method"}}onCompleted(){{/crossLink}}.
    */
    requestAsset : function(ref, forcedAssetType)
    {
        if (CoreStringUtils.startsWith(ref, "generated://") || CoreStringUtils.startsWith(ref, "local://"))
            return null;

        var factory = this.getAssetFactory(ref, forcedAssetType);
        if (factory === null)
        {
            var logged = this.noFactoryErrors[ref];
            if (logged === undefined)
            {
                if (typeof forcedAssetType === "string")
                    this.log.error("No registered AssetFactory for type '" + forcedAssetType + "':", ref);
                else
                    this.log.error("No registered AssetFactory for suffix '" + CoreStringUtils.extension(ref) + "':", ref);
                this.noFactoryErrors[ref] = true;
            }
            return null;
        }

        // Type information
        var assetExt = CoreStringUtils.extension(ref);
        var assetType = factory.assetType;

        // webtundra:// ref to a relative ref on the hosted web page.
        if (CoreStringUtils.startsWith(ref, "webtundra://"))
        {
            ref = this.localStoragePath + ref.substring(12);
        }
        // Point relative refs to default storage.
        // If not known (not connected to server) use relative from page.
        else if (!CoreStringUtils.startsWith(ref, "http"))
        {
            if (this.defaultStorage != null && typeof this.defaultStorage.src === "string")
                ref = this.defaultStorage.src + ref;
            else
                ref = this.localStoragePath + ref;
        }

        // If an asset proxy implementation has been registered, ask it for the proxy url.
        // Otherwise the original url is used for the request, meaning its the hosting partys
        // responsibility to make sure their server support CORS and other aspect of what
        // are required when doing http requests from JavaScript code.
        var proxyRef = undefined;
        if (CoreStringUtils.startsWith(ref, "http") && AssetAPI.httpProxyResolver !== undefined)
            proxyRef = AssetAPI.httpProxyResolver.resolve(ref, assetType, assetExt);

        // 1. Ongoing ready transfer
        var transfer = null;
        for (var i = this.readyTransfers.length - 1; i >= 0; i--)
        {
            transfer = this.readyTransfers[i];
            if (transfer.ref === ref)
                return transfer;
        }

        // 2. Ongoing web transfer
        for (var i = this.transfers.length - 1; i >= 0; i--)
        {
            transfer = this.transfers[i];
            if (transfer.ref === ref)
                return transfer;
        }

        // 3. Asset loaded to the system
        var existingAsset = this.getAsset(ref);
        if (existingAsset !== undefined && existingAsset !== null)
        {
            transfer = new AssetTransfer(null, ref, proxyRef, assetType, assetExt);
            this.readyTransfers.push(transfer);
            return transfer;
        }

        // 4. Request asset from the source
        transfer = new AssetTransfer(factory, ref, proxyRef, assetType, assetExt);
        this.transfers.push(transfer);

        /** @todo Evaluate if this event should fire for 'readyTransfers'
            that are just dummy transfers of already loaded assets. */
        TundraSDK.framework.events.send("AssetAPI.ActiveAssetTransferCountChanged", this.numCurrentTransfers());

        return transfer;
    },

    processTransfers : function(recursiveUpToMaxActiveTransfers)
    {
        if (recursiveUpToMaxActiveTransfers === undefined)
            recursiveUpToMaxActiveTransfers = true;

        var allActive = true;
        if (this.transfers.length > 0 && this.activeTransfers.length < this.maxActiveTransfers)
        {
            var queued = this.numQueuedTransfersPerType();

            for (var i=0; i<this.transfers.length; ++i)
            {
                var transfer = this.transfers[i];
                if (transfer === undefined || transfer === null)
                {
                    this.transfers.splice(0, 1);
                    break;
                }

                if (transfer.active || transfer.loading)
                    continue;

                var maxTransfersForType = this.maxAssetTransfersForType(transfer.type);
                if (maxTransfersForType !== undefined && typeof maxTransfersForType === "number" && maxTransfersForType > 0)
                {
                    if (this.activeTransfersForType(transfer.type) >= maxTransfersForType)
                    {
                        // If no other type is pending, we will ignore the max transfers for this type
                        if (Object.keys(queued).length > 1)
                            continue;
                    }
                }

                allActive = false;
                this.startMonitoring = true;

                this.activeTransfers.push(transfer);
                transfer._send();
                break;
            }
        }

        if (recursiveUpToMaxActiveTransfers === true && !allActive && this.transfers.length > 0 && this.activeTransfers.length < this.maxActiveTransfers)
            this.processTransfers(recursiveUpToMaxActiveTransfers);
    },

    maxAssetTransfersForType : function(type)
    {
        if (typeof type === "string")
            return this.maxActiveTransfersPerType[type];
        return undefined;
    },

    numQueuedTransfersPerType : function()
    {
        var queued = {};
        for (var i = 0; i < this.transfers.length; i++)
        {
            if (this.transfers[i].active || this.transfers[i].loading)
                continue;
            var type = this.transfers[i].type;
            if (queued[type] === undefined)
                queued[type] = 0;
            queued[type] += 1;
        }
        return queued;
    },

    numQueuedTransfers : function()
    {
        var queued = 0;
        for (var i = 0; i < this.transfers.length; i++)
        {
            if (!this.transfers[i].active && this.transfers[i].loading)
                queued += 1;
        }
        return queued;
    },

    transferState : function()
    {
        var state = {
            active  : {},
            loading : {},
            queued  : {}
        };
        for (var i = 0; i < this.activeTransfers.length; i++)
        {
            var type = this.activeTransfers[i].type;
            if (state.active[type] === undefined)
                state.active[type] = 0;
            state.active[type] += 1;
        }
        for (var i = 0; i < this.transfers.length; i++)
        {
            if (this.transfers[i].active)
                continue;

            var submap = this.transfers[i].loading ? "loading" : "queued";
            var type = this.transfers[i].type;
            if (state[submap][type] === undefined)
                state[submap][type] = 0;
            state[submap][type] += 1;
        }
        return state;
    },

    activeTransfersForType : function(type)
    {
        var num = 0;
        for (var i=0; i<this.activeTransfers.length; ++i)
        {
            if (this.activeTransfers[i].type === type)
                num++;
        }
        return num;
    },

    removeActiveTransfer : function(transfer)
    {
        for (var i=0; i<this.activeTransfers.length; ++i)
        {
            if (this.activeTransfers[i].ref === transfer.ref)
            {
                this.activeTransfers.splice(i,1);
                break;
            }
        }
    },

    removeTransfer : function(transfer)
    {
        this.removeActiveTransfer(transfer);
        for (var i=0; i<this.transfers.length; ++i)
        {
            if (this.transfers[i].ref === transfer.ref)
            {
                this.transfers.splice(i,1);
                break;
            }
        }

        TundraSDK.framework.events.send("AssetAPI.ActiveAssetTransferCountChanged", this.numCurrentTransfers());
    },

    assetTransferCompleted : function(transfer, asset)
    {
        // Mark this instance as the clone source
        if (asset.requiresCloning)
            asset.isCloneSource = true;

        // Cache. Replace the ref to cache initially set by createEmptyAsset.
        if (this.getAsset(asset.name) === undefined)
            this.log.warn("Could not find cache item to update for", asset.name, "Did you create the original asset with AssetAPI.createEmptyAsset?");
        this.cache.set(asset.name, asset);

        // Notify completion
        this.removeTransfer(transfer);
        transfer._emitCompleted(asset);

        // Cleanup
        asset = null;
        delete transfer; transfer = null;
    },

    assetTransferFailed : function(transfer, reason)
    {
        if (typeof reason === "string")
            TundraSDK.framework.client.logError("[AssetAPI]: " + reason, true);

        // Notify failure
        this.removeTransfer(transfer);
        transfer._emitFailed(reason);

        delete transfer; transfer = null;
    },

    createEmptyAsset : function(assetRef, assetType)
    {
        var factory = this.getAssetFactory(undefined, assetType);
        if (factory !== null)
        {
            var asset = factory.createEmptyAsset(assetRef);
            this.cache.set(asset.name, asset);
            TundraSDK.framework.events.send("AssetAPI.AssetCreated", asset);
            return asset;
        }
        return null;
    },

    numCurrentTransfers : function()
    {
        return this.transfers.length;
    },

    allTransfersCompleted : function()
    {
        return (this.numCurrentTransfers() === 0);
    },

    /**
        Registers a callback for when asset transfer count changes
        @example
            TundraSDK.framework.asset.onActiveAssetTransferCountChanged(null, function(num) {
                console.log("Transfers remaining:", num);
            });

        @method onActiveAssetTransferCountChanged
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription|null} Subscription data or null if parent entity is not set.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onActiveAssetTransferCountChanged : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("AssetAPI.ActiveAssetTransferCountChanged", context, callback);
    },

    /**
        Registers a callback for when a new asset is created.
        This allows code to track asset creations and hook to IAsset events.

        @method onAssetCreated
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription|null} Subscription data or null if parent entity is not set.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onAssetCreated : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("AssetAPI.AssetCreated", context, callback);
    },

    /**
        Registers a callback for when asset has been deserialized from data.
        See {{#crossLink "IAsset/onDeserializedFromData:method"}}IAsset.onDeserializedFromData(){{/crossLink}}.

        @method onAssetDeserializedFromData
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription|null} Subscription data or null if parent entity is not set.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onAssetDeserializedFromData : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("AssetAPI.AssetDeserializedFromData", context, callback);
    },

    _emitAssetDeserializedFromData : function(asset)
    {
        TundraSDK.framework.events.send("AssetAPI.AssetDeserializedFromData", asset);
        asset._emitDeserializedFromData();
    },

    /**
        Registers a callback for when a asset is about to be removed from the asset system
        and under usual conditions implying that the asset is also being unloaded.

        @method onAssetAboutToBeRemoved
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription|null} Subscription data or null if parent entity is not set.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onAssetAboutToBeRemoved : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("AssetAPI.AssetAboutToBeRemoved", context, callback);
    }
});


;


/**
    InputAPI that is accessible from {{#crossLink "TundraClient/input:property"}}TundraClient.input{{/crossLink}}

    Provides mouse and keyboard input state and events.
    @class InputAPI
    @constructor
*/
var InputAPI = Class.$extend(
{
    /**
        Event object description for {{#crossLink "InputAPI/onMouseEvent:method"}}{{/crossLink}}, {{#crossLink "InputAPI/onMouseMove:method"}}{{/crossLink}}, {{#crossLink "InputAPI/onMouseClick:method"}}{{/crossLink}}, {{#crossLink "InputAPI/onMousePress:method"}}{{/crossLink}}, {{#crossLink "InputAPI/onMouseRelease:method"}}{{/crossLink}} and {{#crossLink "InputAPI/onMouseWheel:method"}}{{/crossLink}} callbacks.
        @event MouseEvent
        @param {String} type "move" | "press" | "release" | "wheel"
        @param {Number} x Current x position
        @param {Number} y Current y position
        @param {Number} relativeX Relative x movement since last mouse event
        @param {Number} relativeY Relative y movement since last mouse event
        @param {Number} relativeZ Mouse wheel delta
        @param {Boolean} rightDown Is right mouse button down
        @param {Boolean} leftDown Is left mouse button down
        @param {Boolean} middleDown Is middle mouse button down
        @param {String} targetId DOM element id that the mouse event occurred on
        @param {String} targetNodeName HTML node name eg. 'canvas' and 'div'. Useful for detected
        when on 'canvas' element aka the mouse event occurred on the 3D scene canvas and not on top of a UI widget.
        @param {Object} originalEvent Original jQuery mouse event
    */

    /**
        Event object description for {{#crossLink "InputAPI/onKeyEvent:method"}}{{/crossLink}}, {{#crossLink "InputAPI/onKeyPress:method"}}{{/crossLink}} and {{#crossLink "InputAPI/onKeyRelease:method"}}{{/crossLink}} callbacks.
        @event KeyEvent
        @param {String} type "press" | "release"
        @param {Number} keyCode Key as number
        @param {String} key Key as string
        @param {Object} pressed Currently held down keys. Maps key as string to boolean.
        @param {String} targetId DOM element id that the mouse event occurred on
        @param {String} targetNodeName HTML node name eg. 'canvas' and 'div'. Useful for detected
        when on 'body' element aka the mouse event occurred on the "3D scene" and not on top of another input UI widget.
        @param {Object} originalEvent Original jQuery key event
    */

    __init__ : function(params)
    {
        var that = this;

        /**
            Current mouse state
            <pre>{
                x : Number,
                y : Number
            }</pre>

                overlay.css({
                    top  : TundraSDK.framework.input.mouse.y,
                    left : 5
                });

            @property mouse
            @type Object
        */
        this.mouse =
        {
            // Event type: move, press, release, wheel
            type : "",
            // Absolute position
            x : null,
            y : null,
            // Relative position
            relativeX : 0,
            relativeY : 0,
            // Wheel delta
            relativeZ : 0,
            // Button states
            rightDown  : false,
            leftDown   : false,
            middleDown : false,
            // HTML element id that the mouse event occurred on
            targetId : "",
            // HTML node name eg. 'canvas' and 'div'. Useful for detected
            // when on 'canvas' element aka the mouse event occurred on the
            // 3D scene canvas and not on top of a UI widget.
            targetNodeName : "",
            // Original jQuery mouse event
            originalEvent : null
        };

        /**
            Current keyboard state
            <pre>{
                pressed :
                {
                    keyCodeStr : Boolean
                }
            }</pre>

                if (TundraSDK.framework.input.keyboard.pressed["w"] === true)
                    console.log("W is down");

            @property keyboard
            @type Object
        */
        this.keyboard =
        {
            // Event type: press, release
            type : "",
            // Event key code
            keyCode : 0,
            // Event key as string
            key : "",
            // If this is a repeat. Meaning the key was already in the pressed state.
            repeat : false,
            // Currently held down keys: maps key as string to 'true' boolean
            // Check with inputApi.keyboard.pressed["w"] or keyEvent.pressed["f"]
            pressed : {},
            // HTML element id that the mouse event occurred on
            targetId : "",
            // HTML node name eg. 'canvas' and 'div'. Useful for detected
            // when on 'body' element aka the mouse event occurred on the "3D scene" and not on top of another input UI widget.
            targetNodeName : "",
            // Original jQuery mouse event
            originalEvent : null
        };

        this.keys =
        {
            8   : 'backspace',
            9   : 'tab',
            13  : 'enter',
            16  : 'shift',
            17  : 'ctrl',
            18  : 'alt',
            20  : 'capslock',
            27  : 'esc',
            32  : 'space',
            33  : 'pageup',
            34  : 'pagedown',
            35  : 'end',
            36  : 'home',
            37  : 'left',
            38  : 'up',
            39  : 'right',
            40  : 'down',
            45  : 'ins',
            46  : 'del',
            91  : 'meta',
            93  : 'meta',
            224 : 'meta'
        };

        this.keycodes =
        {
            106 : '*',
            107 : '+',
            109 : '-',
            110 : '.',
            111 : '/',
            186 : ';',
            187 : '=',
            188 : ',',
            189 : '-',
            190 : '.',
            191 : '/',
            192 : '`',
            219 : '[',
            220 : '\\',
            221 : ']',
            222 : '\''
        };

        $(document).keydown(function(e) {
            that.onKeyPressInternal(e);
        });
        $(document).keyup(function(e) {
            that.onKeyReleaseInternal(e);
        });
    },

    __classvars__ :
    {
        plugins : [],

        /**
            Registers a new input plugin. Name of the plugin must be unique.

            @method registerPlugin
            @static
            @param {IInputPlugin} plugin Plugin instance.
        */
        registerPlugin : function(plugin)
        {
            /*if (!(plugin instanceof IInputPlugin))
            {
                TundraSDK.framework.client.logError("[InputAPI]: Cannot register plugin that is not of type IInputPlugin");
                return false;
            }*/

            for (var i = 0; i < InputAPI.plugins.length; i++)
            {
                if (InputAPI.plugins[i].name === plugin.name)
                {
                    console.error("[InputAPI]: registerPlugin() Name of the plugin needs to be unique. Name", plugin.name, "already registered");
                    return;
                }
            }
            InputAPI.plugins.push(plugin);
        },

        /**
            Get input plugin.

            @method registerPlugin
            @static
            @param {String} name Name of the plugin.
            @return {IInputPlugin}
        */
        getPlugin : function(name)
        {
            for (var i = 0; i < InputAPI.plugins.length; i++)
            {
                if (InputAPI.plugins[i].name === plugin.name)
                    return InputAPI.plugins[i];
            }
            return null;
        }
    },

    postInitialize : function()
    {
        // Register main container mouse events
        TundraSDK.framework.input.registerMouseEvents(TundraSDK.framework.client.container);

        for (var i = 0; i < InputAPI.plugins.length; i++)
        {
            try
            {
                InputAPI.plugins[i]._start();
            }
            catch(e)
            {
                TundraSDK.framework.client.logError("[InputAPI:] Plugin " + InputAPI.plugins[i].name + " start() threw exception: " + e);
            }
        }
    },

    reset : function()
    {
        TundraSDK.framework.events.remove("InputAPI.MouseEvent");
        TundraSDK.framework.events.remove("InputAPI.MouseMove");
        TundraSDK.framework.events.remove("InputAPI.MouseClick");
        TundraSDK.framework.events.remove("InputAPI.MousePress");
        TundraSDK.framework.events.remove("InputAPI.MouseRelease");
        TundraSDK.framework.events.remove("InputAPI.MouseWheel");
        TundraSDK.framework.events.remove("InputAPI.KeyEvent");
        TundraSDK.framework.events.remove("InputAPI.KeyPress");
        TundraSDK.framework.events.remove("InputAPI.KeyRelease");

        for (var i = 0; i < InputAPI.plugins.length; i++)
        {
            try
            {
                InputAPI.plugins[i].reset();
            }
            catch(e)
            {
                TundraSDK.framework.client.logError("[InputAPI:] Plugin " + InputAPI.plugins[i].name + " reset() threw exception: " + e);
            }
        }
    },

    registerPluginEvent : function(eventName, eventStringSignature)
    {
        var eventHandler = "on" + eventName;
        if (this[eventHandler] !== undefined)
        {
            TundraSDK.framework.client.logError("[InputAPI]: Cannot register plugin event " + eventName + " the handler InputAPI." +
                eventHandler + " is already registered!");
            return false;
        }

        this[eventHandler] = function(context, callback)
        {
            return TundraSDK.framework.events.subscribe(eventStringSignature, context, callback);
        };
        return true;
    },

    supportsEventType : function(eventName)
    {
        return (typeof this["on" + eventName] === "function");
    },

    registerMouseEvents : function(element)
    {
        var receiver = this;
        var qElement = $(element);

        // Mouse events
        qElement.mousemove(function(e) {
            receiver.onMouseMoveInternal(e);
        });
        qElement.mousedown(function(e) {
            receiver.onMousePressInternal(e);
        });
        qElement.mouseup(function(e) {
            receiver.onMouseReleaseInternal(e);
        });
        qElement.mousewheel(function(e, delta, deltaX, deltaY) {
            receiver.onMouseWheelInternal(e, delta, deltaX, deltaY);
        });

        // Disable right click context menu
        qElement.bind("contextmenu", function(e) {
            return false;
        });
    },

    /**
        Registers a callback for all mouse events. See {{#crossLink "InputAPI/MouseEvent:event"}}{{/crossLink}} for event data.
        @example
            function onMouseEvent(event)
            {
                // event === MouseEvent
            }

            TundraSDK.framework.input.onMouseEvent(null, onMouseEvent);

        @method onMouseEvent
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onMouseEvent : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("InputAPI.MouseEvent", context, callback);
    },

    /**
        Registers a callback for mouse move events. See {{#crossLink "InputAPI/MouseEvent:event"}}{{/crossLink}} for event data.
        @example
            function onMouseMove(event)
            {
                // event === MouseEvent
            }

            TundraSDK.framework.input.onMouseMove(null, onMouseMove);

        @method onMouseMove
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onMouseMove : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("InputAPI.MouseMove", context, callback);
    },

    /**
        Registers a callback for mouse press and release events. See {{#crossLink "InputAPI/MouseEvent:event"}}{{/crossLink}} for event data.
        @example
            function onMouseClick(event)
            {
                // event === MouseEvent
            }

            TundraSDK.framework.input.onMouseClick(null, onMouseClick);

        @method onMouseClick
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onMouseClick : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("InputAPI.MouseClick", context, callback);
    },

    /**
        Registers a callback for mouse press events. See {{#crossLink "InputAPI/MouseEvent:event"}}{{/crossLink}} for event data.
        @example
            function onMousePress(event)
            {
                // event === MouseEvent
            }

            TundraSDK.framework.input.onMousePress(null, onMousePress);

        @method onMousePress
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onMousePress : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("InputAPI.MousePress", context, callback);
    },

    /**
        Registers a callback for mouse release events. See {{#crossLink "InputAPI/MouseEvent:event"}}{{/crossLink}} for event data.
        @example
            function onMouseRelease(event)
            {
                // event === MouseEvent
            }

            TundraSDK.framework.input.onMouseRelease(null, onMouseRelease);

        @method onMouseRelease
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onMouseRelease : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("InputAPI.MouseRelease", context, callback);
    },

    /**
        Registers a callback for mouse wheel events. See {{#crossLink "InputAPI/MouseEvent:event"}}{{/crossLink}} for event data.
        @example
            function onMouseWheel(event)
            {
                // event === MouseEvent
            }

            TundraSDK.framework.input.onMouseWheel(null, onMouseWheel);

        @method onMouseWheel
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onMouseWheel : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("InputAPI.MouseWheel", context, callback);
    },

    /**
        Registers a callback for all key events. See {{#crossLink "InputAPI/KeyEvent:event"}}{{/crossLink}} for event data.
        @example
            function onKeyEvent(event)
            {
                // event === KeyEvent
            }

            TundraSDK.framework.input.onKeyEvent(null, onKeyEvent);

        @method onKeyEvent
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onKeyEvent : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("InputAPI.KeyEvent", context, callback);
    },

    /**
        Registers a callback for key press events. See {{#crossLink "InputAPI/KeyEvent:event"}}{{/crossLink}} for event data.
        @example
            function onKeyPress(event)
            {
                // event === KeyEvent
            }

            TundraSDK.framework.input.onKeyPress(null, onKeyPress);

        @method onKeyPress
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onKeyPress : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("InputAPI.KeyPress", context, callback);
    },

    /**
        Registers a callback for key release events. See {{#crossLink "InputAPI/KeyEvent:event"}}{{/crossLink}} for event data.
        @example
            function onKeyRelease(event)
            {
                // event === KeyEvent
            }

            TundraSDK.framework.input.onKeyRelease(null, onKeyRelease);

        @method onKeyRelease
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onKeyRelease : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("InputAPI.KeyRelease", context, callback);
    },

    onMouseMoveInternal : function(event)
    {
        this.readMouseEvent(event);
        this.mouse.type = "move";

        TundraSDK.framework.events.send("InputAPI.MouseEvent", this.mouse);
        TundraSDK.framework.events.send("InputAPI.MouseMove", this.mouse);
    },

    onMousePressInternal : function(event)
    {
        this.readMouseEvent(event);
        this.mouse.type = "press";

        TundraSDK.framework.events.send("InputAPI.MouseEvent", this.mouse);
        TundraSDK.framework.events.send("InputAPI.MouseClick", this.mouse);
        TundraSDK.framework.events.send("InputAPI.MousePress", this.mouse);
    },

    onMouseReleaseInternal : function(event)
    {
        this.readMouseEvent(event);
        this.mouse.type = "release";
        this.mouse.leftDown = false;
        this.mouse.rightDown = false;
        this.mouse.middleDown = false;

        TundraSDK.framework.events.send("InputAPI.MouseEvent", this.mouse);
        TundraSDK.framework.events.send("InputAPI.MouseClick", this.mouse);
        TundraSDK.framework.events.send("InputAPI.MouseRelease", this.mouse);
    },

    onMouseWheelInternal : function(event, delta, deltaX, deltaY)
    {
        this.readMouseEvent(event, deltaY);
        this.mouse.type = "wheel";

        TundraSDK.framework.events.send("InputAPI.MouseEvent", this.mouse);
        TundraSDK.framework.events.send("InputAPI.MouseWheel", this.mouse);
    },

    readMouseEvent : function(event, wheelY)
    {
        // Original jQuery event
        this.mouse.originalEvent = event;

        // Target element
        if (event.target !== undefined && event.target !== null)
        {
            this.mouse.targetNodeName = event.target.localName;
            this.mouse.targetId = event.target.id;
        }
        else
        {
            this.mouse.targetNodeName = "";
            this.mouse.targetId = "";
        }

        // Relative movement
        if (this.mouse.x != null)
            this.mouse.relativeX = event.pageX - this.mouse.x;
        if (this.mouse.y != null)
            this.mouse.relativeY = event.pageY - this.mouse.y;

        // Wheel
        this.mouse.relativeZ = (wheelY != null ? wheelY : 0);

        // Mouse position
        this.mouse.x = event.pageX;
        this.mouse.y = event.pageY;

        // Buttons
        if (TundraSDK.browser.isFirefox)
        {
            this.mouse.leftDown   = (event.buttons === 1);
            this.mouse.rightDown  = (event.buttons === 2);
            this.mouse.middleDown = (event.buttons === 3);
        }
        else
        {
            this.mouse.leftDown   = (event.which === 1);
            this.mouse.rightDown  = (event.which === 3);
            this.mouse.middleDown = (event.which === 2);
        }
    },

    onKeyPressInternal : function(event)
    {
        this.readKeyEvent(event);
        this.keyboard.type = "press";

        TundraSDK.framework.events.send("InputAPI.KeyEvent", this.keyboard);
        TundraSDK.framework.events.send("InputAPI.KeyPress", this.keyboard);
    },

    onKeyReleaseInternal : function(event)
    {
        this.readKeyEvent(event);
        this.keyboard.type = "release";

        TundraSDK.framework.events.send("InputAPI.KeyEvent", this.keyboard);
        TundraSDK.framework.events.send("InputAPI.KeyRelease", this.keyboard);
    },

    readKeyEvent : function(event)
    {
        // Original jQuery event
        this.keyboard.originalEvent = event;

        // Target element
        if (event.target !== undefined && event.target !== null)
        {
            this.keyboard.targetNodeName = event.target.localName;
            this.keyboard.targetId = event.target.id;
        }
        else
        {
            this.keyboard.targetNodeName = "";
            this.keyboard.targetId = "";
        }

        // Key code
        this.keyboard.keyCode = event.which;
        this.keyboard.key = this.characterForKeyCode(event.which);

        // Track currenly held down keys
        this.keyboard.repeat = false;
        if (event.type === "keydown")
        {
            if (this.keyboard.pressed[this.keyboard.key] === true)
                this.keyboard.repeat = true;
            else
                this.keyboard.pressed[this.keyboard.key] = true;
        }
        else
            delete this.keyboard.pressed[this.keyboard.key];
    },

    characterForKeyCode : function(keyCode)
    {
        // Special keys
        if (this.keys[keyCode])
            return this.keys[keyCode];
        if (this.keycodes[keyCode])
            return this.keycodes[keyCode];

        // Convert from char code
        /// @todo Fix non ascii keys
        return String.fromCharCode(keyCode).toLowerCase();
    }
});


;
define("lib/jquery.contextmenu", function(){});



/**
    UiAPI that is accessible from {{#crossLink "TundraClient/ui:property"}}TundraClient.ui{{/crossLink}}

    Provides utilities to add your widget to the 2D DOM scene, lets you add shortcuts to the WebTundra taskbar etc.
    @class UiAPI
    @constructor
*/
var UiAPI = Class.$extend(
{
    __init__ : function(params)
    {
        this.tabActive = true;

        this.buttons = [];
        this.numContextMenus = 0;

        this.createTaskbar(params.taskbar);
        this.createConsole(params.console);

        // Hide scroll bars
        $("html").css("overflow", "hidden");
        $("body").css("overflow", "hidden");

        window.addEventListener("resize", this.onWindowResizeDOM, false);

        var that = this;
        $(window).focus(function()
        {
            if (!that.tabActive)
                that.tabActive = true;
        });
        $(window).blur(function()
        {
            if (that.tabActive)
                that.tabActive = false;
        });

        TundraSDK.framework.client.onConnected(this, this.onConnected);
        TundraSDK.framework.client.onDisconnected(this, this.onDisconnected);
    },

    postInitialize : function()
    {
        // FPS counter
        this.fps = $("<div/>", { id : "webtundra-fps" });
        this.fps.css({
            "background-color"  : "transparent",
            "position"          : "absolute",
            "color"             : "black",
            "font-family"       : "Arial",
            "font-size"         : "18pt",
            "font-weight"       : "bold",
            "z-index"           : parseInt(this.console.css("z-index")) + 1
        });
        this.fps.width(60);
        this.fps.height(30);
        this.fps.fpsFrames = 0;
        this.fps.fpsTime = 0;
        this.fps.alwaysShow = (typeof require === "function");
        this.fps.hide();
        this.fps.cachedVisible = false;

        this.addWidgetToScene(this.fps);

        // Arrage UI elements
        this.onWindowResizeInternal();

        // Register console command
        TundraSDK.framework.console.registerCommand("clear", "Clears the console messages", null, this, this.clearConsole);
        TundraSDK.framework.console.registerCommand("showFps", "Toggles if FPS counter is shown", null, this, function() {
            this.fps.alwaysShow = !this.fps.alwaysShow;
            if (this.fps.alwaysShow)
            {
                if (!this.fps.cachedVisible)
                {
                    this.fps.fadeIn();
                    this.fps.cachedVisible = true;
                }
            }
            else if (!this.console.is(":visible"))
            {
                this.fps.fadeOut();
                this.fps.cachedVisible = false;
            }
        });
    },

    reset : function()
    {
        // Remove created buttons
        for (var i = 0; i < this.buttons.length; i++)
            this.buttons[i].remove();
        this.buttons = [];

        // Remove created context menus
        for (var i = 0; i < this.numContextMenus; i++)
        {
            var contextMenu = $("#webtundra-context-menu-" + i);
            if (contextMenu != null) contextMenu.remove();
        }
        this.numContextMenus = 0;

        // Arrage UI elements
        this.onWindowResizeInternal();
    },

    onConnected : function()
    {
        TundraSDK.framework.input.onKeyPress(this, this.onKeyPress);
        TundraSDK.framework.frame.onUpdate(this, this.onUpdate);

        if (this.fps.alwaysShow && !this.fps.cachedVisible)
        {
            this.fps.fadeIn();
            this.fps.cachedVisible = true;
        }
    },

    onDisconnected : function()
    {
        if (this.console.is(":visible"))
            this.toggleConsole();
        this.clearConsole();
    },

    createTaskbar : function(create)
    {
        if (this.taskbar != null)
            return;

        // Default to true for taskbar creation
        if (create === undefined || create === null)
            create = true;
        this.taskbar = (create ? $("<div/>") : null);
        if (this.taskbar == null)
            return;

        this.taskbar.attr("id", "webtundra-taskbar");
        this.taskbar.css({
            "position" : "absolute",
            "top" : 0,
            "padding"  : 0,
            "margin"   : 0,
            "height"   : 30,
            "width"    : "100%",
            "border"   : 0,
            "border-top"        : "1px solid gray",
            "background-color"  : "rgb(248,248,248)",
            "box-shadow"        : "inset 0 0 7px gray, 0 0 7px gray, inset 0 0px 0px 0px gray;"
        });

        if (TundraSDK.browser.isOpera)
            this.taskbar.css("background-image", "-o-linear-gradient(rgb(248,248,248),rgb(190,190,190))");
        else if (TundraSDK.browser.isFirefox)
        {
            this.taskbar.css({
                "background-image" : "-moz-linear-gradient(top, rgb(248,248,248), rgb(190,190,190))",
                "-moz-box-shadow"  : "inset 0 0 0px gray, 0 0 5px gray"
            });
        }
        else if (TundraSDK.browser.isChrome || TundraSDK.browser.isSafari)
        {
            this.taskbar.css({
                "background-image"   : "-webkit-gradient(linear, left top, left bottom, color-stop(0, rgb(248,248,248)), color-stop(0.8, rgb(190,190,190)))",
                "-webkit-box-shadow" : "0 0 7px gray"
            });
        }

        this.addWidgetToScene(this.taskbar);
        this.taskbar.hide();
    },

    createConsole : function(create)
    {
        if (this.console != null)
            return;

        // Default to true for taskbar creation
        if (create === undefined || create === null)
            create = true;
        this.console = (create ? $("<div/>") : null);
        if (this.console == null)
            return;

        this.console.attr("id", "webtundra-console");
        this.console.css({
            "position"          : "absolute",
            "height"            : 0,
            "width"             : "100%",
            "white-space"       : "pre",
            "margin"            : 0,
            "padding"           : 0,
            "padding-top"       : 5,
            "padding-bottom"    : 5,
            "border"            : 0,
            "overflow"          : "auto",
            "font-family"       : "Courier New",
            "font-size"         : "10pt",
            "color"             : "rgb(50,50,50)",
            "background-color"  : "rgba(248,248,248, 0.5)",
            "z-index"           : 100 // Make console be above all widgets added via UiAPI.addWidgetToScene.
        });

        this.consoleInput = $("<input/>", {
            id   : "webtundra-console-input",
            type : "text"
        });
        this.consoleInput.data("data", {
            history : [],
            index   : 0
        });
        this.consoleInput.css({
            "position"          : "absolute",
            "color"             : "rgb(20,20,20)",
            "background-color"  : "rgba(248,248,248, 0.8)",
            "border"            : 1,
            "border-top"        : "1px solid gray",
            "border-bottom"     : "1px solid gray",
            "padding-left"      : 5,
            "font-family"       : "Courier New",
            "font-size"         : "10pt",
            "height"            : 20,
            "width"             : "100%",
            "z-index"           : 100
        });
        this.consoleInput.focus(function() {
            $(this).css("background-color", "white")
        }).blur(function() {
            $(this).css("background-color", "rgba(248,248,248, 0.8)")
        }).keydown(function(e) {
            // tab
            if (e.which == 9)
            {
                var suggestion = TundraSDK.framework.console.commandSuggestion($(this).val());
                if (suggestion != null && suggestion !== $(this).val())
                    $(this).val(suggestion);
                e.preventDefault();
                return false;
            }
            // up and down arrow
            else if (e.which == 38 || e.which == 40)
            {
                var d = $(this).data("data");
                d.index += (e.which == 38 ? 1 : -1);
                if (d.index >= d.history.length)
                    d.index = d.history.length - 1;
                var command = (d.index >= 0 ? d.history[d.index] : "")
                if (d.index < -1) d.index = -1;
                $(this).val(command);
                e.preventDefault();
                return false;
            }
        }).keypress(function(e) {
            // enter
            if (e.which == 13)
            {
                var rawCommand = $(this).val();
                if (rawCommand == "")
                    return;
                if (TundraSDK.framework.console.executeCommandRaw(rawCommand))
                {
                    $(this).data("data").history.unshift(rawCommand);
                    $(this).data("data").index = -1;
                }
                $(this).val("");
                e.preventDefault();
                return false;
            }
        });

        if (TundraSDK.browser.isOpera)
            this.console.css("background-image", "-o-linear-gradient(rgba(190,190,190,0.5), rgba(248,248,248,0.5))");
        else if (TundraSDK.browser.isFirefox)
        {
            this.console.css({
                "background-image" : "-moz-linear-gradient(top, rgba(190,190,190,0.5), rgba(248,248,248,0.5))",
                "-moz-box-shadow"  : "inset 0 0 0px gray, 0 0 5px gray"
            });
        }
        else if (TundraSDK.browser.isChrome || TundraSDK.browser.isSafari)
        {
            this.console.css({
                "background-image"   : "-webkit-gradient(linear, left top, left bottom, color-stop(0, rgba(190,190,190,0.8)), color-stop(0.8, rgba(248,248,248,0.8)))",
                "-webkit-box-shadow" : "0 0 7px gray"
            });
        }

        this.addWidgetToScene([this.console, this.consoleInput]);
        this.console.hide();
        this.consoleInput.hide();
    },

    onUpdate : function(frametime)
    {
        if (!this.fps.cachedVisible)
            return;

        this.fps.fpsFrames++;
        this.fps.fpsTime += frametime;

        if (this.fps.fpsTime >= 1.0)
        {
            var fps = Math.round(this.fps.fpsFrames / this.fps.fpsTime);
            this.fps.html(fps + " <span style='font-size:8pt;color:black;'>FPS</span>");
            this.fps.css("color", fps >= 30 ? "green" : "red");

            this.fps.fpsFrames = 0;
            this.fps.fpsTime = 0;
        }
    },

    /**
        Clears the UI console log. Invoked by the 'clear' console command.
        @method clearConsole
    */
    clearConsole : function()
    {
        this.console.empty();
    },

    /**
        Registers a callback for rendering surface resize.

            function onWindowResize(width, height)
            {
                // width == Number
                // height == Number
            }

            TundraSDK.framework.ui.onWindowResize(null, onWindowResize);

        @method onWindowResize
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onWindowResize : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("UiAPI.WindowResize", context, callback);
    },

    /**
        Registers a callback for clear focus events. This event is fired when we want to clear focus from all DOM elements eg. input fields.

            TundraSDK.framework.ui.onWindowResize(null, function() {
                // I should not unfocus any input DOM elements
            });

        @method onClearFocus
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onClearFocus : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("UiAPI.ClearFocus", context, callback);
    },

    /**
        Sends clear focus event
        @method clearFocus
    */
    clearFocus : function()
    {
        TundraSDK.framework.events.send("UiAPI.ClearFocus");
    },

    /**
        Adds a single or collection of HTML string, element or jQuery to the 2D UI scene.
        @method addWidgetToScene
        @param {HTML String|Element|jQuery|Array} widgetElement Widget to add or an array of widgets.
        @return {Boolean} If (all elements) added successfully.
    */
    addWidgetToScene : function(widgetElement)
    {
        var widgets = (!Array.isArray(widgetElement) ? [widgetElement] : widgetElement);
        var succeeded = true;
        for (var i = 0; i < widgets.length; ++i)
        {
            var we = $(widgets[i]);
            if (we == null || we == undefined)
            {
                console.error("[UiAPI]: Invalid input widget could not be added to the scene.");
                succeeded = false;
                continue;
            }
            var zIndex = we.css("z-index");
            if (typeof zIndex === "string")
                zIndex = parseInt(zIndex);
            if (isNaN(zIndex) || zIndex == null || zIndex == undefined || typeof zIndex !== "number")
                zIndex = 0;
            if (zIndex < 5)
                we.css("z-index", 5);

            TundraSDK.framework.client.container.append(we);
        }
        return succeeded;
    },

    /**
        Adds a polymer web component to the 2D UI scene.
        @method addWebComponentToScene
        @param {String tag name} (must contain dash (-) in tag name) web component tag name to be added.
        @param {String url} url to the web component content to be fetched and added to created element.
        @param {Function} callback Function to be called.
    */
    addWebComponentToScene : function(tagName, webComponentUrl, context, callback)
    {

        if (tagName == null || tagName.indexOf("-") == -1)
        {
            console.error("[UiAPI]: Web component tag name must contain dash (-).");
        }

        var transfer = TundraSDK.framework.asset.requestAsset(webComponentUrl, "Text");
        if (transfer != null)
        {
            transfer.onCompleted(null, function(textAsset)
            {
                var element = document.createElement(tagName);
                element.innerHTML = textAsset.data;
                $("body").append(element);

                if (typeof context === "function")
                    context(element);
                else
                    callback.call(context, element);
            });
        }
    },

    /**
        Adds a new action to the UiAPI toolbar and returns the created DOM element.
        @method addAction
        @param {String} tooltip Tooltip text that is shown when the action is hovered.
        @param {String} [backgroundUrl=null] URL to a image that should be the background. 24x24 or 32x32 icons are recommended.
        @param {Number} [width=32] Width of the action. This gives you possibility for customizations depending on your image size.
        @return {jQuery Element|nu.l} Element if taskbar is enabled and add succeeded, otherwise null.
    */
    addAction : function(tooltip, backgroundUrl, width, upgradeToButton)
    {
        if (this.taskbar == null)
            return null;

        if (width == null)
            width = 32;

        var index = this.buttons.length;
        var name = "taskbar-button-" + index;
        var button = $("<div/>", {
            id    : name,
            title : (tooltip != null ? tooltip : "")
        });
        if (upgradeToButton === undefined || upgradeToButton === true)
            button.button();
        button.tooltip();

        // Style sheets
        button.height(30);
        button.width(width);
        button.css({
            "padding"           : 0,
            "margin"            : 0,
            "width"             : width,
            "min-width"         : width,
            "max-width"         : width,
            "background-color"  : "transparent",
            "border-color"      : "transparent"
        });
        if (backgroundUrl != null && backgroundUrl != "")
        {
            button.css({
                "background-image"    : "url(" + backgroundUrl + ")",
                "background-repeat"   : "no-repeat",
                "background-position" : "center"
            });
        }

        button.fadeIn();

        // Add and track
        this.taskbar.append(button);
        this.buttons.push(button);

        if (!this.taskbar.is(":visible"))
            this.taskbar.fadeIn();

        // Reposition buttons
        this.onWindowResizeInternal();

        return button;
    },

    addContextMenu : function(targetElement, disableNativeContextMenu, useLeftClick, showMenuHandler, hideMenuHandler)
    {
        if (disableNativeContextMenu === undefined)
            disableNativeContextMenu = true;
        if (useLeftClick === undefined)
            useLeftClick = false;

        var id = "webtundra-context-menu-" + this.numContextMenus;
        this.numContextMenus++

        targetElement = $(targetElement);
        targetElement.contextMenu(id, {},
        {
            disable_native_context_menu : disableNativeContextMenu,
            leftClick : useLeftClick,
            showMenu  : showMenuHandler,
            hideMenu  : hideMenuHandler
        });

        var contextMenu = $("#" + id);
        contextMenu.css({
            "background-color": "#F2F2F2",
            "border": "1px solid #999999",
            "list-style-type": "none",
            "margin": 0,
            "padding": 0
        });
        return contextMenu;
    },

    addContextMenuItems : function(contextMenu, items)
    {
        items = Array.isArray(items) ? items : [ items ];
        for (var i = 0; i < items.length; i++)
        {
            var itemData = items[i];
            var parent = $('<li/>');
            var item = $('<a href="#">' + itemData.name + '</a>');
            item.css({
                "font-family"       : "Arial",
                "font-size"         : "12pt",
                "background-color"  : "#F2F2F2",
                "color"             : "#333333",
                "text-decoration"   : "none",
                "display"           : "block",
                "padding"           : 5
            });
            // Hover in
            item.hover(function() {
                $(this).css({
                    "background-color" : "rgb(150,150,150)",
                    "color" : "rgb(255,255,255)"
                });
            // Hover out
            }, function() {
                $(this).css({
                    "background-color" : "#F2F2F2",
                    "color"   : "#333333"
                });
            });
            item.data("itemName", itemData.name);
            item.on("click", itemData.callback);
            parent.append(item);
            contextMenu.append(parent);
        }
    },

    onKeyPress : function(event)
    {
        if (event.key === "1" && event.targetNodeName !== "input")
        {
            if (this.consoleInput.is(":visible") && this.consoleInput.is(":focus"))
                return;
            this.toggleConsole();
        }
    },

    /**
        Toggles visibility of the UI console.
        @method toggleConsole
        @param {Boolean} [visible=!currentlyVisible]
    */
    toggleConsole : function(visible)
    {
        if (this.console == null)
            return;

        var isVisible = this.console.is(":visible");
        if (visible === undefined || visible === null)
            visible = !isVisible;
        if (visible == isVisible)
            return;

        if (!isVisible)
        {
            this.console.height(0);
            this.console.show();
            this.consoleInput.show();
            if (!this.fps.is(":visible"))
                this.fps.fadeIn();
        }
        else if (!this.fps.alwaysShow)
            this.fps.fadeOut();

        var that = this;
        this.console.animate(
        {
            height: !isVisible ? 250 : 0
        },
        {
            duration : 250,
            easing   : "swing",
            progress : function () {
                that.onWindowResizeInternal();
            },
            complete : !isVisible ?
                function () {
                    that.console.animate({ scrollTop: that.console.prop("scrollHeight") }, 350);
                    that.consoleInput.focus();
                    that.onWindowResizeInternal();
                } :
                function () {
                    that.console.scrollTop(0);
                    that.console.hide();
                    that.consoleInput.trigger("blur");
                    that.consoleInput.hide();
                    that.onWindowResizeInternal();
                }
        });
    },

    onWindowResizeDOM : function(event)
    {
        TundraSDK.framework.ui.onWindowResizeInternal(event);

        var element = TundraSDK.framework.client.container;
        if (element != null)
            TundraSDK.framework.events.send("UiAPI.WindowResize", element.width(), element.height());
    },

    onWindowResizeInternal : function(event)
    {
        if (this.taskbar != null)
        {
            this.taskbar.position({
                my: "left bottom",
                at: "left bottom",
                of: this.taskbar.parent()
            });

            if (this.buttons.length > 0)
            {
                var totalwidth = 0;
                for (var i = this.buttons.length - 1; i >= 0; i--)
                    totalwidth += this.buttons[i].width();

                this.buttons[0].position({
                    my: "left",
                    at: "right-" + totalwidth,
                    of: this.taskbar
                });

                var target = "#" + this.buttons[0].attr("id");

                for (var i = 1; i < this.buttons.length; i++)
                {
                    this.buttons[i].position({
                        my: "left",
                        at: "right",
                        of: target,
                        collision: "fit"
                    });
                    target = this.buttons[i];
                }
            }
        }

        if (this.console.is(":visible"))
        {
            this.console.position({
                my : "left top",
                at : "left top",
                of : this.console.parent()
            });
        }
        if (this.consoleInput.is(":visible"))
        {
            this.consoleInput.position({
                my : "left top",
                at : "left bottom",
                of : this.console
            });
        }

        if (this.fps !== undefined && this.fps.is(":visible"))
        {
            this.fps.position({
                my : "right top",
                at : "right-20 top",
                of : TundraSDK.framework.client.container
            });
        }
    }
});




/**
    FrameAPI provides frame updates and single shot callbacks.

    @class FrameAPI
    @constructor
*/
var FrameAPI = Class.$extend(
{
    __init__ : function(params)
    {
        this.currentWallClockTime = 0.0;
        this.currentFrameNumber = 0;
        this.delayedExecutes = [];
    },

    // Called by TundraClient on each frame.
    _update : function(frametime)
    {
        // Advance wall clock time
        this.currentWallClockTime += frametime;

        // Fire events
        TundraSDK.framework.events.send("FrameAPI.Update", frametime);

        this._updateDelayedExecutes(frametime);

        // Protect against someone setting the frame number to negative.
        // No one should screw with this anyways.
        this.currentFrameNumber++;
        if (this.currentFrameNumber < 0)
            this.currentFrameNumber = 0;
    },

    _updateDelayedExecutes : function(frametime)
    {
        if (this.delayedExecutes.length === 0)
            return;

        // Fire delayed executes
        for (var i=0; i<this.delayedExecutes.length; ++i)
        {
            this.delayedExecutes[i].timeLeft -= frametime;
            if (this.delayedExecutes[i].timeLeft <= 0.0)
            {
                var data = this.delayedExecutes[i];
                this.delayedExecutes.splice(i, 1);
                i--;

                this._postDelayedExecute(data);
            }
        };
    },

    _postDelayedExecute : function(data)
    {
        try
        {
            // Callback was not defined, but context is a function: invoke it.
            // Always use the function as the context if one was not provided.
            if (typeof data.callback !== "function" && typeof data.context === "function")
                data.context.call(data.context, data.param);
            else
                data.callback.call(data.context != null ? data.context : data.callback, data.param);
        }
        catch(e)
        {
            TundraLogging.getLogger("FrameAPI").error("Failed to invoke callback for delayed execute:", e);
        }
    },

    // Called by TundraClient on each frame.
    _postUpdate : function(frametime)
    {
        TundraSDK.framework.events.send("FrameAPI.PostFrameUpdate", frametime);
    },

    reset : function()
    {
        // Remove all callbacks attached to the frame updates.
        // This happens on disconnect, the running apps must not get any updates
        // if they are left running in the global js context and do not correctly
        // unsub from frame updates.
        TundraSDK.framework.events.remove("FrameAPI.Update");
        TundraSDK.framework.events.remove("FrameAPI.PostFrameUpdate");
    },

    /**
        Returns the current application wall clock time in seconds.

        @method wallClockTime
        @return {Number}
    */
    wallClockTime : function()
    {
        return this.currentWallClockTime;
    },

    /**
        Returns the current application frame number.

        @method frameNumber
        @return {Number}
    */
    frameNumber : function()
    {
        return this.currentFrameNumber;
    },

    /**
        Registers a callback for frame updates.

            function onFrameUpdate(frametime)
            {
                // frametime == time since last frame update in seconds
            }
            TundraSDK.framework.frame.onUpdate(null, onFrameUpdate);

        @method onUpdate
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onUpdate : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("FrameAPI.Update", context, callback);
    },

    /**
        Registers a callback for post frame updates. Meaning that the normal update has been fired,
        all APIs and the renderer has been updated for this frame.

            function onPostFrameUpdate(frametime)
            {
                // frametime == time since last frame update in seconds
            }
            TundraSDK.framework.frame.onPostFrameUpdate(null, onPostFrameUpdate);

        @method onPostFrameUpdate
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onPostFrameUpdate : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("FrameAPI.PostFrameUpdate", context, callback);
    },

    /**
        Registers a delayed callback invocation with context.

            function onDelayedExecute(param)
            {
                // this.test == 12
                // param == 101
            }
            var context = { test : 12 };
            TundraSDK.framework.frame.delayedExecute(1.0, context, onDelayedExecute, 101);

        @method delayedExecute
        @param {Number} afterSeconds Time in seconds when the after the callback is invoked.
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @param {Object} [param=undefined] Optional parameter to to the callback.
    */
    /**
        Registers a delayed callback invocation.

            TundraSDK.framework.frame.delayedExecute(1.0, function(param) {
                console.log(param); // 101
            }, 101);

        @method delayedExecute
        @param {Number} afterSeconds Time in seconds when the after the callback is invoked.
        @param {Function} callback Function to be called.
        @param {Object} [param=undefined] Optional parameter to to the callback.
    */
    delayedExecute : function(afterSeconds, context, callback, param)
    {
        if (typeof afterSeconds !== "number")
        {
            TundraLogging.getLogger("FrameAPI").error("delayedExecute parameter 'afterSeconds' must be a number!");
            return;
        }
        this.delayedExecutes.push({
            timeLeft : afterSeconds,
            context  : context,
            callback : callback,
            param   : (typeof callback !== "function" && param === undefined ? callback : param)
        });
    }
});




/**
    Login reply message.

    @class LoginReplyMessage
    @extends INetworkMessage
    @constructor
*/
var LoginReplyMessage = INetworkMessage.$extend(
{
    __init__ : function()
    {
        this.$super(LoginReplyMessage.id, "LoginReplyMessage");

        /**
            If login was successful.
            @property success
            @type Boolean
        */
        this.success = false;
        /**
            Client connection id.
            @property connectionId
            @type Number
        */
        this.connectionId = -1;
        /**
            Login reply data as JSON.
            @property replyData
            @type String
        */
        this.replyData = "";
    },

    __classvars__ :
    {
        id   : 101,
        name : "LoginReplyMessage"
    },

    deserialize : function(ds)
    {
        this.success = ds.readBoolean();
        this.connectionId = ds.readVLE();
        this.replyData = ds.readStringU16();
        delete ds;
    }
});




/**
    Clien joined message.

    @class ClientJoinedMessage
    @extends INetworkMessage
    @constructor
*/
var ClientJoinedMessage = INetworkMessage.$extend(
{
    __init__ : function()
    {
        this.$super(ClientJoinedMessage.id, "ClientJoinedMessage");

        /**
            Client connection id.
            @property connectionId
            @type Number
        */
        this.connectionId = -1;
    },

    __classvars__ :
    {
        id   : 102,
        name : "ClientJoinedMessage"
    },

    deserialize : function(ds)
    {
        this.connectionId = ds.readVLE();
        delete ds;
    }
});




/**
    Clien left message.

    @class ClientLeftMessage
    @extends INetworkMessage
    @constructor
*/
var ClientLeftMessage = INetworkMessage.$extend(
{
    __init__ : function()
    {
        this.$super(ClientLeftMessage.id, "ClientLeftMessage");

        /**
            Client connection id.
            @property connectionId
            @type Number
        */
        this.connectionId = -1;
    },

    __classvars__ :
    {
        id   : 103,
        name : "ClientLeftMessage"
    },

    deserialize : function(ds)
    {
        this.connectionId = ds.readVLE();
        delete ds;
    }
});




/**
    Network handler for the Tundra protocol messages.

    @class TundraMessageHandler
    @extends INetworkMessageHandler
    @constructor
*/
var TundraMessageHandler = INetworkMessageHandler.$extend(
{
    __init__ : function()
    {
        this.$super("TundraMessageHandler");
    },

    canHandle : function(id)
    {
        // Login related
        if (id >= 101 && id <= 103)
            return true;
        // Entity action
        else if (id === 120)
            return true;
        // Scene/Entity/Component/Attribute related.
        // Expand this when new messages handling is implemented.
        else if (id >= 110 && id <= 116)
            return true;
        return false;
    },

    handle : function(id, ds)
    {
        /// @todo Implement 109 EditEntityPropertiesMessage
        /// @todo Implement 117 CreateEntityReplyMessage
        /// @todo Implement 118 CreateComponentsReplyMessage
        /// @todo Implement 119 RigidBodyUpdateMessage

        var client = TundraSDK.framework.client;

        if (id >= 110 && id <= 116)
        {
            // Immediate mode message parsing, no predefined objects.
            var msg = new INetworkMessage(id);
            msg.deserialize(ds);

            client.scene.onTundraMessage(msg);   
        }
        else if (id === EntityActionMessage.id)
        {
            var msg = new EntityActionMessage();
            msg.deserialize(ds);

            client.scene.handleEntityActionMessage(msg);
        }
        else if (id === LoginReplyMessage.id)
        {
            var msg = new LoginReplyMessage();
            msg.deserialize(ds);

            if (msg.success)
            {
                // Set the clients connection id.
                client.connectionId = msg.connectionId;

                // Pass storage information to AssetAPI.
                if (msg.loginReplyData !== "")
                    client.asset.handleDefaultStorage(msg.replyData);
            }
            else
            {
                client.log.error("Authentication to server failed: ", msg);
                client.disconnect();
            }
        }
        else if (id === ClientJoinedMessage.id)
        {
            /// @note This is currently a no-op both in native and web client
            var msg = new ClientJoinedMessage();
            msg.deserialize(ds);
        }
        else if (id === ClientLeftMessage.id)
        {
            /// @note This is currently a no-op both in native and web client
            var msg = new ClientLeftMessage();
            msg.deserialize(ds);
        }
    }
});




/**
    Login message.

    @class LoginMessage
    @extends INetworkMessage
    @constructor
*/
var LoginMessage = INetworkMessage.$extend(
{
    __init__ : function()
    {
        this.$super(LoginMessage.id, "LoginMessage");
    },

    __classvars__ :
    {
        id   : 100,
        name : "LoginMessage"
    },

    /**
        Serializes login data to this message.

        @method serialize
        @param {String} loginData Login properties as JSON.
    */
    serialize : function(loginData)
    {
        this.$super(2 + 2 + DataSerializer.utf8StringByteSize(loginData));
        this.ds.writeU16(this.id);
        this.ds.writeStringU16(loginData);
    }
});




/**
    Name component provides functionality for Entity indenfication, description and grouping.

    @class EC_Name
    @extends IComponent
    @constructor
*/
var EC_Name = IComponent.$extend(
{
    __init__ : function(id, typeId, typeName, name)
    {
        this.$super(id, typeId, typeName, name);

        /**
            @property name (attribute)
            @type Attribute
        */
        this.declareAttribute(0, "name", "", Attribute.String);
        /**
            @property description (attribute)
            @type Attribute
        */
        this.declareAttribute(1, "description", "", Attribute.String);
        /**
            @property group (attribute)
            @type Attribute
        */
        this.declareAttribute(2, "group", "", Attribute.String);
    },

    /**
        Event that is fired every time the Entitys name changes.

        @method onNameChanged
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription|null} Subscription data or null if this entity is not yes initialized correctly.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onNameChanged : function()
    {
        if (!this.hasParentEntity())
        {
            this.log.error("Cannot subscribe onNameChanged, parent entity not set!");
            return null;
        }
        return TundraSDK.framework.events.subscribe("EC_Name.NameChanged." + this.parentEntity.id + "." + this.id, context, callback);
    },

    /**
        Set name.
        @method setName
        @param {String} name New name.
        @param {AttributeChange} [change=AttributeChange.Default] Attribute change signaling mode.
    */
    setName : function(name, change)
    {
        if (name !== this.attributes.name.get())
        {
            var oldName = this.attributes.name.getClone();
            this.attributes.name.set(name, change);

            // Send generic event about the name change
            if (this.hasParentEntity())
                TundraSDK.framework.events.send("EC_Name.NameChanged." + this.parentEntity.id + "." + this.id, name, oldName);

            // Inform scene about the name change. This will update all parenting to be correct.
            if (this.hasParentScene())
                this.parentScene._onEntityNameChanged(this.parentEntity, name, oldName);
        }
    },

    /**
        Get name.
        @method getName
        @return {String}
    */
    getName : function()
    {
        return this.attributes.name.getClone();
    },

    /**
        Set description.
        @method setDescription
        @param {String} description New description.
        @param {AttributeChange} [change=AttributeChange.Default] Attribute change signaling mode.
    */
    setDescription : function(description, change)
    {
        if (description !== this.attributes.description.get())
            this.attributes.description.set(description, change);
    },

    /**
        Get description.
        @method getDescription
        @return {String}
    */
    getDescription : function()
    {
        return this.attributes.description.getClone();
    },

    /**
        Set group.
        @method setGroup
        @param {String} group New group.
        @param {AttributeChange} [change=AttributeChange.Default] Attribute change signaling mode.
    */
    setGroup : function(group, change)
    {
        if (group !== this.attributes.group.get())
            this.attributes.group.set(group, change);
    },

    /**
        Get group.
        @method getGroup
        @return {String}
    */
    getGroup : function()
    {
        return this.attributes.group.getClone();
    },

    update : function()
    {
    },

    attributeChanged : function(index, name, value)
    {
    }
});

Scene.registerComponent(26, "EC_Name", EC_Name);




/**
    Script component.
    @class EC_Script
    @extends IComponent
    @constructor
*/
var EC_Script = IComponent.$extend(
{
    __init__ : function(id, typeId, typeName, name)
    {
        this.$super(id, typeId, typeName, name);

        /**
            @property scriptRef (attribute)
            @type Attribute
        */
        this.declareAttribute(0, "scriptRef", [], Attribute.AssetReferenceList);
        /**
            @property runOnLoad (attribute)
            @type Attribute
        */
        this.declareAttribute(1, "runOnLoad", false, Attribute.Bool);
        /**
            @example
                if (ent.script.runMode === EC_Script.RunMode.Both)
                    ...;
                else if (ent.script.runMode === EC_Script.RunMode.Client)
                    ...;
                else if (ent.script.runMode === EC_Script.RunMode.Server)
                    ...;
            @property runMode (attribute)
            @type Attribute
        */
        this.declareAttribute(2, "runMode", EC_Script.RunMode.Both, Attribute.Int);
        /**
            @property applicationName (attribute)
            @type Attribute
        */
        this.declareAttribute(3, "applicationName", "", Attribute.String);
        /**
            @property className (attribute)
            @type Attribute
        */
        this.declareAttribute(4, "className", "", Attribute.String);
    },

    __classvars__ :
    {
        /**
            Script run mode enumeration.
            @property RunMode
            @static
            @example
                {
                    Both   : 0,
                    Client : 1,
                    Server : 2
                };
        */
        RunMode :
        {
            Both   : 0,
            Client : 1,
            Server : 2
        },

        nativeScriptReplacements : [],

        /**
            Register an web client script to replace certain native Tundra script ref.
            Useful for register hot swapping apps so you don't have to add two client scripts to your scene.
            The keyword will be matched against the script file name only, not the full URL. Comparison is case-insensitive.
            @static
            @method registerNativeScriptReplacement
            @param {String} Script ref keyword, if this keyword is found from a scriptref it will be replaced.
            @param {String} Replacement script ref.
        */
        registerNativeScriptReplacement : function(scriptRefKeyword, replacementScriptRef)
        {
            this.nativeScriptReplacements.push({
                "keyword"     : scriptRefKeyword,
                "replacement" : replacementScriptRef
            });
        },

        localScriptReplacement : [],

        /**
            Registers a local replacement file for .webtundrajs scripts. Essentially allows you
            to use a local script for development/debug purpouses.
        */
        registerLocalScriptReplacement : function(scriptRefKeyword, replacementScriptRef)
        {
            this.localScriptReplacement.push({
                "keyword"     : scriptRefKeyword,
                "replacement" : replacementScriptRef
            });
        }
    }
});




/**
    Avatar component handles parsing an avatar appearance description and setting it up for rendering.

    @todo Implement .avatar/.xml realXtend Avatar description and the new json based avatar description
    parsing. Detect the mesh, skeleton, materials and animations and inject them into EC_Mesh + EC_AnimationController
    as needed.

    @class EC_Avatar
    @extends IComponent
    @constructor
*/
var EC_Avatar = IComponent.$extend(
{
    __init__ : function(id, typeId, typeName, name)
    {
        this.$super(id, typeId, typeName, name);

        /**
            @property appearanceRef (attribute)
            @type Attribute
        */
        this.declareAttribute(0, "appearanceRef", "", Attribute.AssetReference);
    }
});




/**
    DynamicComponent component that differs from static components in that it's attributes can be
    added, manipulated and removed during runtime.

    @class EC_DynamicComponent
    @extends IComponent
    @constructor
*/
var EC_DynamicComponent = IComponent.$extend(
{
    __init__ : function(id, typeId, typeName, name)
    {
        this.$super(id, typeId, typeName, name);
    },

    /**
        DynamicComponent always returns true as its structure is not known beforehand.
        This overrides the IComponent.isDynamic function.

        @method isDynamic
        @return {Boolean} Always true for DynamicComponent.
    */
    isDynamic : function()
    {
        return true;
    },

    /**
        Check if an attribute exists.

        @method hasAttribute
        @param {String} attributeName Name of the attribute.
        @return {Boolean} If this attribute exists.
    */
    hasAttribute : function(attributeName)
    {
        var attr = this.getAttribute(attributeName);
        return (attr !== undefined && attr !== null);
    },

    /**
        Creates a new attribute. <b>Note:</b> Does not replicate to the server at this moment!

        @method createAttribute
        @param {Number|String} typeNameOrId Type name or id of the attribute.
        @param {String} attributeName Name of the attribute.
        @return {Boolean} If this attribute was created.
    */
    createAttribute : function(typeId, name)
    {
        if (typeof typeId === "string")
            typeId = Attribute.toTypeId(typeId);
        if (typeId === undefined || typeId === null)
        {
            this.log.error("createAttribute: received invalid type name or id parameter.");
            return false;
        }
        if (this.hasAttribute(name))
        {
            this.log.error("createAttribute: attribute with name '" + name + "' already exists!");
            return false;
        }

        // Find a free index
        var index = 0;
        while (index < 10000)
        {
            if (this.attributeIndexes[index] === undefined)
                break;
            index++;
        }

        this.declareAttribute(index, name, Attribute.defaultValueForType(typeId), typeId);
        this._attributeAdded(index);
        return true;
    },

    /**
        Removes a existing attribute. <b>Note:</b> Does not replicate to the server at this moment!

        @method removeAttribute
        @param {Number|String} id Attribute name or index.
        @return {Boolean} If this attribute was removed.
    */
    removeAttribute : function(id)
    {
        try
        {
            var attributeName = undefined;
            var attributeIndex = undefined;
            if (typeof id === "string")
            {
                attributeName = id;
            }
            else if (typeof id === "number")
            {
                attributeIndex = id;
                attributeName = this.attributeIndexes[id];
            }

            if (attributeName === undefined || attributeName === null)
                return false;
            var attribute = this.attributes[attributeName];
            if (attribute === undefined || attribute === null)
                return false;

            if (attributeIndex === undefined)
                attributeIndex = attribute.index;

            this._attributeAboutToBeRemoved(attribute);

            if (this[attributeName] !== undefined)
            {
                var getSet   = {};
                getSet[attributeName] = 
                {
                    get : function ()      { return undefined; },
                    set : function (value) { },
                    configurable : true
                };
                Object.defineProperties(this, getSet);
            }

            attribute._reset();
            attribute = null;

            delete this.attributes[attributeName];
            delete this.attributeIndexes[attributeIndex];
            this.attributes[attributeName] = undefined;
            this.attributeIndexes[attributeIndex] = undefined;
            return true;
        }
        catch (e)
        {
            console.error("EC_DynamicComponent.removeAttribute:", e);
        }
        return false;
    },

    /**
        Registers a callback for when new attribute is created.
        @example
            ent.dynamicComponent.onAttributeAdded(null, function(component, attribute) {
                console.log("Attribute added", attribute.name, attribute.typeName, attribute.get().toString(),
                    "from component", component.id, component.name);
            });

        @method onAttributeAdded
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription|null} Subscription data or null if parent entity is not set.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onAttributeAdded : function(context, callback)
    {
        if (!this.hasParentEntity())
        {
            this.log.error("Cannot subscribe onAttributeAdded, no parent entity!");
            return null;
        }
        return TundraSDK.framework.events.subscribe("EC_DynamicComponent.AttributeAdded." + this.parentEntity.id + "." + this.id, context, callback);
    },

    _attributeAdded : function(attribute)
    {
        if (typeof attribute === "number")
            attribute = this.attributeByIndex(attribute);
        if (attribute !== undefined && attribute !== null && this.hasParentEntity())
        {
            TundraSDK.framework.events.send("EC_DynamicComponent.AttributeAdded." + this.parentEntity.id + "." + this.id,
                this, attribute);
        }
    },

    /**
        Registers a callback for when an existing attribute is about to be removed. Try to avoid querying the actual attribute object from the component.
        @example
            ent.dynamicComponent.onAttributeAboutToBeRemoved(null, function(component, attributeIndex, attributeName) {
                console.log("Attribute about to be removed", attributeIndex, attributeName, "from component", component.id, component.name);
            });

        @method onAttributeAboutToBeRemoved
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription|null} Subscription data or null if parent entity is not set.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onAttributeAboutToBeRemoved : function(context, callback)
    {
        if (!this.hasParentEntity())
        {
            this.log.error("Cannot subscribe onAttributeAboutToBeRemoved, no parent entity!");
            return null;
        }
        return TundraSDK.framework.events.subscribe("EC_DynamicComponent.AttributeAboutToBeRemoved." + this.parentEntity.id + "." + this.id, context, callback);
    },

    _attributeAboutToBeRemoved : function(attribute)
    {
        if (attribute !== undefined && attribute !== null && this.hasParentEntity())
        {
            TundraSDK.framework.events.send("EC_DynamicComponent.AttributeAboutToBeRemoved." + this.parentEntity.id + "." + this.id,
                this, attribute.index, attribute.name);
        }
    }
});

Scene.registerComponent(25, "EC_DynamicComponent", EC_DynamicComponent);



/**
    Tundra client that exposes the instantiates the TundraSDK and its APIs.
    Main entry point for app developers that want to leverage the realXtend WebTundra SDK.

    @class TundraClient
    @constructor
    @example
        var client = new TundraClient({
            // Container element id for Web Rocket. Default: If not passed a full screen container is created.
            container : "#webtundra-container-custom",

            // Render system selection. Default: Empty string, equals to picking the first registered renderer.
            // This can be the name of the render system if it has been registered via TundraClient.registerRenderSystem
            // or the prototype of the wanter renderer. In this case it will be registered, instantiated and set as the
            // current renderer.
            renderSystem   : "three.js",

            // Maps startup application names to scriptRefs. Default: Empty map.
            applications : {
                "Application name" : scriptRef
            },

            // If taskbar should be created. Default: true.
            taskbar   : true,

            // If console should be created. Default: true.
            console   : true,

            // If verbose network message debug info should be printed to browsers console. Default: false.
            networkDebugLogging : false,

            // Asset related information
            asset     : {
                // Storage path webtundra:// refs will be resovled to. Default: Same path as the hosted page.
                localStoragePath : ""
            }
        });
    @param {Object} [params={}] An configuration object that setups the client.
    @return {TundraClient}
*/
var TundraClient = Class.$extend(
{
    __init__ : function(params)
    {
        TundraSDK.framework.client = this;

        // Default params
        // @todo Nicer sytax here with 'params.something = params.something || <default-value>;'?
        // @todo Move these to be done by the code that is expecting the values, stupid to do here.
        if (params === undefined || params === null)
            params = {};
        if (params.renderSystem === undefined || params.renderSystem === null)
            params.renderSystem = "";
        if (params.applications === undefined || params.applications === null)
            params.applications = {};
        if (params.taskbar === undefined || params.taskbar === null)
            params.taskbar = true;
        if (params.console === undefined || params.console === null)
            params.console = true;
        if (params.networkDebugLogging === undefined || params.networkDebugLogging === null)
            params.networkDebugLogging = false;
        if (params.asset === undefined || params.asset === null)
            params.asset = {}
        if (params.asset.localStoragePath === undefined)
            params.asset.localStoragePath = "";
        if (params.container === undefined || params.container === null)
        {
            /**
                DOM container for this WebTundra client.
                @property container
                @type jQuery Element
            */
            this.container = $("<div/>");
            this.container.attr("id", "webtundra-container");
            this.container.css({
                "background-color" : "black",
                "position" : "absolute",
                "z-index"  : 0,
                "top"      : 0,
                "left"     : 0,
                "padding"  : 0,
                "margin"   : 0,
                "width"    : "100%",
                "height"   : "100%"
            });
            $("body").append(this.container);
        }
        else
            this.container = $(params.container);

        // DEBUG if in development requirejs environment, INFO for production.
        if (params.loglevel === undefined || params.loglevel === null)
            params.loglevel = (typeof require === "function" ? TundraLogging.Level.DEBUG : TundraLogging.Level.INFO);
        TundraLogging.setLevel(typeof params.loglevel === "string" ? params.loglevel.toUpperCase() : params.loglevel);

        this.log = TundraLogging.getLogger("WebTundra");

        /**
            @property frame
            @type FrameAPI
        */
        this.frame = new FrameAPI(params);
        TundraSDK.framework.frame = this.frame;

        /**
            @property network
            @type Network
        */
        this.network = new Network(params);
        this.network.registerMessageHandler(new TundraMessageHandler());
        TundraSDK.framework.network = this.network;

        /**
            @property events
            @type EventAPI
        */
        this.events = new EventAPI(params);
        TundraSDK.framework.events = this.events;

        /**
            @property console
            @type ConsoleAPI
        */
        this.console = new ConsoleAPI(params);
        TundraSDK.framework.console = this.console;

        /**
            @property scene
            @type Scene
        */
        this.scene = new Scene(params);
        TundraSDK.framework.scene = this.scene;

        /**
            @property asset
            @type AssetAPI
        */
        this.asset = new AssetAPI(params);
        TundraSDK.framework.asset = this.asset;

        /**
            @property input
            @type InputAPI
        */
        this.input = new InputAPI(params);
        TundraSDK.framework.input = this.input;

        /**
            @property ui
            @type UiAPI
        */
        this.ui = new UiAPI(params);
        TundraSDK.framework.ui = this.ui;

        /**
            @property renderer
            @type IRenderSystem
        */
        this.renderer = null;

        // Passed in 'renderSystem' is a prototype of the wanted renderer, register and use it.
        if (typeof params.renderSystem === "function")
            this.renderer = params.renderSystem.register(TundraClient);
        else if (typeof params.renderSystem === "string" && params.renderSystem !== "")
        {
            for (var i = 0; i < TundraClient.renderSystems.length; i++)
            {
                if (CoreStringUtils.trim(TundraClient.renderSystems[i].name).toLowerCase() === CoreStringUtils.trim(params.renderSystem).toLowerCase())
                {
                    this.renderer = TundraClient.renderSystems[i];
                    break;
                }
            }
            if (this.renderer == null)
            {
                this.log.warn("Could not find a requested render system with name '" + params.renderSystem + "'. Picking the first registered system instead!");
                if (TundraClient.renderSystems.length > 0)
                    this.renderer = TundraClient.renderSystems[0];
            }
        }
        else if (TundraClient.renderSystems.length > 0)
            this.renderer = TundraClient.renderSystems[0];

        if (this.renderer != null)
            this.renderer._load(params);
        else
            this.log.error("Failed to load a render system!");
        TundraSDK.framework.renderer = this.renderer;

        /**
            @property domIntegration
            @type IDomIntegration
        */
        this.domIntegration = null;

        /**
            Used login properties for the current server connection.
            @property loginProperties
            @type Object
        */
        this.loginProperties = {};
        /**
            Client connection id.
            @property connectionId
            @type Number
        */
        this.connectionId = 0;
        /**
            If verbose network message debug info should be printed to browsers console.
            Can be passed in the TundraClient contructor parameters or toggled during runtime.
            @property networkDebugLogging
            @type Boolean
        */
        this.networkDebugLogging = params.networkDebugLogging;

        // Reset state
        this.reset();

        // Post init APIs
        this.ui.postInitialize();
        this.asset.postInitialize();
        this.input.postInitialize();
        this.scene.postInitialize();

        // Load plugins
        this.loadPlugins();

        if (this.renderer != null)
            this.renderer.postInitialize();

        // Start frame updates
        this.onUpdateInternal();

        // Console commands
        this.console.registerCommand("disconnect", "Disconnects the active server connection", null, this, this.disconnect);

        // Run startup apps
        for (var appName in params.applications)
            this.runApplication(appName, params.applications[appName]);
    },

    __classvars__ :
    {
        domIntegrations : [],

        registerDomIntegration : function(domIntegration)
        {
            if (domIntegration instanceof IDomIntegration)
                TundraClient.domIntegrations.push(domIntegration);
            else if (console.error != null)
                console.error("[WebTundra]: registerDomIntegration called with object that is not an instance of IDomIntegration!");
            return (domIntegration instanceof IDomIntegration);
        },

        renderSystems : [],

        registerRenderSystem : function(renderSystem)
        {
            if (renderSystem instanceof IRenderSystem)
                TundraClient.renderSystems.push(renderSystem);
            else if (console.error != null)
                console.error("[WebTundra]: registerRenderSystem called with object that is not an instance of IRenderSystem!");
            return (renderSystem instanceof IRenderSystem);
        }
    },

    loadPlugins : function()
    {
        // Protect accidental/malicious double loading.
        if (this.pluginsLoaded === true)
            return;
        this.pluginsLoaded = true;

        /// @todo Figure out if there is a sensible point where
        /// the plugins should be uninitialized, currently not
        /// done but its part of the interface.
        
        // Load TundraSDK registerd plugins
        for (var i = 0; i < TundraSDK.plugins.length; i++)
        {
            try
            {
                this.log.debug("Loading", TundraSDK.plugins[i].name);
                TundraSDK.plugins[i]._initialize();
            } 
            catch(e)
            {
                this.log.error("Failed to initialize " + TundraSDK.plugins[i].name + ":", e);
            }
        }
        // Post init plugins now that all plugins have been loaded.
        for (var i = 0; i < TundraSDK.plugins.length; i++)
        {
            try
            {
                TundraSDK.plugins[i]._postInitialize();
            } 
            catch(e)
            {
                this.log.error("Failed to postInitialize " + TundraSDK.plugins[i].name + ":", e);
            }
        }
    },

    setDomIntegration : function(domIntegration)
    {
        if (this.domIntegration !== undefined && this.domIntegration !== null)
            this.domIntegration._unload();

        this.domIntegration = domIntegration;
        this.domIntegration._load();
    },

    registerCameraApplication : function(name, application)
    {
        if (!(application instanceof ICameraApplication))
        {
            console.error("[WebTundra]: registerCameraApplication called with object that is not an instance of ICameraApplication!");
            return;
        }

        for (var i = 0; i < this.cameraApplications.length; i++)
        {
            if (this.cameraApplications[i].name === name)
            {
                console.error("[WebTundra]: Camera application '" + name + "' already registered!");
                return;
            }
        }

        this.cameraApplications.push({
            "name"        : name,
            "application" : application
        });

        // We wont be needing a selection button if only one camera app is running
        if (this.cameraApplications.length <= 1)
            return;

        var that = this;
        if (this.cameraSwitcherButton != null)
        {
            // Menu exists, add new item
            this.ui.addContextMenuItems(this.cameraSwitcherMenu, {
                name     : name,
                callback : function() {
                    that.activateCameraApplication($(this).data("itemName"));
                }
            });
            return;
        }

        // Create taskbar action and attache context menu to it
        this.cameraSwitcherButton = this.ui.addAction("Select Camera Mode (Tab)", 
            TundraSDK.framework.asset.getLocalAssetPath("img/icons/icon-camera.png"), 40, false);
        this.cameraSwitcherMenu = this.ui.addContextMenu(this.cameraSwitcherButton, true, true, function() {
            that.cameraSwitcherButton.tooltip("close");
        });

        // Add context menu items
        for (var i = 0; i < this.cameraApplications.length; i++)
        {
            this.ui.addContextMenuItems(this.cameraSwitcherMenu, {
                name     : this.cameraApplications[i].name,
                callback : function() {
                    that.activateCameraApplication($(this).data("itemName"));
                }
            });
        }

        this.input.onKeyPress(this, function(keyEvent) {
            if (keyEvent.keyCode === 9 || keyEvent.key === "tab")
            {
                this.cameraApplicationIndex++;
                if (this.cameraApplicationIndex >= this.cameraApplications.length)
                    this.cameraApplicationIndex = 0;
                this.activateCameraApplication(this.cameraApplications[this.cameraApplicationIndex].name);

                keyEvent.originalEvent.preventDefault();
            }
        });
    },

    activateCameraApplication : function(name)
    {
        for (var i = 0; i < this.cameraApplications.length; i++)
        {
            if (this.cameraApplications[i].name === name)
            {
                this.cameraApplicationIndex = i;
                this.cameraApplications[i].application._activateCameraApplication();
                return;
            }
        }
    },

    setAuthToken : function(name, value)
    {
        this.authTokens[name] = value;
    },

    getAuthToken : function(name)
    {
        try
        {
            return this.authTokens[name];
        }
        catch (e)
        {
            return null;
        }
    },

    /**
        Runs a client side application by creating a local entity.
        Useful for startup apps after the client has been instantiated on a page.

        This function is called automatically with {{#crossLink "TundraClient"}}{{/crossLink}} 'applications' constructor parameters.
        @method runApplication
        @param {String} applicationName Application name. This will be used as the local entitys name that will hold the script component.
        @param {String} scriptRef Application script URL or relative path.
        @return {Entity} The local entity that holds the script component.
    */
    runApplication : function(applicationName, scriptRef)
    {
        if (Scene.registeredComponent("Script") == null)
        {
            this.log.error("runApplication: Cannot run script '" + scriptRef + "', Script component not registered.");
            return null;
        }
        var appEnt = this.scene.createLocalEntity(["Name", "Script"]);
        appEnt.name = applicationName;

        appEnt.script.startupApplication = true;
        appEnt.script.attributes.runMode.set(EC_Script.RunMode.Client, AttributeChange.LocalOnly);
        appEnt.script.attributes.runOnLoad.set(true, AttributeChange.LocalOnly);
        appEnt.script.attributes.scriptRef.set([scriptRef], AttributeChange.LocalOnly);
        return appEnt;
    },

    /**
        Registers a callback for when client connects to the server.

            TundraSDK.framework.client.onConnected(null, function() {
                console.log("The eagle has landed!");
            });

        @method onConnected
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onConnected : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("TundraClient.Connected", context, callback);
    },

    /**
        Registers a callback for client connection errors.

            TundraSDK.framework.client.onConnectionError(null, function(event) {
                console.error("RED ALERT: " + event);
            });

        @method onConnectionError
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onConnectionError : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("TundraClient.ConnectionError", context, callback);
    },

    /**
        Registers a callback for when client disconnects from the server.

            TundraSDK.framework.client.onDisconnected(null, function() {
                console.log("Elvis has left the building!");
            });

        @method onDisconnected
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onDisconnected : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("TundraClient.Disconnected", context, callback);
    },

    /**
        Registers a callback for log info prints. Note: Important messages is ones are already
        logged to console.log() and the UI console if one has been created.

            TundraSDK.framework.client.onLogInfo(null, function(message) {
                console.log("LogInfo:", message);
            });

        @method onLogInfo
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onLogInfo : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("TundraClient.LogInfo", context, callback);
    },

    /**
        Registers a callback for log warning prints. Note: Important messages is ones are already
        logged to console.warn() and the UI console if one has been created.

            TundraSDK.framework.client.onLogWarning(null, function(message) {
                console.warn("LogWarning:", message);
            });

        @method onLogWarning
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onLogWarning : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("TundraClient.LogWarning", context, callback);
    },

    /**
        Registers a callback for log error prints. Note: Important messages is ones are already
        logged to console.error() and the UI console if one has been created.

            TundraSDK.framework.client.onLogError(null, function(message) {
                console.log("LogError:", message);
            });

        @method onLogError
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription} Subscription data.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onLogError : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("TundraClient.LogError", context, callback);
    },

    /**
        Resets the client object state. This is automatically called when disconnected from a server.
        @method reset
    */
    reset : function()
    {
        // Reset data
        this.websocket = null;
        this.loginProperties = {};
        this.connectionId = 0;
        this.authTokens = {};

        // Reset APIs
        this.frame.reset();
        this.ui.reset();
        this.input.reset();
        this.asset.reset();
        this.scene.reset();
        this.renderer.reset();

        // Reset frametime
        this.lastTime = performance.now();

        this.cameraApplications = [];
        this.cameraApplicationIndex = 0;
        this.cameraSwitcherButton = null;
        this.cameraSwitcherMenu = null;
    },

    onUpdateInternal : function()
    {
        var that = TundraSDK.framework.client;
        requestAnimationFrame(that.onUpdateInternal);

        var timeNow = performance.now()
        var frametime = (timeNow - that.lastTime);
        frametimeMsec = frametime;
        frametime = frametime / 1000.0;
        that.lastTime = timeNow;

        that.frame._update(frametime);

        // Update APIs
        that.asset.update(frametime);
        that.scene.update(frametime);

        // Render scene
        that.renderer.update(frametime, frametimeMsec);

        that.frame._postUpdate(frametime);
    },

    /**
        Logs a info message. Always sends the event to {{#crossLink "TundraClient/onLogInfo:method"}}{{/crossLink}}
        callbacks and optionally logs to the browsers console.
        @method logInfo
        @param {String} message Log message.
        @param {Boolean} toBrowserConsole If the message should be logged to the browsers console.log function.
    */
    logInfo : function(message, toBrowserConsole)
    {
        if (toBrowserConsole === undefined || toBrowserConsole == null)
            toBrowserConsole = false;
        if (toBrowserConsole && console.log != null)
            console.log(message);

        TundraSDK.framework.events.send("TundraClient.LogInfo", message);
    },

    /**
        Logs a warning message. Always sends the event to {{#crossLink "TundraClient/onLogWarning:method"}}{{/crossLink}}
        callbacks and optionally logs to the browsers console.
        @method logWarning
        @param {String} message Log message.
        @param {Boolean} toBrowserConsole If the message should be logged to the browsers console.warn function.
    */
    logWarning : function(message, toBrowserConsole)
    {
        if (toBrowserConsole === undefined || toBrowserConsole == null)
            toBrowserConsole = false;
        if (toBrowserConsole && console.warn != null)
            console.warn(message);

        TundraSDK.framework.events.send("TundraClient.LogWarning", message);
    },

    /**
        Logs a error message. Always sends the event to {{#crossLink "TundraClient/onLogWarning:method"}}{{/crossLink}}
        callbacks and optionally logs to the browsers console.
        @method logError
        @param {String} message Log message.
        @param {Boolean} toBrowserConsole If the message should be logged to the browsers console.error function.
    */
    logError : function(message, toBrowserConsole)
    {
        if (toBrowserConsole === undefined || toBrowserConsole == null)
            toBrowserConsole = false;
        if (toBrowserConsole && console.error != null)
            console.error(message);

        TundraSDK.framework.events.send("TundraClient.LogError", message);
    },

    /**
        Returns if there is a active connection to a WebSocket host.
        @method isConnected
        @return {Boolean}
    */
    isConnected : function()
    {
        if (this.websocket == null)
            return false;
        else if (this.websocket.readyState != 3) // CLOSED
            return true;
        return false;
    },

    /**
        Connects to a WebSocket host with login properties and returns if successful.
        @method connect
        @param {String} host Host with port
        @param {Object} loginProperties This object will get serialized into JSON and sent to the server.
        @example
            client.connect("ws://localhost:2345", { username  : "WebTundra user" });
        @return {Object} Result object
        <pre>{
            success   : Boolean,
            reason    : String      // Only defined if success == false
        }</pre>
    */
    connect : function(host, loginProperties)
    {
        if (typeof host !== "string")
        {
            this.log.error("connect() called with non-string 'host'");
            return { success : false, reason : "Host not a string" };
        }
        if ("WebSocket" in window)
            this.websocket = new WebSocket(host);
        else if ("MozWebSocket" in window)
            this.websocket = new MozWebSocket(host);
        else
            return { success : false, reason : "This browser does not support WebSocket connections" };

        // Configure and connect websocket connection
        this.websocket.binaryType = "arraybuffer";
        this.websocket.onopen = this.onWebSocketConnectionOpened;
        this.websocket.onerror = this.onWebSocketConnectionError;
        this.websocket.onclose = this.onWebSocketConnectionClosed;
        this.websocket.onmessage = this.onWebSocketMessage;

        // Store the login properties
        this.loginProperties = (loginProperties !== undefined && loginProperties !== null ? loginProperties : {});
        return { success : true };
    },

    /**
        Disconnects if there is a active websocket connection.
        @method disconnect
    */
    disconnect : function()
    {
        if (this.websocket != null)
            this.websocket.close();
        this.reset();
    },

    onWebSocketConnectionOpened : function(event)
    {
        var that = TundraSDK.framework.client;
        that.log.infoC("Server connection established");

        // Send login message
        var message = new LoginMessage();
        message.serialize(JSON.stringify(that.loginProperties));
        TundraSDK.framework.network.send(message);

        // Fire event
        that.events.send("TundraClient.Connected");
    },

    onWebSocketConnectionError : function(event)
    {
        var that = TundraSDK.framework.client;
        that.log.errorC("Failed to connect to", event.target.url);
        that.events.send("TundraClient.ConnectionError", event);
    },

    onWebSocketConnectionClosed : function(event)
    {
        var that = TundraSDK.framework.client;
        that.log.infoC("Server connection disconnected");
        that.events.send("TundraClient.Disconnected", event);

        // Reset client and all APIs
        that.reset();
    },

    onWebSocketMessage : function(event)
    {
        var that = TundraSDK.framework.client;

        // Binary frame
        if (typeof event.data !== "string")
        {
            TundraSDK.framework.client.network.receive(event.data);
            event.data = null;
        }
        // String frame, just log it..
        else
            that.log.info("Server sent a unexpected string message '" + event.data + "'");
    }
});


;
define("lib/three/CSS3DRenderer", function(){});



/**
    Raycast result.

    @class RaycastResult
    @constructor
*/
var RaycastResult = Class.$extend(
{
    __init__ : function()
    {
        /**
            Entity that was hit, null if none.

            @property entity
            @type Entity
        */
        this.entity = null;
        /**
            Component which was hit, null if none.

            @property component
            @type IComponent
        */
        this.component = null;
        /**
            World coordinates of hit position.

            @property pos
            @type THREE.Vector3
        */
        this.pos = new THREE.Vector3(0,0,0);
        /**
            World face normal of hit.

            @property normal
            @type THREE.Vector3
        */
        this.normal = new THREE.Vector3(0,0,0);
        /**
            Submesh index in entity, starting from 0.
            -1 if could not be resolved by the renderer.

            @property submeshIndex
            @type Number
        */
        this.submeshIndex = -1;
        /**
            Face index in submesh. -1 if could not be resolved by the renderer.

            @property faceIndex
            @type Number
        */
        this.faceIndex = -1;
        /**
            UV coords in entity. (0,0) if no texture mapping or
            could not be resolved by the renderer.

            @property uv
            @type THREE.Vector2
        */
        this.uv = new THREE.Vector2(0,0);
        /**
            Distance along the ray to the point of intersection.
            -1 if could not be resolved by the renderer.

            @property distance
            @type Number
        */
        this.distance = -1;
        /**
            The ray used for the raycast. This will be a renderer specific object.

            @property ray
            @type Object
        */
        this.ray = null;
        /**
            Information about the execution.

            @property execution
            @type Object
        */
        this.execution =
        {
            /**
                Error that occurred while executing the raycast.
                Empty string if no error.

                @property execution.error
                @type String
            */
            error : "",
            /**
                Screen position that was used for execution.

                @property execution.screenPos
                @type THREE.Vector2
            */
            screenPos : new THREE.Vector2(0,0),
            /**
                Selection layer that was used for execution.

                @property execution.distance
                @type Number
            */
            selectionLayer : -1
        };
    },

    reset : function()
    {
        this.entity = null;
        this.component = null;
        this.pos.x = 0; this.pos.y = 0; this.pos.z = 0;
        this.normal.x = 0; this.normal.y = 0; this.normal.z = 0;
        this.submeshIndex = -1;
        this.faceIndex = -1;
        this.uv.x = 0; this.uv.y = 0;
        this.distance = -1;
        this.ray = null;
        this.execution.error = "";
        this.execution.screenPos.x = 0; this.execution.screenPos.y = 0;
        this.execution.selectionLayer = -1;
    },

    clone : function()
    {
        var clone = new RaycastResult();
        clone.entity = this.entity;             // object ref
        clone.component = this.component;       // object ref
        clone.pos = this.pos.clone();           // threejs clone
        clone.normal = this.normal.clone();     // threejs clone
        clone.submeshIndex = this.submeshIndex; // js copy
        clone.faceIndex = this.faceIndex;       // js copy
        clone.uv = this.uv.clone();             // threejs clone
        clone.distance = this.distance;         // js copy
        clone.ray = this.ray.clone();           // threjs clone
        clone.execution =
        {
            error           : this.execution.error, // js copy
            screenPos       : this.execution.screenPos.clone(), // threjs clone
            selectionLayer  : this.execution.selectionLayer // js copy
        };
        return clone;
    },

    hasError : function()
    {
        return (this.execution.error !== "");
    },

    setError : function(error)
    {
        this.execution.error = error;
    },

    executionMatches : function(x, y, selectionLayer)
    {
        return (this.execution.screenPos.x === x &&
                this.execution.screenPos.y === y &&
                this.execution.selectionLayer === selectionLayer);
    },

    setExecutionInfo : function(x, y, selectionLayer)
    {
        this.execution.screenPos.x = x;
        this.execution.screenPos.y = y;
        this.execution.selectionLayer = selectionLayer;
    },

    setPosition : function(vector)
    {
        this.pos.x = vector.x;
        this.pos.y = vector.y;
        this.pos.z = vector.z;
    }
});


;
define("lib/three/OBJLoader", function(){});



/**
    Represents a OBJ mesh asset. This asset is processed and Three.js rendering engine meshes are generated.

    @class ObjMeshAsset
    @extends IAsset
    @constructor
    @param {String} name Unique name of the asset, usually this is the asset reference.
*/
var ObjMeshAsset = IAsset.$extend(
{
    __init__ : function(name)
    {
        this.$super(name, "ObjMeshAsset");

        this.requiresCloning = true;
        /**
            THREE.Object3D scene node where all the submeshes with the actual geometry are parented to.
            @property mesh
            @type THREE.Object3D
        */
        this.mesh = undefined;
    },

    __classvars__ :
    {
        Loader : new THREE.OBJLoader()
    },

    isLoaded : function()
    {
        return (this.mesh !== undefined && this.mesh.children.length > 0);
    },

    unload : function()
    {
        // If this is the source of cloning don't unload it.
        // This would break the mesh if refs with it are added back during runtime.
        if (this.requiresCloning && this.isCloneSource)
            return;

        var numSubmeshes = this.numSubmeshes();
        if (this.logging && this.mesh != null && numSubmeshes > 0)
            this.log.debug("unload", this.name);

        if (this.mesh != null && this.mesh.parent != null)
            this.mesh.parent.remove(this.mesh);

        for (var i = 0; i < numSubmeshes; i++)
        {
            if (this.logging) console.log("  submesh " + i);
            var submesh = this.getSubmesh(i);
            if (submesh.geometry != null)
            {
                if (this.logging) console.log("    geometry");
                if (this.isGeometryInUse(submesh.geometry) === false)
                    submesh.geometry.dispose();
                else if (this.logging)
                    this.log.debug("      Still in use, not unloading");
                submesh.geometry = null;
            }
            submesh.material = null;
            submesh = null;
        }
        if (this.mesh != null)
            this.mesh.children = [];
        this.mesh = undefined;
    },

    isGeometryInUse : function(geom)
    {
        if (geom.uuid === undefined)
            return false;

        /// @todo This is probaly very slow. Figure out a faster way to do this.
        /// We could do internal bookkeeping on how many with this UUID have been created.
        var used = false;
        TundraSDK.framework.renderer.scene.traverse(function(node) {
            // We are only interested in things that are using a geometry.
            if (used === true || node == null || node.geometry === undefined ||
                (!(node.geometry instanceof THREE.BufferGeometry) && !(node.geometry instanceof THREE.Geometry)))
                return;

            if (node.geometry.uuid === geom.uuid)
                used = true;
        });
        return used;
    },

    _cloneImpl : function(newAssetName)
    {
        // Clone the three.js Object3D so that they get their own transform etc.
        // but don't clone the geometry, just reference to the existing geometry.
        // The unloading mechanism will check when the geometry uuid is no longer used and
        // is safe to unload.

        var meshAsset = new ObjMeshAsset(newAssetName);
        meshAsset.mesh = TundraSDK.framework.renderer.createSceneNode();
        for (var i=0, len=this.numSubmeshes(); i<len; ++i)
        {
            var existingSubmesh = this.getSubmesh(i);
            var clonedSubmesh = null;

            if (existingSubmesh instanceof THREE.SkinnedMesh)
                clonedSubmesh = new THREE.SkinnedMesh(existingSubmesh.geometry, TundraSDK.framework.renderer.materialWhite, false);
            else
                clonedSubmesh = new THREE.Mesh(existingSubmesh.geometry, TundraSDK.framework.renderer.materialWhite);

            clonedSubmesh.name = meshAsset.name + "_submesh_" + i;
            clonedSubmesh.tundraSubmeshIndex = existingSubmesh.tundraSubmeshIndex;

            meshAsset.mesh.add(clonedSubmesh);
        }
        return meshAsset;
    },

    getSubmesh : function(index)
    {
        return (this.isLoaded() ? this.mesh.children[index] : null);
    },

    numSubmeshes : function()
    {
        return (this.isLoaded() ? this.mesh.children.length : 0);
    },

    deserializeFromData : function(data, dataType)
    {
        try
        {
            this.mesh = ObjMeshAsset.Loader.parse(data);
        }
        catch(e)
        {
            this.log.error("Failed to load OBJ mesh", this.name, e.toString());
            this.mesh = undefined;
        }

        if (this.mesh === undefined || this.mesh === null)
            this.mesh = TundraSDK.framework.renderer.createSceneNode();

        // Placeable will update the matrix when changes occur.
        this.mesh.name = this.name;
        this.mesh.matrixAutoUpdate = false;

        for (var i = 0; i < this.mesh.children.length; i++)
        {
            this.mesh.children[i].tundraSubmeshIndex = i;
            this.mesh.children[i].name = this.name + "_submesh_" + i;
        }

        return this.isLoaded();
    }
});




/**
    Represents a three.js json mesh asset. The input data is processed and Three.js rendering engine meshes are generated.

    @class ThreeJsonAsset
    @extends IAsset
    @constructor
    @param {String} name Unique name of the asset, usually this is the asset reference.
*/
var ThreeJsonAsset = IAsset.$extend(
{
    __init__ : function(name)
    {
        this.$super(name, "ThreeJsonAsset");

        this.requiresCloning = true;
        /**
            THREE.Object3D scene node where all the submeshes with the actual geometry are parented to.
            @property mesh
            @type THREE.Object3D
        */
        this.mesh = undefined;
    },

    __classvars__ :
    {
        Loader : new THREE.JSONLoader()
    },

    isLoaded : function()
    {
        return (this.mesh !== undefined && this.mesh.children.length > 0);
    },

    unload : function()
    {
        // If this is the source of cloning don't unload it.
        // This would break the mesh if refs with it are added back during runtime.
        if (this.requiresCloning && this.isCloneSource)
            return;

        var numSubmeshes = this.numSubmeshes();
        if (this.logging && this.mesh != null && numSubmeshes > 0)
            this.log.debug("unload", this.name);

        if (this.mesh != null && this.mesh.parent != null)
            this.mesh.parent.remove(this.mesh);

        for (var i = 0; i < numSubmeshes; i++)
        {
            if (this.logging) console.log("  submesh " + i);
            var submesh = this.getSubmesh(i);
            if (submesh.geometry != null)
            {
                if (this.logging) console.log("    geometry");
                if (this.isGeometryInUse(submesh.geometry) === false)
                    submesh.geometry.dispose();
                else if (this.logging)
                    this.log.debug("      Still in use, not unloading");
                submesh.geometry = null;
            }
            submesh.material = null;
            submesh = null;
        }
        if (this.mesh != null)
            this.mesh.children = [];
        this.mesh = undefined;
    },

    isGeometryInUse : function(geom)
    {
        if (geom.uuid === undefined)
            return false;

        /// @todo This is probaly very slow. Figure out a faster way to do this.
        /// We could do internal bookkeeping on how many with this UUID have been created.
        var used = false;
        TundraSDK.framework.renderer.scene.traverse(function(node) {
            // We are only interested in things that are using a geometry.
            if (used === true || node == null || node.geometry === undefined ||
                (!(node.geometry instanceof THREE.BufferGeometry) && !(node.geometry instanceof THREE.Geometry)))
                return;

            if (node.geometry.uuid === geom.uuid)
                used = true;
        });
        return used;
    },

    _cloneImpl : function(newAssetName)
    {
        // Clone the three.js Object3D so that they get their own transform etc.
        // but don't clone the geometry, just reference to the existing geometry.
        // The unloading mechanism will check when the geometry uuid is no longer used and
        // is safe to unload.

        var meshAsset = new ThreeJsonAsset(newAssetName);
        meshAsset.mesh = TundraSDK.framework.renderer.createSceneNode();
        for (var i=0, len=this.numSubmeshes(); i<len; ++i)
        {
            var existingSubmesh = this.getSubmesh(i);
            var clonedSubmesh = null;

            if (existingSubmesh instanceof THREE.SkinnedMesh)
                clonedSubmesh = new THREE.SkinnedMesh(existingSubmesh.geometry, TundraSDK.framework.renderer.materialWhite, false);
            else
                clonedSubmesh = new THREE.Mesh(existingSubmesh.geometry, TundraSDK.framework.renderer.materialWhite);

            clonedSubmesh.name = meshAsset.name + "_submesh_" + i;
            clonedSubmesh.tundraSubmeshIndex = existingSubmesh.tundraSubmeshIndex;

            meshAsset.mesh.add(clonedSubmesh);
        }
        return meshAsset;
    },

    getSubmesh : function(index)
    {
        return (this.isLoaded() ? this.mesh.children[index] : null);
    },

    numSubmeshes : function()
    {
        return (this.isLoaded() ? this.mesh.children.length : 0);
    },

    deserializeFromData : function(data, dataType)
    {
        try
        {
            var threejsData = ThreeJsonAsset.Loader.parse(data);

            if (threejsData !== undefined && threejsData.geometry !== undefined)
            {
                /// @todo Check if a .json mesh can even return a single material and if this code is valid in that case.
                var material = undefined;
                if (threejsData.materials !== undefined)
                    material = (threejsData.materials.length === 1 ? threejsData.materials[0] : new THREE.MeshFaceMaterial(threejsData.materials));

                this.mesh = TundraSDK.framework.renderer.createSceneNode();
                this.mesh.add(new THREE.Mesh(threejsData.geometry, material));
            }
            else
                this.log.error("Parsing failed, three.js didnt return a valid geometry for", this.name);
        }
        catch(e)
        {
            this.log.error("Failed to load JSON mesh", this.name, e.toString());
            this.mesh = undefined;
        }

        if (this.mesh === undefined || this.mesh === null)
            this.mesh = TundraSDK.framework.renderer.createSceneNode();

        // Placeable will update the matrix when changes occur.
        this.mesh.name = this.name;
        this.mesh.matrixAutoUpdate = false;

        for (var i = 0; i < this.mesh.children.length; i++)
        {
            this.mesh.children[i].tundraSubmeshIndex = i;
            this.mesh.children[i].name = this.name + "_submesh_" + i;
        }

        return this.isLoaded();
    }
});




/**
    This base implementation does not do anything. It declared the static attribute structure of EC_Fog
    in the Tundra protocol.

    Renderer implementations need to provide this components functionality, preferably by extending this object.

    @class EC_Fog
    @extends IComponent
    @constructor
*/
var EC_Fog = IComponent.$extend(
{
    __init__ : function(id, typeId, typeName, name)
    {
        this.$super(id, typeId, typeName, name);

        /**
            @property mode (attribute)
            @type Attribute
        */
        this.declareAttribute(0, "mode", EC_Fog.Type.Linear, Attribute.Int);
        /**
            @property color (attribute)
            @type Attribute
        */
        this.declareAttribute(1, "color", new Color(0.707792,0.770537,0.831373,1.0), Attribute.Color);
        /**
            @property position (attribute)
            @type Attribute
        */
        this.declareAttribute(2, "startDistance", 100.0, Attribute.Real);
        /**
            @property endDistance (attribute)
            @type Attribute
        */
        this.declareAttribute(3, "endDistance", 2000.0, Attribute.Real);
        /**
            @property expDensity (attribute)
            @type Attribute
        */
        this.declareAttribute(4, "expDensity", 0.001, Attribute.Real);
    },

    __classvars__ :
    {
        Type :
        {
            NoFog               : 0,
            Exponentially       : 1,
            ExponentiallySquare : 2,
            Linear              : 3
        }
    }
});




/**
    Sky component implementation for the three.js render system.

    @class EC_Fog_ThreeJs
    @extends EC_Fog
    @constructor
*/
var EC_Fog_ThreeJs = EC_Fog.$extend(
{
    __init__ : function(id, typeId, typeName, name)
    {
        this.$super(id, typeId, typeName, name);

        this._activated = false;
    },

    __classvars__ :
    {
        implementationName : "three.js"
    },

    reset : function(forced)
    {
        if (!this._activated && forced !== true)
            return;
        this._activated = false;

        TundraSDK.framework.renderer.scene.fog = null;
        TundraSDK.framework.renderer.renderer.setClearColor(0x000000);

        this._forceMaterialUpdates();
    },

    update : function()
    {
        if (!this._activated && TundraSDK.framework.renderer.scene.fog != null)
        {
            this.log.warn("Fog is already set, only the first initialized fog will be enabled. Inactivating", this.toString());
            return;
        }

        this._forceMaterialUpdates();
        this._createFog(this.mode);
    },

    _forceMaterialUpdates : function()
    {
        // All materials need to be updated (shaders reconfigured) now that fog is 
        // either removed or we are about to change the fog type.
        var meshes = TundraSDK.framework.renderer.getAllMeshes();
        for (var i = 0; i < meshes.length; i++)
        {
            if (meshes[i].material !== undefined && meshes[i].material !== null)
                meshes[i].material.needsUpdate = true;
        }
    },

    _createFog : function(fogMode)
    {
        this.reset(true);

        if (fogMode === EC_Fog.Type.NoFog)
        {
            this._activated = true;
            return;
        }
        
        if (fogMode === EC_Fog.Type.Linear)
            TundraSDK.framework.renderer.scene.fog = new THREE.Fog(this.color.toThreeColor(), this.startDistance, this.endDistance);
        else
            TundraSDK.framework.renderer.scene.fog = new THREE.FogExp2(this.color.toThreeColor(), this.expDensity);

        this._activated = (TundraSDK.framework.renderer.scene.fog != null);
        if (this._activated)
            TundraSDK.framework.renderer.renderer.setClearColor(TundraSDK.framework.renderer.scene.fog.color);
    },

    attributeChanged : function(index, name, value)
    {
        if (!this._activated)
            return;

        // mode
        if (index === 0)
            this._createFog(value);
        // color
        else if (index === 1)
        {
            TundraSDK.framework.renderer.scene.fog.color = value.toThreeColor();
            TundraSDK.framework.renderer.renderer.setClearColor(TundraSDK.framework.renderer.scene.fog.color);
        }
        // startDistance
        else if (index === 2)
            TundraSDK.framework.renderer.scene.fog.near = value;
        // endDistance
        else if (index === 3)
            TundraSDK.framework.renderer.scene.fog.far = value;
        // expDensity
        else if (index === 4)
            TundraSDK.framework.renderer.scene.fog.density = value;
    }
});




/**
    This base implementation does not do anything. It declared the static attribute structure of EC_Camera
    in the Tundra protocol.

    Renderer implementations need to provide this components functionality, preferably by extending this object.

    @class EC_AnimationController
    @extends IComponent
    @constructor
*/
var EC_AnimationController = IComponent.$extend(
{
    __init__ : function(id, typeId, typeName, name)
    {
        this.$super(id, typeId, typeName, name);

        /**
            @property animationState (attribute)
            @type Attribute
        */
        this.declareAttribute(0, "animationState", "", Attribute.String);
        /**
            @property drawDebug (attribute)
            @type Attribute
        */
        this.declareAttribute(1, "drawDebug", false, Attribute.Bool);
    }
});




/**
    AnimationController component implementation for the three.js render system.

    @class EC_AnimationController_ThreeJs
    @extends EC_AnimationController
    @constructor
*/
var EC_AnimationController_ThreeJs = EC_AnimationController.$extend(
{
    __init__ : function(id, typeId, typeName, name)
    {
        this.$super(id, typeId, typeName, name);
    },
    
    __classvars__ :
    {
        implementationName : "three.js"
    },

    getAvailableAnimations : function()
    {
        var animationNames = [];
        if (this.parentEntity == null)
            return animationNames;

        if (this.parentEntity.mesh != null && this.parentEntity.mesh.skeletonAsset != null)
            animationNames = this.parentEntity.mesh.skeletonAsset.getAvailableAnimations();
        return animationNames;
    },

    playAnimation : function(name, loop, speed)
    {
        if (this.parentEntity == null)
            return;

        if (this.parentEntity.mesh != null && this.parentEntity.mesh.skeletonAsset != null)
            this.parentEntity.mesh.skeletonAsset.playAnimation(name, loop, speed);
        else
            this.log.warn("playAnimation could not find valid skeleton from EC_Mesh.");
    }
});




/**
    This base implementation does not do anything. It declared the static attribute structure of EC_Camera
    in the Tundra protocol.

    Renderer implementations need to provide this components functionality, preferably by extending this object.

    @class EC_Camera
    @extends IComponent
    @constructor
*/
var EC_Camera = IComponent.$extend(
{
    __init__ : function(id, typeId, typeName, name)
    {
        this.$super(id, typeId, typeName, name);

        /**
            @property upVector (attribute)
            @type Attribute
        */
        this.declareAttribute(0, "upVector", new THREE.Vector3(0,1,0), Attribute.Float3); /// @todo Make our own vec class to remove the dependency
        /**
            @property nearPlane (attribute)
            @type Attribute
        */
        this.declareAttribute(1, "nearPlane", 0.1, Attribute.Real);
        /**
            @property farPlane (attribute)
            @type Attribute
        */
        this.declareAttribute(2, "farPlane", 2000.0, Attribute.Real); /// @todo Should we increase this default?
        /**
            @property verticalFov (attribute)
            @type Attribute
        */
        this.declareAttribute(3, "verticalFov", 45.0, Attribute.Real); // Ignored for now, taken from browser window size.
        /**
            @property aspectRatio (attribute)
            @type Attribute
        */
        this.declareAttribute(4, "aspectRatio", "", Attribute.String);
    }
});




/**
    Camera component implementation for the three.js render system.

    @class EC_Camera_ThreeJs
    @extends EC_Camera
    @constructor
*/
var EC_Camera_ThreeJs = EC_Camera.$extend(
{
    __init__ : function(id, typeId, typeName, name)
    {
        this.$super(id, typeId, typeName, name);

        // Don't document this, its an implementation detail
        this.camera = undefined;

        /**
            If this camera is currently active and used for rendering.
            Use onActiveStateChanged to register callbacks when active state changes.
            @property active
            @type Boolean
        */
        this._active = false;
        Object.defineProperties(this, {
            active : {
                get : function () {
                    return this.isActive();
                },
                set : function (value) {
                    this.setActive(value);
                }
            }
        });

        TundraSDK.framework.ui.onWindowResize(this, this.onWindowResize);
    },
    
    __classvars__ :
    {
        implementationName : "three.js"
    },

    update : function()
    {
        // Create camera
        if (this.camera === undefined)
            this.camera = new THREE.PerspectiveCamera(this.verticalFov, this.aspectRatio(), this.nearPlane, this.farPlane);
        else
        {
            this.camera.fov = this.verticalFov;
            this.camera.aspect = this.aspectRatio();
            this.camera.near = this.nearPlane;
            this.camera.far = this.farPlane;
            this.camera.updateProjectionMatrix();
        }

        // Parent
        if (this.camera.parent == null && this.parentEntity != null)
        {
            if (this.parentEntity.placeable != null)
                this.parentEntity.placeable.addChild(this.camera);
            else
                this._componentAddedSub = this.parentEntity.onComponentCreated(this, this._onParentEntityComponentCreated);
        }
    },

    /** random test for intersect code. 
        @todo make this work?
    intersectsObject : function(object)
    {
        if (object.geometry === undefined)
            return;

        var pos = this.parentEntity.placeable.worldPosition();
        var height = Math.tan(this.verticalFov) * this.nearPlane;
        var width = Math.tan(this.aspectRatio() * this.verticalFov) * this.nearPlane;
        var zero = new THREE.Vector3(-width, height, this.nearPlane);
        zero.applyQuaternion(this.parentEntity.placeable.worldOrientation());
        var sphere = new THREE.Sphere();
        sphere.setFromPoints([zero.add(pos)]);

        var geometry = object.geometry;
        if ( geometry.boundingSphere === null ) geometry.computeBoundingSphere();

        var other = new THREE.Sphere().copy( geometry.boundingSphere );
        object.updateMatrix();
        other.applyMatrix4( object.matrixWorld );
        var res = sphere.intersectsSphere( other );

        if (res)
        {
            if (this.debugColor === undefined)
            {
                this.debugColor = new THREE.Color();
                this.debugColor.setRGB(1,0,0);
            }
            if (this.debugMaterial === undefined)
                this.debugMaterial = new THREE.MeshBasicMaterial({ color: this.debugColor, wireframe: true });

            var box = other.getBoundingBox();
            var debugMesh = new THREE.Mesh(new THREE.SphereGeometry(other.radius,6,6), this.debugMaterial);
            //box.size(debugMesh.scale);
            box.center(debugMesh.position);
            debugMesh.quaternion = object.quaternion.clone();
            debugMesh.matrixAutoUpdate = false;
            debugMesh.updateMatrix();

            TundraSDK.framework.renderer.scene.add(debugMesh);
        }
        return res;
    },
    */

    reset : function()
    {
        if (this.active)
            TundraSDK.framework.renderer.setActiveCamera(null);

        if (this._componentAddedSub !== undefined)
        {
            TundraSDK.framework.events.unsubscribe(this._componentAddedSub);
            this._componentAddedSub = undefined;
        }
    },

    _onParentEntityComponentCreated : function(entity, component)
    {
        if (component != null && component.typeName === "EC_Placeable")
        {
            if (this._componentAddedSub !== undefined)
            {
                TundraSDK.framework.events.unsubscribe(this._componentAddedSub);
                this._componentAddedSub = undefined;
            }

            if (this.camera != null && this.camera.parent == null)
                component.addChild(this.camera);
        }
    },

    /**
        Registers a callback for when a camera active state changes
        @example
            ent.camera.onActiveStateChanged(null, function(parentEntity, cameraComponent, active) {
                console.log("Camera active state changes", parentEntity.name, active);
            });

        @method onActiveStateChanged
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription|null} Subscription data or null if parent entity is not set.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onActiveStateChanged : function(context, callback)
    {
        if (!this.hasParentEntity())
        {
            TundraSDK.framework.client.logError("[EC_Camera]: Cannot subscribe onActiveStateChanged, parent entity not set!", true);
            return null;
        }
        return TundraSDK.framework.events.subscribe("EC_Camera.ActiveStateChanged." + this.parentEntity.id + "." + this.id, context, callback);
    },

    _postActiveStateChanged : function(active)
    {
        TundraSDK.framework.events.send("EC_Camera.ActiveStateChanged." + this.parentEntity.id + "." + this.id,
            this.parentEntity, this, active);
    },

    /**
        Activates this camera to be used for rendering.
        @method setActive
    */
    setActive : function(active)
    {
        if (active === undefined)
            active = true;
        if (typeof active !== "boolean")
            return;
        if (this._active === active)
            return;

        // Semi ugly hack. Check if the current active camera is animating before enabling shit camera.
        if (active && TundraSDK.framework.renderer.activeCamera() && TundraSDK.framework.renderer.activeCamera()._animating === true)
        {
            this.log.warn("Current camera is animating, cannot activate " + this.parentEntity.name);
            return;
        }

        this._active = active;
        if (this._active)
            TundraSDK.framework.renderer.setActiveCamera(this);
        this._postActiveStateChanged(this._active);
    },

    /**
        Returns if this camera is currently active. You can also use the 'active' property directly.
        @method isActive
    */
    isActive : function()
    {
        return this._active;
    },

    attributeChanged : function(index, name, value)
    {
        this.update();
    },

    aspectRatio : function()
    {
        var windowSize = TundraSDK.framework.renderer.windowSize;
        if (windowSize !== undefined && windowSize.height !== 0)
            return windowSize.width / windowSize.height;
        return 0;
    },

    onWindowResize : function(width, height)
    {
        if (this.camera === undefined)
            return;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }
});




/**
    This base implementation does not do anything. It declared the static attribute structure of EC_Mesh
    in the Tundra protocol.

    Renderer implementations need to provide this components functionality, preferably by extending this object.

    @class EC_Mesh
    @extends IComponent
    @constructor
*/
var EC_Mesh = IComponent.$extend(
{
    __init__ : function(id, typeId, typeName, name)
    {
        this.$super(id, typeId, typeName, name);

        /**
            @property nodeTransformation (attribute)
            @type Attribute
        */
        this.declareAttribute(0, "nodeTransformation", new Transform(), Attribute.Transform);
        /**
            @property meshRef (attribute)
            @type Attribute
        */
        this.declareAttribute(1, "meshRef", "", Attribute.AssetReference);
        /**
            @property skeletonRef (attribute)
            @type Attribute
        */
        this.declareAttribute(2, "skeletonRef", "", Attribute.AssetReference);
        /**
            @property materialRefs (attribute)
            @type Attribute
        */
        this.declareAttribute(3, "materialRefs", "", Attribute.AssetReferenceList);
        /**
            @property drawDistance (attribute)
            @type Attribute
        */
        this.declareAttribute(4, "drawDistance", 0, Attribute.Real);
        /**
            @property castShadows (attribute)
            @type Attribute
        */
        this.declareAttribute(5, "castShadows", false, Attribute.Bool);
    }
});




/**
    Mesh component implementation for the three.js render system.

    @class EC_Mesh_ThreeJs
    @extends EC_Mesh
    @constructor
*/
var EC_Mesh_ThreeJs = EC_Mesh.$extend(
{
    __init__ : function(id, typeId, typeName, name)
    {
        this.$super(id, typeId, typeName, name);

        this.meshAsset = null;
        this.skeletonAsset = null;
        this.materialAssets = [];

        this.meshRequested = false;
        this.skeletonRequested = false;
        this.materialsRequested = false;

        this._loadsEmitted = {
            mesh : false
        };
    },

    __classvars__ :
    {
        implementationName : "three.js"
    },

    reset : function()
    {
        TundraSDK.framework.events.remove("EC_Mesh." + this.parentEntity.id + "." + this.id + ".MeshLoaded");
        TundraSDK.framework.events.remove("EC_Mesh." + this.parentEntity.id + "." + this.id + ".SkeletonLoaded");
        TundraSDK.framework.events.remove("EC_Mesh." + this.parentEntity.id + "." + this.id + ".MaterialLoaded");

        this.resetMesh();
        this.resetMaterials();

        if (this._componentAddedSub !== undefined)
        {
            TundraSDK.framework.events.unsubscribe(this._componentAddedSub);
            this._componentAddedSub = undefined;
        }
    },

    attributeChanged : function(index, name, value)
    {
        // nodeTransformation
        if (index === 0)
        {
            this.update();
        }
        // meshRef
        else if (index === 1)
        {
            this.resetMesh();
            this.update();
        }
        // skeletonRef
        else if (index === 2)
        {
            this.update();
        }
        // materialRefs
        else if (index === 3)
        {
            this.resetMaterials();
            this.update();
        }
        // drawDistance
        else if (index === 4)
        {
        }
        // castShadows
        else if (index === 5)
        {
            if (this.meshAsset == null)
                return;

            for (var i=0, num=this.meshAsset.numSubmeshes(); i<num; ++i)
            {
                var submesh = this.meshAsset.getSubmesh(i);
                if (submesh === undefined || submesh === null)
                    continue;
                submesh.castShadow = value;
            }
        }
    },

    update : function()
    {
        // Request mesh
        if (this.meshAsset == null && !this.meshRequested)
        {
            var meshRef = this.attributes.meshRef.get();
            if (meshRef != null && meshRef != "")
            {
                // Support force requesting three.js meshes with correct type
                var forcedType = undefined;
                if (CoreStringUtils.endsWith(meshRef, ".json", true) || CoreStringUtils.endsWith(meshRef, ".js", true))
                    forcedType = "ThreeJsonMesh";

                this.meshRequested = true;
                var transfer = TundraSDK.framework.asset.requestAsset(meshRef, forcedType);
                if (transfer != null)
                    transfer.onCompleted(this, this._meshAssetLoaded);
            }
        }

        // Request materials
        if (this.materialAssets.length === 0 && !this.materialsRequested)
        {
            var materialRefs = this.attributes.materialRefs.get();
            for (var i=0; i<materialRefs.length; i++)
            {
                this.materialsRequested = true;

                var materialRef = materialRefs[i];
                if (typeof materialRef === "string" && materialRef !== "")
                {
                    // Don't request materials that are already set
                    var submesh = (this.meshAsset != null ? this.meshAsset.getSubmesh(i) : undefined);
                    if (submesh != undefined && submesh.material != null && submesh.material.name === materialRef)
                        continue;

                    var transfer = TundraSDK.framework.asset.requestAsset(materialRef);
                    if (transfer != null)
                    {
                        transfer.onCompleted(this, this._materialAssetLoaded, i);
                        transfer.onFailed(this, this._materialAssetFailed, i);
                        this.materialAssets[i] = transfer;
                    }
                }
            }
        }

        // Mesh still loading?
        if (this.meshAsset == null || !this.meshAsset.isLoaded())
            return;

        // Materials still loading?
        if (this.allMaterialsLoaded())
        {
            // Request skeleton only after mesh and materials are loaded.
            // OgreSkeletonAsset will be modifying both when applied to them.
            if (this.skeletonAsset == null && !this.skeletonRequested)
            {
                var skeletonRef = this.attributes.skeletonRef.get();
                if (skeletonRef != null && skeletonRef != "")
                {
                    this.skeletonRequested = true;
                    var transfer = TundraSDK.framework.asset.requestAsset(skeletonRef);
                    if (transfer != null)
                    {
                        transfer.onCompleted(this, this._skeletonAssetLoaded);
                        return;
                    }
                }
            }

            // Apply materials
            var materialRefs = this.attributes.materialRefs.get();
            var numSubmeshes = this.meshAsset.numSubmeshes();
            for (var i=0; i<numSubmeshes; ++i)
            {
                // Target submesh
                var submesh = this.meshAsset.getSubmesh(i);
                if (submesh === undefined || submesh === null)
                    continue;

                // Check if this submesh already has the material ref
                var materialRef = materialRefs[i];
                if (submesh.material != null && submesh.material.name === materialRef)
                    continue;

                // Set loaded material, error material or empty material.
                var materialAsset = this.materialAssets[i];
                if (materialAsset instanceof IAsset || materialAsset instanceof THREE.Material)
                    submesh.material = (materialAsset instanceof IAsset ? materialAsset.material : materialAsset);
                else
                    submesh.material = TundraSDK.framework.renderer.materialWhite;

                submesh.receiveShadow = (submesh.material.hasTundraShadowShader !== undefined && submesh.material.hasTundraShadowShader === true);
                submesh.castShadow = this.castShadows;
            }
            if (this.materialAssets.length > numSubmeshes)
            {
                this.log.warnC("Too many materials for target mesh " + this.meshAsset.name + ". Materials: " +
                    this.materialAssets.length + " Submeshes: " + numSubmeshes + " In entity: " + this.parentEntity.id + " " +
                        this.parentEntity.name);
            }
        }

        // Parent this meshes scene node to EC_Placeable scene node
        if (this.meshAsset.mesh.parent == null)
        {
            if (this.parentEntity.placeable != null)
                this._onParentEntityComponentCreated(this.parentEntity, this.parentEntity.placeable);
            else
                this._componentAddedSub = this.parentEntity.onComponentCreated(this, this._onParentEntityComponentCreated);
        }

        TundraSDK.framework.renderer.updateSceneNode(this.meshAsset.mesh, this.nodeTransformation);

        // Attach skeleton to mesh
        if (this.skeletonAsset != null)
            this.skeletonAsset.attach(this.meshAsset);
    },

    _onParentEntityComponentCreated : function(entity, component)
    {
        if (component != null && component.typeName === "EC_Placeable")
        {
            if (this._componentAddedSub !== undefined)
            {
                TundraSDK.framework.events.unsubscribe(this._componentAddedSub);
                this._componentAddedSub = undefined;
            }

            if (component.sceneNode != null)
                this._onParentPlaceableNodeCreated(component, component.sceneNode);
            else
                this._placeableNodeCreatedSub = component.onSceneNodeCreated(this, this._onParentPlaceableNodeCreated);
        }
    },

    _onParentPlaceableNodeCreated : function(placeable, sceneNode)
    {
        if (this._placeableNodeCreatedSub !== undefined)
        {
            TundraSDK.framework.events.unsubscribe(this._placeableNodeCreatedSub);
            this._placeableNodeCreatedSub = undefined;
        }

        if (this.meshAsset != null && this.meshAsset.mesh != null)
        {
            var parentWasNull = (this.meshAsset.mesh.parent == null);
            placeable.addChild(this.meshAsset.mesh)

            if (parentWasNull && this._loadsEmitted.mesh === false)
            {
                this._loadsEmitted.mesh = true;
                TundraSDK.framework.events.send("EC_Mesh." + this.parentEntity.id + "." + this.id + ".MeshLoaded", this.parentEntity, this, this.meshAsset);
            }
        }
        else
            this.log.error("Mesh not ready but placeable is?!")
    },

    resetMesh : function()
    {
        if (this.meshAsset != null)
        {
            var placeable = this.parentEntity.getComponent("EC_Placeable");
            if (placeable != null && placeable.sceneNode != null)
                placeable.sceneNode.remove(this.meshAsset.mesh);

            // Meshes are instantiated per object/usage so its safe to unload this instance here.
            this.meshAsset.unload();
        }
        this.meshAsset = null;
        this.meshRequested = false;
    },

    resetMaterials : function()
    {
        // We cannot unload the material asset as they are not loaded per object/usage.
        // If we unload here, all the other meshes that use this material will break.
        /*for (i=0; i<this.materialAssets.length; i++)
        {
            var material = this.materialAssets[i];
            if (material != null && typeof material !== "string")
                material.unload();
            material = null;
        }*/
        this.materialAssets = [];
        this.materialsRequested = false;
    },

    /**
        Set mesh reference.
        @method setMesh
        @param {String} meshRef Mesh reference.
        @param {AttributeChange} [change=AttributeChange.Default] Attribute change signaling mode.
        @return {Boolean} If set was successful.
    */
    setMesh : function(meshRef, change)
    {
        if (typeof meshRef !== "string")
        {
            this.log.errorC("setMesh must be called with a string ref, called with:", meshRef);
            return false;
        }
        return this.attributes.meshRef.set(meshRef, change);
    },

    /**
        Set material reference.
        @method setMaterial
        @param {String} material Material reference.
        @param {Number} index Material index.
        @param {AttributeChange} [change=AttributeChange.Default] Attribute change signaling mode.
        @return {Boolean} If set was successful.
    */
    setMaterial : function(material, index, change)
    {
        if (typeof material === "string" && typeof index === "number")
        {
            var materials = this.attributes.materialRefs.get(); // No need to getClone() here.
            for (var i = materials.length; i < index; ++i)
                materials.push("");
            materials[index] = material;
            return this.attributes.materialRefs.set(materials, change);
        }

        this.log.errorC("setMaterial must be called single string ref and material index as the second parameter, called with:", material, index);
        return false;
    },

    /**
        Set material references.
        @method setMaterials
        @param {Array} materials Material reference list.
        @param {AttributeChange} [change=AttributeChange.Default] Attribute change signaling mode.
        @return {Boolean} If set was successful.
    */
    setMaterials : function(materials, change)
    {
        if (Array.isArray(materials))
            return this.attributes.materialRefs.set(materials, change);

        this.log.errorC("setMaterials must be called with Array parameter, called with:", materials);
        return false
    },

    /**
        Registers a callback for when a new mesh has been loaded.
        @example
            ent.mesh.onMeshLoaded(null, function(parentEntity, meshComponent, asset) {
                console.log("Mesh loaded", asset.name);
            });

        @method onMeshLoaded
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription|null} Subscription data or null if parent entity is not set.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onMeshLoaded : function(context, callback)
    {
        if (!this.hasParentEntity())
        {
            this.log.error("Cannot subscribe onMeshLoaded, parent entity not set!");
            return null;
        }
        return TundraSDK.framework.events.subscribe("EC_Mesh." + this.parentEntity.id + "." + this.id + ".MeshLoaded", context, callback);
    },

    /**
        Registers a callback for when a new skeleton has been loaded.
        @example
            ent.mesh.onSkeletonLoaded(null, function(parentEntity, meshComponent, asset) {
                console.log("Skeleton loaded", asset.name);
            });

        @method onSkeletonLoaded
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription|null} Subscription data or null if parent entity is not set.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onSkeletonLoaded : function(context, callback)
    {
        if (!this.hasParentEntity())
        {
            this.log.error("Cannot subscribe onSkeletonLoaded, parent entity not set!");
            return null;
        }
        return TundraSDK.framework.events.subscribe("EC_Mesh." + this.parentEntity.id + "." + this.id + ".SkeletonLoaded", context, callback);
    },

    /**
        Registers a callback for when a new material has been loaded.
        Material dependency textures are guaranteed to be loaded when fired.
        @example
            ent.mesh.onMaterialLoaded(null, function(parentEntity, meshComponent, index, asset) {
                console.log("Material loaded", asset.name, "to index", index);
            });

        @method onMaterialLoaded
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription|null} Subscription data or null if parent entity is not set.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onMaterialLoaded : function(context, callback)
    {
        if (!this.hasParentEntity())
        {
            this.log.error("Cannot subscribe onMaterialLoaded, parent entity not set!");
            return null;
        }
        return TundraSDK.framework.events.subscribe("EC_Mesh." + this.parentEntity.id + "." + this.id + ".MaterialLoaded", context, callback);
    },

    _meshAssetLoaded : function(asset)
    {
        if (!this.hasParentEntity())
            return;

        this.meshAsset = asset;
        if (this.meshAsset.mesh != null)
        {
            this.meshAsset.mesh.tundraEntityId = this.parentEntity.id;
            for (var i = 0, numSubmeshes = this.meshAsset.numSubmeshes(); i < numSubmeshes; i++)
            {
                var submesh = this.meshAsset.getSubmesh(i);
                if (submesh != null)
                    submesh.tundraEntityId = this.parentEntity.id;
            }
        }
        this.update();

        if (this.meshAsset.mesh.parent != null && this._loadsEmitted.mesh === false)
        {
            this._loadsEmitted.mesh = true;
            TundraSDK.framework.events.send("EC_Mesh." + this.parentEntity.id + "." + this.id + ".MeshLoaded", this.parentEntity, this, this.meshAsset);
        }
    },

    _skeletonAssetLoaded : function (asset, metadata)
    {
        if (!this.hasParentEntity())
            return;

        this.skeletonAsset = asset;
        this.update();

        TundraSDK.framework.events.send("EC_Mesh." + this.parentEntity.id + "." + this.id + ".SkeletonLoaded", this.parentEntity, this, this.skeletonAsset);
    },

    _materialAssetLoaded : function(asset, index)
    {
        if (!this.hasParentEntity())
            return;

        // Store material name for later load steps.
        if (asset !== undefined && index !== undefined)
            this.materialAssets[index] = asset;

        if (!this.allMaterialsLoaded())
            return;
        this.update();

        for (var i = 0; i < this.materialAssets.length; ++i)
        {
            var material = this.materialAssets[i];
            if (material instanceof IAsset && material.isLoaded())
                TundraSDK.framework.events.send("EC_Mesh." + this.parentEntity.id + "." + this.id + ".MaterialLoaded", this.parentEntity, this, i, material);
        }
    },

    _materialAssetFailed : function(transfer, reason, index)
    {
        this._materialAssetLoaded(TundraSDK.framework.renderer.materialLoadError, index);
    },

    /**
        Returns if all materials have been loaded.
        @method allMaterialsLoaded
        @return {Boolean}
    */
    allMaterialsLoaded : function()
    {
        for (var i = 0; i < this.materialAssets.length; ++i)
        {
            var material = this.materialAssets[i];
            if (material === undefined || material === null)
                continue;
            if (material instanceof THREE.Material)
                continue;

            if (material instanceof AssetTransfer)
                return false;
            if (!(material instanceof IAsset))
                return false;
        }
        return true;
    },

    /**
        Returns number of materials currently loading.
        @method numMaterialsLoading
        @return {Number}
    */
    numMaterialsLoading : function()
    {
        var pending = 0;
        for (var i = 0; i < this.materialAssets.length; ++i)
        {
            var material = this.materialAssets[i];
            if (material === undefined || material === null)
                continue;
            if (material instanceof AssetTransfer)
                pending++;
            if (material instanceof IAsset && !material.isLoaded())
                pending++;
        }
        return pending;
    }
});




/**
    This base implementation does not do anything. It declared the static attribute structure of EC_Placeable
    in the Tundra protocol.

    Renderer implementations need to provide this components functionality, preferably by extending this object.

    @class EC_Placeable
    @extends IComponent
    @constructor
*/
var EC_Placeable = IComponent.$extend(
{
    __init__ : function(id, typeId, typeName, name)
    {
        this.$super(id, typeId, typeName, name);

        /**
            @property transform (attribute)
            @type Attribute
        */
        this.declareAttribute(0, "transform", new Transform(), Attribute.Transform);
        /**
            @property drawDebug (attribute)
            @type Attribute
        */
        this.declareAttribute(1, "drawDebug", false, Attribute.Bool);
        /**
            @property visible (attribute)
            @type Attribute
        */
        this.declareAttribute(2, "visible", true, Attribute.Bool);
        /**
            @property selectionLayer (attribute)
            @type Attribute
        */
        this.declareAttribute(3, "selectionLayer", 1, Attribute.Int);
        /**
            @property parentRef (attribute)
            @type Attribute
        */
        this.declareAttribute(4, "parentRef", "", Attribute.EntityReference);
        /**
            @property parentBone (attribute)
            @type Attribute
        */
        this.declareAttribute(5, "parentBone", "", Attribute.String);
    }
});




/**
    Placeable component implementation for the three.js render system.

    @class EC_Placeable_ThreeJs
    @extends EC_Placeable
    @constructor
*/
var EC_Placeable_ThreeJs = EC_Placeable.$extend(
{
    __init__ : function(id, typeId, typeName, name)
    {
        this.$super(id, typeId, typeName, name);

        this.sceneNode = null;
        this._pendingChildren = [];
    },

    __classvars__ :
    {
        implementationName : "three.js"
    },

    reset : function()
    {
        if (this.sceneNode != null)
        {
            // Fire event. This way children of this placeables node have
            // a change to restore them selves to the scene or to parent
            // to another node. The below parent.remove() will remove this
            // scene node and all its children from the scene.
            TundraSDK.framework.events.send("EC_Placeable." + this.parentEntity.id + "." + this.id + ".AboutToBeDestroyed", this, this.sceneNode);

            var parent = this.sceneNode.parent;
            if (parent !== undefined && parent !== null)
                parent.remove(this.sceneNode);
        }
        this.sceneNode = null;
    },

    update : function()
    {
        var renderer = TundraSDK.framework.renderer;

        if (this.sceneNode == null)
        {
            // Create scene node and update visibility.
            this.sceneNode = renderer.createSceneNode();
            this.sceneNode.name = this.parentEntity.name;
            this.sceneNode.tundraEntityId = this.parentEntity.id;
            this.sceneNode.tundraComponentId = this.id;
            this._setVisible(this.attributes.visible.get());

            // Parent to scene and then check if we need to be parented.
            renderer.scene.add(this.sceneNode);
            this.checkParent();

            renderer.updateSceneNode(this.sceneNode, this.transform);

            // Parent pending childrend
            for (var i = 0; i < this._pendingChildren.length; i++)
                this.addChild(this._pendingChildren[i]);
            this._pendingChildren = [];

            TundraSDK.framework.events.send("EC_Placeable." + this.parentEntity.id + "." + this.id + ".SceneNodeCreated", this, this.sceneNode);
            return;
        }
        else
            this.checkParent();

        renderer.updateSceneNode(this.sceneNode, this.transform);
    },

    attributeChanged : function(index, name, value)
    {
        switch(index)
        {
        case 0: // transform
            if (this.sceneNode != null)
                TundraSDK.framework.client.renderer.updateSceneNode(this.sceneNode, value);
            break;
        case 1: // drawDebug
            break;
        case 2: // visible
            this._setVisible(value);
            break;
        case 3: // selectionLayer
            break;
        case 4: // parentRef
            this.checkParent();
            break;
        case 5: // parentBone
            break;
        default:
            break; // TODO Log error/warning?
        }
    },

    /**
        Event that is fired when the scene node is created. Useful if you want to parent something to this placeable.

        @method onSceneNodeCreated
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription|null} Subscription data or null if this entity is not yes initialized correctly.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onSceneNodeCreated : function(context, callback)
    {
        if (!this.hasParentEntity())
        {
            this.log.error("Cannot subscribe onSceneNodeCreated, parent entity not set!");
            return null;
        }
        return TundraSDK.framework.events.subscribe("EC_Placeable." + this.parentEntity.id + "." + this.id + ".SceneNodeCreated", context, callback);
    },

    /**
        Event that is fired before this placeables scene node is being removed from its parent and destroyed.
        Useful if you are currently parented to this placeable to remove the parenting and restore it to the root scene.

        @method onAboutToBeDestroyed
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription|null} Subscription data or null if this entity is not yes initialized correctly.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onAboutToBeDestroyed : function(context, callback)
    {
        if (!this.hasParentEntity())
        {
            this.log.error("Cannot subscribe onAboutToBeDestroyed, parent entity not set!");
            return null;
        }
        return TundraSDK.framework.events.subscribe("EC_Placeable." + this.parentEntity.id + "." + this.id + ".AboutToBeDestroyed", context, callback);
    },

    /**
        Parents another Placeable component to this components scene node.
        If the scene node in this component is not created, the parenting
        will be automatically done when it is created.

        @method addChild
        @param {EC_Placeable} placeable The child Placeable component.
    */
    /**
        Parents a THREE.Object3D to this components scene node.
        If the scene node in this component is not created, the parenting
        will be automatically done when it is created.

        @method addChild
        @param {THREE.Object3D} object3d The child object.
    */
    addChild : function(child)
    {
        if (child === undefined || child === null)
            return;

        if (child instanceof EC_Placeable)
        {
            this.addChild(child.sceneNode);
            return;
        }

        if (this.sceneNode != null)
        {
            this.sceneNode.add(child);
            this.updateVisibility();
            child.updateMatrix();
        }
        else
            this._pendingChildren.push(child);
    },

    _applyParentChain : function(dest, part)
    {
        var p = this.sceneNode.parent;
        while (p !== null && p !== undefined && p instanceof THREE.Scene === false)
        {
            if (dest instanceof THREE.Vector3)
                dest.add(p[part]); /// @todo We need to do multiplyQuaternion(p.quaternion) to the added offset here!
            else if (dest instanceof THREE.Quaternion)
                dest.multiply(p[part].clone().normalize());
            p = p.parent;
        }
    },

    /**
        Returns distance to another object.
        @method distanceTo
        @param {Entity|EC_Placeable|THREE.Vector3} other
        @return {Number|undefined} Distance to the other object or undefined if could not be resolved.
    */
    distanceTo : function(other)
    {
        var otherPos = (other instanceof THREE.Vector3 ? other : undefined);
        if (otherPos === undefined)
        {
            var otherPlaceable = (other instanceof Entity ? other.placeable : (other instanceof EC_Placeable ? other : undefined));
            if (otherPlaceable != null)
                otherPos = otherPlaceable.worldPosition();
        }
        if (otherPos !== undefined)
            return this.worldPosition().distanceTo(otherPos);
        return undefined;
    },

    /**
        Returns the position of this placeable node in the space of its parent.
        @method position
        @return {THREE.Vector3} Position vector.
    */
    position : function()
    {
        return this.attributes.transform.get().pos.clone();
    },

    /**
        Sets the translation part of this placeable's transform.
        @method setPosition
        @note This function sets the Transform attribute of this component, and synchronizes to network.
        @param {THREE.Vector3} vector Position vector.
        @param {AttributeChange} [change=AttributeChange.Default] Attribute change signaling mode.
        @return {Boolean} If set was successful.
    */
    /**
        Set position.
        @method setPosition
        @param {Number} x
        @param {Number} y
        @param {Number} z
        @param {AttributeChange} [change=AttributeChange.Default] Attribute change signaling mode.
        @return {Boolean} If set was successful.
    */
    setPosition : function(x, y, z, change)
    {
        var transform = this.attributes.transform.get();
        transform.setPosition(x, y, z);
        var changeParam = (typeof x !== "number" ? y : change);
        return this.attributes.transform.set(transform, changeParam);
    },

    /**
        Returns clone of the position of this placeable node in world space.
        @method worldPosition
        @return {THREE.Vector3} Position vector.
    */
    worldPosition : function()
    {
        if (this.sceneNode == null)
            return null;

        var worldPos = this.sceneNode.position.clone();
        this._applyParentChain(worldPos, "position");
        return worldPos;
    },

    /// @note Experimental!
    setWorldPosition : function(position)
    {
        var tRef = this.attributes.transform.get();
        var localPos = (this.parentRef !== "" ? this.transform.pos.clone() : new THREE.Vector3(0,0,0));
        tRef.pos = position.sub(localPos);
        this.attributes.transform.set(tRef);
    },

    /**
        Returns the scale of this placeable node in the space of its parent.
        @method scale
        @return {THREE.Vector3} Scale vector.
    */
    scale : function()
    {
        return this.attributes.transform.get().scale.clone();
    },

    /**
        Sets the scale of this placeable's transform.
        @method setScale
        @note This function preserves the previous translation and rotation of this placeable.
        @param {THREE.Vector3} vector Scale vector.
        @param {AttributeChange} [change=AttributeChange.Default] Attribute change signaling mode.
        @return {Boolean} If set was successful.
    */
    /**
        Sets the scale of this placeable's transform.
        @method setScale
        @note This function preserves the previous translation and rotation of this placeable.
        @param {Number} x
        @param {Number} y
        @param {Number} z
        @param {AttributeChange} [change=AttributeChange.Default] Attribute change signaling mode.
        @return {Boolean} If set was successful.
    */
    setScale : function(x, y, z, change)
    {
        var transform = this.attributes.transform.get();
        transform.setScale(x, y, z);
        var changeParam = (typeof x !== "number" ? y : change);
        return this.attributes.transform.set(transform, changeParam);
    },

    /**
        Get rotation.
        @method rotation
        @return {THREE.Vector3} Rotation vector in degrees.
    */
    rotation : function()
    {
        return this.attributes.transform.get().rot.clone();
    },

    /**
        Set rotation.
        @method setRotation
        @param {THREE.Vector3} vector Rotation vector in degrees.
        @param {AttributeChange} [change=AttributeChange.Default] Attribute change signaling mode.
        @return {Boolean} If set was successful.
    */
    /**
        Set rotation.
        @method setRotation
        @param {THREE.Quaternion} quaternion Rotation quaternion.
        @param {AttributeChange} [change=AttributeChange.Default] Attribute change signaling mode.
        @return {Boolean} If set was successful.
    */
    /**
        Set rotation.
        @method setRotation
        @param {THREE.Euler} euler Rotation in radians.
        @param {AttributeChange} [change=AttributeChange.Default] Attribute change signaling mode.
        @return {Boolean} If set was successful.
    */
    /**
        Set rotation.
        @method setRotation
        @param {Number} x X-axis degrees.
        @param {Number} y Y-axis degrees.
        @param {Number} z Z-axis degrees.
        @param {AttributeChange} [change=AttributeChange.Default] Attribute change signaling mode.
        @return {Boolean} If set was successful.
    */
    setRotation : function(x, y, z, change)
    {
        var transform = this.attributes.transform.get();
        transform.setRotation(x, y, z);
        var changeParam = (typeof x !== "number" ? y : change);
        return this.attributes.transform.set(transform, changeParam);
    },

    checkParent : function()
    {
        if (this.sceneNode == null || this.parentEntity == null || this.parentScene == null)
            return;

        if (this._componentAddedSub !== undefined)
        {
            TundraSDK.framework.events.unsubscribe(this._componentAddedSub);
            this._componentAddedSub = undefined;
        }

        // Remove parenting if ref is empty and we are not parented to the scene
        if (this.parentRef !== "")
        {
            // Find by name fist, then try with entity id.
            var foundParent = null;
            foundParent = this.parentScene.entityByName(this.parentRef);
            if (foundParent == null)
            {
                var parentRefId = parseInt(this.parentRef);
                if (!isNaN(parentRefId))
                    foundParent = this.parentScene.entityById(parentRefId);
            }
            if (foundParent != null)
            {
                if (foundParent.placeable != null)
                {
                    foundParent.placeable.addChild(this);
                    return;
                }
                else
                    this._componentAddedSub = foundParent.onComponentCreated(this, this._onParentPlaceableEntityComponentCreated);
            }
        }

        // No parent or failed to find parent, restore to scene as unparented.
        this.removeParent();
    },

    removeParent : function()
    {
        if (this.sceneNode == null || this.parentEntity == null || this.parentScene == null)
            return;

        if (this.sceneNode.parent !== undefined && this.sceneNode.parent !== null && this.sceneNode.parent !== TundraSDK.framework.renderer.scene)
        {
            TundraSDK.framework.renderer.scene.add(this.sceneNode);
            TundraSDK.framework.client.renderer.updateSceneNode(this.sceneNode, this.transform);
        }
    },

    _onParentPlaceableEntityComponentCreated : function(entity, component)
    {
        if (component != null && component.typeName === "EC_Placeable")
            this.checkParent();
    },

    updateVisibility : function()
    {
        this._setVisible(this.attributes.visible.get());
    },

    _setVisible : function(visible)
    {
        if (this.sceneNode == null)
            return;

        this.sceneNode.traverse(function(node) {
            // @todo Should we ignore other parented three.js node types?
            if (node instanceof THREE.PerspectiveCamera)
                return;

            if (visible)
            {
                // Check if this childs placeable has false visibility, then don't show the node!
                // The child can be 1) EC_Placeable scene node 2) EC_Mesh mesh node or submesh node 3) EC_WebBrowser projection plane.
                if (node.tundraEntityId !== undefined)
                {
                    var childEntity = TundraSDK.framework.scene.entityById(node.tundraEntityId)
                    var childPlaceable = (childEntity != null ? (node.tundraComponentId !== undefined ?
                        childEntity.componentById(node.tundraComponentId) : childEntity.placeable) : null);
                    if (childPlaceable != null && !childPlaceable.visible)
                        return;
                }
            }
            node.visible = visible;
        });
    },

    /**
        Makes this Placeables Transform look at a target Entity or position.
        @method lookAt
        @param {Entity|THREE.Vector3} target Target Entity or a position to look at. If Entity is passed target.placeable.worldPosition() is used.
    */
    lookAt : function(param)
    {
        var t = this.attributes.transform.get();
        if (param instanceof THREE.Vector3)
            t.lookAt(this.worldPosition(), param);
        else
            t.lookAt(this.worldPosition(), param.placeable.worldPosition());
        this.transform = t;
    },

    /**
        Returns the orientation of this placeable node in the space of its parent.
        @method orientation
        @return {THREE.Quaternion} Orientation.
    */
    orientation : function()
    {
        return this.attributes.transform.get().orientation();
    },

    /**
        Returns the orientation of this placeable node in world space.
        @method worldOrientation
        @return {THREE.Quaternion} Position vector.
    */
    worldOrientation : function()
    {
        if (this.sceneNode == null)
            return null;

        var worldRot = this.sceneNode.quaternion.clone();
        this._applyParentChain(worldRot, "quaternion");
        return worldRot.normalize();
    }

    /// Sets the orientation of this placeable's transform.
    /// If you want to set the orientation of this placeable using Euler angles, use e.g.
    /// the Quat::FromEulerZYX function.
    /// @note This function sets the Transform attribute of this component, and synchronizes to network.
    /// @note This function preserves the previous position and scale of this transform.
    //Quat q
    // setOrientation : function(q)
    // {
    // },

    /// Sets the rotation and scale of this placeable (the local-to-parent transform).
    /// @param rotAndScale The transformation matrix to set. This matrix is assumed to be orthogonal (no shear),
    ///                    and can not contain any mirroring.
    /// @note This function sets the Transform attribute of this component, and synchronizes to network.
    /// @note This function preserves the previous position of this transform.
    // Quat q, float3 scale
    // setOrientationAndScale : function(q, scale)
    //setOrientationAndScale : function(float3x3 rotAndScale)
    // {
    // },

    /// Sets the position, rotation and scale of this placeable (the local-to-parent transform).
    /// @param tm An orthogonal matrix (no shear), which cannot contain mirroring. The float4x4 version is provided
    ///           for conveniency, and the last row must be identity [0 0 0 1].
    /// @note This function sets the Transform attribute of this component, and synchronizes to network.
    /// @note Logically, the matrix tm is applied to the object first before translating by pos.
    // float3x3 tm, float3 pos
    // setTransform : function(tm, pos)
    //setTransform : function(float3x4 tm)
    // setTransform : function(float4x4 tm)
    // {
    // },

    /// Sets the position, rotation and scale of this placeable (the local-to-parent transform).
    /// @note This function RESETS the scale of this transform to (1,1,1), if scale not provided.
    /// @note Logically, the order of transformations is T * R * S * v.
    // Quat orientation, float3 pos, float3 scale)
    // setTransform : function(orientation, pos, scale)
    //setTransform : function(Quat orientation, float3 pos)
    // {
    // },

    /// Sets the transform of this placeable by specifying the world-space transform this scene node should have.
    /// This function recomputes the local->parent transform for this placeable so that the resulting world transform is as given.
    /// @param tm An orthogonal matrix (no shear), which cannot contain mirroring. The float4x4 version is provided
    ///           for conveniency, and the last row must be identity [0 0 0 1].
    /// @note This function sets the Transform attribute of this component, and synchronizes to network.
    /// @note Logically, the matrix tm is applied to the object first before translating by pos.
    //float3x3 tm, float3 pos
    // setWorldTransform : function(tm, pos)
    //setWorldTransform : function(float3x4 tm)
    //setWorldTransform : function(float4x4 tm)
    // {
    // },

    /// Sets the transform of this placeable by specifying the world-space transform this scene node should have.
    /// @note This function RESETS the scale of this transform to (1,1,1), if scale not provided.
    /// @note Logically, the matrix tm is applied to the object first before translating by pos.
    // Quat orientation, float3 pos, float3 scale)
    // setWorldTransform : function(orientation, pos, scale)
    //setWorldTransform : function(Quat orientation, float3 pos)
    // {
    // },

    /// Returns the world-space transform this scene node.
    /// @return float3x4
    ,
    worldTransform : function()
    {
        var t = this.transform.clone();
        t.pos = this.worldPosition();
        return t;
    },

    setWorldTransform : function(transform)
    {
        var tRef = this.attributes.transform.get();
        var localPos = (this.parentRef !== "" ? this.transform.pos.clone() : new THREE.Vector3(0,0,0));
        tRef = transform;
        tRef.pos.add(localPos);
        this.attributes.transform.set(tRef);
    },

    /// Returns the scale of this placeable node in world space.
    /// @return float3
    // worldScale : function()
    // {
    // },

    /// Returns the concatenated world transformation of this placeable.
    /// @return float3x4
    // localToWorld : function()
    // {
    // },

    /// Returns the matrix that transforms objects from world space into the local coordinate space of this placeable.
    /// @return float3x4
    // worldToLocal : function()
    // {
    // },

    /// Returns the local transformation of this placeable in the space of its parent.
    /// @note For a placeable which is not attached to any parent, this returns the same transform as LocalToWorld : function().
    /// @return float3x4
    // localToParent : function()
    // {
    // },

    /// Returns the matrix that transforms objects from this placeable's parent's space into the local coordinate
    /// space of this placeable.
    /// @note For a placeable which is not attached to any parent, this returns the same transform as WorldToLocal : function().
    /// @return float3x4
    // parentToLocal : function()
    // {
    // },

    /// Re-parents this scene node to the given parent scene node. The parent entity must contain an EC_Placeable component.
    /// Detaches this placeable from its previous parent.
    /// @param preserveWorldTransform If true, the world space position of this placeable is preserved.
    ///                               If false, the transform attribute of this placeable is treated as the new local->parent transform for this placeable.
    /// @note This function sets the parentRef and parentBone attributes of this component to achieve the parenting.
    // Entity parent, bool preserveWorldTransform
    // setParent : function(parent, preserveWorldTransform)
    // {
    // },

    /// Re-parents this scene node to the named bone of the given parent scene node. The parent scene node must contain an EC_Placeable component and an EC_Mesh with a skeleton.
    /// Detaches this placeable from its previous parent.
    /// @param preserveWorldTransform If true, the world space position of this placeable is preserved.
    ///                               If false, the transform attribute of this placeable is treated as the new local->parent transform for this placeable.
    /// @note This function sets the parentRef and parentBone attributes of this component to achieve the parenting.
    // Entity parent, String boneName, bool preserveWorldTransform
    // setParent : function(parent, boneName, preserveWorldTransform)
    // {
    // },

    /// Returns all entities that are attached to this placeable.
    /// @return EntityList
    // children : function()
    // {
    // },

    /// If this placeable is parented to another entity's placeable (parentRef.Get().IsEmpty() == false, and points to a valid entity), returns the parent placeable entity.
    /// @return Entity
    // parentPlaceableEntity : function()
    // {
    // },

    /// If this placeable is parented to another entity's placeable (parentRef.Get().IsEmpty() == false, and points to a valid entity), returns parent placeable component.
    /// @return EC_Placeable
    // parentPlaceableComponent : function()
    // {
    // },

    /// Checks whether or not this component is parented and is grandparent of another @c entity.
    /** @param entity Entity for which relationship is to be inspected.
        @note Each entity is its own grand parent. */
    /// @return bool
    // isGrandparentOf : function(entity)
    // {
    // },

    /// @overload
    /** @param placeable Placeable component, of which relationship is to be inspected.
        @note Each entity is its own grand parent. */
    /// @return bool
    // isGrandparentOf : function(placeable)
    // {
    // },

    /// Checks whether or not this component is parented and is a grandchild of another @c entity.
    /** @param entity Entity for which relationship is to be inspected.
        @note Each entity is its own grand child. */
    /// @return bool
    // isGrandchildOf : function(entity)
    // {
    // },

    /// @overload
    /** @param placeable Placeable component, of which relationship is to be inspected.
        @note Each entity is its own grand child. */
    /// @return bool
    // isGrandchildOf : function(placeable)
    // {
    // },

    /// Returns flat list consisting of the whole parent-child hierarchy for @c entity.
    /** @param entity Entity to be inspected. */
    /// @return return EntityList
    // grandchildren : function(entity)
    // {
    // }
});



/**
    Three.js renderer implementation that is accessible from {{#crossLink "TundraClient/renderer:property"}}TundraClient.renderer{{/crossLink}}

    Manages the rendering engine scene and its scene nodes. Utility functions for camera, raycasting etc.
    @class ThreeJsRenderer
    @extends IRenderSystem
    @constructor
*/
var ThreeJsRenderer = IRenderSystem.$extend(
{
    __init__ : function()
    {
        this.$super("three.js");
        this.log = TundraLogging.getLogger("ThreeJsRenderer");
    },

    load : function(params)
    {
        /**
            <pre>{
                width   : Number,
                height  : Number
            }</pre>
            @property windowSize
            @type Object
        */
        this.windowSize = { width : TundraSDK.framework.client.container.width(), height : TundraSDK.framework.client.container.height() };

        try
        {
            /**
                @property renderer
                @type THREE.WebGLRenderer
            */
            this.renderer = new THREE.WebGLRenderer({ antialias : true });
            this.renderer.setSize(this.windowSize.width, this.windowSize.height);
            this.renderer.sortObjects = true;
            this.renderer.physicallyBasedShading = true;
        }
        catch (e)
        {
            this.renderer = null;
            this.log.error("Failed to initialize WebGL rendering, aborting startup:", e);
            return;
        }

        this.setupShadows({
            enabled     : true,
            softShadows : true,
            drawDebug   : false,
            clip : {
                near    : 50,
                far     : 1000
            },
            textureSize : {
                width   : 2048,
                height  : 2048
            },
            bounds : {
                right   :  30,
                left    : -30,
                top     :  20,
                bottom  : -20
            }
        });

        this.cssRenderer = null;
        this.cssRendererScene = null;

        /**
            @property scene
            @type THREE.Scene
        */
        this.scene = null;

        /**
            @property activeCameraComponent
            @type EC_Camera_ThreeJs
        */
        this.activeCameraComponent = null;

        /**
            @property camera
            @type THREE.PerspectiveCamera
        */
        this.camera = null;

        /**
            @property projector
            @type THREE.Projector
        */
        this.projector = new THREE.Projector();

        /**
            @property raycaster
            @type THREE.Raycaster
        */
        this.raycaster = new THREE.Raycaster();

        /**
            Latest raycast result. Use raycast() to execute.
            @property raycastResult
            @type THREE.Projector
        */
        this.raycastResult = new RaycastResult();
        this.raycastResult._raycastVector = new THREE.Vector3(0,0,0);

        this.raycastFromResult = new RaycastResult();
        this.meshes = [];

        /**
            @property axisX
            @type THREE.Vector3
        */
        this.axisX = new THREE.Vector3(1,0,0);
        /**
            @property axisY
            @type THREE.Vector3
        */
        this.axisY = new THREE.Vector3(0,1,0);
        /**
            @property axisZ
            @type THREE.Vector3
        */
        this.axisZ = new THREE.Vector3(0,0,1);

        // DOM hookup
        TundraSDK.framework.client.container.append(this.renderer.domElement);
        window.addEventListener("resize", this.onWindowResize, false);

        /**
            Basic white solid color material that is used as a default in rendering.
            @property materialWhite
            @type THREE.MeshPhongMaterial
        */
        this.materialWhite = new THREE.MeshPhongMaterial({ "color": this.convertColor("rgb(240,240,240)"), "wireframe" : false });
        this.materialWhite.name = "tundra.MaterialLibrary.SolidWhite";

        /**
            Basic red solid color material that can be used for material load errors.
            @property materialLoadError
            @type THREE.MeshPhongMaterial
        */
        this.materialLoadError = new THREE.MeshPhongMaterial({ "color": this.convertColor("rgb(240,50,50)"), "wireframe" : false });
        this.materialLoadError.name = "tundra.MaterialLibrary.LoadError";

        // Register the three.js asset and component implementations.
        this.registerAssetFactories();
        this.registerComponents();
    },

    postInitialize : function()
    {
        // Track mesh components and their mesh loaded signals.
        // The objects can be queried from _getAllObjects(), this is an attempt
        // to optimize getAllMeshes() which iterates the whole scene for EC_Mesh
        // potentially multiple times per frame.
        this._sceneObjects = {};
        this._meshLoadedSubs = {};
        this._trackingKey = "";

        TundraSDK.framework.scene.onComponentCreated(this, this.onSceneComponentCreated);
        TundraSDK.framework.scene.onComponentRemoved(this, this.onSceneComponentRemoved);
    },

    unload : function()
    {
        /// @todo Implement to support runtime render system swaps!
    },

    onSceneComponentCreated : function(entity, component)
    {
        if (component.typeId === 17) // EC_Mesh
        {
            this._trackingKey = entity.id + "." + component.id;
            this._meshLoadedSubs[this._trackingKey] = component.onMeshLoaded(this, this.onSceneMeshLoaded);
        }
    },

    onSceneComponentRemoved : function(entity, component)
    {
        if (component.typeId !== 17) // EC_Mesh
            return;

        this._trackingKey = entity.id + "." + component.id;
        if (this._sceneObjects[this._trackingKey] !== undefined)
            delete this._sceneObjects[this._trackingKey];
    },

    onSceneMeshLoaded : function(entity, component, meshAsset)
    {
        this._trackingKey = entity.id + "." + component.id;
        this._sceneObjects[this._trackingKey] = new Array(meshAsset.numSubmeshes());

        for (var i=0, len=meshAsset.numSubmeshes(); i<len; ++i)
            this._sceneObjects[this._trackingKey].push(meshAsset.getSubmesh(i));

        if (this._meshLoadedSubs[this._trackingKey] !== undefined)
        {
            TundraSDK.framework.events.unsubscribe(this._meshLoadedSubs[this._trackingKey]);
            delete this._meshLoadedSubs[this._trackingKey];
        }
    },

    _getAllObjects : function()
    {
        var list = [];
        for (var key in this._sceneObjects)
            list = list.concat(this._sceneObjects[key]);
        return list;
    },

    registerAssetFactories : function()
    {
        /** @note It would be too wide of acceptance range if the three.js json accepted all .json file extensions.
            .3geo is a three.js "standardized" extensions for mesh assets, but not widely used (yet).
            You can load from .json/.js files via AssetAPI but you need to force the type to "ThreeJsonMesh". */
        TundraSDK.framework.asset.registerAssetFactory(new AssetFactory("ThreeJsonMesh", ThreeJsonAsset, { ".3geo" : "json", ".json" : "json", ".js" : "json" }, "json"));
        TundraSDK.framework.asset.registerAssetFactory(new AssetFactory("ObjMesh", ObjMeshAsset, { ".obj" : "text" }));
    },

    registerComponents : function()
    {
        Scene.registerComponent( 9, "EC_Fog", EC_Fog_ThreeJs);        
        Scene.registerComponent(14, "EC_AnimationController", EC_AnimationController_ThreeJs);
        Scene.registerComponent(15, "EC_Camera", EC_Camera_ThreeJs);
        Scene.registerComponent(17, "EC_Mesh", EC_Mesh_ThreeJs);
        Scene.registerComponent(20, "EC_Placeable", EC_Placeable_ThreeJs);
    },

    getCssRenderer : function()
    {
        if (this.cssRenderer == null)
        {
            this.cssRenderer = new THREE.CSS3DRenderer();
            this.cssRenderer.setSize(this.windowSize.width, this.windowSize.height);

            var cssDom = $(this.cssRenderer.domElement);
            var webglDom = $(this.renderer.domElement);

            cssDom.css({
                "background-color" : "transparent",
                "position" : "absolute",
                "top"       : 0,
                "margin"    : 0,
                "padding"   : 0,
                "z-index"   : 1
            });

            webglDom.css({
                "background-color" : "transparent",
                "position"  : "absolute",
                "top"       : 0,
                "margin"    : 0,
                "padding"   : 0,
                "z-index"   : 1
            });

            /* @note CSS renderer to main container. WebGL inside Css renderer. Both with same z-index.
               This will get the 3D objects rendered on top of the CSS renderer elements. */
            TundraSDK.framework.client.container.append(cssDom);
            cssDom.append(webglDom);
        }
        return this.cssRenderer;
    },

    getCssRendererScene : function()
    {
        if (this.cssRenderer == null)
            this.getCssRenderer();
        if (this.cssRendererScene == null)
            this.cssRendererScene = new THREE.Scene();
        return this.cssRendererScene;
    },

    onWindowResize : function(event)
    {
        var that = TundraSDK.framework.client.renderer;
        that.windowSize = { width: TundraSDK.framework.client.container.width(), height : TundraSDK.framework.client.container.height() };

        that.renderer.setSize(that.windowSize.width, that.windowSize.height);
        if (that.cssRenderer != null)
            that.cssRenderer.setSize(that.windowSize.width, that.windowSize.height);

        if (that.camera !== undefined && that.camera !== null)
        {
            that.camera.aspect = that.windowSize.width / that.windowSize.height;
            that.camera.updateProjectionMatrix();
        }
    },

    /**
        Resets the internal state. Removes all entities from the scene.
        @method reset
    */
    reset : function()
    {
        if (this.scene != null)
        {
            // This is an old failsafe to unload CPU/GPU resources.
            // The scene should already be empty as EC_Placeable, EC_Mesh etc.
            // have been reseted. They should have removed their scene nodes correctly.
            // Additionally AssetAPI forgetAllAssets() should have unloaded each IAsset
            // so that they unload any CPU/GPU resources from threejs.
            while (this.scene.children.length > 0)
            {
                var child = this.scene.children[0];
                if (child instanceof THREE.Mesh)
                {
                    this.log.debug(child.name);
                    if (child.material != null)
                    {
                        if (child.material instanceof THREE.MeshBasicMaterial)
                        {
                            if (child.material.map != null)
                            {
                                this.log.debug("  map");
                                child.material.map.dispose();
                                child.material.map = null;
                            }
                            if (child.material.lightMap != null)
                            {
                                this.log.debug("  lightMap");
                                child.material.lightMap.dispose();
                                child.material.lightMap = null;
                            }
                            if (child.material.specularMap != null)
                            {
                                this.log.debug("  specularMap");
                                child.material.specularMap.dispose();
                                child.material.specularMap = null;
                            }
                            if (child.material.envMap != null)
                            {
                                this.log.debug("  envMap");
                                child.material.envMap.dispose();
                                child.material.envMap = null;
                            }
                        }
                        else if (child.material instanceof THREE.ShaderMaterial)
                        {
                            if (child.material.uniforms != null)
                            {
                                if (child.material.uniforms["tCube"] != null && child.material.uniforms["tCube"].value != null)
                                {
                                    this.log.debug("  uniform tCube");
                                    child.material.uniforms["tCube"].value.dispose();
                                    child.material.uniforms["tCube"].value = null;
                                }
                                if (child.material.uniforms["map"] != null && child.material.uniforms["map"].value != null)
                                {
                                    this.log.debug("  uniform map");
                                    child.material.uniforms["map"].value.dispose();
                                    child.material.uniforms["map"].value = null;
                                }
                                if (child.material.uniforms["normalMap"] != null && child.material.uniforms["normalMap"].value != null)
                                {
                                    this.log.debug("  uniform normalMap");
                                    child.material.uniforms["normalMap"].value.dispose();
                                    child.material.uniforms["normalMap"].value = null;
                                }
                            }
                        }
                        this.log.debug("  material");

                        child.material.dispose();
                        child.material = null;
                    }
                    if (child.geometry != null)
                    {
                        this.log.debug("  geometry");
                        child.geometry.dispose();
                        child.geometry = null;
                    }
                }

                this.scene.remove(child);
                child = null;
            }

            delete this.scene;
            this.scene = null;
        }

        this.scene = new THREE.Scene();

        // Create default ambient light, can be modified by components.
        this.ambientLight = this.createLight("ambient");
        this.ambientLight.color = this.defaultSceneAmbientLightColor().toThreeColor();
        this.scene.add(this.ambientLight);
    },

    /**
        Setup shadows. Below are the options you can define, these are the defaults.
        @example
            {
                enabled     : true,
                softShadows : true,
                drawDebug   : false,
                clip : {
                    near    : 50,
                    far     : 1000
                },
                textureSize : {
                    width   : 2048,
                    height  : 2048
                },
                bounds : {
                    right   :  50,
                    left    : -50,
                    top     :  50,
                    bottom  : -50
                }
            }

        @method setupShadows
        @param {Boolean} enableShadows Enable shadows.
        @param {Boolean} enableSoftShadows Enable shadow antialiasing.
        @param {Object} shadowBounds Bounds of the shadow projection eg. { left: x1, right: x2, top: y1, bottom: y2 }.
    */
    setupShadows : function(settings)
    {
        if (this.renderer == null || settings === undefined)
            return;

        if (this.shadowSettings === undefined)
        {
            this.shadowSettings = {};
            this.shadowSettings.shadowCastingLights = 0;
        }

        if (settings.enabled !== undefined)
            this.shadowSettings.enabled = settings.enabled;
        if (settings.softShadows !== undefined)
            this.shadowSettings.softShadows = settings.softShadows;
        if (settings.textureSize !== undefined)
            this.shadowSettings.textureSize = settings.textureSize;
        if (settings.clip !== undefined)
            this.shadowSettings.clip = settings.clip;
        if (settings.bounds !== undefined)
            this.shadowSettings.bounds = settings.bounds;
        if (settings.drawDebug !== undefined)
            this.shadowSettings.drawDebug = settings.drawDebug;

        /// @todo Investigate cascading shadows.
        this.renderer.shadowMapEnabled = (this.shadowSettings.enabled === true && this.shadowSettings.shadowCastingLights > 0);
        this.renderer.shadowMapType = (this.shadowSettings.softShadows === true ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap);
        this.renderer.shadowMapDebug = this.shadowSettings.drawDebug;

        TundraSDK.framework.events.send("ThreeJsRenderer.ShadowSettingsChanged", this.shadowSettings);
    },

    shadowCastingLightsChanged : function()
    {
        // If we simply set THREE.Light.castShadow = false for all lights in the scene.
        // The shaders will fail to compute and you wont see any real time change in the scene.
        // We must calculate actual shadow casting lights and disable the renderers main shadowMapEnabled flag.
        this.shadowSettings.shadowCastingLights = 0;
        for ( var l = 0, ll = this.scene.__lights.length; l < ll; l++)
        {
            var light = this.scene.__lights[l];
            if (!light.castShadow)
                continue;
            if (light instanceof THREE.SpotLight)
                this.shadowSettings.shadowCastingLights++;
            if (light instanceof THREE.DirectionalLight && !light.shadowCascade)
                this.shadowSettings.shadowCastingLights++;
        }
        this.setupShadows({ enabled : this.shadowSettings.enabled });

        // All materials need to be updated (shaders reconfigured) now that
        // shadow settings and/or light counts changed.
        var meshes = this._getAllObjects();
        for (var i = 0, len = meshes.length; i<len; i++)
        {
            if (meshes[i] != null && meshes[i].material !== undefined && meshes[i].material !== null)
                meshes[i].material.needsUpdate = true;
        }
    },

    /**
        Registers a callback for when renderers shadow settings changed. Below is the settings
        object that you will receive as the parameter when the event is fired.
        @example
            {
                enabled     : true,
                softShadows : true,
                drawDebug   : false,
                clip : {
                    near    : 50,
                    far     : 1000
                },
                textureSize : {
                    width   : 2048,
                    height  : 2048
                },
                bounds : {
                    right   :  50,
                    left    : -50,
                    top     :  50,
                    bottom  : -50
                }
            }

        @method onShadowSettingsChanged
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription|null} Subscription data or null if parent entity is not set.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onShadowSettingsChanged : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("ThreeJsRenderer.ShadowSettingsChanged", context, callback);
    },

    /**
        Returns the default scene ambient color. You can set the ambient color to renderer.ambientLight.color = x;.
        @method defaultSceneAmbientLightColor
        @return {Color}
    */
    defaultSceneAmbientLightColor : function()
    {
        return new Color(0.364, 0.364, 0.364, 1.0);
    },

    /**
        Returns all rendering engine scene nodes from the scene that contain geometry. This excludes cameras, lights etc.

        Use this function with care, the performance is not going to be great!
        See _getAllObjects() for a faster non-scene-iterating implementation!

        @method getAllMeshes
        @return {Array} List of Three.Mesh objects.
    */
    getAllMeshes : function()
    {
        // If we have already done a mesh query this frame, dont do it again.
        /// @todo Should we actually remove this and make EC_Mesh add their meshes to the list?
        if (this.meshes.length == 0)
        {
            var meshComponents = TundraSDK.framework.client.scene.components("Mesh");
            for (var i = 0; i < meshComponents.length; ++i)
            {
                var meshComponent = meshComponents[i];
                if (meshComponent.meshAsset != null && meshComponent.meshAsset.mesh != null)
                {
                    for (var k=0; k<meshComponent.meshAsset.numSubmeshes(); ++k)
                        this.meshes.push(meshComponent.meshAsset.getSubmesh(k));
                }
            }
        }
        return this.meshes;
    },

    update : function(frametime, frametimeMsec)
    {
        // Reset per frame cache data
        this.raycastResult.reset();

        if (this.meshes.length > 0)
            this.meshes = [];

        // Update animations
        THREE.AnimationHandler.update(frametimeMsec);

        // Render
        this.render();
    },

    /**
        Updates the rendering engine. <br><br>__Note:__ Do not call this method, constant updates are handled by TundraClient.
        @method render
    */
    render : function()
    {
        if (this.scene === undefined || this.scene === null)
            return;
        if (this.camera === undefined || this.camera === null)
            return;

        this.renderer.render(this.scene, this.camera);

        if (this.cssRenderer != null && this.cssRendererScene != null)
        {
            var webBrowserComponents = TundraSDK.framework.scene.components("EC_WebBrowser");
            for (var i = 0, wbLen = webBrowserComponents.length; i < wbLen; i++)
                webBrowserComponents[i].updateCssObjectTransform();
            this.cssRenderer.render(this.cssRendererScene, this.camera);
        }
    },

    /**
        Executes a raycast from origin to direction. Returns all hit objects.

        @method raycastAllFrom
        @param {THREE.Vector3} origin Origin of the raycast.
        @param {THREE.Vector3} direction Normalized direction vector.
        @param {Number} [selectionLayer=1] Entity selection layer.
        @param {Array} [targets=all-THREE.Mesh-in-scene] Raycast execution targets.
        These objects must have geometry property if recursive is false!
        @param {Boolean} [ignoreECModel=false] If the Tundra EC model should be ignored,
        if true no entity or component information is checked or filled to the result.
        @param {Boolean} [recursive=false] If false only the top level targets are checked.
        If true also their children will be recursively checked.
        <b>Note:</b> Recursive raycast to a large amount of objects can be slow.
        @return {Array<RaycastResult>}
    */
    raycastAllFrom : function(origin, direction, selectionLayer, targets, ignoreECModel, recursive)
    {
        return this.raycastFrom(origin, direction, selectionLayer, targets, ignoreECModel, recursive, true);
    },

    /**
        Executes a raycast from origin to direction. Returns the first hit object.

        @method raycastFrom
        @param {THREE.Vector3} origin Origin of the raycast.
        @param {THREE.Vector3} direction Normalized direction vector.
        @param {Number} [selectionLayer=1] Entity selection layer.
        @param {Array} [targets=all-THREE.Mesh-in-scene] Raycast execution targets.
        These objects must have geometry property if recursive is false!
        @param {Boolean} [ignoreECModel=false] If the Tundra EC model should be ignored,
        if true no entity or component information is checked or filled to the result.
        @param {Boolean} [recursive=false] If false only the top level targets are checked.
        If true also their children will be recursively checked.
        <b>Note:</b> Recursive raycast to a large amount of objects can be slow.
        @return {RaycastResult}
    */
    raycastFrom : function(origin, direction, selectionLayer, targets, ignoreECModel, recursive, all)
    {
        // Set default values
        selectionLayer = (typeof selectionLayer === "number" ? selectionLayer : 1);
        ignoreECModel = (typeof ignoreECModel === "boolean" ? ignoreECModel : false);
        recursive = (typeof recursive === "boolean" ? recursive : false);
        all = (typeof all === "boolean" ? all : false);

        this.raycastFromResult.reset();
        this.raycastFromResult.setExecutionInfo(-1, -1, selectionLayer);

        if (this.raycastFromResult.origin === undefined)
            this.raycastFromResult.origin = new THREE.Vector3();
        this.raycastFromResult.origin.copy(origin);
        if (this.raycastFromResult.direction === undefined)
            this.raycastFromResult.direction = new THREE.Vector3();
        this.raycastFromResult.direction.copy(direction);

        // If no meshes in scene, bail out. This is not an error.
        if (targets === undefined)
        {
            /** @todo Only return visible objects here?!
                I think the raycast logic itself wont check if
                the hit geometry is visible! */
            targets = this._getAllObjects();
        }
        if (targets.length === 0)
            return this.raycastFromResult;

        this.raycaster.set(origin, direction);
        var objects = this.raycaster.intersectObjects(targets, recursive);
        return this._raycastResults(this.raycaster, objects, this.raycastFromResult, selectionLayer, ignoreECModel, all)
    },

    /**
        Executes a raycast to the renderers scene using the currently active camera 
        and screen coordinates. Returns all hit objects.

        @method raycastAll
        @param {Number} [x=current-mouse-x] Screen x coordinate. Defaults to current mouse position. 
        You can check bounds from the windowSize property.
        @param {Number} [y=current-mouse-y] Screen y coordinate. Defaults to current mouse position.
        You can check bounds from the windowSize property.
        @param {Number} [selectionLayer=1] Entity selection layer.
        @param {Array} [targets=all-THREE.Mesh-in-scene] Raycast execution targets.
        These objects must have geometry property if recursive is false!
        @param {Boolean} [ignoreECModel=false] If the Tundra EC model should be ignored,
        if true no entity or component information is checked or filled to the result.
        @param {Boolean} [recursive=false] If false only the top level targets are checked.
        If true also their children will be recursively checked.
        <b>Note:</b> Recursive raycast to a large amount of objects can be slow.
        @return {Array<RaycastResult>}
    */
    raycastAll : function(x, y, selectionLayer, targets, ignoreECModel, recursive)
    {
        return this.raycast(x, y, selectionLayer, targets, ignoreECModel, recursive, true);
    },

    /**
        Executes a raycast to the renderers scene using the currently active camera 
        and screen coordinates. Returns all hit objects.

        @method raycastAll
        @param {Number} [x=current-mouse-x] Screen x coordinate. Defaults to current mouse position. 
        You can check bounds from the windowSize property.
        @param {Number} [y=current-mouse-y] Screen y coordinate. Defaults to current mouse position.
        You can check bounds from the windowSize property.
        @param {Number} [selectionLayer=1] Entity selection layer.
        @param {Array} [targets=all-THREE.Mesh-in-scene] Raycast execution targets.
        These objects must have geometry property if recursive is false!
        @param {Boolean} [ignoreECModel=false] If the Tundra EC model should be ignored,
        if true no entity or component information is checked or filled to the result.
        @param {Boolean} [recursive=false] If false only the top level targets are checked.
        If true also their children will be recursively checked.
        <b>Note:</b> Recursive raycast to a large amount of objects can be slow.
        @return {RaycastResult}
    */
    raycast : function(x, y, selectionLayer, targets, ignoreECModel, recursive, all)
    {
        /// @todo Fix offset calculation if the main DOM container is not at 0,0

        // Set default values
        x = (typeof x === "number" ? x : TundraSDK.framework.input.mouse.x);
        y = (typeof y === "number" ? y : TundraSDK.framework.input.mouse.y);
        selectionLayer = (typeof selectionLayer === "number" ? selectionLayer : 1);
        ignoreECModel = (typeof ignoreECModel === "boolean" ? ignoreECModel : false);
        recursive = (typeof recursive === "boolean" ? recursive : false);
        all = (typeof all === "boolean" ? all : false);

        // @note These are not part of the RaycastResult object, custom checks for theejs implementation.
        var customExecInfoChanged = false;
        if (this.raycastResult._ignoreECModel !== undefined && this.raycastResult._ignoreECModel !== ignoreECModel)
            customExecInfoChanged = true;
        else if (this.raycastResult._all !== undefined && this.raycastResult._all !== all)
            customExecInfoChanged = true;

        /** Execute raycast again if
            1) Our custom additional params were different
            2) x, y (usually mouse pos) or selectionLayer has changed
            3) Custom targets has been passed in */
        if (!customExecInfoChanged && targets === undefined && !this.raycastResult.hasError() && this.raycastResult.executionMatches(x, y, selectionLayer))
            return this.raycastResult;

        this.raycastResult.reset();

        if (this.camera === undefined || this.camera === null)
        {
            this.raycastResult.setError("No active rendering camera set");
            return this.raycastResult;
        }

        // Check correct types were passed in.
        if (typeof selectionLayer !== "number")
        {
            this.raycastResult.setError("given selectionLayer is not a number");
            return this.raycastResult;
        }
        if (typeof x !== "number" || typeof y !== "number")
        {
            this.raycastResult.setError("given x and/or y is not a number");
            return this.raycastResult;
        }

        // Return null raycast if the coordinate is outside the screen.
        if (x > this.windowSize.width || y > this.windowSize.height)
        {
            this.raycastResult.setError("x and/or y screen position out of bounds");
            return this.raycastResult;
        }

        // If no meshes in scene, bail out. This is not an error.
        if (targets === undefined)
        {
            /** @todo Only return visible objects here?!
                I think the raycast logic itself wont check if
                the hit geometry is visible! */
            targets = this._getAllObjects();
        }
        if (targets.length === 0)
            return this.raycastResult;

        // Store execution info
        this.raycastResult.setExecutionInfo(x, y, selectionLayer);
        
        // Custom info for our threejs implementation
        this.raycastResult._ignoreECModel = ignoreECModel;
        this.raycastResult._all = all;

        // Execute raycast
        this.raycastResult._raycastVector.x =  (x / this.windowSize.width ) * 2 - 1;
        this.raycastResult._raycastVector.y = -(y / this.windowSize.height) * 2 + 1;
        this.raycastResult._raycastVector.z = 0;

        /// @todo Try to optimize this, its quit slow. Maybe get all visible meshes 
        /// from frustrum instead of passing all mesh objects in the scene
        var raycaster = this.projector.pickingRay(this.raycastResult._raycastVector, this.camera);
        var objects = raycaster.intersectObjects(targets, recursive);

        return this._raycastResults(raycaster, objects, this.raycastResult, selectionLayer, ignoreECModel, all)
    },

    _raycastResults : function(raycaster, objects, raycastResult, selectionLayer, ignoreECModel, all)
    {
        var rayvastResults = (all ? [] : undefined);

        for (var i = 0, len = objects.length; i < len; ++i)
        {
            /// @todo Add billboards/sprites when implemented.
            var nearestHit = objects[i];
            if ((nearestHit.object instanceof THREE.Mesh) || (nearestHit.object instanceof THREE.SkinnedMesh))
            {
                // Entity and Component
                if (!ignoreECModel && nearestHit.object.parent != null && nearestHit.object.parent.tundraEntityId != null)
                {
                    var hitEntity = TundraSDK.framework.scene.entityById(nearestHit.object.parent.tundraEntityId);
                    if (hitEntity != null)
                    {
                        /// @todo Should we ignore entities that do now have EC_Placeable all together?
                        if (hitEntity.placeable != null)
                        {
                            if (!hitEntity.placeable.visible)
                                continue;
                            if (hitEntity.placeable.selectionLayer !== selectionLayer)
                                continue;
                        }

                        raycastResult.setPosition(nearestHit.point);
                        raycastResult.distance = nearestHit.distance;
                        raycastResult.faceIndex = nearestHit.faceIndex;
                        raycastResult.ray = raycaster.ray.clone();

                        if (nearestHit.object.tundraSubmeshIndex !== undefined)
                            raycastResult.submeshIndex = nearestHit.object.tundraSubmeshIndex;

                        /// @todo Add more component types here when we get some, eg. billboards/sprites.
                        raycastResult.entity = hitEntity;
                        raycastResult.component = hitEntity.getComponent("EC_Mesh");

                        if (rayvastResults !== undefined)
                            rayvastResults.push(raycastResult.clone());
                        else
                            break;
                    }
                }
                else if (ignoreECModel)
                {
                    raycastResult.setPosition(nearestHit.point);
                    raycastResult.distance = nearestHit.distance;
                    raycastResult.faceIndex = nearestHit.faceIndex;
                    raycastResult.ray = raycaster.ray.clone();

                    if (rayvastResults !== undefined)
                        rayvastResults.push(raycastResult.clone());
                    else
                        break;
                }
            }
        }

        if (rayvastResults !== undefined)
            return rayvastResults;
        return raycastResult;
    },

    createLight : function(type, color, intensity, distance)
    {
        if (color !== undefined)
            color = this.convertColor(color);
        if (intensity === undefined)
            intensity = 1.0;
        if (distance === undefined)
            distance = 0.0;

        var light = null;
        if (type == "point")
            light = new THREE.PointLight(color, intensity, distance);
        else if (type == "directional")
            light = new THREE.DirectionalLight(color, intensity, distance);
        else if (type == "spot")
            light = new THREE.SpotLight(color, intensity, distance, true);
        else if (type == "ambient")
            light = new THREE.AmbientLight(color);
        return light;
    },

    convertColor : function(color)
    {
        if (color === undefined)
            return undefined;

        if (color.substr(0, 1) === '#')
            return color;

        var digits = /(.*?)rgb\((\d+),(\d+),(\d+)\)/.exec(color);
        var red = parseInt(digits[2]);
        var green = parseInt(digits[3]);
        var blue = parseInt(digits[4]);
        return blue | (green << 8) | (red << 16);
    },

    /**
        Registers a callback for when the active camera that is used for rendering changes.
        @example
            // 'deactivatedCameraComponent' can be undefined if no camera was set when the new camera was activated
            TundraSDK.framework.renderer.onActiveCameraChanged(null, function(activeCameraComponent, deactivatedCameraComponent) {
                console.log("Current active camera is", activeCameraComponent.parentEntity.name);
                if (deactivatedCameraComponent !== undefined)
                    console.log("Last active camera was", deactivatedCameraComponent.parentEntity.name);
            });

        @method onActiveCameraChanged
        @param {Object} context Context of in which the callback function is executed. Can be null.
        @param {Function} callback Function to be called.
        @return {EventSubscription|null} Subscription data or null if parent entity is not set.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} how to unsubscribe from this event.
    */
    onActiveCameraChanged : function(context, callback)
    {
        return TundraSDK.framework.events.subscribe("ThreeJsRenderer.ActiveCameraChanged", context, callback);
    },

    setActiveCamera : function(cameraComponent)
    {
        /// @todo Automatically find the first EC_Camera from the scene and activate it!
        if (cameraComponent === null)
        {
            // Deactivate current camera
            if (this.activeCameraComponent !== undefined && this.activeCameraComponent !== null)
                this.activeCameraComponent.active = false;

            this.camera = null;
            this.activeCameraComponent = null;
            return true;
        }

        if (!(cameraComponent instanceof EC_Camera_ThreeJs))
        {
            this.log.error("[ThreeJsRenderer]: setActiveCamera called with non EC_Camera_ThreeJs component!", cameraComponent);
            return false;
        }

        // Deactivate current camera
        var deactivatedCameraComponent = undefined;
        if (this.activeCameraComponent !== undefined && this.activeCameraComponent !== null)
        {
            this.activeCameraComponent.active = false;
            deactivatedCameraComponent = this.activeCameraComponent;
        }

        // Activate new camera
        this.camera = cameraComponent.camera;
        this.activeCameraComponent = cameraComponent;
        this.activeCameraComponent.active = true;

        // Send event that give old and new camera component.
        TundraSDK.framework.events.send("ThreeJsRenderer.ActiveCameraChanged", this.activeCameraComponent, deactivatedCameraComponent);
        deactivatedCameraComponent = undefined;

        return true;
    },

    activeCamera : function()
    {
        return this.activeCameraComponent;
    },

    activeCameraEntity : function()
    {
        return (this.activeCameraComponent != null ? this.activeCameraComponent.parentEntity : null);
    },

    /**
        Creates a new rendering engine scene node without adding it to the scene.
        @method createSceneNode
        @return {THREE.Object3D}
    */
    createSceneNode : function()
    {
        var sceneNode = new THREE.Object3D();
        sceneNode.matrixAutoUpdate = false;
        return sceneNode;
    },

    /**
        Updates a rendering engine scene node from a Tundra Transform.
        @method updateSceneNode
        @param {THREE.Object3D} sceneNode Update target
        @param {Transform} transform Tundra transform.
    */
    updateSceneNode : function(sceneNode, transform)
    {
        if (sceneNode == null)
            return;

        if (sceneNode.matrixAutoUpdate === true)
            sceneNode.matrixAutoUpdate = false;

        // Update three.js scene node from Tundra Transform.
        // Copy each Number type separately to avoid cloning
        // and passing in by reference to threejs.
        sceneNode.position.x = transform.pos.x;
        sceneNode.position.y = transform.pos.y;
        sceneNode.position.z = transform.pos.z;

        // This returns a new instance of Quaternion
        sceneNode.quaternion = transform.orientation();

        sceneNode.scale.x = transform.scale.x;
        sceneNode.scale.y = transform.scale.y;
        sceneNode.scale.z = transform.scale.z;

        // Verify scale is not negative or zero.
        if (sceneNode.scale.x < 0.0000001 || sceneNode.scale.y < 0.0000001 || sceneNode.scale.z < 0.0000001)
        {
            this.log.warn("Fixing negative/zero scale", sceneNode.scale.toString(), "for object", sceneNode.name);
            if (sceneNode.scale.x < 0.0000001) sceneNode.scale.x = 0.0000001;
            if (sceneNode.scale.y < 0.0000001) sceneNode.scale.y = 0.0000001;
            if (sceneNode.scale.z < 0.0000001) sceneNode.scale.z = 0.0000001;
        }

        sceneNode.updateMatrix();
    }
});


// Extending the three.js classes
/// @todo make this somehow generic so its included everywhere! (make our of vector class that inherits THREE.Vector3)
THREE.Box2.prototype.toString       = function() { return "(min: " + this.min + " max: " + this.max + ")"; };
THREE.Box3.prototype.toString       = function() { return "(min: " + this.min + " max: " + this.max + ")"; };
THREE.Color.prototype.toString      = function() { return "(" + this.r + ", " + this.g + ", " + this.b + ")"; };
THREE.Euler.prototype.toString      = function() { return "(" + this.x + ", " + this.y + ", " + this.z + " " + this.order + ")"; };
THREE.Vector2.prototype.toString    = function() { return "(" + this.x + ", " + this.y + ")"; };
THREE.Vector3.prototype.toString    = function() { return "(" + this.x + ", " + this.y + ", " + this.z + ")"; };
THREE.Vector4.prototype.toString    = function() { return "(" + this.x + ", " + this.y + ", " + this.z + ", " + + this.w + ")"; };
THREE.Quaternion.prototype.toString = function() { return "(" + this.x + ", " + this.y + ", " + this.z + ", " + this.w + ")"; };
THREE.Matrix3.prototype.toString    = function() { var m = this.elements; return  "(" + m[0] + ", " + m[3] + ", " + m[6] + ") " +
                                                                                  "(" + m[1] + ", " + m[4] + ", " + m[7] + ") " +
                                                                                  "(" + m[2] + ", " + m[5] + ", " + m[8] + ")"; };
THREE.Matrix4.prototype.toString    = function() { var m = this.elements; return  "(" + m[0] + ", " + m[4] + ", " + m[8 ] + ", " + m[12] + ") " +
                                                                                  "(" + m[1] + ", " + m[5] + ", " + m[9 ] + ", " + m[13] + ") " +
                                                                                  "(" + m[2] + ", " + m[6] + ", " + m[10] + " ," + m[14] + ") " +
                                                                                  "(" + m[3] + ", " + m[7] + ", " + m[11] + " ," + m[15] + ")"; };
// @todo THREE.Plane.prototype.toString = function() {} "Plane(Normal:(%.2f, %.2f, %.2f) d:%.2f)"
// @todo THREE.Frustum.prototype.toString = function() {} "Frustum(%s pos:(%.2f, %.2f, %.2f) front:(%.2f, %.2f, %.2f), up:(%.2f, %.2f, %.2f), near: %.2f, far: %.2f, %s: %.2f, %s: %.2f)"
// @todo THREE.Ray.prototype.toString = function() {} "Ray(pos:(%.2f, %.2f, %.2f) dir:(%.2f, %.2f, %.2f))"
// @todo THREE.Sphere.prototype.toString = function() {} "Sphere(pos:(%.2f, %.2f, %.2f) r:%.2f)"
// @todo THREE.Spline.prototype.toString = function() {}
// @todo THREE.Triangle.prototype.toString = function() {} "Triangle(a:(%.2f, %.2f, %.2f) b:(%.2f, %.2f, %.2f) c:(%.2f, %.2f, %.2f))"


;


/**
    Tundra plugin interface.

    @class ITundraPlugin
    @constructor
    @param {String} name Name of the plugin.
*/
var ITundraPlugin = Class.$extend(
{
    __init__ : function(name)
    {
        if (typeof name !== "string")
            console.error("ITundraPlugin constructor must be called with the plugin name as a string!");

        /**
            TundraSDK Framework object.
            @property framework
            @type TundraSDK.framework
        */
        this.framework = null;
        /**
            Name of the plugin.
            @property framework
            @type String
        */
        this.name = name;
        /**
            Logger for this plugin.
            @property log
            @type TundraLogger
        */
        this.log = TundraLogging.getLogger(this.name);

        this.initialized = false;
    },

    _setFramework : function(fw)
    {
        this.framework = fw;
    },

    /// Internal
    _initialize : function()
    {
        if (this.initialized === true)
        {
            this.log("Already initialized!");
            return;
        }

        this.initialize();
        this.initialized = true;
    },

    /**
        Called when plugin is loaded to TundraClient. Implementation can override this.
            <b>Note:</b> this.framework is set at this stage.

        @method initialize
    */
    initialize : function()
    {
    },

    /// Internal
    _postInitialize : function()
    {
        this.postInitialize();
    },

    /**
        Called after all plugins have been loaded to TundraClient.
        Useful if your plugin needs to fetch and use other plugins.
        Implementation can override this.

        @method postInitialize
    */
    postInitialize : function()
    {
    },

    /// Internal
    _uninitialize : function()
    {
        this.uninitialize();
        this.framework = null;
        this.initialized = false;
    },

    /**
        Called when plugin is unloaded from TundraClient. Implementation can override this.
            <b>Note:</b> this.framework is still valid at this stage.

        @method uninitialize
    */
    uninitialize : function()
    {
    }
});




/**
    Http proxy resolvers responsibility is to provide proxy URL for HTTP assets.
    This interface is used by AssetAPI to request a proxy URL for http assets.

    The internal implementation should know where the http proxy service is running
    and its API to request assets from. This can include doing asset conversions on the fly.

    @example
        var assetRef = "http://some.site.com/my.mesh"
        var assetType = "Mesh";
        if (TundraSDK.AssetAPI.httpProxyResolver !== undefined)
        {
            console.log("Using HTTP proxy resolver: " + TundraSDK.AssetAPI.httpProxyResolver.name)
            var proxyRef = TundraSDK.AssetAPI.httpProxyResolver.resolve(assetRef, assetType);

            // What this prints depends on the implentation, it can be undefined too if
            // the implementation does not support this asset type.
            // For example: http://my.proxy.com/assets?assetRef=http://some.site.com/my.mesh&convert=.mesh.xml
            console.log(proxyRef);
        }

    @class IHttpProxyResolver
    @constructor
    @param {String} name Descriptive resolver name
*/
var IHttpProxyResolver = Class.$extend(
{
    __init__ : function(name, proxyUrl)
    {
        /**
            Resolver implementation name
            @property name
            @type String
        */
        this.name = name;

        /**
            Proxy URL. Has a guaranteed trailing forward slash.
            @property proxyUrl
            @type String
        */
        this.proxyUrl = undefined;

        this.setProxy(proxyUrl);
    },

    /**
        Can be used to set the proxy URL during runtime.
        The proxyUrl property is guaranteed to have a trailing slash after this call.

        @method setProxy
        @param {String} proxyUrl Proxy URL.
    */
    setProxy : function(proxyUrl)
    {
        if (proxyUrl === "")
            proxyUrl = undefined;

        this.proxyUrl = proxyUrl;

        if (typeof this.proxyUrl === "string" && this.proxyUrl !== "")
        {
            if (!CoreStringUtils.startsWith(this.proxyUrl, "http", true))
                this.proxyUrl = "http://" + this.proxyUrl;
            if (!CoreStringUtils.endsWith(this.proxyUrl, "/"))
                this.proxyUrl += "/";
        }
    },

    /**
        Returns proxy url for this implementation where the asset can be fetched. Return undefined if assetRef is not supported.

        IHttpProxyResolver implementation must override this function, base implementation always returns undefined.

        @method resolve
        @param {String} assetRef Asset reference
        @param {String} assetType Asset type
        This can be ignored by the proxy implementation as long as it requests the asset in a format that can be loaded by AssetAPI.
        @return {String|undefined} Proxy URL if this asset ref and type can be fetched from the implementations proxy. Otherwise 'undefined'.
    */
    resolve : function(assetRef, assetType)
    {
        TundraSDK.framework.client.logError("[IHttpProxyResolver]: resolve() function not overridden by implementation " + this.name)
        return undefined
    },

    /**
        Returns data type of the request done to proxyRef. Valid 'dataType' property values are "text", "xml", "arraybuffer" or undefined.
        Return undefined if you wish AssetTransfer to auto detect the data type from the asset type and its request suffix
        (desiredAssetTypeSuffix passed into resolve() earlier).

        The 'timeout' property should be set to number of milliseconds the HTTP transfer should fail after. This is queried from the
        proxy implementation as its the only entity that knows if data conversion will happen on the server. The data conversion may
        take a long time, so this is the proxys change to make timout larger. If 'timeout' is not type of 'number' AssetTransfer will
        use default timeout of 10 seconds.

        IHttpProxyResolver implementation must override this function, base implementation always returns undefined which
        will break asset loading by design so you can detect the bug.

        @example
            // Returned object should have the following properties.
            {
                // HTTP request timeout in milliseconds
                timeout  : <Number>,
                // HTTP request data type as string or undefined.
                dataType : <String or undefined>
            }

        @method resolveRequestMetadata
        @param {AssetTransfer} transfer Asset transfer object making that is executing this function.
        @param {String} proxyRef Full resolved proxy ref that was produced by resolve() earlier.
        @return {Object} With properties 'timeout' and 'dataType'.
    */
    resolveRequestMetadata : function(transfer, proxyRef)
    {
        TundraSDK.framework.client.logError("[IHttpProxyResolver]: resolveRequestMetadata() function not overridden by implementation " + this.name)
        return undefined;
    }
});




/**
    @class RedirectResolver
    @extends IHttpProxyResolver
    @constructor
*/
var RedirectResolver = IHttpProxyResolver.$extend(
{
    __init__ : function()
    {
        this.$super("RedirectResolver");
        this.framework = TundraSDK.framework;

        this.typeSwaps = {};
    },

    /// IHttpProxyResolver override.
    resolve : function(assetRef, assetType)
    {
        // This returns a lowercased with prefix dot which
        // is what we have in the typeSwaps map.
        var fromExt = CoreStringUtils.extension(assetRef);
        var toExt = this.typeSwaps[fromExt];
        if (typeof toExt === "string")
            return assetRef.substring(0, assetRef.length - fromExt.length) + toExt;
        // Undefined will request the asset from the original assetRef.
        return undefined;
    },

    /// IHttpProxyResolver override.
    resolveRequestMetadata : function(transfer, proxyRef)
    {
        // Returning undefined will use AssetAPI, AssetTransfer
        // and AssetFactory to resolve the metadata. This is ok
        // as we know there is an actual AssetFactory behind our swap logic.
        return undefined;
    }
});




/**
    This plugin provides a IHttpProxyResolver implementation that can be configured
    to redirect and change asset requests.

    Use cases where this plugin will be useful to you

    1) You want to fetch relative asset references from a custom host and optionally path.
       For example: "assets/texture.png" -> "http://my.custom.com/my/path/assets/texture.png"
    2) You want to swap asset extensions during runtime in a clean manner.
       For example: "my-mesh.mesh" -> "my-mesh.json"

    @example
        // todo

    @class AssetRedirectPlugin
    @extends ITundraPlugin
    @constructor
*/
var AssetRedirectPlugin = ITundraPlugin.$extend(
{
    __init__ : function()
    {
        this.$super("AssetRedirectPlugin");
        
        this._enabled = true;
        this._defaultStorage = null;
        this.resolver = new RedirectResolver();

        /**
            If asset redirect is enabled.
            @property enabled
            @type Boolean
            @default true
        */
        Object.defineProperties(this, {
            enabled : {
                get : function ()      { return this._enabled; },
                set : function (value) { this.setEnabled(value); }
            },
        });
    },

    initialize : function()
    {
        if (this.enabled)
            AssetAPI.setHttpProxyResolver(this.resolver);
    },

    setEnabled : function(enabled)
    {
        if (typeof enabled !== "boolean")
            enabled = true;
        if (this._enabled === enabled)
            return;
        this._enabled = enabled;
        AssetAPI.setHttpProxyResolver(this._enabled ? this.resolver : null);
    },

    /**
        Setups a custom default storage that will override the server sent default storage.
        This is useful if you are going to receive relative asset references from the server
        and would like to fetch them from a custom host+path or the current pages parent directory.

        If you would like to use the current pages host and parent directory, don't pass 
        any parameters to the invocation.

        @method setupDefaultStorage
        @param {String} [path] Optional path. Defaults to (parent) directory of window.location.pathname
        @param {String} [host] Optional host. Defaults to window.location.protocol + "//" + window.location.host
        @return {Boolean} If registration succeeded.
    */
    setupDefaultStorage : function(path, host)
    {
        if (this.framework.asset == null)
        {
            this.log.error("setupDefaultStorage: AssetAPI not initialized yet. Call after TundraClient has been created.");
            return false;
        }
        if (path === "") path = undefined;
        if (host === "") host = undefined;

        // Host
        host = host || (window.location.protocol + "//" + window.location.host);
        if (!CoreStringUtils.startsWith(host, "http"))
            host = "http://" + host;
        if (CoreStringUtils.endsWith(host, "/"))
            host = host.substring(0, host.length-1);
        // Path
        if (typeof path === "string")
        {
            if (!CoreStringUtils.startsWith(host, "/"))
                path = "/" + path;
        }
        else
        {
            // Use the current pages path directory
            path = window.location.pathname;
            if (!CoreStringUtils.endsWith(path, "/"))
                path = path.substring(0, path.lastIndexOf("/") + 1);
        }
        // Combine
        this._defaultStorage = host + path;
        if (!CoreStringUtils.endsWith(this._defaultStorage, "/"))
            this._defaultStorage += "/";
        this.log.debug("Default storage set to:", this._defaultStorage);
        this.framework.asset.handleDefaultStorage = this.handleDefaultStorageOverride.bind(this);
        return true;
    },

    handleDefaultStorageOverride : function(storageStr)
    {
        var temp = JSON.parse(storageStr);
        if (typeof this._defaultStorage === "string")
        {
            this.framework.asset.defaultStorage =
            {
                default : true,
                name    : "AssetRedirectPluginOverride",
                src     : this._defaultStorage,
                type    : "HttpAssetStorage"
            };
            this.log.debug("Overriding server sent default storage '" + temp.storage.src + "' with '" + this._defaultStorage + "'");
        }
        else
            this.framework.asset.defaultStorage = temp.storage;
    },

    /**
        Registers a asset type swap.

        1) Append the swapped extension to a existing factory.
           Otherwise the request never ends up to our RedirectResolver.

        2) Registers the type extension swap to our RedirectResolver
           to fetch the resource with a new extension.

        @method registerAssetTypeSwap
        @param {String} fromExtension Extension you want to swap eg. ".mesh"
        @param {String} toExtension Asset type extension you want to fetch instead eg. ".json"
        @param {String} toAssetType Asset type name. This must have a existing registered AssetFactory.
        @param {String} [requestDataType] Network request data type. If not provided the
        target factory default will be used.
        @return {Boolean} If registration succeeded.
    */
    registerAssetTypeSwap : function(fromExtension, toExtension, toAssetType, requestDataType)
    {
        if (this.framework.asset == null)
        {
            this.log.error("registerAssetTypeSwap: AssetAPI not initialized yet. Call after TundraClient has been created.");
            return false;
        }
        if (typeof fromExtension !== "string" || fromExtension === "")
        {
            this.log.error("registerAssetTypeSwap: Invalid 'fromExtension':", fromExtension);
            return false;
        }
        else if (typeof toExtension !== "string" || toExtension === "")
        {
            this.log.error("registerAssetTypeSwap: Invalid 'toExtension':", toExtension);
            return false;
        }

        if (fromExtension[0] !== ".") fromExtension = "." + fromExtension;
        if (toExtension[0] !== ".") toExtension = "." + toExtension;
        fromExtension = fromExtension.toLowerCase();
        toExtension = toExtension.toLowerCase();

        var toFactory = this.framework.asset.getAssetFactory(undefined, toAssetType);
        if (toFactory === null)
        {
            this.log.error("registerAssetTypeSwap: AssetFactory not found for '" + toAssetType + "' asset type!");
            return false;
        }
        // If already registered this grants a warning
        if (toFactory.canCreate("fake" + fromExtension))
        {
            this.log.warn("registerAssetTypeSwap: Extension '" + fromExtension + "' already supported by AssetFactory of", toFactory.assetType);
            return false;
        }

        toFactory.typeExtensions[fromExtension] = requestDataType;
        this.resolver.typeSwaps[fromExtension] = toExtension;
        this.log.debug("Registered type swap from", fromExtension, "to", toExtension, "with AssetFactory", toFactory.assetType);
        return true;
    }
});

TundraSDK.registerPlugin(new AssetRedirectPlugin());




var tundra = tundra || {};

tundra.createWebTundraClient = function(params) {
    if (params === undefined || params === null)
        params = {};
    if (params.renderSystem === undefined)
        params.renderSystem = ThreeJsRenderer;

    // Instantiate the client
    tundra.client = new TundraClient({
        container              : params.container,
        renderSystem           : params.renderSystem,
        asset                  : params.asset,
        applications           : params.applications
    });
    tundra.TundraSDK = TundraSDK;

    return tundra.client;
}

