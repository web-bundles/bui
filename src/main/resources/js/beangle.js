/**
 * Beangle, Agile Java/Scala Development Scaffold and Toolkit
 *
 * Copyright (c) 2005-2020, Beangle Software.
 *
 * Beangle is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Beangle is distributed in the hope that it will be useful.
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Beangle.  If not, see <http://www.gnu.org/licenses/>.
 */
(function(window, undefined) {
  if(beangle) return;
  var beangle = function() {
    return true;
  };

  beangle.version = "0.5.4";
  /** extend function */
  beangle.extend = function(map) {
    for(var attr in map) {
      var attrs = attr.split("."),
        obj = beangle,
        i;
      for(i = 0; i < attrs.length - 1; i++) {
        obj[attrs[i]] = obj[attrs[i]] || {};
        obj = obj[attrs[i]];
      }
      obj[attrs[attrs.length - 1]] = map[attr];
    }
  };
  beangle.base = null;
  beangle.staticBase = null;
  beangle.contextPath = null;
  beangle.getContextPath = function() {
    if(beangle.contextPath) return beangle.contextPath;
    var
      baseElements = document.getElementsByTagName("base"),
      baseHref = "";
    if(baseElements.length === 1) {
      baseHref = baseElements[0].href.replace(/[^\/]+$/, "");
    } else {
      baseHref = document.location.origin + "/";
    }
    beangle.base = baseHref;
    var endPart = baseHref.substring(baseHref.indexOf(document.domain) + document.domain.length);
    beangle.contextPath = endPart.substring(endPart.indexOf("/"));
    return beangle.contextPath;
  };

  beangle.displayAjaxMessage = function() {
    var loadingMessage = "Loading...";
    var mz = document.getElementById("topLoadingMessageZone");
    if(!mz) {
      mz = document.createElement("div");
      mz.setAttribute("id", "topLoadingMessageZone");
      document.body.appendChild(mz);
      var text = document.createTextNode(loadingMessage);
      mz.appendChild(text);
    } else {
      mz.innerHTML = loadingMessage;
      mz.style.display = "block";
    }
  };
  beangle.hideAjaxMessage = function() {
    var mz = document.getElementById("topLoadingMessageZone");
    if(mz) mz.style.display = "none";
  };

  //History--------------------------
  beangle.history = {
    isValidState: function(s) {
      return (typeof s !== "undefined") && jQuery.type((s.data || {}).container) != "undefined" && jQuery.type((s.data || {}).content) != "undefined";
    },
    busy: false,
    init: function() {
      // build Public History Object
      var History = window.History = window.History || {};
      var history = window.history; // Old History Object

      // Initialise
      History.init = function(options) {
        if(typeof History.init.initialized !== "undefined") {
          return false;
        }
        History.init.initialized = true;
        History.options = options || {};
        History.options.initialTitle = History.options.initialTitle || document.title;
        //最多存储20个状态
        History.options.maxStates = History.options.maxStates || 50;
        History.options.minStates = History.options.minStates || 20;
        History.extractEventData = function(key, event, extra) {
          return (event && event.originalEvent && event.originalEvent[key]) || (extra && extra[key]) || undefined;
        };
        /**
         * Ensures that we have an absolute URL and not a relative URL
         */
        History.getFullUrl = function(url) {
          var fullUrl = url;
          var firstChar = url.substring(0, 1);
          if(/[a-z]+\:\/\//.test(url)) {} else if(firstChar === "/") {
            fullUrl = document.location.origin + "/" + url.replace(/^\/+/, "");
          } else {
            fullUrl = beangle.base + url.replace(/^(\.\/)+/, "");
          }
          return fullUrl.replace(/\#$/, "");
        };

        History.getLocationHref = function(doc) {
          doc = doc || document;
          return doc.location.href;
        };

        History.idToState = new Map();
        History.urlToId = new Map();
        History.ids = [];
        History.lastState = {};

        History.getState = function(create) {
          var st = History.getLastState();
          if(typeof create === "undefined") { create = false; }
          if(!st && create) {
            st = History.createState();
          }
          return st;
        };

        History.genStateId = function(newState) {
          var id;
          while(true) {
            id = Date.now() + String(Math.random()).replace(/\D/g, "");
            if(typeof History.idToState.get(id) === "undefined") {
              break;
            }
          }
          return id;
        };

        History.createState = function(data, title, url) {
          var state = {};
          if(!data || (typeof data !== "object")) {
            data = {};
          }
          state.data = data;
          state.url = History.getFullUrl(url ? url : (History.getLocationHref()));
          state.id = History.genStateId(state);
          History.ids.push(state.id);
          History.idToState.set(state.id, state);
          History.urlToId.set(state.url, state.id);
          return state;
        };

        History.getStateById = function(id) {
          id = String(id);
          return History.idToState.get(id) || undefined;
        };

        History.extractState = function(url, create) {
          var st = null;
          var id = History.urlToId.get(url) || false;
          create = create || false;
          if(id) {
            st = History.getStateById(id);
          }
          if(!st && create) {
            st = History.createState(null, null, url);
          }
          return st;
        };

        History.getLastState = function() {
          return History.lastState || undefined;
        };

        History.isLastState = function(newState) {
          if(History.lastState) {
            return (newState.id === History.lastState.id);
          } else {
            return false;
          }
        };

        History.saveState = function(newState) {
          History.lastState = newState;
        };

        History.onPopState = function(event, extra) {
          var stateId = false;
          var newState = false;
          stateId = History.extractEventData("state", event, extra) || false;
          if(stateId) {
            newState = History.getStateById(stateId);
          } else if(History.expectedStateId) {
            newState = History.getStateById(History.expectedStateId);
          } else {
            newState = History.extractState(History.getLocationHref());
          }
          if(!newState) {
            newState = History.createState(null, null, History.getLocationHref());
          }

          History.expectedStateId = false;
          if(History.isLastState(newState)) {
            return false;
          }
          History.saveState(newState);
          jQuery(window).trigger("statechange");
          return true;
        };
        jQuery(window).bind("popstate", History.onPopState);

        History.pushState = function(data, title, url) {
          var newState = History.createState(data, title, url);
          if(History.ids.length > History.options.maxStates) {
            History.shrink();
          }
          if(!History.isLastState(newState)) {
            History.expectedStateId = newState.id;
            history.pushState(newState.id, newState.title, newState.url);
            jQuery(window).trigger("popstate");
          }
          return true;
        };

        History.replaceState = function(data, title, url) {
          var newState = History.createState(data, title, url);
          if(!History.isLastState(newState)) {
            History.expectedStateId = newState.id;
            history.replaceState(newState.id, newState.title, newState.url);
            jQuery(window).trigger("popstate");
          }
          return true;
        };
        History.shrink = function() {
          while(History.ids.length > History.options.minStates) {
            var oldId = History.ids.shift();
            var ss = History.idToState.get(oldId);
            if(ss) {
              History.idToState.delete(oldId);
              History.urlToId.delete(ss.url);
            }
          }
        };
        History.saveState(History.extractState(History.getLocationHref(), true));

        jQuery(window).bind("hashchange", function() {
          jQuery(window).trigger("popstate");
        });
      }; // History.init

      History.init();
      jQuery(window).bind("statechange", function() {
        var currState = History.getState() || {};
        if(beangle.history.isValidState(currState)) {
          if(jQuery(currState.data.container).length > 0) {
            jQuery(currState.data.container).html(currState.data.content);
            beangle.history.applyState(currState);
          } else {
            beangle.history.busy = true;
            var statePaths = []; //存储嵌套的state路径
            statePaths.push(currState);
            while(currState && currState.data.parentId) {
              currState = History.getStateById(currState.data.parentId);
              if(beangle.history.isValidState(currState)) {
                statePaths.push(currState);
                if(jQuery(currState.data.container).length > 0) {
                  break;
                }
              } else {
                break;
              }
            }
            for(var i = statePaths.length - 1; i >= 0; i--) {
              var state = statePaths[i];
              jQuery(state.data.container).html(state.data.content);
              beangle.history.applyState(state);
            }
            beangle.history.busy = false;
          }
        }
      });
    },

    Go: function(url, target) {
      if(beangle.history.busy) return;
      jQuery.ajax({
        url: url,
        cache: false,
        type: "GET",
        dataType: "html",
        complete: function(jqXHR) {
          target = "#" + target;
          var state = History.getState() || { id: "" };
          var parentId = state.id;
          if(jQuery(target).html().length > 0) {
            beangle.history.snapshot();
            History.pushState({ content: jqXHR.responseText, container: target, parentId: parentId }, "", beangle.history.convertUrl(url));
          } else {
            History.replaceState({ content: jqXHR.responseText, container: target, parentId: parentId }, "", beangle.history.convertUrl(url));
          }
          beangle.hideAjaxMessage();
        },
        beforeSend: beangle.displayAjaxMessage
      });
    },
    snapshot: function() {
      var state = History.getState() || {};
      if(state.data && state.data.content) {
        var _t = [];
        jQuery(state.data.container + " .box:checked").each(function(index, e) { _t[_t.length] = e.value; });
        if(_t.length > 0) state.data.boxes = _t;
      }
    },
    applyState: function(state) {
      if(state.data.boxes) {
        jQuery(state.data.boxes).each(function(index, value) {
          jQuery(state.data.container + " .box[value=" + value + "]").prop("checked", true);
        });
      }
      if(typeof afterApplyState == "function") {
        afterApplyState();
        afterApplyState = null;
      }
    },
    convertUrl: function(url) {
      var tail = null;
      if(url.startsWith(beangle.base)) { //http://localhost:8080/context/menu
        tail = url.substring(beangle.base.length);
        return beangle.base + "#/" + tail;
      } else if(url.startsWith(beangle.contextPath)) { //context/menu
        tail = url.substring(document.location.origin.length);
        return beangle.base + "#" + url.replace(beangle.contextPath, "/");
      } else if(url.startsWith(document.location.origin)) { //http://localhost:8080/other_context/menu
        tail = url.substring(document.location.origin.length);
        return beangle.base + "#" + tail;
      } else {
        return beangle.base + "#" + url;
      }
    },
    submit: function(form, action, target) {
      if(jQuery.type(form) == "string" && form.indexOf("#") != 0) {
        form = "#" + form;
      }
      if(jQuery.type(target) == "string" && target.indexOf("#") != 0) {
        target = "#" + target;
      }
      beangle.displayAjaxMessage();

      var handleResult = function(result) {
        beangle.history.snapshot();
        var state = History.getState() || { id: "" };
        var parentId = state.id;
        History.pushState({ content: result, container: target, parentId: parentId }, "", beangle.history.convertUrl(action));
        beangle.hideAjaxMessage();
        return false;
      };
      require(["jquery-form"], function() {
        jQuery(form).ajaxForm({ success: handleResult, error: handleResult, url: action });
        jQuery(form).submit();
      })
    }
  };

  //Go and ajax---------------------------------
  beangle.extend({
    //jump to href or anchor
    Go: function(obj, target, confirmMsg) {
      if(confirmMsg && !confirm(confirmMsg)) return false;
      var url = obj;
      if(typeof obj == "object" && obj.tagName.toLowerCase() == "a") {
        url = obj.href;
        if(!target) {
          target = beangle.findTarget(obj);
        }
      }
      if(!target) target = "_self";
      if("_self" == target) { self.location = url; }
      else if("_parent" == target) { self.parent.location = url; }
      else if("_top" == target) { self.top.location = url; }
      else if("_blank" == target) { window.open(url); }
      else {
        if(!beangle.isAjaxTarget(target)) {
          document.getElementById(target).src = url;
        } else {
          if(jQuery("#" + target).hasClass("ajax_container")) {
            beangle.history.Go(url, target);
          } else {
            jQuery.get(url, function(data) { jQuery("#" + target).html(data); });
          }
        }
      }
      return false;
    },
    ready: function(fn) {
      jQuery(document).ready(fn);
    },
    isAjaxTarget: function(target) {
      if(!target) return false;
      if(target == "" || target == "_blank" || target == "_self" || target == "_parent" || target == "_top") {
        return false;
      }
      var targetEle = document.getElementById(target);
      if(!targetEle) return false;
      var tagName = targetEle.tagName.toLowerCase();
      if(tagName == "iframe" || tagName == "object") {
        return false;
      }
      return true;
    },
    normalTarget: function(target) {
      if(target == "" || target == "_blank" || target == "_self" || target == "_parent") {
        return target;
      }
      var targetObj = document.getElementById(target);
      if(!targetObj || targetObj.tagName.toLowerCase() != "iframe") return "_self";
      else return target;
    },
    findTarget: function(ele) {
      var p = ele.parentNode,
        finalTarget = "_self";
      while(p) {
        //FIXME ui-tabs-panel
        if(p.id && p.className && (p.className.indexOf("ajax_container") > -1)) { //||p.className.indexOf("ui-tabs-panel")>-1
          finalTarget = p.id;
          break;
        } else {
          if(p == p.parentNode) p = null;
          else p = p.parentNode;
        }
      }
      ele.target = finalTarget;
      return finalTarget;
    }
  });

  // Assert------------------------
  beangle.extend({
    assert: {
      notNull: function(object, message) {
        if(null == object) alert(message);
      }
    }
  });
  beangle.extend({
    randomInt: function() {
      var num = Math.random() * 10000000;
      num -= num % 1;
      return num;
    }
  });
  // Logger----------------------------
  beangle.extend({
    logger: {
      // debug=0;info=1;warn=2;error=3;fatal=4;disabled=5
      level: 1,
      debug: function(message) {
        if(beangle.logger.level <= 0) {
          var msg = "[beangle] " + message;
          if(window.console && window.console.log) {
            window.console.log(message);
          } else {
            alert(msg);
          }
        }
      }
    }
  });

  // Event--------------------------------------------------
  beangle.extend({
    event: {
      portable: function(e) {
        if(!e) return window.event;
        else return e;
      },
      /**获得事件背后的元素*/
      getTarget: function(e) {
        e = beangle.event.portable(e);
        return e.target || e.srcElement;
      }
    }
  });

  // Input----------------------------------------------------
  beangle.extend({
    input: {
      toggleCheckBox: function(chk, event) {
        beangle.input.boxAction(chk, "toggle", event);
      },
      /**
       * 返回单选列表中选择的值
       * @return 没有选中时,返回""
       */
      getRadioValue: function(radioName) {
        return beangle.input.boxAction(document.getElementsByName(radioName), "value");
      },

      /**
       * 返回多选列表中选择的值
       * @return 多个值以,相隔.没有选中时,返回""
       */
      getCheckBoxValues: function(chkname) {
        var tmpIds = beangle.input.boxAction(document.getElementsByName(chkname), "value");
        if(tmpIds == null) return "";
        else return tmpIds;
      },
      /**
       * modify by chaostone 2006-8-2
       * 将反选取消,改为全选或者全部取消
       */
      boxAction: function(box, action, event) {
        var val = "",
          srcElement, i;
        if(box) {
          if(!box[0]) {
            if(action == "selected") {
              return box.checked;
            } else if(action == "value") {
              if(box.checked)
                val = box.value;
            } else if(action == "toggle") {
              srcElement = beangle.event.getTarget(event);
              box.checked = srcElement.checked;
              if(typeof box.onchange == "function") {
                box.onchange();
              }
            }
          } else {
            for(i = 0; i < box.length; i++) {
              if(action == "selected") {
                if(box[i].checked)
                  return box[i].checked;
              } else if(action == "value") {
                if(box[i].checked) {
                  if(box[i].type == "radio") {
                    val = box[i].value;
                  } else if(box[i].type == "checkbox") {
                    if(val != "")
                      val = val + ",";
                    val = val + box[i].value;
                  }
                }
              } else if(action == "toggle") {
                srcElement = beangle.event.getTarget(event);
                box[i].checked = srcElement.checked;
                if(typeof box[i].onchange == "function") {
                  box[i].onchange();
                }
              }
            }
          }
        }
        if(action == "selected")
          return false;
        else
          return val;
      }
    }
  });

  //IFrame--------------------------------------------------------
  beangle.extend({
    iframe: {
      adaptSelf: function() {
        beangle.iframe.adapt(self);
      },
      /** iframe 页面自适应大小
       * @targObj    iframe
       * @extraHight
       */
      adapt: function(targObj, extraHight) {
        var frames, targWin, totalHeight, myHeight;
        if(null == targObj || targObj.name == "")
          return;
        if(targObj.parent == targObj) return;
        if(targObj.parent == window.top) {
          if(targObj.parent.document.body.style.overflowY == "hidden") return;
        }
        frames = targObj.parent.document.getElementsByName(targObj.name);
        if(frames.length < 1) return;
        targWin = frames[0];
        if(targWin != null && (targWin.scrolling == "no" || targWin.className == "autoadapt")) {
          totalHeight = targObj.document.body.scrollHeight + ((null == extraHight) ? 0 : extraHight);
          myHeight = 0;
          if(targWin.style.height) {
            myHeight = parseInt(targWin.style.height.substring(0, targWin.style.height.length - 2));
          }
          if((totalHeight > 0) && totalHeight > myHeight) {
            targWin.style.height = totalHeight + "px";
            beangle.logger.debug("adapt frame:" + targObj.name + " height " + targWin.style.height);
          }
        }
        beangle.iframe.adapt(targObj.parent);
      }
    }
  });
  //About From
  beangle.extend({
    form: {
      submit: function(myForm, action, target, onsubmit, ajax, noHistory) {
        var submitTarget, rs, origin_target, origin_action;
        if((typeof myForm) == "string") myForm = document.getElementById(myForm);
        //First native onsubmit will benefit to user"s onsubmit hook on data validation.
        //1.native onsubmit
        if(myForm.onsubmit) {
          rs = null;
          try { rs = myForm.onsubmit(); } catch (e) { alert(e); return false; }
          if(!rs) {
            return false;
          }
        }
        //2. submit hook
        if(onsubmit) {
          rs = null;
          if(typeof onsubmit == "function") {
            try { rs = onsubmit(myForm); } catch (e) { alert(e); return false; }
          } else {
            rs = eval(onsubmit);
          }
          if(!rs) {
            return false;
          }
        }
        //3. check target and action
        submitTarget = (null != target) ? target : myForm.target;

        if(!submitTarget) submitTarget = beangle.findTarget(myForm);

        if(action == null) action = myForm.action;

        if(action.indexOf("http://") == 0) action = action.substring(action.indexOf("/", 7));
        if(action.indexOf("https://") == 0) action = action.substring(action.indexOf("/", 8));

        if(null == ajax || ajax) ajax = beangle.isAjaxTarget(submitTarget);

        // 4. fire
        if(ajax) {
          if(null == myForm.id || "" == myForm.id) {
            myForm.setAttribute("id", myForm.name);
          }
          if(!noHistory && !jQuery("input:file", myForm).length) {
            beangle.history.submit(myForm.id, action, submitTarget);
          } else {
            beangle.form.ajaxSubmit(myForm.id, action, submitTarget);
          }
        } else {
          origin_target = myForm.target;
          origin_action = myForm.action;
          myForm.action = action;
          myForm.target = beangle.normalTarget(submitTarget);
          myForm.submit();
          myForm.target = origin_target;
          myForm.action = origin_action;
        }
        return true;
      },
      displayWaiting: function(formId, btn) {
        var disable = false;
        var form = document.getElementById(formId);
        if(form) {
          if(form.target) {
            var ele = form;
            var p = ele.parentNode;
            while(p) {
              if(p.id && p.id == form.target) {
                disable = true;
                break;
              } else {
                if(p == p.parentNode) p = null;
                else p = p.parentNode;
              }
            }
          } else {
            disable = true;
          }
        }
        if(disable) {
          btn.innerHTML = btn.innerHTML + "...";
          btn.disabled = true;
        }
      },
      ajaxSubmit: function(formId, action, target) {
        if(!action) action = document.getElementById(formId).action;
        require(["jquery-form"], function() {
          jQuery("#" + formId).ajaxForm({
            success: function(result) { try { jQuery("#" + target).html(result); } catch (e) { alert(e); } },
            error: function(response) { try { jQuery("#" + target).html(response.responseText); } catch (e) { alert(e); } },
            url: action
          });
          jQuery("#" + formId).submit();
        });
      },
      /**
       * 提交要求含有id的表单
       * @param form 带提交的表单
       * @param id 要提交id的名称
       * @param isMulti(可选)是否允许多个id选择,默认支持一个
       * @param action (可选) 指定form的action
       */
      submitId: function(form, id, isMulti, action, promptMsg, ajax) {
        var selectId = beangle.input.getCheckBoxValues(id);
        if(null == isMulti) isMulti = false;

        if("" == selectId) {
          alert(isMulti ? "请选择一个或多个进行操作" : "请选择一个进行操作");
          return;
        }
        if(!isMulti && (selectId.indexOf(",") > 0)) {
          alert("请仅选择一个");
          return;
        }
        if(null != action) {
          form.action = action;
        } else {
          action = form.action;
        }
        beangle.form.addInput(form, (isMulti ? (id + "s") : id), selectId, "hidden");
        if(null != promptMsg) {
          if(!confirm(promptMsg)) return;
        }
        beangle.form.submit(form, action, null, null, ajax);
      },
      /**
       * 向form中添加一个input。
       * @param form 要添加输入的form
       * @param name input的名字
       * @param value input的值
       * @param type input的类型，默认为hidden
       * @author chaostone 2006-4-7
       */
      addInput: function(form, name, value, type) {
        if(!form) {
          return;
        }
        //防止设置form的属性
        if(form[name] != null && (typeof form[name].tagName) != "undefined") {
          form[name].value = value;
        } else {
          if(null == type) type = "hidden";
          var input = document.createElement("input");
          input.setAttribute("name", name);
          input.setAttribute("value", value);
          input.setAttribute("type", type);
          form.appendChild(input);
        }
      },
      addInputs: function(form, name, value, type) {
        if(!form) {
          console.log("add inputs to null form");
          return;
        }
        if(null == type) type = "hidden";
        for(i = 0; i < value.length; i++) {
          var input = document.createElement("input");
          input.setAttribute("name", name);
          input.setAttribute("value", value[i]);
          input.setAttribute("type", type);
          form.appendChild(input);
        }
      },
      removeInputs: function(form, name) {
        jQuery(form).children("input[name=" + name.replace(".", "\\.") + "]").remove();
      },
      ecodeParams: function(params) {
        if("" == params) return "";
        var paramsPair = params.split("&"),
          newParams = "",
          i, eqIndex;
        for(i = 0; i < paramsPair.length; i++) {
          if(paramsPair[i] != "") {
            eqIndex = paramsPair[i].indexOf("=");
            newParams += "&" + paramsPair[i].substr(0, eqIndex);
            if(-1 != eqIndex) {
              newParams += "=";
              newParams += escape(paramsPair[i].substr(eqIndex + 1));
            }
          }
        }
        return newParams;
      },
      /**
       * 从form表单中，抽出含有指定前缀的输出参数，
       * 将其作为一个参数加入到to表单中。
       */
      setSearchParams: function(from, to, prefix) {
        beangle.form.addInput(to, "params", "");
        var params = beangle.form.getInputParams(from, prefix, false);
        beangle.form.addInput(to, "params", params);
      },

      addHiddens: function(form, paramSeq) {
        beangle.assert.notNull(paramSeq, "paramSeq for addHiddens must not be null");
        var params = paramSeq.split("&"),
          i, name, value;
        for(i = 0; i < params.length; i++) {
          if(params[i] != "") {
            name = params[i].substr(0, params[i].indexOf("="));
            value = params[i].substr(params[i].indexOf("=") + 1);
            beangle.form.addInput(form, name, value, "hidden");
          }
        }
      },

      addParamsInput: function(form, value) {
        beangle.form.addInput(form, "_params", value, "hidden");
      },
      transferParams: function(from, to, prefix, getEmpty) {
        if(getEmpty == null)
          getEmpty = true;
        var params = beangle.form.getInputParams(from, prefix, getEmpty);
        beangle.form.addHiddens(to, params);
      },

      /**
       * 收集给定form中的input||select参数（不论input的类型）.<b>
       * 但不收集params的input,这个作为保留名称
       * @param form
       * @param prefix 指明所有input||select的前缀，如果没有前缀可以忽略
       * @param getEmpty 是否收集值为空的属性
       * @return 返回参数列表串形如：&input1=...&input2=...
       * @author chaostone 2006-4-7
       *
       */
      getInputParams: function(form, prefix, getEmpty) {
        var elems = form.elements,
          params = "",
          i;
        if(null == getEmpty) getEmpty = true;

        for(i = 0; i < elems.length; i++) {
          if("" != elems[i].name) {
            if("_params" == elems[i].name) continue;
            //alert(elems[i].tagName+":"+elems[i].value);
            if((elems[i].value == "") && (!getEmpty)) continue;
            if(null != prefix) {
              if(elems[i].name.indexOf(prefix) == 0 && elems[i].name.indexOf(".") > 1) {
                if((elems[i].type == "radio" || elems[i].type == "checkbox") && !elems[i].checked)
                  continue;
                if(elems[i].value.indexOf("&") != -1) {
                  params += "&" + elems[i].name + "=" + escape(elems[i].value);
                } else {
                  params += "&" + elems[i].name + "=" + elems[i].value;
                }
              }
            } else {
              if((elems[i].type == "radio" || elems[i].type == "checkbox") && !elems[i].checked)
                continue;
              if(elems[i].value.indexOf("&") != -1) {
                params += "&" + elems[i].name + "=" + escape(elems[i].value);
              } else {
                params += "&" + elems[i].name + "=" + elems[i].value;
              }
            }
          }
        }
        //alert("[getInputParams]:"+params);
        return params;
      },
      goToPage: function(form, pageIndex, pageSize, orderBy) {
        if((typeof form) != "object") { alert("[goToPage:]form is not well defined."); return; }
        //form.method="post"; for avoid "method" input
        if(null != pageIndex) {
          if(!/^[1-9]\d*$/.test(pageIndex)) {
            alert("输入分页的页码是:" + pageIndex + ",它不是个整数");
            return;
          }
          beangle.form.addInput(form, "pageIndex", pageIndex, "hidden");
        } else {
          beangle.form.addInput(form, "pageIndex", 1, "hidden");
        }
        if(null != pageSize) {
          if(!/^[1-9]\d*$/.test(pageSize)) {
            alert("输入分页的页长是:" + pageSize + ",它不是个整数");
            return;
          }
          beangle.form.addInput(form, "pageSize", pageSize, "hidden");
        } else {
          beangle.form.addInput(form, "pageSize", "", "hidden");
        }
        if(null != orderBy && orderBy != "null") {
          beangle.form.addInput(form, "orderBy", orderBy, "hidden");
        } else {
          beangle.form.addInput(form, "orderBy", "", "hidden");
        }
        //alert("in goToPage");
        form.submit();
      },
      goToFirstPage: function(form) {
        beangle.form.goToPage(form, 1);
      }
    }
  });

  //select---------------------
  beangle.extend({
    select: {
      getValues: function(select) {
        var val = "",
          i, options = select.options;
        for(i = 0; i < options.length; i++) {
          if(val != "")
            val = val + ",";
          val = val + options[i].value;
        }
        return val;
      },
      getSelectedValues: function(select) {
        var val = "",
          i, options = select.options;
        for(i = 0; i < options.length; i++) {
          if(options[i].selected) {
            if(val != "")
              val = val + ",";
            val = val + options[i].value;
          }
        }
        return val;
      },
      hasOption: function(select, op) {
        for(var i = 0; i < select.length; i++) {
          if(select.options[i].value == op.value)
            return true;
        }
        return false;
      },

      moveSelected: function(srcSelect, destSelect) {
        var i, op;
        for(i = 0; i < srcSelect.length; i++) {
          if(srcSelect.options[i].selected) {
            op = srcSelect.options[i];
            if(!beangle.select.hasOption(destSelect, op)) {
              destSelect.options[destSelect.length] = new Option(op.text, op.value);
            }
          }
        }
        beangle.select.removeSelected(srcSelect);
        beangle.select.clearStatus(srcSelect);
      },

      clearStatus: function(select) {
        for(var i = 0; i < select.options.length; i++)
          select.options[i].selected = false;
      },
      selectAll: function(select) {
        for(var i = 0; i < select.options.length; i++)
          select.options[i].selected = true;
        return select.options.length > 0;
      },
      removeSelected: function(select) {
        var options = select.options,
          i;
        for(i = options.length - 1; i >= 0; i--) {
          if(options[i].selected) {
            options[i] = null;
          }
        }
      },
      /**
       * 设定选择框中的选择项(单项)
       */
      setSelected: function(select, idSeq) {
        if(idSeq.indexOf(",") != 0) {
          idSeq = "," + idSeq;
        }
        if(idSeq.lastIndexOf(",") != idSeq.length - 1) {
          idSeq = idSeq + ",";
        }
        for(var i = 0; i < select.options.length; i++) {
          if(idSeq.indexOf("," + select.options[i].value + ",") != -1)
            select.options[i].selected = true;
        }
      },
      fillin: function(id, obj, value, keyName, valueName, chosenMin) {
        var is_restapi = Array.isArray(obj);
        var datas = is_restapi ? obj : obj.datas;
        var select = $("#" + id);
        var cnt = 0;
        var rows = []
        for(var i in datas) {
          cnt += 1;
          var data = datas[i];
          var k, v;
          if(Array.isArray(data)) {
            k = data[0], v = data[1];
            rows = datas;
          } else {
            k = data[keyName];
            v = is_restapi ? data[valueName] : data.attributes[valueName];
            rows.push([k, v]);
          }
          select.append("<option value='" + k + "' title='" + v + "'>" + v + "</option>");
        }
        if(value) select.val(value);
        if(!chosenMin) chosenMin = 30;
        if(cnt >= chosenMin) {
          beangle.load(["chosen"], function() {
            $("#" + id).chosen({ placeholder_text_single: "...", no_results_text: "没有找到结果！", search_contains: true, allow_single_deselect: true });
          });
        }
        return rows;
      }
    }
  });

  // Cookie----------------------------------------------------------------------------------------
  beangle.extend({
    cookie: {
      get: function(cookieName) {
        var cookieString = document.cookie,
          start = cookieString.indexOf(cookieName + "="),
          end;
        if(start == -1) return null;
        start += cookieName.length + 1;
        end = cookieString.indexOf(";", start);
        if(end == -1) return unescape(cookieString.substring(start));
        return unescape(cookieString.substring(start, end));
      },
      set: function(name, value, path, days) {
        if(null == path) path = "/";
        if(!days) days = 30;
        var expires = new Date();
        expires.setTime(expires.getTime() + (86400 * days)); //30days
        document.cookie = name + "=" + value + "; expires=" + expires.toGMTString() + "; path=" + path + ";SameSite=Strict";
      },
      remove: function(name, path, domain) {
        if(beangle.cookie.get(name)) {
          document.cookie = name + "=" +
            (path ? (";path=" + path) : "") +
            (domain ? (";domain=" + domain) : "") +
            ";expires=Thu, 01 Jan 1970 00:00:01 GMT";
        }
      }
    }
  });
  // data----------------------------------------------------------------------------------------
  beangle.extend({
    data: {
      toCsv: function(rows) {
        if(rows && rows.length > 0) {
          var datas = []
          for(var i = 0; i < rows.length; i++) {
            datas.push(rows[i].join(","));
          }
          return datas.join(";");
        } else {
          return "";
        }
      },
      parseCsv: function(str) {
        if(str && str.length > 0) {
          var rows = str.split(";");
          for(var i = 0; i < rows.length; i++) {
            rows[i] = rows[i].split(",");
          }
          return rows;
        } else {
          return [];
        }
      }
    }
  });
  // Page---------------------------------------------------------------------
  function Page(action, target, pageIndex, pageSize, totalItems) {
    this.formid = "form_" + beangle.randomInt();
    this.actionurl = action;
    this.target = target;
    this.paramMap = {};
    this.params = function() { return this.paramMap; };

    this.pageInfo = function(pageIndex, pageSize, totalItems) {
      this.pageIndex = pageIndex;
      this.pageSize = pageSize;
      this.totalItems = totalItems;
      if(null != totalItems && null != pageSize && null != pageIndex) {
        var quotient = Math.floor(totalItems / pageSize);
        this.totalPages = (0 == totalItems % pageSize) ? quotient : (quotient + 1);
        this.startNo = (pageIndex - 1) * pageSize + 1;
        this.endNo = ((this.startNo + pageSize - 1) <= totalItems) ? (this.startNo + pageSize - 1) : totalItems;
      } else {
        this.totalPages = 1;
      }
    };

    this.pageInfo(pageIndex, pageSize, totalItems);

    this.action = function(actionurl) {
      this.actionurl = actionurl;
      return this;
    };
    this.orderBy = function(newstring) {
      this.orderby = newstring;
      return this;
    };

    this.setTarget = function(givenTarget, elemId) {
      if(givenTarget) {
        this.target = givenTarget;
      } else if(elemId) {
        this.target = beangle.findTarget(document.getElementById(elemId));
      }
      return this;
    };

    this.getForm = function() {
      var myForm = document.getElementById(this.formid);
      if(null == myForm) {
        myForm = document.createElement("form");
        myForm.setAttribute("id", this.formid);
        myForm.setAttribute("action", this.actionurl);
        myForm.setAttribute("method", "POST");
        if(document.getElementById(this.target)) {
          document.getElementById(this.target).appendChild(myForm);
        } else {
          document.body.appendChild(myForm);
        }
      }
      return myForm;
    };

    this.addParams = function(paramSeq) {
      beangle.assert.notNull(paramSeq, "paramSeq for addHiddens must not be null");
      this.paramstr = paramSeq;
      var paramArray = paramSeq.split("&"),
        i, name, value, oneParam;
      for(i = 0; i < paramArray.length; i++) {
        oneParam = paramArray[i];
        if(oneParam != "") {
          name = oneParam.substr(0, oneParam.indexOf("="));
          value = oneParam.substr(oneParam.indexOf("=") + 1);
          this.paramMap[name] = value;
        }
      }
      return this;
    };
    // 检查分页参数
    this.checkPageParams = function(pageIndex, pageSize, orderBy) {
      if(null != pageIndex) {
        if(!/^[1-9]\d*$/.test(pageIndex)) {
          beangle.alert("输入分页的页码是:" + pageIndex + ",它不是个整数");
          return false;
        }
        if(this.totalPages != null) {
          if(pageIndex > this.totalPages) {
            pageIndex = this.totalPages;
          }
        }
        this.paramMap["pageIndex"] = pageIndex;
      }
      if(null != pageSize) {
        if(!/^[1-9]\d*$/.test(pageSize)) {
          beangle.alert("输入分页的页长是:" + pageSize + ",它不是个整数");
          return false;
        }
        this.paramMap["pageSize"] = pageSize;
      }
      if(null != orderBy && orderBy != "null") {
        this.paramMap["orderBy"] = orderBy;
      }
      return true;
    };
    this.goPage = function(pageIndex, pageSize, orderBy) {
      var myForm = this.getForm(),
        key, value;
      if(this.checkPageParams(pageIndex, pageSize, orderBy)) {
        for(key in this.paramMap) {
          value = this.paramMap[key];
          if(value != "") beangle.form.addInput(myForm, key, value, "hidden");
        }
        if(this.target && document.getElementById(this.target)) {
          beangle.form.submit(this.formid, this.actionurl, this.target);
        } else {
          myForm.submit();
        }
      }
    };
  }

  beangle.extend({
    page: function(action, target) { return new Page(action, target); }
  });

  beangle.onReturn = function(event, action) {
    if(!event) {
      event = window.event;
    }
    if(event && event.keyCode && event.keyCode == 13) {
      action();
    }
  };

  beangle.displayFileInfo = function(domId, file, maxSize) {
    var maxStr = "";
    if(maxSize >= 1024 * 1024) {
      maxStr = (maxSize / 1024.0 / 1024.0).toFixed(1) + "MB";
    } else {
      maxStr = (maxSize / 1024.0).toFixed(1) + "KB";
    }
    jQuery("#" + domId).attr("title", "最大" + maxStr);
    var sizeStr = "";
    if(file.size >= 1024 * 1024) {
      sizeStr = (file.size / 1024.0 / 1024.0).toFixed(1) + "MB";
    } else {
      sizeStr = (file.size / 1024.0).toFixed(1) + "KB";
    }
    if(file.size > maxSize) {
      jQuery("#" + domId).css("color", "red");
      jQuery("#" + domId).html("大小" + sizeStr + ",超过" + maxStr);
    } else {
      jQuery("#" + domId).css("color", "black");
      jQuery("#" + domId).html("大小" + sizeStr + ",最大" + maxStr);
    }
  };

  beangle.extend({
    styleCache: {},
    modules: {},
    register: function(base, modules) {
      if(!beangle.staticBase) {
        beangle.staticBase = base;
      }
      var registed = false;
      for(var m in modules) {
        if(!beangle.modules[m]) {
          beangle.modules[m] = modules[m];
          registed = true;
        }
      }
      if(registed) {
        var paths = {};
        var shim = {};
        for(var m in beangle.modules) {
          var bm = beangle.modules[m];
          if(bm.js) {
            paths[m] = bm.js.substring(0, bm.js.length - 3);
            if(bm.deps) {
              shim[m] = bm.deps;
            }
          }
        }
        require.config({ baseUrl: base, paths: paths, shim: shim });
      }
    },
    load: function(names, callBack) {
      var requireModules = [];
      for(var i = 0; i < names.length; i++) {
        var module = beangle.modules[names[i]];
        if(module) {
          if(module.css) {
            for(var j = 0; j < module.css.length; j++) {
              beangle.requireCss(module.css[j], beangle.staticBase);
            }
          }
          if(module.js) {
            requireModules.push(names[i]);
          }
        }
      }
      if(requireModules.length > 0) {
        require(requireModules, callBack);
      } else if(callBack) {
        try {
          callBack();
        } catch (e) {}
      }
    },
    require: function(urls, callBack) {
      if(arguments.length == 3) {
        require([arguments[0]], arguments[2]);
      } else {
        if(typeof urls === "string") {
          require([urls], callBack);
        } else {
          require(urls, callBack);
        }
      }
    },

    /** Load required CSS Files */
    requireCss: function(cssFile, basePath) {
      var path = (basePath || "") + cssFile;
      if(!beangle.styleCache[path]) {
        var link = document.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("type", "text/css");
        link.setAttribute("href", path);
        document.getElementsByTagName("head")[0].appendChild(link);
        beangle.styleCache[path] = true;
      }
    }

  });

  beangle.ready(beangle.iframe.adaptSelf);
  beangle.getContextPath();
  beangle.history.init();

  //register as a module
  if(typeof module === "object" && module && typeof module.exports === "object") {
    module.exports = beangle;
  } else {
    window.beangle = beangle;
    window.bg = beangle;
    if(typeof define === "function" && define.amd) {
      define("beangle", [], function() { return beangle; });
    }
  }
})(window);