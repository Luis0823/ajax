(function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof require == "function" && require;
                if (!u && a) return a(o, !0);
                if (i) return i(o, !0);
                throw new Error("Cannot find module '" + o + "'")
            }
            var f = n[o] = {
                exports: {}
            };
            t[o][0].call(f.exports, function(e) {
                var n = t[o][1][e];
                return s(n ? n : e)
            }, f, f.exports, e, t, n, r)
        }
        return n[o].exports
    }
    var i = typeof require == "function" && require;
    for (var o = 0; o < r.length; o++) s(r[o]);
    return s
})({
    1: [function(require, module, exports) {
        var type;
        try {
            type = require("type-of")
        } catch (ex) {
            var r = require;
            type = r("type")
        }
        var jsonpID = 0,
            document = window.document,
            key, name, rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            scriptTypeRE = /^(?:text|application)\/javascript/i,
            xmlTypeRE = /^(?:text|application)\/xml/i,
            jsonType = "application/json",
            htmlType = "text/html",
            blankRE = /^\s*$/;
        var ajax = module.exports = function(options) {
            var settings = extend({}, options || {});
            for (key in ajax.settings)
                if (settings[key] === undefined) settings[key] = ajax.settings[key];
            ajaxStart(settings);
            if (!settings.crossDomain) settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) && RegExp.$2 != window.location.host;
            var dataType = settings.dataType,
                hasPlaceholder = /=\?/.test(settings.url);
            if (dataType == "jsonp" || hasPlaceholder) {
                if (!hasPlaceholder) settings.url = appendQuery(settings.url, "callback=?");
                return ajax.JSONP(settings)
            }
            if (!settings.url) settings.url = window.location.toString();
            serializeData(settings);
            var mime = settings.accepts[dataType],
                baseHeaders = {},
                protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
                xhr = ajax.settings.xhr(),
                abortTimeout;
            if (!settings.crossDomain) baseHeaders["X-Requested-With"] = "XMLHttpRequest";
            if (mime) {
                baseHeaders["Accept"] = mime;
                if (mime.indexOf(",") > -1) mime = mime.split(",", 2)[0];
                xhr.overrideMimeType && xhr.overrideMimeType(mime)
            }
            if (settings.contentType || settings.data && settings.type.toUpperCase() != "GET") baseHeaders["Content-Type"] = settings.contentType || "application/x-www-form-urlencoded";
            settings.headers = extend(baseHeaders, settings.headers || {});
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    clearTimeout(abortTimeout);
                    var result, error = false;
                    if (xhr.status >= 200 && xhr.status < 300 || xhr.status == 304 || xhr.status == 0 && protocol == "file:") {
                        dataType = dataType || mimeToDataType(xhr.getResponseHeader("content-type"));
                        result = xhr.responseText;
                        try {
                            if (dataType == "script")(1, eval)(result);
                            else if (dataType == "xml") result = xhr.responseXML;
                            else if (dataType == "json") result = blankRE.test(result) ? null : JSON.parse(result)
                        } catch (e) {
                            error = e
                        }
                        if (error) ajaxError(error, "parsererror", xhr, settings);
                        else ajaxSuccess(result, xhr, settings)
                    } else {
                        ajaxError(null, "error", xhr, settings)
                    }
                }
            };
            var async = "async" in settings ? settings.async : true;
            xhr.open(settings.type, settings.url, async);
            for (name in settings.headers) xhr.setRequestHeader(name, settings.headers[name]);
            if (ajaxBeforeSend(xhr, settings) === false) {
                xhr.abort();
                return false
            }
            if (settings.timeout > 0) abortTimeout = setTimeout(function() {
                xhr.onreadystatechange = empty;
                xhr.abort();
                ajaxError(null, "timeout", xhr, settings)
            }, settings.timeout);
            xhr.send(settings.data ? settings.data : null);
            return xhr
        };

        function triggerAndReturn(context, eventName, data) {
            return true
        }

        function triggerGlobal(settings, context, eventName, data) {
            if (settings.global) return triggerAndReturn(context || document, eventName, data)
        }
        ajax.active = 0;

        function ajaxStart(settings) {
            if (settings.global && ajax.active++ === 0) triggerGlobal(settings, null, "ajaxStart")
        }

        function ajaxStop(settings) {
            if (settings.global && !--ajax.active) triggerGlobal(settings, null, "ajaxStop")
        }

        function ajaxBeforeSend(xhr, settings) {
            var context = settings.context;
            if (settings.beforeSend.call(context, xhr, settings) === false || triggerGlobal(settings, context, "ajaxBeforeSend", [xhr, settings]) === false) return false;
            triggerGlobal(settings, context, "ajaxSend", [xhr, settings])
        }

        function ajaxSuccess(data, xhr, settings) {
            var context = settings.context,
                status = "success";
            settings.success.call(context, data, status, xhr);
            triggerGlobal(settings, context, "ajaxSuccess", [xhr, settings, data]);
            ajaxComplete(status, xhr, settings)
        }

        function ajaxError(error, type, xhr, settings) {
            var context = settings.context;
            settings.error.call(context, xhr, type, error);
            triggerGlobal(settings, context, "ajaxError", [xhr, settings, error]);
            ajaxComplete(type, xhr, settings)
        }

        function ajaxComplete(status, xhr, settings) {
            var context = settings.context;
            settings.complete.call(context, xhr, status);
            triggerGlobal(settings, context, "ajaxComplete", [xhr, settings]);
            ajaxStop(settings)
        }

        function empty() {}
        ajax.JSONP = function(options) {
            if (!("type" in options)) return ajax(options);
            var callbackName = "jsonp" + ++jsonpID,
                script = document.createElement("script"),
                abort = function() {
                    if (callbackName in window) window[callbackName] = empty;
                    ajaxComplete("abort", xhr, options)
                },
                xhr = {
                    abort: abort
                },
                abortTimeout, head = document.getElementsByTagName("head")[0] || document.documentElement;
            if (options.error) script.onerror = function() {
                xhr.abort();
                options.error()
            };
            window[callbackName] = function(data) {
                clearTimeout(abortTimeout);
                delete window[callbackName];
                ajaxSuccess(data, xhr, options)
            };
            serializeData(options);
            script.src = options.url.replace(/=\?/, "=" + callbackName);
            head.insertBefore(script, head.firstChild);
            if (options.timeout > 0) abortTimeout = setTimeout(function() {
                xhr.abort();
                ajaxComplete("timeout", xhr, options)
            }, options.timeout);
            return xhr
        };
        ajax.settings = {
            type: "GET",
            beforeSend: empty,
            success: empty,
            error: empty,
            complete: empty,
            context: null,
            global: true,
            xhr: function() {
                return new window.XMLHttpRequest
            },
            accepts: {
                script: "text/javascript, application/javascript",
                json: jsonType,
                xml: "application/xml, text/xml",
                html: htmlType,
                text: "text/plain"
            },
            crossDomain: false,
            timeout: 0
        };

        function mimeToDataType(mime) {
            return mime && (mime == htmlType ? "html" : mime == jsonType ? "json" : scriptTypeRE.test(mime) ? "script" : xmlTypeRE.test(mime) && "xml") || "text"
        }

        function appendQuery(url, query) {
            return (url + "&" + query).replace(/[&?]{1,2}/, "?")
        }

        function serializeData(options) {
            if (type(options.data) === "object") options.data = param(options.data);
            if (options.data && (!options.type || options.type.toUpperCase() == "GET")) options.url = appendQuery(options.url, options.data)
        }
        ajax.get = function(url, success) {
            return ajax({
                url: url,
                success: success
            })
        };
        ajax.post = function(url, data, success, dataType) {
            if (type(data) === "function") dataType = dataType || success, success = data, data = null;
            return ajax({
                type: "POST",
                url: url,
                data: data,
                success: success,
                dataType: dataType
            })
        };
        ajax.getJSON = function(url, success) {
            return ajax({
                url: url,
                success: success,
                dataType: "json"
            })
        };
        var escape = encodeURIComponent;

        function serialize(params, obj, traditional, scope) {
            var array = type(obj) === "array";
            for (var key in obj) {
                var value = obj[key];
                if (scope) key = traditional ? scope : scope + "[" + (array ? "" : key) + "]";
                if (!scope && array) params.add(value.name, value.value);
                else if (traditional ? type(value) === "array" : type(value) === "object") serialize(params, value, traditional, key);
                else params.add(key, value)
            }
        }

        function param(obj, traditional) {
            var params = [];
            params.add = function(k, v) {
                this.push(escape(k) + "=" + escape(v))
            };
            serialize(params, obj, traditional);
            return params.join("&").replace("%20", "+")
        }

        function extend(target) {
            var slice = Array.prototype.slice;
            slice.call(arguments, 1).forEach(function(source) {
                for (key in source)
                    if (source[key] !== undefined) target[key] = source[key]
            });
            return target
        }
    }, {
        "type-of": 2
    }],
    2: [function(require, module, exports) {
        var toString = Object.prototype.toString;
        module.exports = function(val) {
            switch (toString.call(val)) {
                case "[object Function]":
                    return "function";
                case "[object Date]":
                    return "date";
                case "[object RegExp]":
                    return "regexp";
                case "[object Arguments]":
                    return "arguments";
                case "[object Array]":
                    return "array";
                case "[object String]":
                    return "string"
            }
            if (val === null) return "null";
            if (val === undefined) return "undefined";
            if (val && val.nodeType === 1) return "element";
            if (val === Object(val)) return "object";
            return typeof val
        }
    }, {}]
}, {}, [1]);
