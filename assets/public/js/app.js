var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/@capacitor/core/dist/index.js
var createCapacitorPlatforms, initPlatforms, CapacitorPlatforms, addPlatform, setPlatform, ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, Plugins, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp;
var init_dist = __esm({
  "node_modules/@capacitor/core/dist/index.js"() {
    createCapacitorPlatforms = (win) => {
      const defaultPlatformMap = /* @__PURE__ */ new Map();
      defaultPlatformMap.set("web", { name: "web" });
      const capPlatforms = win.CapacitorPlatforms || {
        currentPlatform: { name: "web" },
        platforms: defaultPlatformMap
      };
      const addPlatform2 = (name, platform) => {
        capPlatforms.platforms.set(name, platform);
      };
      const setPlatform2 = (name) => {
        if (capPlatforms.platforms.has(name)) {
          capPlatforms.currentPlatform = capPlatforms.platforms.get(name);
        }
      };
      capPlatforms.addPlatform = addPlatform2;
      capPlatforms.setPlatform = setPlatform2;
      return capPlatforms;
    };
    initPlatforms = (win) => win.CapacitorPlatforms = createCapacitorPlatforms(win);
    CapacitorPlatforms = /* @__PURE__ */ initPlatforms(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
    addPlatform = CapacitorPlatforms.addPlatform;
    setPlatform = CapacitorPlatforms.setPlatform;
    (function(ExceptionCode2) {
      ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
      ExceptionCode2["Unavailable"] = "UNAVAILABLE";
    })(ExceptionCode || (ExceptionCode = {}));
    CapacitorException = class extends Error {
      constructor(message, code, data) {
        super(message);
        this.message = message;
        this.code = code;
        this.data = data;
      }
    };
    getPlatformId = (win) => {
      var _a, _b;
      if (win === null || win === void 0 ? void 0 : win.androidBridge) {
        return "android";
      } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
        return "ios";
      } else {
        return "web";
      }
    };
    createCapacitor = (win) => {
      var _a, _b, _c, _d, _e;
      const capCustomPlatform = win.CapacitorCustomPlatform || null;
      const cap = win.Capacitor || {};
      const Plugins2 = cap.Plugins = cap.Plugins || {};
      const capPlatforms = win.CapacitorPlatforms;
      const defaultGetPlatform = () => {
        return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
      };
      const getPlatform = ((_a = capPlatforms === null || capPlatforms === void 0 ? void 0 : capPlatforms.currentPlatform) === null || _a === void 0 ? void 0 : _a.getPlatform) || defaultGetPlatform;
      const defaultIsNativePlatform = () => getPlatform() !== "web";
      const isNativePlatform = ((_b = capPlatforms === null || capPlatforms === void 0 ? void 0 : capPlatforms.currentPlatform) === null || _b === void 0 ? void 0 : _b.isNativePlatform) || defaultIsNativePlatform;
      const defaultIsPluginAvailable = (pluginName) => {
        const plugin = registeredPlugins.get(pluginName);
        if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
          return true;
        }
        if (getPluginHeader(pluginName)) {
          return true;
        }
        return false;
      };
      const isPluginAvailable = ((_c = capPlatforms === null || capPlatforms === void 0 ? void 0 : capPlatforms.currentPlatform) === null || _c === void 0 ? void 0 : _c.isPluginAvailable) || defaultIsPluginAvailable;
      const defaultGetPluginHeader = (pluginName) => {
        var _a2;
        return (_a2 = cap.PluginHeaders) === null || _a2 === void 0 ? void 0 : _a2.find((h) => h.name === pluginName);
      };
      const getPluginHeader = ((_d = capPlatforms === null || capPlatforms === void 0 ? void 0 : capPlatforms.currentPlatform) === null || _d === void 0 ? void 0 : _d.getPluginHeader) || defaultGetPluginHeader;
      const handleError = (err) => win.console.error(err);
      const pluginMethodNoop = (_target, prop, pluginName) => {
        return Promise.reject(`${pluginName} does not have an implementation of "${prop}".`);
      };
      const registeredPlugins = /* @__PURE__ */ new Map();
      const defaultRegisterPlugin = (pluginName, jsImplementations = {}) => {
        const registeredPlugin = registeredPlugins.get(pluginName);
        if (registeredPlugin) {
          console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
          return registeredPlugin.proxy;
        }
        const platform = getPlatform();
        const pluginHeader = getPluginHeader(pluginName);
        let jsImplementation;
        const loadPluginImplementation = async () => {
          if (!jsImplementation && platform in jsImplementations) {
            jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
          } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
            jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
          }
          return jsImplementation;
        };
        const createPluginMethod = (impl, prop) => {
          var _a2, _b2;
          if (pluginHeader) {
            const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
            if (methodHeader) {
              if (methodHeader.rtype === "promise") {
                return (options) => cap.nativePromise(pluginName, prop.toString(), options);
              } else {
                return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
              }
            } else if (impl) {
              return (_a2 = impl[prop]) === null || _a2 === void 0 ? void 0 : _a2.bind(impl);
            }
          } else if (impl) {
            return (_b2 = impl[prop]) === null || _b2 === void 0 ? void 0 : _b2.bind(impl);
          } else {
            throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
          }
        };
        const createPluginMethodWrapper = (prop) => {
          let remove;
          const wrapper = (...args) => {
            const p = loadPluginImplementation().then((impl) => {
              const fn = createPluginMethod(impl, prop);
              if (fn) {
                const p2 = fn(...args);
                remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                return p2;
              } else {
                throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
              }
            });
            if (prop === "addListener") {
              p.remove = async () => remove();
            }
            return p;
          };
          wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
          Object.defineProperty(wrapper, "name", {
            value: prop,
            writable: false,
            configurable: false
          });
          return wrapper;
        };
        const addListener = createPluginMethodWrapper("addListener");
        const removeListener = createPluginMethodWrapper("removeListener");
        const addListenerNative = (eventName, callback) => {
          const call = addListener({ eventName }, callback);
          const remove = async () => {
            const callbackId = await call;
            removeListener({
              eventName,
              callbackId
            }, callback);
          };
          const p = new Promise((resolve) => call.then(() => resolve({ remove })));
          p.remove = async () => {
            console.warn(`Using addListener() without 'await' is deprecated.`);
            await remove();
          };
          return p;
        };
        const proxy = new Proxy({}, {
          get(_, prop) {
            switch (prop) {
              // https://github.com/facebook/react/issues/20030
              case "$$typeof":
                return void 0;
              case "toJSON":
                return () => ({});
              case "addListener":
                return pluginHeader ? addListenerNative : addListener;
              case "removeListener":
                return removeListener;
              default:
                return createPluginMethodWrapper(prop);
            }
          }
        });
        Plugins2[pluginName] = proxy;
        registeredPlugins.set(pluginName, {
          name: pluginName,
          proxy,
          platforms: /* @__PURE__ */ new Set([
            ...Object.keys(jsImplementations),
            ...pluginHeader ? [platform] : []
          ])
        });
        return proxy;
      };
      const registerPlugin2 = ((_e = capPlatforms === null || capPlatforms === void 0 ? void 0 : capPlatforms.currentPlatform) === null || _e === void 0 ? void 0 : _e.registerPlugin) || defaultRegisterPlugin;
      if (!cap.convertFileSrc) {
        cap.convertFileSrc = (filePath) => filePath;
      }
      cap.getPlatform = getPlatform;
      cap.handleError = handleError;
      cap.isNativePlatform = isNativePlatform;
      cap.isPluginAvailable = isPluginAvailable;
      cap.pluginMethodNoop = pluginMethodNoop;
      cap.registerPlugin = registerPlugin2;
      cap.Exception = CapacitorException;
      cap.DEBUG = !!cap.DEBUG;
      cap.isLoggingEnabled = !!cap.isLoggingEnabled;
      cap.platform = cap.getPlatform();
      cap.isNative = cap.isNativePlatform();
      return cap;
    };
    initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
    Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
    registerPlugin = Capacitor.registerPlugin;
    Plugins = Capacitor.Plugins;
    WebPlugin = class {
      constructor(config) {
        this.listeners = {};
        this.windowListeners = {};
        if (config) {
          console.warn(`Capacitor WebPlugin "${config.name}" config object was deprecated in v3 and will be removed in v4.`);
          this.config = config;
        }
      }
      addListener(eventName, listenerFunc) {
        const listeners = this.listeners[eventName];
        if (!listeners) {
          this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(listenerFunc);
        const windowListener = this.windowListeners[eventName];
        if (windowListener && !windowListener.registered) {
          this.addWindowListener(windowListener);
        }
        const remove = async () => this.removeListener(eventName, listenerFunc);
        const p = Promise.resolve({ remove });
        Object.defineProperty(p, "remove", {
          value: async () => {
            console.warn(`Using addListener() without 'await' is deprecated.`);
            await remove();
          }
        });
        return p;
      }
      async removeAllListeners() {
        this.listeners = {};
        for (const listener in this.windowListeners) {
          this.removeWindowListener(this.windowListeners[listener]);
        }
        this.windowListeners = {};
      }
      notifyListeners(eventName, data) {
        const listeners = this.listeners[eventName];
        if (listeners) {
          listeners.forEach((listener) => listener(data));
        }
      }
      hasListeners(eventName) {
        return !!this.listeners[eventName].length;
      }
      registerWindowListener(windowEventName, pluginEventName) {
        this.windowListeners[pluginEventName] = {
          registered: false,
          windowEventName,
          pluginEventName,
          handler: (event) => {
            this.notifyListeners(pluginEventName, event);
          }
        };
      }
      unimplemented(msg = "not implemented") {
        return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
      }
      unavailable(msg = "not available") {
        return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
      }
      async removeListener(eventName, listenerFunc) {
        const listeners = this.listeners[eventName];
        if (!listeners) {
          return;
        }
        const index = listeners.indexOf(listenerFunc);
        this.listeners[eventName].splice(index, 1);
        if (!this.listeners[eventName].length) {
          this.removeWindowListener(this.windowListeners[eventName]);
        }
      }
      addWindowListener(handle) {
        window.addEventListener(handle.windowEventName, handle.handler);
        handle.registered = true;
      }
      removeWindowListener(handle) {
        if (!handle) {
          return;
        }
        window.removeEventListener(handle.windowEventName, handle.handler);
        handle.registered = false;
      }
    };
    encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
    decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
    CapacitorCookiesPluginWeb = class extends WebPlugin {
      async getCookies() {
        const cookies = document.cookie;
        const cookieMap = {};
        cookies.split(";").forEach((cookie) => {
          if (cookie.length <= 0)
            return;
          let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
          key = decode(key).trim();
          value = decode(value).trim();
          cookieMap[key] = value;
        });
        return cookieMap;
      }
      async setCookie(options) {
        try {
          const encodedKey = encode(options.key);
          const encodedValue = encode(options.value);
          const expires = `; expires=${(options.expires || "").replace("expires=", "")}`;
          const path = (options.path || "/").replace("path=", "");
          const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
          document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async deleteCookie(options) {
        try {
          document.cookie = `${options.key}=; Max-Age=0`;
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async clearCookies() {
        try {
          const cookies = document.cookie.split(";") || [];
          for (const cookie of cookies) {
            document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
          }
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async clearAllCookies() {
        try {
          await this.clearCookies();
        } catch (error) {
          return Promise.reject(error);
        }
      }
    };
    CapacitorCookies = registerPlugin("CapacitorCookies", {
      web: () => new CapacitorCookiesPluginWeb()
    });
    readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result;
        resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
    normalizeHttpHeaders = (headers = {}) => {
      const originalKeys = Object.keys(headers);
      const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
      const normalized = loweredKeys.reduce((acc, key, index) => {
        acc[key] = headers[originalKeys[index]];
        return acc;
      }, {});
      return normalized;
    };
    buildUrlParams = (params, shouldEncode = true) => {
      if (!params)
        return null;
      const output = Object.entries(params).reduce((accumulator, entry) => {
        const [key, value] = entry;
        let encodedValue;
        let item;
        if (Array.isArray(value)) {
          item = "";
          value.forEach((str) => {
            encodedValue = shouldEncode ? encodeURIComponent(str) : str;
            item += `${key}=${encodedValue}&`;
          });
          item.slice(0, -1);
        } else {
          encodedValue = shouldEncode ? encodeURIComponent(value) : value;
          item = `${key}=${encodedValue}`;
        }
        return `${accumulator}&${item}`;
      }, "");
      return output.substr(1);
    };
    buildRequestInit = (options, extra = {}) => {
      const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
      const headers = normalizeHttpHeaders(options.headers);
      const type = headers["content-type"] || "";
      if (typeof options.data === "string") {
        output.body = options.data;
      } else if (type.includes("application/x-www-form-urlencoded")) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(options.data || {})) {
          params.set(key, value);
        }
        output.body = params.toString();
      } else if (type.includes("multipart/form-data")) {
        const form = new FormData();
        if (options.data instanceof FormData) {
          options.data.forEach((value, key) => {
            form.append(key, value);
          });
        } else {
          for (const key of Object.keys(options.data)) {
            form.append(key, options.data[key]);
          }
        }
        output.body = form;
        const headers2 = new Headers(output.headers);
        headers2.delete("content-type");
        output.headers = headers2;
      } else if (type.includes("application/json") || typeof options.data === "object") {
        output.body = JSON.stringify(options.data);
      }
      return output;
    };
    CapacitorHttpPluginWeb = class extends WebPlugin {
      /**
       * Perform an Http request given a set of options
       * @param options Options to build the HTTP request
       */
      async request(options) {
        const requestInit = buildRequestInit(options, options.webFetchExtra);
        const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
        const url = urlParams ? `${options.url}?${urlParams}` : options.url;
        const response = await fetch(url, requestInit);
        const contentType = response.headers.get("content-type") || "";
        let { responseType = "text" } = response.ok ? options : {};
        if (contentType.includes("application/json")) {
          responseType = "json";
        }
        let data;
        let blob;
        switch (responseType) {
          case "arraybuffer":
          case "blob":
            blob = await response.blob();
            data = await readBlobAsBase64(blob);
            break;
          case "json":
            data = await response.json();
            break;
          case "document":
          case "text":
          default:
            data = await response.text();
        }
        const headers = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        return {
          data,
          headers,
          status: response.status,
          url: response.url
        };
      }
      /**
       * Perform an Http GET request given a set of options
       * @param options Options to build the HTTP request
       */
      async get(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
      }
      /**
       * Perform an Http POST request given a set of options
       * @param options Options to build the HTTP request
       */
      async post(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
      }
      /**
       * Perform an Http PUT request given a set of options
       * @param options Options to build the HTTP request
       */
      async put(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
      }
      /**
       * Perform an Http PATCH request given a set of options
       * @param options Options to build the HTTP request
       */
      async patch(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
      }
      /**
       * Perform an Http DELETE request given a set of options
       * @param options Options to build the HTTP request
       */
      async delete(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
      }
    };
    CapacitorHttp = registerPlugin("CapacitorHttp", {
      web: () => new CapacitorHttpPluginWeb()
    });
  }
});

// node_modules/@capacitor/haptics/dist/esm/definitions.js
var ImpactStyle, NotificationType;
var init_definitions = __esm({
  "node_modules/@capacitor/haptics/dist/esm/definitions.js"() {
    (function(ImpactStyle2) {
      ImpactStyle2["Heavy"] = "HEAVY";
      ImpactStyle2["Medium"] = "MEDIUM";
      ImpactStyle2["Light"] = "LIGHT";
    })(ImpactStyle || (ImpactStyle = {}));
    (function(NotificationType2) {
      NotificationType2["Success"] = "SUCCESS";
      NotificationType2["Warning"] = "WARNING";
      NotificationType2["Error"] = "ERROR";
    })(NotificationType || (NotificationType = {}));
  }
});

// node_modules/@capacitor/haptics/dist/esm/web.js
var web_exports = {};
__export(web_exports, {
  HapticsWeb: () => HapticsWeb
});
var HapticsWeb;
var init_web = __esm({
  "node_modules/@capacitor/haptics/dist/esm/web.js"() {
    init_dist();
    init_definitions();
    HapticsWeb = class extends WebPlugin {
      constructor() {
        super(...arguments);
        this.selectionStarted = false;
      }
      async impact(options) {
        const pattern = this.patternForImpact(options === null || options === void 0 ? void 0 : options.style);
        this.vibrateWithPattern(pattern);
      }
      async notification(options) {
        const pattern = this.patternForNotification(options === null || options === void 0 ? void 0 : options.type);
        this.vibrateWithPattern(pattern);
      }
      async vibrate(options) {
        const duration = (options === null || options === void 0 ? void 0 : options.duration) || 300;
        this.vibrateWithPattern([duration]);
      }
      async selectionStart() {
        this.selectionStarted = true;
      }
      async selectionChanged() {
        if (this.selectionStarted) {
          this.vibrateWithPattern([70]);
        }
      }
      async selectionEnd() {
        this.selectionStarted = false;
      }
      patternForImpact(style = ImpactStyle.Heavy) {
        if (style === ImpactStyle.Medium) {
          return [43];
        } else if (style === ImpactStyle.Light) {
          return [20];
        }
        return [61];
      }
      patternForNotification(type = NotificationType.Success) {
        if (type === NotificationType.Warning) {
          return [30, 40, 30, 50, 60];
        } else if (type === NotificationType.Error) {
          return [27, 45, 50];
        }
        return [35, 65, 21];
      }
      vibrateWithPattern(pattern) {
        if (navigator.vibrate) {
          navigator.vibrate(pattern);
        } else {
          throw this.unavailable("Browser does not support the vibrate API");
        }
      }
    };
  }
});

// node_modules/@capacitor/app/dist/esm/web.js
var web_exports2 = {};
__export(web_exports2, {
  AppWeb: () => AppWeb
});
var AppWeb;
var init_web2 = __esm({
  "node_modules/@capacitor/app/dist/esm/web.js"() {
    init_dist();
    AppWeb = class extends WebPlugin {
      constructor() {
        super();
        this.handleVisibilityChange = () => {
          const data = {
            isActive: document.hidden !== true
          };
          this.notifyListeners("appStateChange", data);
          if (document.hidden) {
            this.notifyListeners("pause", null);
          } else {
            this.notifyListeners("resume", null);
          }
        };
        document.addEventListener("visibilitychange", this.handleVisibilityChange, false);
      }
      exitApp() {
        throw this.unimplemented("Not implemented on web.");
      }
      async getInfo() {
        throw this.unimplemented("Not implemented on web.");
      }
      async getLaunchUrl() {
        return { url: "" };
      }
      async getState() {
        return { isActive: document.hidden !== true };
      }
      async minimizeApp() {
        throw this.unimplemented("Not implemented on web.");
      }
    };
  }
});

// node_modules/@jofr/capacitor-media-session/dist/esm/web.js
var web_exports3 = {};
__export(web_exports3, {
  MediaSessionWeb: () => MediaSessionWeb
});
var MediaSessionWeb;
var init_web3 = __esm({
  "node_modules/@jofr/capacitor-media-session/dist/esm/web.js"() {
    init_dist();
    MediaSessionWeb = class extends WebPlugin {
      async setMetadata(options) {
        if ("mediaSession" in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata(options);
        } else {
          throw this.unavailable("Media Session API not available in this browser.");
        }
      }
      async setPlaybackState(options) {
        if ("mediaSession" in navigator) {
          navigator.mediaSession.playbackState = options.playbackState;
        } else {
          throw this.unavailable("Media Session API not available in this browser.");
        }
      }
      async setActionHandler(options, handler) {
        if ("mediaSession" in navigator) {
          navigator.mediaSession.setActionHandler(options.action, handler);
        } else {
          throw this.unavailable("Media Session API not available in this browser.");
        }
      }
      async setPositionState(options) {
        if ("mediaSession" in navigator) {
          navigator.mediaSession.setPositionState(options);
        } else {
          throw this.unavailable("Media Session API not available in this browser.");
        }
      }
    };
  }
});

// js/quran-data.js
var TRANSLITERATION_ALIASES = {
  allah: "\u0627\u0644\u0644\u0647",
  allahumma: "\u0627\u0644\u0644\u0647\u0645",
  rahman: "\u0627\u0644\u0631\u062D\u0645\u0646",
  raheem: "\u0627\u0644\u0631\u062D\u064A\u0645",
  rahim: "\u0627\u0644\u0631\u062D\u064A\u0645",
  rahmat: "\u0631\u062D\u0645\u0629",
  rahmah: "\u0631\u062D\u0645\u0629",
  mercy: "mercy",
  iman: "\u0625\u064A\u0645\u0627\u0646",
  imaan: "\u0625\u064A\u0645\u0627\u0646",
  faith: "faith",
  shukr: "\u0634\u0643\u0631",
  sabr: "\u0635\u0628\u0631",
  salah: "\u0635\u0644\u0627\u0629",
  salat: "\u0635\u0644\u0627\u0629",
  dua: "\u062F\u0639\u0627\u0621",
  duaa: "\u062F\u0639\u0627\u0621",
  quran: "\u0642\u0631\u0622\u0646",
  noor: "\u0646\u0648\u0631",
  nur: "\u0646\u0648\u0631",
  huda: "\u0647\u062F\u0649",
  taqwa: "\u062A\u0642\u0648\u0649",
  rizq: "\u0631\u0632\u0642",
  tawbah: "\u062A\u0648\u0628\u0629",
  tauba: "\u062A\u0648\u0628\u0629",
  jannah: "\u062C\u0646\u0629",
  deen: "\u062F\u064A\u0646",
  nabi: "\u0646\u0628\u064A"
};
var ROOT_LEXICON = [
  { match: /(?:رحم|mercy|مہربان)/iu, root: "\u0631 \u062D \u0645", transliteration: "r-\u1E25-m", meaning: "Mercy, tenderness, and compassionate care." },
  { match: /(?:غفر|forgiv|بخشش)/iu, root: "\u063A \u0641 \u0631", transliteration: "gh-f-r", meaning: "To cover, forgive, and protect." },
  { match: /(?:شكر|gratitude|شکر)/iu, root: "\u0634 \u0643 \u0631", transliteration: "sh-k-r", meaning: "Thankfulness and acknowledgment of blessing." },
  { match: /(?:صبر|patien|صبر)/iu, root: "\u0635 \u0628 \u0631", transliteration: "\u1E63-b-r", meaning: "Steadfastness, restraint, and perseverance." },
  { match: /(?:علم|know|علم)/iu, root: "\u0639 \u0644 \u0645", transliteration: "\u02BF-l-m", meaning: "Knowledge, awareness, and discernment." },
  { match: /(?:امن|ايمان|faith|ایمان)/iu, root: "\u0623 \u0645 \u0646", transliteration: "\u02BE-m-n", meaning: "Security, trust, and faith." },
  { match: /(?:هدى|guidance|ہدایت)/iu, root: "\u0647 \u062F \u064A", transliteration: "h-d-y", meaning: "Guidance and being led to the right path." },
  { match: /(?:نور|light|روشنی)/iu, root: "\u0646 \u0648 \u0631", transliteration: "n-w-r", meaning: "Light, illumination, and clarity." },
  { match: /(?:دعو|دعاء|prayer|دعا)/iu, root: "\u062F \u0639 \u0648", transliteration: "d-\u02BF-w", meaning: "To call, invite, or supplicate." },
  { match: /(?:رزق|provision|رزق)/iu, root: "\u0631 \u0632 \u0642", transliteration: "r-z-q", meaning: "Provision and sustenance." },
  { match: /(?:توب|repent|توبہ)/iu, root: "\u062A \u0648 \u0628", transliteration: "t-w-b", meaning: "To return; repentance." },
  { match: /(?:صلو|صلا|prayer|نماز)/iu, root: "\u0635 \u0644 \u0648", transliteration: "\u1E63-l-w", meaning: "Prayer and connection." }
];
var OFFLINE_AYAHS = [
  {
    number: 1,
    numberInSurah: 1,
    juz: 1,
    page: 1,
    surah: { number: 1, name: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0671\u0644\u0652\u0641\u064E\u0627\u062A\u0650\u062D\u064E\u0629\u0650", englishName: "Al-Faatiha", revelationType: "Meccan" },
    arabic: "\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u064E\u0651\u0647\u0650 \u0671\u0644\u0631\u064E\u0651\u062D\u0652\u0645\u064E\u0670\u0646\u0650 \u0671\u0644\u0631\u064E\u0651\u062D\u0650\u064A\u0645\u0650",
    english: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
    urdu: "\u0634\u0631\u0648\u0639 \u0627\u0644\u0644\u06C1 \u06A9\u06D2 \u0646\u0627\u0645 \u0633\u06D2 \u062C\u0648 \u0628\u0691\u0627 \u0645\u06C1\u0631\u0628\u0627\u0646 \u0646\u06C1\u0627\u06CC\u062A \u0631\u062D\u0645 \u0648\u0627\u0644\u0627 \u06C1\u06D2\u06D4",
    searchKeys: ["\u0627\u0644\u0644\u0647", "allah", "\u0631\u062D\u0645\u0646", "rahman", "\u0631\u062D\u064A\u0645", "raheem", "mercy", "\u0631\u062D\u0645\u062A"]
  },
  {
    number: 164,
    numberInSurah: 157,
    juz: 2,
    page: 24,
    surah: { number: 2, name: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0628\u064E\u0642\u064E\u0631\u064E\u0629\u0650", englishName: "Al-Baqara", revelationType: "Medinan" },
    arabic: "\u0623\u064F\u0648\u0644\u064E\u0670\u0626\u0650\u0643\u064E \u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650\u0645\u0652 \u0635\u064E\u0644\u064E\u0648\u064E\u0627\u062A\u064C \u0645\u0650\u0651\u0646 \u0631\u064E\u0651\u0628\u0650\u0651\u0647\u0650\u0645\u0652 \u0648\u064E\u0631\u064E\u062D\u0652\u0645\u064E\u0629\u064C \u06D6 \u0648\u064E\u0623\u064F\u0648\u0644\u064E\u0670\u0626\u0650\u0643\u064E \u0647\u064F\u0645\u064F \u0627\u0644\u0652\u0645\u064F\u0647\u0652\u062A\u064E\u062F\u064F\u0648\u0646\u064E",
    english: "Those are the ones upon whom are blessings from their Lord and mercy. And it is those who are the guided.",
    urdu: "\u06CC\u06C1\u06CC \u0644\u0648\u06AF \u06C1\u06CC\u06BA \u062C\u0646 \u067E\u0631 \u0627\u0646 \u06A9\u06D2 \u067E\u0631\u0648\u0631\u062F\u06AF\u0627\u0631 \u06A9\u06CC \u0645\u06C1\u0631\u0628\u0627\u0646\u06CC \u0627\u0648\u0631 \u0631\u062D\u0645\u062A \u06C1\u06D2\u06D4 \u0627\u0648\u0631 \u06CC\u06C1\u06CC \u0633\u06CC\u062F\u06BE\u06D2 \u0631\u0633\u062A\u06D2 \u067E\u0631 \u06C1\u06CC\u06BA\u06D4",
    searchKeys: ["\u0631\u062D\u0645\u0629", "\u0631\u062D\u0645\u062A", "rahmat", "rahmah", "mercy", "\u06C1\u062F\u0627\u06CC\u062A", "guidance"]
  },
  {
    number: 186,
    numberInSurah: 179,
    juz: 2,
    page: 28,
    surah: { number: 2, name: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0628\u064E\u0642\u064E\u0631\u064E\u0629\u0650", englishName: "Al-Baqara", revelationType: "Medinan" },
    arabic: "\u064A\u064E\u0627 \u0623\u064E\u064A\u064F\u0651\u0647\u064E\u0627 \u0627\u0644\u064E\u0651\u0630\u0650\u064A\u0646\u064E \u0622\u0645\u064E\u0646\u064F\u0648\u0627 \u0643\u064F\u062A\u0650\u0628\u064E \u0639\u064E\u0644\u064E\u064A\u0652\u0643\u064F\u0645\u064F \u0627\u0644\u0652\u0642\u0650\u0635\u064E\u0627\u0635\u064F \u0641\u0650\u064A \u0627\u0644\u0652\u0642\u064E\u062A\u0652\u0644\u064E\u0649\u0670",
    english: "O you who have believed, prescribed for you is legal retribution for those murdered.",
    urdu: "\u0645\u0648\u0645\u0646\u0648! \u062A\u0645 \u067E\u0631 \u0645\u0642\u062A\u0648\u0644\u0648\u06BA \u06A9\u0627 \u0642\u0635\u0627\u0635 \u0641\u0631\u0636 \u06A9\u06CC\u0627 \u06AF\u06CC\u0627 \u06C1\u06D2\u06D4",
    searchKeys: ["\u0622\u0645\u0646\u0648\u0627", "\u0627\u06CC\u0645\u0627\u0646", "iman", "imaan", "faith"]
  },
  {
    number: 152,
    numberInSurah: 145,
    juz: 2,
    page: 22,
    surah: { number: 2, name: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0628\u064E\u0642\u064E\u0631\u064E\u0629\u0650", englishName: "Al-Baqara", revelationType: "Medinan" },
    arabic: "\u0641\u064E\u0627\u0630\u0652\u0643\u064F\u0631\u064F\u0648\u0646\u0650\u064A \u0623\u064E\u0630\u0652\u0643\u064F\u0631\u0652\u0643\u064F\u0645\u0652 \u0648\u064E\u0627\u0634\u0652\u0643\u064F\u0631\u064F\u0648\u0627 \u0644\u0650\u064A \u0648\u064E\u0644\u064E\u0627 \u062A\u064E\u0643\u0652\u0641\u064F\u0631\u064F\u0648\u0646\u0650",
    english: "So remember Me; I will remember you. And be grateful to Me and do not deny Me.",
    urdu: "\u0633\u0648 \u062A\u0645 \u0645\u062C\u06BE\u06D2 \u06CC\u0627\u062F \u06A9\u0631\u0648 \u0645\u06CC\u06BA \u062A\u0645 \u06A9\u0648 \u06CC\u0627\u062F \u06A9\u0631\u0648\u06BA \u06AF\u0627 \u0627\u0648\u0631 \u0645\u06CC\u0631\u0627 \u0627\u062D\u0633\u0627\u0646 \u0645\u0627\u0646\u0648 \u0627\u0648\u0631 \u0646\u0627\u0634\u06A9\u0631\u06CC \u0646\u06C1 \u06A9\u0631\u0648\u06D4",
    searchKeys: ["\u0634\u0643\u0631", "\u0634\u06A9\u0631", "shukr", "grateful", "gratitude"]
  }
];
var QUICK_CONCEPTS = [
  { label: "\u0635\u0628\u0631", query: "\u0635\u0628\u0631" },
  { label: "\u0634\u06A9\u0631", query: "\u0634\u0643\u0631" },
  { label: "\u062C\u0646\u062A", query: "\u062C\u0646\u0629" },
  { label: "\u0646\u0648\u0631", query: "\u0646\u0648\u0631" },
  { label: "\u062D\u0642", query: "\u062D\u0642" },
  { label: "\u062A\u0648\u06A9\u0644", query: "\u062A\u0648\u0643\u0644" },
  { label: "\u062F\u0639\u0627", query: "\u062F\u0639\u0627\u0621" },
  { label: "\u06C1\u062F\u0627\u06CC\u062A", query: "\u0647\u062F\u0649" },
  { label: "\u062A\u0642\u0648\u06CC", query: "\u062A\u0642\u0648\u0649" },
  { label: "\u0631\u0632\u0642", query: "\u0631\u0632\u0642" },
  { label: "\u062A\u0648\u0628\u06C1", query: "\u062A\u0648\u0628\u0629" },
  { label: "\u0633\u0644\u0627\u0645", query: "\u0633\u0644\u0627\u0645" },
  { label: "\u0639\u062F\u0644", query: "\u0639\u062F\u0644" },
  { label: "\u0631\u062D\u0645\u062A", query: "\u0631\u062D\u0645\u0629" },
  { label: "Mercy", query: "mercy" },
  { label: "Faith", query: "faith" }
];

// js/storage.js
var KEYS = {
  history: "magniaayat.history.v1",
  bookmarks: "magniaayat.bookmarks.v1",
  preferences: "magniaayat.preferences.v1",
  arabicIndex: "magniaayat.arabic-index.v1"
};
function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
  }
}
var storage = {
  history: () => safeRead(KEYS.history, []),
  saveHistory(items) {
    safeWrite(KEYS.history, items.slice(0, 12));
  },
  bookmarks: () => safeRead(KEYS.bookmarks, []),
  saveBookmarks(items) {
    safeWrite(KEYS.bookmarks, items);
  },
  preferences: () => safeRead(KEYS.preferences, { translation: "both" }),
  savePreferences(value) {
    safeWrite(KEYS.preferences, value);
  },
  getArabicIndex() {
    return safeRead(KEYS.arabicIndex, null);
  },
  saveArabicIndex(index) {
    safeWrite(KEYS.arabicIndex, index);
  },
  clearAll() {
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  }
};

// js/api-service.js
var API_BASE = "https://api.alquran.cloud/v1";
var ARABIC_MARKS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\uFEFF]/g;
var QuranApiError = class extends Error {
  constructor(message, code = 0, cancelled = false) {
    super(message);
    this.name = "QuranApiError";
    this.code = code;
    this.cancelled = cancelled;
  }
};
function cancellationError() {
  return new QuranApiError("Search cancelled.", 499, true);
}
function throwIfAborted(signal) {
  if (signal?.aborted) throw cancellationError();
}
function normalise(value = "") {
  return String(value).normalize("NFKD").replace(ARABIC_MARKS, "").replace(/[أإآٱ]/g, "\u0627").replace(/ى/g, "\u064A").replace(/ة/g, "\u0647").replace(/ـ/g, "").toLocaleLowerCase();
}
function isArabic(value) {
  return /[\u0600-\u06FF]/.test(value);
}
function looksUrdu(value) {
  return /[ےٹڈڑںھچپگژ]/.test(value);
}
function isLatin(value) {
  return /[a-z]/i.test(value);
}
function toRecord(match, arabicIndex, sourceEdition, query) {
  const indexed = arabicIndex?.[match.number];
  const surah = indexed?.surah || match.surah || { number: 0, name: "\u2014", englishName: "Quran", revelationType: "Unknown" };
  return {
    number: match.number,
    numberInSurah: indexed?.numberInSurah ?? match.numberInSurah,
    juz: indexed?.juz ?? null,
    page: indexed?.page ?? null,
    surah,
    arabic: indexed?.arabic || (sourceEdition === "quran-uthmani" ? match.text : ""),
    english: sourceEdition === "en.sahih" ? match.text : "",
    urdu: sourceEdition === "ur.jalandhry" ? match.text : "",
    matchText: match.text,
    matchEdition: sourceEdition,
    query,
    source: "live"
  };
}
function fallbackSearch(query) {
  const needle = normalise(query);
  return OFFLINE_AYAHS.filter((ayah) => {
    const haystack = [...ayah.searchKeys, ayah.arabic, ayah.english, ayah.urdu].map(normalise).join(" ");
    return haystack.includes(needle) || ayah.searchKeys.some((key) => normalise(key) === needle);
  }).map((ayah) => ({
    ...ayah,
    matchText: ayah.arabic,
    matchEdition: isLatin(query) ? "en.sahih" : "quran-uthmani",
    query,
    source: "offline"
  }));
}
var QuranApiService = class {
  constructor() {
    this.arabicIndexPromise = null;
  }
  /** Request helper with both timeout and caller-owned cancellation. */
  async request(path, { timeout = 18e3, signal } = {}) {
    throwIfAborted(signal);
    const controller = new AbortController();
    const abortFromCaller = () => controller.abort();
    signal?.addEventListener("abort", abortFromCaller, { once: true });
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.code !== 200) {
        throw new QuranApiError(payload?.data || "No matching verses were found.", response.status);
      }
      return payload.data;
    } catch (error) {
      if (error instanceof QuranApiError) throw error;
      if (signal?.aborted) throw cancellationError();
      if (error?.name === "AbortError") throw new QuranApiError("The Quran service took too long to respond.");
      throw new QuranApiError("Could not reach the Quran service. Check your connection and try again.");
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abortFromCaller);
    }
  }
  resolveSearch(input) {
    const original = input.trim().replace(/\s+/g, " ");
    const lower = original.toLowerCase();
    const alias = TRANSLITERATION_ALIASES[lower];
    if (alias && isLatin(original) && alias !== original) {
      return { query: alias, displayQuery: original, edition: isLatin(alias) ? "en.sahih" : "quran-uthmani", aliased: true };
    }
    if (looksUrdu(original)) return { query: original, displayQuery: original, edition: "ur.jalandhry", aliased: false };
    if (isArabic(original)) return { query: original, displayQuery: original, edition: "quran-uthmani", aliased: false };
    return { query: original, displayQuery: original, edition: "en.sahih", aliased: false };
  }
  /**
   * The metadata index is intentionally shared and not tied to a search's
   * AbortSignal: cancelling one search must never cancel the next search's
   * Arabic text enrichment.
   */
  async loadArabicIndex() {
    if (this.arabicIndexPromise) return this.arabicIndexPromise;
    const cached = storage.getArabicIndex();
    if (cached && typeof cached === "object" && Object.keys(cached).length > 6e3) {
      this.arabicIndexPromise = Promise.resolve(cached);
      return this.arabicIndexPromise;
    }
    this.arabicIndexPromise = this.request("/quran/quran-uthmani", { timeout: 3e4 }).then((data) => {
      const index = {};
      data.surahs.forEach((surah) => {
        const briefSurah = {
          number: surah.number,
          name: surah.name,
          englishName: surah.englishName,
          englishNameTranslation: surah.englishNameTranslation,
          revelationType: surah.revelationType
        };
        surah.ayahs.forEach((ayah) => {
          index[ayah.number] = {
            arabic: ayah.text.replace(/^\uFEFF/, ""),
            numberInSurah: ayah.numberInSurah,
            juz: ayah.juz,
            page: ayah.page,
            surah: briefSurah
          };
        });
      });
      storage.saveArabicIndex(index);
      return index;
    }).catch((error) => {
      this.arabicIndexPromise = null;
      throw error;
    });
    return this.arabicIndexPromise;
  }
  async search(input, { signal } = {}) {
    const plan = this.resolveSearch(input);
    let searchData;
    let sourceEdition = plan.edition;
    try {
      searchData = await this.request(`/search/${encodeURIComponent(plan.query)}/all/${plan.edition}`, { signal });
    } catch (error) {
      if (error.cancelled) throw error;
      if (plan.edition === "quran-uthmani") {
        try {
          searchData = await this.request(`/search/${encodeURIComponent(plan.query)}/all/ur.jalandhry`, { signal });
          sourceEdition = "ur.jalandhry";
        } catch (fallbackError) {
          throw fallbackError.cancelled ? fallbackError : error;
        }
      } else {
        throw error;
      }
    }
    throwIfAborted(signal);
    let arabicIndex = null;
    try {
      arabicIndex = await this.loadArabicIndex();
    } catch {
    }
    throwIfAborted(signal);
    const records = searchData.matches.map((match) => toRecord(match, arabicIndex, sourceEdition, plan.query));
    return {
      query: plan.displayQuery,
      resolvedQuery: plan.query,
      total: searchData.count,
      records,
      sourceEdition,
      aliased: plan.aliased,
      offline: false
    };
  }
  async details(record, { signal } = {}) {
    try {
      const data = await this.request(`/ayah/${record.number}/editions/quran-uthmani,en.sahih,ur.jalandhry`, { signal });
      const [arabic, english, urdu] = data;
      return {
        ...record,
        arabic: arabic?.text?.replace(/^\uFEFF/, "") || record.arabic,
        english: english?.text || record.english,
        urdu: urdu?.text || record.urdu,
        numberInSurah: arabic?.numberInSurah ?? record.numberInSurah,
        juz: arabic?.juz ?? record.juz,
        page: arabic?.page ?? record.page,
        surah: arabic?.surah ?? record.surah
      };
    } catch (error) {
      if (error.cancelled) throw error;
      return record;
    }
  }
  localSearch(input) {
    const records = fallbackSearch(input);
    return {
      query: input,
      resolvedQuery: input,
      total: records.length,
      records,
      sourceEdition: isLatin(input) ? "en.sahih" : "quran-uthmani",
      aliased: false,
      offline: true
    };
  }
};

// js/native-bridge.js
init_dist();

// node_modules/@capacitor/keyboard/dist/esm/index.js
init_dist();

// node_modules/@capacitor/keyboard/dist/esm/definitions.js
var KeyboardStyle;
(function(KeyboardStyle2) {
  KeyboardStyle2["Dark"] = "DARK";
  KeyboardStyle2["Light"] = "LIGHT";
  KeyboardStyle2["Default"] = "DEFAULT";
})(KeyboardStyle || (KeyboardStyle = {}));
var KeyboardResize;
(function(KeyboardResize2) {
  KeyboardResize2["Body"] = "body";
  KeyboardResize2["Ionic"] = "ionic";
  KeyboardResize2["Native"] = "native";
  KeyboardResize2["None"] = "none";
})(KeyboardResize || (KeyboardResize = {}));

// node_modules/@capacitor/keyboard/dist/esm/index.js
var Keyboard = registerPlugin("Keyboard");

// node_modules/@capacitor/status-bar/dist/esm/index.js
init_dist();

// node_modules/@capacitor/status-bar/dist/esm/definitions.js
var Style;
(function(Style2) {
  Style2["Dark"] = "DARK";
  Style2["Light"] = "LIGHT";
  Style2["Default"] = "DEFAULT";
})(Style || (Style = {}));
var Animation;
(function(Animation2) {
  Animation2["None"] = "NONE";
  Animation2["Slide"] = "SLIDE";
  Animation2["Fade"] = "FADE";
})(Animation || (Animation = {}));

// node_modules/@capacitor/status-bar/dist/esm/index.js
var StatusBar = registerPlugin("StatusBar");

// node_modules/@capacitor/haptics/dist/esm/index.js
init_dist();
init_definitions();
var Haptics = registerPlugin("Haptics", {
  web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.HapticsWeb())
});

// node_modules/@capacitor/app/dist/esm/index.js
init_dist();
var App = registerPlugin("App", {
  web: () => Promise.resolve().then(() => (init_web2(), web_exports2)).then((m) => new m.AppWeb())
});

// js/native-bridge.js
var NativeDialog = registerPlugin("Dialog");
var isNative = () => Capacitor.isNativePlatform();
async function initializeNativeShell() {
  const root = document.documentElement;
  root.classList.toggle("native-platform", isNative());
  if (!isNative()) return;
  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setBackgroundColor({ color: "#03040B" });
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {
  }
  try {
    await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    await Keyboard.setStyle({ style: KeyboardStyle.Dark });
  } catch {
  }
  try {
    Keyboard.addListener("keyboardWillShow", ({ keyboardHeight }) => {
      root.classList.add("keyboard-visible");
      root.style.setProperty("--keyboard-height", `${keyboardHeight || 0}px`);
    });
    Keyboard.addListener("keyboardWillHide", () => {
      root.classList.remove("keyboard-visible");
      root.style.removeProperty("--keyboard-height");
    });
  } catch {
  }
}
var tactile = {
  light() {
    if (isNative()) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {
    });
  },
  medium() {
    if (isNative()) Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {
    });
  },
  success() {
    if (isNative()) Haptics.notification({ type: NotificationType.Success }).catch(() => {
    });
  },
  warning() {
    if (isNative()) Haptics.notification({ type: NotificationType.Warning }).catch(() => {
    });
  }
};
async function confirmNative({ title, message, okButtonTitle = "Confirm", cancelButtonTitle = "Cancel" }) {
  if (!isNative()) return false;
  try {
    const result = await NativeDialog.confirm({ title, message, okButtonTitle, cancelButtonTitle });
    return Boolean(result.value);
  } catch {
    return false;
  }
}
async function registerNativeBackHandler(handler) {
  if (!isNative()) return null;
  try {
    return await App.addListener("backButton", handler);
  } catch {
    return null;
  }
}
async function exitNativeApp() {
  if (!isNative()) return;
  try {
    await App.exitApp();
  } catch {
  }
}

// node_modules/@jofr/capacitor-media-session/dist/esm/index.js
init_dist();
var MediaSession = registerPlugin("MediaSession", {
  web: () => Promise.resolve().then(() => (init_web3(), web_exports3)).then((m) => new m.MediaSessionWeb()),
  ios: () => Promise.resolve().then(() => (init_web3(), web_exports3)).then((m) => new m.MediaSessionWeb())
});

// js/audio-engine.js
init_dist();
var RECITERS = [
  {
    id: "alafasy",
    name: "Mishary Rashid Alafasy",
    shortName: "Alafasy",
    subtitle: "Murattal \xB7 128 kbps",
    url: ({ number }) => `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${number}.mp3`
  },
  {
    id: "husary",
    name: "Mahmoud Khalil Al-Husary",
    shortName: "Husary",
    subtitle: "Murattal \xB7 128 kbps",
    url: ({ number }) => `https://cdn.islamic.network/quran/audio/128/ar.husary/${number}.mp3`
  },
  {
    id: "sudais",
    name: "Abdurrahman Al-Sudais",
    shortName: "Sudais",
    subtitle: "Murattal \xB7 192 kbps",
    url: ({ surahNumber, ayahNumber }) => `https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/${String(surahNumber).padStart(3, "0")}${String(ayahNumber).padStart(3, "0")}.mp3`
  }
];
function reciterById(id) {
  return RECITERS.find((reciter) => reciter.id === id) || RECITERS[0];
}
function trackFromRecord(record, reciterId) {
  const reciter = reciterById(reciterId);
  return {
    number: record.number,
    surahNumber: record.surah?.number,
    ayahNumber: record.numberInSurah,
    reference: `${record.surah?.number || "\u2014"}:${record.numberInSurah || "\u2014"}`,
    surahName: record.surah?.englishName || "Quran",
    arabicSurahName: record.surah?.name || "",
    reciterId: reciter.id,
    reciterName: reciter.name,
    url: reciter.url({
      number: record.number,
      surahNumber: record.surah?.number,
      ayahNumber: record.numberInSurah
    })
  };
}
var QuranAudioEngine = class {
  constructor() {
    this.audio = null;
    this.listeners = /* @__PURE__ */ new Set();
    this.lastPositionPush = 0;
    this.state = {
      track: null,
      playing: false,
      loading: false,
      repeat: false,
      speed: 1,
      error: null
    };
  }
  ensureAudio() {
    if (this.audio) return this.audio;
    const audio = document.createElement("audio");
    audio.id = "magniaayat-native-audio";
    audio.preload = "none";
    audio.playsInline = true;
    audio.setAttribute("aria-hidden", "true");
    audio.className = "native-audio-engine";
    document.body.append(audio);
    audio.addEventListener("playing", () => {
      this.state = { ...this.state, playing: true, loading: false, error: null };
      this.syncNativeSession();
      this.emit();
    });
    audio.addEventListener("pause", () => {
      if (!audio.ended) {
        this.state = { ...this.state, playing: false, loading: false };
        this.syncNativeSession();
        this.emit();
      }
    });
    audio.addEventListener("waiting", () => {
      this.state = { ...this.state, loading: true };
      this.emit();
    });
    audio.addEventListener("canplay", () => {
      this.state = { ...this.state, loading: false };
      this.emit();
    });
    audio.addEventListener("timeupdate", () => {
      const now = Date.now();
      if (now - this.lastPositionPush > 5e3) {
        this.lastPositionPush = now;
        this.syncNativeSessionPosition();
      }
    });
    audio.addEventListener("ended", () => {
      this.state = { ...this.state, playing: false, loading: false };
      this.syncNativeSession();
      this.emit();
    });
    audio.addEventListener("error", () => {
      this.state = { ...this.state, playing: false, loading: false, error: "This recitation stream could not be played. Please try another reciter." };
      this.syncNativeSession();
      this.emit();
    });
    this.audio = audio;
    this.registerNativeHandlers();
    return audio;
  }
  snapshot() {
    return { ...this.state, track: this.state.track ? { ...this.state.track } : null };
  }
  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }
  emit() {
    const snapshot = this.snapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
  async play(record, reciterId = this.state.track?.reciterId || "alafasy") {
    const audio = this.ensureAudio();
    const nextTrack = trackFromRecord(record, reciterId);
    const isSameTrack = this.state.track?.url === nextTrack.url;
    if (!isSameTrack) {
      audio.pause();
      audio.src = nextTrack.url;
      audio.load();
      this.state = { ...this.state, track: nextTrack, loading: true, error: null };
    }
    audio.loop = this.state.repeat;
    audio.playbackRate = this.state.speed;
    try {
      await audio.play();
      await this.syncNativeSession();
    } catch {
      this.state = { ...this.state, loading: false, error: "Audio needs a connection and a user tap to begin." };
      this.emit();
    }
  }
  async toggle(record, reciterId) {
    const audio = this.ensureAudio();
    const requested = record ? trackFromRecord(record, reciterId || this.state.track?.reciterId || "alafasy") : null;
    if (requested && this.state.track?.url !== requested.url) return this.play(record, requested.reciterId);
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        this.state = { ...this.state, error: "Audio needs a connection and a user tap to begin." };
        this.emit();
      }
    } else {
      audio.pause();
    }
  }
  async setReciter(record, reciterId) {
    const wasPlaying = this.state.playing;
    const repeat = this.state.repeat;
    const speed = this.state.speed;
    await this.play(record, reciterId);
    this.setRepeat(repeat);
    this.setSpeed(speed);
    if (!wasPlaying) this.pause();
  }
  setSpeed(speed) {
    const value = Number(speed) || 1;
    this.state = { ...this.state, speed: value };
    if (this.audio) this.audio.playbackRate = value;
    this.syncNativeSessionPosition();
    this.emit();
  }
  setRepeat(repeat) {
    this.state = { ...this.state, repeat: Boolean(repeat) };
    if (this.audio) this.audio.loop = Boolean(repeat);
    this.emit();
  }
  pause() {
    if (this.audio) this.audio.pause();
  }
  stop() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
    this.state = { ...this.state, track: null, playing: false, loading: false, error: null };
    this.syncNativeSession();
    this.emit();
  }
  async registerNativeHandlers() {
    const actions = {
      play: () => this.audio?.play().catch(() => {
      }),
      pause: () => this.pause(),
      stop: () => this.stop(),
      seekbackward: () => this.seekBy(-10),
      seekforward: () => this.seekBy(10),
      seekto: ({ seekTime }) => this.seekTo(seekTime)
    };
    for (const [action, handler] of Object.entries(actions)) {
      try {
        await MediaSession.setActionHandler({ action }, handler);
      } catch {
      }
    }
  }
  seekBy(delta) {
    if (!this.audio || !Number.isFinite(this.audio.duration)) return;
    this.audio.currentTime = Math.max(0, Math.min(this.audio.duration, this.audio.currentTime + delta));
    this.syncNativeSessionPosition();
  }
  seekTo(position) {
    if (!this.audio || !Number.isFinite(position)) return;
    this.audio.currentTime = Math.max(0, Math.min(this.audio.duration || position, position));
    this.syncNativeSessionPosition();
  }
  async syncNativeSession() {
    const track = this.state.track;
    const playbackState = this.state.playing ? "playing" : track ? "paused" : "none";
    if (!track) {
      try {
        await MediaSession.setPlaybackState({ playbackState });
      } catch {
      }
      return;
    }
    try {
      await MediaSession.setMetadata({
        title: `${track.surahName} \xB7 ${track.reference}`,
        artist: track.reciterName,
        album: "MagniAayat Quran Recitation"
      });
      await MediaSession.setPlaybackState({ playbackState });
      await this.syncNativeSessionPosition();
    } catch {
      if (!Capacitor.isNativePlatform() && "mediaSession" in navigator) {
        try {
          navigator.mediaSession.playbackState = playbackState;
        } catch {
        }
      }
    }
  }
  async syncNativeSessionPosition() {
    if (!this.audio || !Number.isFinite(this.audio.duration) || this.audio.duration <= 0) return;
    try {
      await MediaSession.setPositionState({
        duration: this.audio.duration,
        position: Math.min(this.audio.currentTime, this.audio.duration),
        playbackRate: this.state.speed
      });
    } catch {
    }
  }
};
var audioEngine = new QuranAudioEngine();

// js/morphology-service.js
var QURAN_COM_API = "https://api.quran.com/api/v4";
var QURAN_HUB_API = "https://api.quranhub.com/v1";
function abortError() {
  const error = new Error("Request cancelled");
  error.name = "AbortError";
  return error;
}
async function getJson(url, { signal, timeout = 16e3 } = {}) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Study data request failed (${response.status}).`);
    return response.json();
  } catch (error) {
    if (signal?.aborted) throw abortError();
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}
function reference(record) {
  return `${record.surah?.number}:${record.numberInSurah}`;
}
function visibleWords(words = []) {
  return words.filter((word) => word.char_type_name === "word" && word.text_uthmani).map((word) => ({
    position: word.position,
    text: word.text_uthmani,
    translation: word.translation?.text || "",
    transliteration: word.transliteration?.text || ""
  }));
}
function extractRoot(tagsByCategory = {}) {
  const candidates = (tagsByCategory.Root || []).filter((tag) => tag.code && tag.code !== "\u062E\u0635");
  return candidates[0]?.code || null;
}
function derivePartOfSpeech(tagsByCategory = {}) {
  if (tagsByCategory.Afal?.length) return { ar: "\u0641\u0639\u0644", en: "Verb" };
  if (tagsByCategory.Asma?.length) return { ar: "\u0627\u0633\u0645", en: "Noun / nominal" };
  if (tagsByCategory.Horof?.length) return { ar: "\u062D\u0631\u0641", en: "Particle" };
  if (tagsByCategory.Sawabiq?.length && !tagsByCategory.Lawahiq?.length) return { ar: "\u0633\u0627\u0628\u0642\u0629", en: "Prefix / particle" };
  return { ar: "\u2014", en: "Morphological classification" };
}
function conciseFeatures(tagsByCategory = {}) {
  const groups = ["Irab", "Sarf", "Aam", "Lawahiq", "Sawabiq"];
  const values = [];
  groups.forEach((group) => {
    (tagsByCategory[group] || []).forEach((tag) => {
      const label = tag.user_meaning || tag.meaning;
      if (label && !values.includes(label) && values.length < 8) values.push(label);
    });
  });
  return values;
}
var MorphologyService = class {
  constructor() {
    this.verseCache = /* @__PURE__ */ new Map();
    this.wordCache = /* @__PURE__ */ new Map();
  }
  async verseWords(record, { signal } = {}) {
    const key = reference(record);
    if (this.verseCache.has(key)) return this.verseCache.get(key);
    const url = `${QURAN_COM_API}/verses/by_key/${key}?words=true&word_fields=text_uthmani,translation,transliteration`;
    const payload = await getJson(url, { signal });
    const words = visibleWords(payload?.verse?.words);
    this.verseCache.set(key, words);
    return words;
  }
  async wordStudy(record, position, fallbackWord = "", { signal } = {}) {
    const verseKey = reference(record);
    const key = `${verseKey}:${position}`;
    if (this.wordCache.has(key)) return this.wordCache.get(key);
    const [verseWords, morphologyPayload] = await Promise.all([
      this.verseWords(record, { signal }),
      getJson(`${QURAN_HUB_API}/morphology/word/${key}`, { signal })
    ]);
    const quranWord = verseWords.find((word) => Number(word.position) === Number(position));
    const data = morphologyPayload?.data || {};
    const tagsByCategory = data.morphology?.tags_by_category || {};
    const pos = derivePartOfSpeech(tagsByCategory);
    const study = {
      location: key,
      word: quranWord?.text || data.word?.text || fallbackWord,
      translation: quranWord?.translation || "",
      transliteration: quranWord?.transliteration || "",
      root: extractRoot(tagsByCategory),
      partOfSpeech: pos,
      grammar: conciseFeatures(tagsByCategory),
      tagCount: data.morphology?.total_tags || 0,
      // QuranHub exposes verified roots and grammar tags. It does not expose
      // a dictionary lemma field, so the UI deliberately does not infer one.
      lemma: null,
      lemmaNote: "This online morphology record exposes verified roots and grammar tags; it does not provide a dictionary lemma for this token.",
      source: "QuranHub morphology + Quran.com word-by-word"
    };
    this.wordCache.set(key, study);
    return study;
  }
};
function fallbackTokens(arabic = "") {
  return arabic.replace(/[ۖۗۚۛۙۘۜ۝۞]/g, " ").trim().split(/\s+/).filter(Boolean).map((text, index) => ({ position: index + 1, text, translation: "", transliteration: "" }));
}
var morphologyService = new MorphologyService();

// js/app.js
var app = document.querySelector("#app");
var api = new QuranApiService();
var ui = {};
var scrollPositions = { home: 0, results: 0, bookmarks: 0, history: 0, settings: 0 };
var searchRequest = null;
var detailRequest = null;
var wordRequest = null;
var searchSequence = 0;
var detailSequence = 0;
var wordSequence = 0;
var started = false;
var lastAudioError = "";
var storedPreferences = storage.preferences();
var state = {
  view: "home",
  results: null,
  loading: false,
  filter: "All",
  displayLimit: 20,
  detail: null,
  detailLoading: false,
  detailWords: [],
  wordSheet: null,
  wordStudyLoading: false,
  quickSearch: false,
  reciterSheet: null,
  quickSuggestions: [],
  bookmarks: storage.bookmarks(),
  history: storage.history(),
  preferences: { translation: "both", reciter: "alafasy", audioSpeed: 1, audioRepeat: false, ...storedPreferences },
  audio: audioEngine.snapshot(),
  error: null
};
audioEngine.setSpeed(state.preferences.audioSpeed);
audioEngine.setRepeat(state.preferences.audioRepeat);
var ICONS = {
  logo: '<path d="M5 20.5V8.6C5 5.6 7.7 3.3 12 2c4.3 1.3 7 3.6 7 6.6v11.9"/><path d="M7.7 19V9.6c1.1-1.1 2.5-1.9 4.3-2.5v13.8"/><path d="M16.3 19V9.6c-1.1-1.1-2.5-1.9-4.3-2.5"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.7"/><path d="m16 16 4 4"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
  home: '<path d="m3.5 10 8.5-7 8.5 7"/><path d="M5.5 9v10h13V9"/><path d="M9.5 19v-5h5v5"/>',
  bookmark: '<path d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V21l-6-3.5L6 21z"/>',
  book: '<path d="M5 20.5V8.6C5 5.6 7.7 3.3 12 2c4.3 1.3 7 3.6 7 6.6v11.9"/><path d="M7.7 19V9.6c1.1-1.1 2.5-1.9 4.3-2.5v13.8"/><path d="M16.3 19V9.6c-1.1-1.1-2.5-1.9-4.3-2.5"/>',
  history: '<path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 5v4h4"/><path d="M12 7v5l3.5 2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-2.4 2.4-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56v.09h-3.4v-.09A1.7 1.7 0 0 0 10.05 19a1.7 1.7 0 0 0-1.87.34l-.06.06-2.4-2.4.06-.06A1.7 1.7 0 0 0 6.12 15a1.7 1.7 0 0 0-1.56-1.03h-.09v-3.4h.09A1.7 1.7 0 0 0 6.12 9.54a1.7 1.7 0 0 0-.34-1.87l-.06-.06 2.4-2.4.06.06a1.7 1.7 0 0 0 1.87.34 1.7 1.7 0 0 0 1.03-1.56v-.09h3.4v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06 2.4 2.4-.06.06a1.7 1.7 0 0 0-.34 1.87 1.7 1.7 0 0 0 1.56 1.03h.09v3.4h-.09A1.7 1.7 0 0 0 19.4 15z"/>',
  copy: '<rect x="8" y="8" width="11" height="12" rx="1.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v10A1.5 1.5 0 0 0 5.5 17H8"/>',
  play: '<path d="m9 6 9 6-9 6z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M8.5 6v12M15.5 6v12"/>',
  loop: '<path d="M17 3.5 20.5 7 17 10.5"/><path d="M20 7H8a4 4 0 0 0-4 4v1"/><path d="M7 20.5 3.5 17 7 13.5"/><path d="M4 17h12a4 4 0 0 0 4-4v-1"/>',
  volume: '<path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>',
  check: '<path d="m5 12 4.2 4L19 6.5"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M7 7l.7 13h8.6L17 7M10 11v5M14 11v5"/>',
  info: '<circle cx="12" cy="12" r="8"/><path d="M12 11v5M12 8h.01"/>',
  cloudOff: '<path d="M17 17.5H7.5a4.5 4.5 0 0 1-1.1-8.86A6 6 0 0 1 17.8 9"/><path d="m3 3 18 18"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.9-3L3 10"/><path d="M3 4v6h6"/><path d="M4 13a8 8 0 0 0 14.9 3l2.1-2"/><path d="M21 20v-6h-6"/>',
  translate: '<path d="M5 5h9M9.5 3v2M7 5c.4 3 1.8 5.4 4.1 7.1M6.3 11.3c1.5 0 3.1-.5 4.7-1.6"/><path d="m15 18 2.5-7 2.5 7M16 15.6h3"/>'
};
function icon(name, className = "") {
  return `<svg class="icon ${className}" aria-hidden="true" viewBox="0 0 24 24">${ICONS[name] || ""}</svg>`;
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}
function stringIsLatin(value) {
  return isLatin(value) && !isArabic(value);
}
function displayNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}
function revelationLabel(type = "") {
  return /medinan/i.test(type) ? "Madani" : /meccan/i.test(type) ? "Makki" : "Quran";
}
function cardQuery(record) {
  return record.query || state.results?.resolvedQuery || state.results?.query || "";
}
function queryLooksArabic(query) {
  return isArabic(query);
}
function isBookmarked(number) {
  return state.bookmarks.some((item) => Number(item.number) === Number(number));
}
function isCurrentTrack(record) {
  return Number(state.audio.track?.number) === Number(record?.number);
}
function waveform() {
  return '<span class="audio-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>';
}
function randomQuickSuggestions(count = 5) {
  const pool = [...QUICK_CONCEPTS];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }
  return pool.slice(0, count);
}
function makeArabicRegex(term) {
  const source = normalise(term).replace(/\s+/g, " ").trim();
  if (!source) return null;
  const variants = { \u0627: "[\u0627\u0671\u0623\u0625\u0622]", \u064A: "[\u064A\u0649]", \u0647: "[\u0647\u0629]", \u0643: "[\u0643\u06A9]", \u0648: "[\u0648\u0624]", \u0621: "[\u0621\u0623\u0625\u0624\u0626]" };
  const marks = "[\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06ED]*";
  const expression = [...source].map((char) => char === " " ? "\\s+" : `${variants[char] || char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}${marks}`).join("");
  try {
    return new RegExp(expression, "giu");
  } catch {
    return null;
  }
}
function highlight(text, term, { arabic = false } = {}) {
  if (!text) return "";
  const regex = arabic ? makeArabicRegex(term) : term ? new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "giu") : null;
  if (!regex) return escapeHtml(text);
  let html = "";
  let last = 0;
  let matched = false;
  text.replace(regex, (match, offset) => {
    matched = true;
    html += escapeHtml(text.slice(last, offset));
    html += `<span class="highlight-word">${escapeHtml(match)}</span>`;
    last = offset + match.length;
    return match;
  });
  return matched ? html + escapeHtml(text.slice(last)) : escapeHtml(text);
}
function rootHint(record) {
  const source = `${record.query || ""} ${record.arabic || ""} ${record.matchText || ""}`;
  return ROOT_LEXICON.find((item) => item.match.test(source)) || { root: "\u2014", transliteration: "study hint", meaning: "Tap a word above for its online word-by-word morphology record." };
}
function mountShell() {
  const shell = document.createRange().createContextualFragment(`
    <header class="header app-header"><div class="header-inner"><div class="brand brand-static" aria-label="MagniAayat"><img class="brand-logo" src="./assets/magniaayat-logo.png" alt="" width="42" height="42" /><span>MagniAayat</span></div></div></header>
    <main class="page view-screen" data-view-screen="home" id="home-screen">
      <section class="hero-card glass neon-blue"><h1 class="hero-title" dir="rtl">\u06A9\u0633\u06CC \u0628\u06BE\u06CC \u0644\u0641\u0638 \u0633\u06D2 \u062A\u0644\u0627\u0634 \u06A9\u0631\u06CC\u06BA</h1><p class="hero-subtitle">Search any word in the Quran</p>${searchForm("home")}</section>
      <div class="section-head"><div><span class="section-title" dir="rtl">\u062A\u0644\u0627\u0634 \u06A9\u06CC \u062A\u0627\u0631\u06CC\u062E</span><span class="section-caption">Recent Searches</span></div><button class="text-action" id="home-see-history" data-action="nav" data-view="history" hidden>See All</button></div>
      <section id="home-history"></section>
    </main>
    <main class="page view-screen" data-view-screen="results" id="results-screen" hidden>
      <section id="results-top"></section><section id="results-stats" hidden></section><section id="results-controls"></section><section id="results-body"></section>
    </main>
    <main class="page view-screen" data-view-screen="bookmarks" id="bookmarks-screen" hidden><h1 class="page-title">Bookmarks</h1><p class="page-lede">Keep meaningful ayahs close. Bookmarks are saved privately on this device.</p><section id="bookmark-body"></section></main>
    <main class="page view-screen" data-view-screen="history" id="history-screen" hidden><h1 class="page-title">Search history</h1><p class="page-lede">Revisit words you have explored. This history stays on your device.</p><section id="history-body"></section></main>
    <main class="page view-screen" data-view-screen="settings" id="settings-screen" hidden><h1 class="page-title">Settings</h1><p class="page-lede">Configure your study and native playback experience. Quran and morphology data are retrieved online.</p><section id="settings-body"></section></main>
    <aside id="now-playing-dock" class="now-playing-dock glass" aria-label="Current recitation" hidden></aside>
    <nav class="bottom-nav" aria-label="Main navigation">
      ${navButton("home", "Home", "home")}${navButton("bookmarks", "Bookmarks", "bookmark")}<span class="nav-center-space" aria-hidden="true"></span>${navButton("history", "History", "history")}${navButton("settings", "Settings", "settings")}
      <button class="quick-search-trigger" data-action="quick-open" aria-label="Search the Quran from anywhere">${icon("book")}</button>
    </nav>
    <div id="detail-overlay"></div><div id="word-overlay"></div><div id="reciter-overlay"></div><div id="quick-overlay"></div>
  `);
  app.replaceChildren(shell);
  ui.screens = Object.fromEntries([...app.querySelectorAll("[data-view-screen]")].map((node) => [node.dataset.viewScreen, node]));
  ui.homeHistory = app.querySelector("#home-history");
  ui.homeSeeHistory = app.querySelector("#home-see-history");
  ui.resultsTop = app.querySelector("#results-top");
  ui.resultsStats = app.querySelector("#results-stats");
  ui.resultsControls = app.querySelector("#results-controls");
  ui.resultsBody = app.querySelector("#results-body");
  ui.bookmarkBody = app.querySelector("#bookmark-body");
  ui.historyBody = app.querySelector("#history-body");
  ui.settingsBody = app.querySelector("#settings-body");
  ui.dock = app.querySelector("#now-playing-dock");
  ui.detail = app.querySelector("#detail-overlay");
  ui.word = app.querySelector("#word-overlay");
  ui.reciter = app.querySelector("#reciter-overlay");
  ui.quick = app.querySelector("#quick-overlay");
}
function navButton(target, label, glyph) {
  return `<button class="nav-item" data-action="nav" data-view="${target}" aria-label="${label}">${icon(glyph)}<span>${label}</span></button>`;
}
function searchForm(mode) {
  return `<form class="search-form" data-search-form="${mode}" role="search"><span class="search-icon">${icon("search")}</span><label class="screen-reader" for="search-${mode}">Search Quranic words</label><input id="search-${mode}" class="search-input" name="query" autocomplete="off" autocapitalize="none" spellcheck="false" dir="auto" placeholder="Search any word\u2026" /><button type="button" class="clear-search" data-action="clear-input" data-input="search-${mode}" aria-label="Clear search">${icon("close")}</button><button type="submit" class="search-submit" aria-label="Search Quran">${icon("arrow")}</button></form>`;
}
function updateNavigation() {
  const active = state.view === "results" ? "home" : state.view;
  app.querySelectorAll(".nav-item[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === active));
}
function navigateTo(view, { resetScroll = false } = {}) {
  if (view === state.view) return false;
  scrollPositions[state.view] = window.scrollY;
  state.view = view;
  Object.entries(ui.screens).forEach(([name, node]) => {
    node.hidden = name !== view;
  });
  updateNavigation();
  requestAnimationFrame(() => window.scrollTo({ top: resetScroll ? 0 : scrollPositions[view] || 0, behavior: "auto" }));
  return true;
}
function historyRows(items, { limited = false } = {}) {
  const visible = limited ? items.slice(0, 4) : items;
  if (!visible.length) return `<div class="empty-state"><div class="empty-orb">${icon("clock")}</div><h2>No searches yet</h2><p>Your recent Quran word searches will appear here for easy return.</p></div>`;
  return `<div class="history-list">${visible.map((item) => {
    const ltr = stringIsLatin(item.query);
    return `<button class="history-row glass" data-action="history-search" data-query="${escapeHtml(item.query)}"><span class="history-row-left"><span class="history-icon">${icon("clock")}</span><span><strong class="history-query ${ltr ? "ltr" : ""}" dir="${ltr ? "ltr" : "rtl"}">${escapeHtml(item.query)}</strong><small class="history-meta ${ltr ? "ltr" : ""}">${displayNumber(item.total || 0)} ${item.total === 1 ? "Ayah" : "Ayahs"} \xB7 ${escapeHtml(item.when || "Recent")}</small></span></span><span class="chevron">${icon("chevron")}</span></button>`;
  }).join("")}</div>`;
}
function updateHome() {
  ui.homeHistory.innerHTML = historyRows(state.history, { limited: true });
  ui.homeSeeHistory.hidden = !state.history.length;
}
function renderStats() {
  const records = state.results?.records || [];
  const surahs = new Set(records.map((item) => item.surah?.number).filter(Boolean)).size;
  const total = state.results?.total || 0;
  return `<div class="stats-grid" aria-label="Search statistics"><article class="metric glass neon-purple purple"><span class="metric-ar" dir="rtl">\u0622\u06CC\u0627\u062A</span><strong class="metric-value">${displayNumber(total)}</strong><span class="metric-label">Total Ayahs</span></article><article class="metric glass neon-blue blue"><span class="metric-ar" dir="rtl">\u0633\u0648\u0631\u06C3</span><strong class="metric-value">${displayNumber(surahs)}</strong><span class="metric-label">Surahs</span></article><article class="metric glass neon-cyan cyan"><span class="metric-ar" dir="rtl">\u0645\u0642\u0627\u0645</span><strong class="metric-value">${displayNumber(total)}</strong><span class="metric-label">Occurrences</span></article></div>`;
}
function filteredRecords() {
  const all = state.results?.records || [];
  if (state.filter === "All") return all;
  return all.filter((item) => new RegExp(state.filter === "Makki" ? "Meccan" : "Medinan", "i").test(item.surah?.revelationType || ""));
}
function renderAyahCard(record, { saved = false } = {}) {
  const query = cardQuery(record);
  const arabic = record.arabic || record.matchText || "Arabic text is unavailable while offline.";
  const ref = `${record.surah?.number || "\u2014"}:${record.numberInSurah || "\u2014"}`;
  const isArabicMatch = record.matchEdition === "quran-uthmani" || queryLooksArabic(query);
  const sourceContext = record.matchEdition !== "quran-uthmani" && record.matchText && record.matchText !== arabic;
  const nowPlaying = isCurrentTrack(record) && state.audio.playing;
  const savedState = isBookmarked(record.number);
  return `<article class="ayah-card glass ${saved ? "saved-card" : ""} ${nowPlaying ? "is-playing" : ""}" data-action="open-detail" data-id="${record.number}" data-ayah-card-id="${record.number}" tabindex="0" role="button"><div class="ayah-top"><span class="ayah-id">AYAH ${ref}</span><span class="ayah-top-actions"><span class="card-playing-indicator" data-playing-indicator ${nowPlaying ? "" : "hidden"}>${waveform()} Playing</span><button class="bookmark-toggle ${savedState ? "saved" : ""}" data-action="toggle-bookmark" data-id="${record.number}" aria-label="${savedState ? "Remove bookmark" : "Save bookmark"}">${icon("bookmark")}</button></span></div><div class="ayah-arabic" dir="rtl">${highlight(arabic, query, { arabic: isArabicMatch })}</div>${sourceContext ? `<p class="match-context" dir="${record.matchEdition === "ur.jalandhry" ? "rtl" : "ltr"}"><span class="eyebrow">Matched in ${record.matchEdition === "ur.jalandhry" ? "Urdu" : "English"}</span><br>${highlight(record.matchText, query, { arabic: record.matchEdition === "ur.jalandhry" })}</p>` : ""}<div class="ayah-bottom"><span class="surah-name">${escapeHtml(record.surah?.name || "")} \xB7 ${escapeHtml(record.surah?.englishName || "Quran")}</span><span class="ayah-ref">${ref}</span></div>${saved ? `<div class="saved-actions"><button class="small-action" data-action="open-detail" data-id="${record.number}">${icon("info")} Details</button><button class="small-action danger" data-action="remove-bookmark" data-id="${record.number}">${icon("trash")} Remove</button></div>` : ""}</article>`;
}
function loadingMarkup() {
  return '<div class="loading-wrap" aria-live="polite"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>';
}
function emptyResults() {
  const error = state.error;
  return `<section class="empty-state"><div class="empty-orb">${error ? icon("cloudOff") : icon("search")}</div><h2>${error ? "Search paused" : "No exact matches yet"}</h2><p>${error ? escapeHtml(error) : "Try an alternate spelling, an Arabic or Urdu form, or one of the suggested words."}</p><div class="empty-actions">${error ? `<button class="secondary-button" data-action="retry-search">${icon("refresh")}Try again</button>` : ""}<button class="primary-button" data-action="nav" data-view="home">Browse suggestions</button></div></section>`;
}
function updateResults() {
  const result = state.results;
  ui.resultsTop.innerHTML = `<div class="results-top"><div><span class="eyebrow">Quran search</span><h1 class="results-heading">${state.loading ? "Searching Quran\u2026" : "Search results"}</h1><p class="results-subheading">${state.loading ? "Finding Uthmani text and translations\u2026" : `Results for \u201C${escapeHtml(result?.query || "")}\u201D`}</p></div><button class="icon-btn" data-action="nav" data-view="home" aria-label="New search">${icon("search")}</button></div>`;
  ui.resultsStats.hidden = state.loading || !result;
  ui.resultsStats.innerHTML = !state.loading && result ? renderStats() : "";
  if (state.loading) {
    ui.resultsControls.innerHTML = "";
    ui.resultsBody.innerHTML = loadingMarkup();
    return;
  }
  const filtered = filteredRecords();
  const shown = filtered.slice(0, state.displayLimit);
  const total = result?.total || 0;
  ui.resultsControls.innerHTML = result ? `<div class="results-summary"><span>${displayNumber(total)} ${total === 1 ? "ayah" : "ayahs"} found${result.aliased ? ` \xB7 interpreted as \u201C${escapeHtml(result.resolvedQuery)}\u201D` : ""}${result.offline ? " \xB7 offline examples" : ""}</span></div><div class="filter-row" role="tablist">${["All", "Makki", "Madani"].map((name) => `<button class="filter-chip ${state.filter === name ? "active" : ""}" data-action="filter" data-filter="${name}" role="tab">${name}</button>`).join("")}</div>` : "";
  ui.resultsBody.innerHTML = total && shown.length ? `<div class="result-list">${shown.map((record) => renderAyahCard(record)).join("")}</div>${shown.length < filtered.length ? `<button class="load-more" data-action="load-more">Show ${Math.min(20, filtered.length - shown.length)} more verses</button>` : ""}` : emptyResults();
}
function updateBookmarks() {
  ui.bookmarkBody.innerHTML = state.bookmarks.length ? `<div class="bookmark-list">${state.bookmarks.map((record) => renderAyahCard(record, { saved: true })).join("")}</div>` : `<section class="empty-state"><div class="empty-orb">${icon("bookmark")}</div><h2>Your collection is waiting</h2><p>Tap the bookmark icon on a result to save an ayah here.</p><div class="empty-actions"><button class="primary-button" data-action="quick-open">${icon("search")} Search Quran</button></div></section>`;
}
function updateHistory() {
  ui.historyBody.innerHTML = state.history.length ? `<div class="section-head"><span class="section-caption">${state.history.length} stored searches</span><button class="text-action" data-action="clear-history">Clear history</button></div>${historyRows(state.history)}` : historyRows([]);
}
function updateSettings() {
  const pref = state.preferences;
  ui.settingsBody.innerHTML = `<section class="settings-list glass"><div class="settings-row"><div><span class="settings-name">Translation display</span><span class="settings-copy">Choose what appears in ayah details.</span></div><select class="select-control" data-action="translation-setting"><option value="both" ${pref.translation === "both" ? "selected" : ""}>Both</option><option value="english" ${pref.translation === "english" ? "selected" : ""}>English</option><option value="urdu" ${pref.translation === "urdu" ? "selected" : ""}>Urdu</option></select></div><div class="settings-row"><div><span class="settings-name">Default reciter</span><span class="settings-copy">Used by the foreground media player and lock-screen controls.</span></div><button class="select-like" data-action="audio-open-reciter">${escapeHtml(reciterById(pref.reciter).shortName)} ${icon("down")}</button></div><div class="settings-row"><div><span class="settings-name">Search data</span><span class="settings-copy">Clear history, saved ayahs, and cached Arabic text from this device.</span></div><button class="danger-button" data-action="clear-local-data">Clear data</button></div></section><section class="empty-state"><div class="empty-orb">${icon("translate")}</div><h2>Online word study</h2><p>Tap an Arabic token in Ayah Detail to load word translation, root, and grammar tags.</p></section>`;
}
function storeHistory(query, total) {
  const items = state.history.filter((item) => normalise(item.query) !== normalise(query));
  const when = new Intl.DateTimeFormat(void 0, { month: "short", day: "numeric" }).format(/* @__PURE__ */ new Date());
  items.unshift({ query, total, when: `Searched ${when}` });
  state.history = items.slice(0, 12);
  storage.saveHistory(state.history);
  updateHome();
  updateHistory();
}
function savePreferences() {
  storage.savePreferences(state.preferences);
}
function findRecord(number) {
  const id = Number(number);
  return state.results?.records.find((item) => Number(item.number) === id) || state.bookmarks.find((item) => Number(item.number) === id) || (state.detail && Number(state.detail.number) === id ? state.detail : null);
}
async function performSearch(input) {
  const query = input.trim();
  if (!query) {
    tactile.warning();
    toast("Enter a word to search.", "error");
    return;
  }
  searchRequest?.abort();
  const controller = new AbortController();
  searchRequest = controller;
  const requestId = ++searchSequence;
  tactile.medium();
  state.loading = true;
  state.results = { query, resolvedQuery: query, total: 0, records: [] };
  state.error = null;
  state.filter = "All";
  state.displayLimit = 20;
  closeQuick();
  navigateTo("results", { resetScroll: true });
  updateResults();
  try {
    const result = await api.search(query, { signal: controller.signal });
    if (controller.signal.aborted || requestId !== searchSequence) return;
    state.results = result;
    state.error = null;
    storeHistory(query, result.total);
    tactile.success();
  } catch (error) {
    if (controller.signal.aborted || error?.cancelled || requestId !== searchSequence) return;
    const fallback = api.localSearch(query);
    state.results = fallback;
    state.error = fallback.total ? null : error instanceof QuranApiError ? error.message : "Search could not be completed.";
    if (fallback.total) toast("Showing a small offline reference set.", "success");
    else tactile.warning();
  } finally {
    if (requestId === searchSequence) {
      state.loading = false;
      updateResults();
    }
  }
}
function tokenMarkup(record) {
  const words = state.detailWords.length ? state.detailWords : fallbackTokens(record.arabic || record.matchText || "");
  const needle = normalise(cardQuery(record));
  return `<div class="word-token-row" dir="rtl">${words.map((word) => `<button class="word-token ${needle && normalise(word.text).includes(needle) ? "matched" : ""}" data-action="word-study" data-position="${word.position}" data-word="${escapeHtml(word.text)}">${escapeHtml(word.text)}</button>`).join("")}</div><p class="word-study-prompt">${icon("translate")} Tap any word for root, grammar, and word-level translation</p>`;
}
function audioHub(record) {
  const matching = isCurrentTrack(record);
  const reciter = reciterById(matching ? state.audio.track?.reciterId : state.preferences.reciter);
  const playing = matching && state.audio.playing;
  const speed = state.audio.speed || state.preferences.audioSpeed;
  return `<section id="detail-audio-hub" class="audio-hub glass ${playing ? "audio-active" : ""}"><div class="audio-hub-top"><div><span class="translation-label">Native recitation</span><strong class="audio-reciter-name">${escapeHtml(reciter.shortName)}</strong><small>${escapeHtml(reciter.subtitle)}</small></div><button class="round-audio-button ${playing ? "playing" : ""}" data-action="audio-toggle" data-id="${record.number}" aria-label="${playing ? "Pause" : "Play"} recitation">${playing ? icon("pause") : icon("play")}</button></div><div class="audio-visual-line ${playing ? "is-active" : ""}">${waveform()}<span>${state.audio.loading && matching ? "Buffering recitation\u2026" : playing ? `Playing ${escapeHtml(reciter.shortName)}` : "Background-ready playback"}</span></div><div class="audio-controls-row"><button class="audio-select" data-action="audio-open-reciter" data-id="${record.number}">${icon("volume")} ${escapeHtml(reciter.shortName)} ${icon("down")}</button><div class="speed-set">${[0.5, 1, 1.5, 2].map((item) => `<button class="speed-chip ${Number(speed) === item ? "active" : ""}" data-action="audio-speed" data-speed="${item}">${item}\xD7</button>`).join("")}</div><button class="loop-button ${state.audio.repeat ? "active" : ""}" data-action="audio-repeat" aria-pressed="${state.audio.repeat}">${icon("loop")}</button></div>${state.audio.error && matching ? `<p class="audio-error">${escapeHtml(state.audio.error)}</p>` : ""}</section>`;
}
function updateDetail() {
  if (!state.detail) {
    ui.detail.replaceChildren();
    syncModalState();
    return;
  }
  if (state.detailLoading) {
    ui.detail.innerHTML = `<div class="modal-layer"><section class="modal modal-detail" data-modal-content><div class="modal-head"><div><span class="modal-overline">Ayah details</span><h2 class="modal-title">Loading verse\u2026</h2></div><button class="icon-btn" data-action="close-detail">${icon("close")}</button></div><div class="loading-wrap" style="margin-top:20px"><div class="skeleton"></div><div class="skeleton"></div></div></section></div>`;
    syncModalState();
    return;
  }
  const r = state.detail;
  const ref = `${r.surah?.number || "\u2014"}:${r.numberInSurah || "\u2014"}`;
  const hint = rootHint(r);
  const translation = state.preferences.translation;
  ui.detail.innerHTML = `<div class="modal-layer"><section class="modal modal-detail" role="dialog" aria-modal="true"><div class="modal-head"><div class="modal-head-copy"><span class="modal-overline">Ayah details</span><h2 class="modal-title">${escapeHtml(r.surah?.englishName || "Quran")} <span style="color:var(--muted);font-weight:500">\xB7 ${ref}</span></h2></div><div class="detail-head-actions"><button class="icon-btn" data-action="copy-ayah" aria-label="Copy Ayah">${icon("copy")}</button><button class="icon-btn" data-action="close-detail" aria-label="Close details">${icon("close")}</button></div></div><div class="detail-meta"><span class="meta-badge">${revelationLabel(r.surah?.revelationType)}</span><span class="meta-badge">Juz ${r.juz || "\u2014"}</span><span class="meta-badge">Page ${r.page || "\u2014"}</span><span class="meta-badge">${escapeHtml(r.surah?.name || "")}</span></div><div class="detail-arabic interactive-ayah" dir="rtl">${tokenMarkup(r)}</div>${translation !== "urdu" && r.english ? `<section class="translation-card glass"><div class="translation-label">English \xB7 Saheeh International</div><p class="translation-body">${highlight(r.english, r.matchEdition === "en.sahih" ? cardQuery(r) : "")}</p></section>` : ""}${translation !== "english" && r.urdu ? `<section class="translation-card glass"><div class="translation-label">\u0627\u0631\u062F\u0648 \xB7 \u062C\u0627\u0644\u0646\u062F\u06BE\u0631\u06CC</div><p class="translation-body urdu" dir="rtl">${highlight(r.urdu, r.matchEdition === "ur.jalandhry" ? cardQuery(r) : "", { arabic: true })}</p></section>` : ""}<section class="root-card glass"><div class="root-seal" dir="rtl">${escapeHtml(hint.root)}</div><div><div class="root-head">Quick study hint \xB7 ${escapeHtml(hint.transliteration)}</div><p class="root-copy">${escapeHtml(hint.meaning)}</p></div></section>${audioHub(r)}</section></div>`;
  syncModalState();
}
function syncModalState() {
  document.body.classList.toggle("modal-open", Boolean(state.detail || state.wordSheet || state.reciterSheet || state.quickSearch));
}
async function openDetail(number) {
  const record = findRecord(number);
  if (!record) return;
  detailRequest?.abort();
  wordRequest?.abort();
  const controller = new AbortController();
  detailRequest = controller;
  const requestId = ++detailSequence;
  tactile.light();
  state.detail = record;
  state.detailLoading = true;
  state.detailWords = [];
  state.wordSheet = null;
  updateDetail();
  updateWordSheet();
  try {
    const [detailed, words] = await Promise.all([api.details(record, { signal: controller.signal }), morphologyService.verseWords(record, { signal: controller.signal }).catch(() => null)]);
    if (controller.signal.aborted || requestId !== detailSequence) return;
    state.detail = detailed;
    state.detailWords = words?.length ? words : fallbackTokens(detailed.arabic || detailed.matchText || "");
    state.detailLoading = false;
    updateDetail();
  } catch (error) {
    if (controller.signal.aborted || error?.cancelled || requestId !== detailSequence) return;
    state.detailLoading = false;
    state.detailWords = fallbackTokens(record.arabic || record.matchText || "");
    updateDetail();
  }
}
function closeDetail() {
  detailRequest?.abort();
  wordRequest?.abort();
  state.detail = null;
  state.detailLoading = false;
  state.wordSheet = null;
  state.wordStudyLoading = false;
  updateDetail();
  updateWordSheet();
}
async function openWordStudy(position, word) {
  if (!state.detail) return;
  wordRequest?.abort();
  const controller = new AbortController();
  wordRequest = controller;
  const requestId = ++wordSequence;
  tactile.light();
  state.wordSheet = { word, study: null, position };
  state.wordStudyLoading = true;
  updateWordSheet();
  try {
    const study = await morphologyService.wordStudy(state.detail, position, word, { signal: controller.signal });
    if (controller.signal.aborted || requestId !== wordSequence) return;
    state.wordSheet = { word, study, position };
    state.wordStudyLoading = false;
    updateWordSheet();
  } catch (error) {
    if (controller.signal.aborted || error?.name === "AbortError" || requestId !== wordSequence) return;
    state.wordSheet = { word, study: null, position };
    state.wordStudyLoading = false;
    updateWordSheet();
  }
}
function updateWordSheet() {
  if (!state.wordSheet) {
    ui.word.replaceChildren();
    syncModalState();
    return;
  }
  const { study, word } = state.wordSheet;
  ui.word.innerHTML = `<div class="modal-layer word-study-layer"><section class="modal word-study-sheet" role="dialog" aria-modal="true"><div class="sheet-grabber"></div><div class="modal-head"><div><span class="modal-overline">Word-by-word study</span><h2 class="modal-title" dir="rtl">${escapeHtml(study?.word || word || "\u2026")}</h2></div><button class="icon-btn" data-action="close-word-study">${icon("close")}</button></div>${state.wordStudyLoading ? `<div class="loading-wrap" style="margin-top:18px"><div class="skeleton" style="min-height:170px"></div></div>` : study ? `<div class="word-gloss"><span class="word-gloss-label">Word translation</span><strong>${escapeHtml(study.translation || "Translation not supplied")}</strong>${study.transliteration ? `<small>${escapeHtml(study.transliteration)}</small>` : ""}</div><div class="morph-grid"><article class="morph-stat"><span>Root \xB7 \u0627\u0644\u062C\u0630\u0631</span><strong dir="rtl">${escapeHtml(study.root || "\u2014")}</strong></article><article class="morph-stat"><span>Part of speech</span><strong>${escapeHtml(study.partOfSpeech.en)}</strong><small dir="rtl">${escapeHtml(study.partOfSpeech.ar)}</small></article><article class="morph-stat full"><span>Lemma \xB7 \u0627\u0644\u0635\u064A\u063A\u0629 \u0627\u0644\u0645\u0639\u062C\u0645\u064A\u0629</span><strong dir="rtl">${escapeHtml(study.lemma || "Not supplied by source")}</strong><small>${escapeHtml(study.lemmaNote)}</small></article></div><section class="grammar-card glass"><div class="translation-label">Grammar and morphology \xB7 ${study.tagCount} source tags</div><div class="grammar-chips">${study.grammar.map((item) => `<span class="grammar-chip" dir="rtl">${escapeHtml(item)}</span>`).join("")}</div></section><p class="morph-source">${icon("info")} ${escapeHtml(study.source)} \xB7 online lookup</p>` : `<div class="empty-state"><div class="empty-orb">${icon("cloudOff")}</div><h2>Study record unavailable</h2><p>Connect and try this word again.</p></div>`}</section></div>`;
  syncModalState();
}
function closeWordSheet() {
  wordRequest?.abort();
  state.wordSheet = null;
  state.wordStudyLoading = false;
  updateWordSheet();
}
function updateReciterSheet() {
  if (!state.reciterSheet) {
    ui.reciter.replaceChildren();
    syncModalState();
    return;
  }
  const active = state.audio.track?.reciterId || state.preferences.reciter;
  ui.reciter.innerHTML = `<div class="modal-layer reciter-layer"><section class="modal reciter-sheet" role="dialog" aria-modal="true"><div class="sheet-grabber"></div><div class="modal-head"><div><span class="modal-overline">Recitation hub</span><h2 class="modal-title">Choose a reciter</h2></div><button class="icon-btn" data-action="close-reciter">${icon("close")}</button></div><div class="reciter-list">${RECITERS.map((reciter) => `<button class="reciter-row ${active === reciter.id ? "active" : ""}" data-action="audio-set-reciter" data-reciter="${reciter.id}" data-id="${state.reciterSheet.recordId || ""}"><span class="reciter-avatar">${escapeHtml(reciter.shortName.slice(0, 1))}</span><span><strong>${escapeHtml(reciter.name)}</strong><small>${escapeHtml(reciter.subtitle)}</small></span>${active === reciter.id ? `<span class="reciter-check">${icon("check")}</span>` : `<span class="chevron">${icon("chevron")}</span>`}</button>`).join("")}</div></section></div>`;
  syncModalState();
}
function openReciterSheet(recordId = null) {
  tactile.light();
  state.reciterSheet = { recordId: recordId || state.audio.track?.number || null };
  updateReciterSheet();
}
function closeReciterSheet() {
  state.reciterSheet = null;
  updateReciterSheet();
}
async function chooseReciter(id, recordId) {
  const record = recordId ? findRecord(recordId) : null;
  const current = record && isCurrentTrack(record);
  state.preferences.reciter = id;
  savePreferences();
  closeReciterSheet();
  tactile.medium();
  if (current) await audioEngine.setReciter(record, id);
  else {
    updateSettings();
    updateDetailAudio();
  }
}
function updateQuickModal() {
  if (!state.quickSearch) {
    ui.quick.replaceChildren();
    syncModalState();
    return;
  }
  ui.quick.innerHTML = `<div class="modal-layer"><section class="modal quick-modal" role="dialog" aria-modal="true"><div class="modal-head"><div><span class="modal-overline">Quick search</span><h2 class="modal-title">Find an ayah</h2></div><button class="icon-btn" data-action="quick-close">${icon("close")}</button></div><h3 class="hero-title" dir="rtl" style="margin-top:23px">\u0644\u0641\u0638 \u062A\u0644\u0627\u0634 \u06A9\u0631\u06CC\u06BA</h3><p class="hero-subtitle">Arabic, Urdu, English, or familiar transliteration</p>${searchForm("quick")}<div class="suggestion-row">${state.quickSuggestions.map(({ label, query }) => `<button class="suggestion ${stringIsLatin(label) ? "ltr" : ""}" data-action="suggestion" data-query="${escapeHtml(query)}">${escapeHtml(label)}</button>`).join("")}</div></section></div>`;
  syncModalState();
  setTimeout(() => document.querySelector("#search-quick")?.focus(), 0);
}
function openQuick() {
  tactile.medium();
  state.quickSuggestions = randomQuickSuggestions();
  state.quickSearch = true;
  updateQuickModal();
}
function closeQuick() {
  if (!state.quickSearch) return;
  state.quickSearch = false;
  updateQuickModal();
}
function updateAudioIndicators() {
  const active = Number(state.audio.track?.number);
  const playing = Boolean(state.audio.playing);
  app.querySelectorAll("[data-ayah-card-id]").forEach((card) => {
    const matches = Number(card.dataset.ayahCardId) === active && playing;
    card.classList.toggle("is-playing", matches);
    const label = card.querySelector("[data-playing-indicator]");
    if (label) label.hidden = !matches;
  });
}
function updateAudioDock() {
  const track = state.audio.track;
  app.classList.toggle("player-active", Boolean(track));
  ui.dock.hidden = !track;
  if (!track) {
    ui.dock.replaceChildren();
    return;
  }
  ui.dock.innerHTML = `<span class="dock-visual">${waveform()}</span><button class="dock-track" data-action="open-current-detail"><strong>${escapeHtml(track.surahName)} \xB7 ${escapeHtml(track.reference)}</strong><small>${escapeHtml(reciterById(track.reciterId).shortName)}${state.audio.repeat ? " \xB7 Repeat ayah" : ""}</small></button><button class="dock-control" data-action="audio-toggle-global">${state.audio.playing ? icon("pause") : icon("play")}</button><button class="dock-close" data-action="audio-stop">${icon("close")}</button>`;
  ui.dock.classList.toggle("playing", state.audio.playing);
}
function updateDetailAudio() {
  const slot = document.querySelector("#detail-audio-hub");
  if (slot && state.detail) slot.outerHTML = audioHub(state.detail);
}
async function toggleAudio(number) {
  const record = number ? findRecord(number) : null;
  tactile.light();
  await audioEngine.toggle(record, state.preferences.reciter);
}
function setAudioSpeed(speed) {
  state.preferences.audioSpeed = Number(speed);
  savePreferences();
  audioEngine.setSpeed(state.preferences.audioSpeed);
  tactile.light();
}
function toggleRepeat() {
  state.preferences.audioRepeat = !state.audio.repeat;
  savePreferences();
  audioEngine.setRepeat(state.preferences.audioRepeat);
  tactile.light();
}
function toggleBookmark(number) {
  const record = findRecord(number);
  if (!record) return;
  const index = state.bookmarks.findIndex((item) => Number(item.number) === Number(number));
  if (index >= 0) {
    state.bookmarks.splice(index, 1);
    toast("Bookmark removed.");
  } else {
    state.bookmarks.unshift({ ...record, savedAt: Date.now() });
    toast("Ayah bookmarked.", "success");
  }
  storage.saveBookmarks(state.bookmarks);
  tactile.light();
  updateBookmarks();
  updateBookmarkVisuals();
}
function updateBookmarkVisuals() {
  app.querySelectorAll(".bookmark-toggle[data-id]").forEach((button) => {
    const saved = isBookmarked(button.dataset.id);
    button.classList.toggle("saved", saved);
    button.setAttribute("aria-label", saved ? "Remove bookmark" : "Save bookmark");
  });
}
async function copyCurrentAyah() {
  const r = state.detail;
  if (!r) return;
  const text = `${r.arabic || ""}

${r.english ? `English: ${r.english}
` : ""}${r.urdu ? `Urdu: ${r.urdu}
` : ""}Surah ${r.surah?.englishName || ""} (${r.surah?.number || "\u2014"}:${r.numberInSurah || "\u2014"})`;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const input = document.createElement("textarea");
    input.value = text;
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.append(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }
  tactile.success();
  toast("Ayah copied to clipboard.", "success");
}
function toast(message, type = "") {
  const region = document.querySelector("#toast-region");
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.textContent = message;
  region.append(item);
  setTimeout(() => item.remove(), 3200);
}
async function handleNativeBack() {
  if (state.wordSheet) {
    closeWordSheet();
    return;
  }
  if (state.reciterSheet) {
    closeReciterSheet();
    return;
  }
  if (state.quickSearch) {
    closeQuick();
    return;
  }
  if (state.detail) {
    closeDetail();
    navigateTo(state.results ? "results" : "home");
    return;
  }
  if (state.view === "results") {
    navigateTo("home");
    return;
  }
  if (state.view !== "home") {
    navigateTo("home");
    return;
  }
  const exit = await confirmNative({ title: "Exit MagniAayat?", message: "Do you want to close the app?", okButtonTitle: "Exit", cancelButtonTitle: "Stay" });
  if (exit) await exitNativeApp();
}
app.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-search-form]");
  if (!form) return;
  event.preventDefault();
  performSearch(form.query.value);
});
app.addEventListener("input", (event) => {
  if (!event.target.matches(".search-input")) return;
  const input = event.target;
  const ltr = stringIsLatin(input.value);
  input.classList.toggle("ltr", ltr);
  input.setAttribute("dir", ltr ? "ltr" : "auto");
  input.closest("form")?.querySelector(".clear-search")?.classList.toggle("show", Boolean(input.value));
});
app.addEventListener("change", (event) => {
  if (event.target.matches('[data-action="translation-setting"]')) {
    state.preferences.translation = event.target.value;
    savePreferences();
    tactile.light();
    updateDetail();
  }
});
app.addEventListener("keydown", (event) => {
  if (event.key === "Escape") handleNativeBack();
  if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-ayah-card-id]")) {
    event.preventDefault();
    openDetail(event.target.dataset.ayahCardId);
  }
});
app.addEventListener("click", async (event) => {
  const node = event.target.closest("[data-action]");
  if (!node) return;
  const action = node.dataset.action;
  if (action === "nav") {
    const target = node.dataset.view;
    if (target === state.view && !state.detail && !state.quickSearch) return;
    tactile.light();
    navigateTo(target);
    return;
  }
  if (action === "quick-open") {
    openQuick();
    return;
  }
  if (action === "quick-close") {
    closeQuick();
    return;
  }
  if (action === "clear-input") {
    const input = document.querySelector(`#${node.dataset.input}`);
    if (input) {
      input.value = "";
      input.focus();
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    return;
  }
  if (action === "suggestion" || action === "history-search") {
    performSearch(node.dataset.query);
    return;
  }
  if (action === "filter") {
    tactile.light();
    state.filter = node.dataset.filter;
    state.displayLimit = 20;
    updateResults();
    return;
  }
  if (action === "load-more") {
    state.displayLimit += 20;
    updateResults();
    return;
  }
  if (action === "retry-search") {
    if (state.results?.query) performSearch(state.results.query);
    return;
  }
  if (action === "open-detail") {
    event.stopPropagation();
    openDetail(node.dataset.id);
    return;
  }
  if (action === "close-detail") {
    closeDetail();
    return;
  }
  if (action === "toggle-bookmark" || action === "remove-bookmark") {
    event.stopPropagation();
    toggleBookmark(node.dataset.id);
    return;
  }
  if (action === "word-study") {
    openWordStudy(Number(node.dataset.position), node.dataset.word);
    return;
  }
  if (action === "close-word-study") {
    closeWordSheet();
    return;
  }
  if (action === "copy-ayah") {
    copyCurrentAyah();
    return;
  }
  if (action === "audio-toggle") {
    toggleAudio(node.dataset.id);
    return;
  }
  if (action === "audio-toggle-global") {
    tactile.light();
    await audioEngine.toggle();
    return;
  }
  if (action === "audio-stop") {
    tactile.light();
    audioEngine.stop();
    return;
  }
  if (action === "audio-speed") {
    setAudioSpeed(node.dataset.speed);
    return;
  }
  if (action === "audio-repeat") {
    toggleRepeat();
    return;
  }
  if (action === "audio-open-reciter") {
    openReciterSheet(node.dataset.id);
    return;
  }
  if (action === "close-reciter") {
    closeReciterSheet();
    return;
  }
  if (action === "audio-set-reciter") {
    await chooseReciter(node.dataset.reciter, node.dataset.id);
    return;
  }
  if (action === "open-current-detail") {
    const record = findRecord(state.audio.track?.number);
    if (record) openDetail(record.number);
    else navigateTo("bookmarks");
    return;
  }
  if (action === "clear-history") {
    state.history = [];
    storage.saveHistory([]);
    updateHome();
    updateHistory();
    toast("Search history cleared.");
    return;
  }
  if (action === "clear-local-data") {
    const approved = await confirmNative({ title: "Clear local data?", message: "This removes saved ayahs, search history, and cached Arabic text from this device.", okButtonTitle: "Clear", cancelButtonTitle: "Keep" });
    if (approved) {
      storage.clearAll();
      api.arabicIndexPromise = null;
      state.bookmarks = [];
      state.history = [];
      state.preferences = { translation: "both", reciter: "alafasy", audioSpeed: 1, audioRepeat: false };
      audioEngine.setSpeed(1);
      audioEngine.setRepeat(false);
      state.results = null;
      updateHome();
      updateHistory();
      updateBookmarks();
      updateSettings();
      tactile.warning();
      toast("Local data cleared.");
    }
  }
});
window.addEventListener("online", () => toast("You are back online.", "success"));
window.addEventListener("offline", () => toast("You are offline. Saved data and sample references remain available.", "error"));
audioEngine.subscribe((snapshot) => {
  state.audio = snapshot;
  if (snapshot.error && snapshot.error !== lastAudioError) {
    lastAudioError = snapshot.error;
    if (started) toast(snapshot.error, "error");
  }
  if (started) {
    updateAudioDock();
    updateAudioIndicators();
    updateDetailAudio();
  }
});
mountShell();
updateHome();
updateResults();
updateBookmarks();
updateHistory();
updateSettings();
updateNavigation();
initializeNativeShell();
registerNativeBackHandler(handleNativeBack);
started = true;
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
