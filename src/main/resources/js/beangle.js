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
(function (window, undefined) {
  if (beangle) return;
  var beangle = function () {
    return true;
  };

  beangle.version = "0.8.0";
  beangle.base = null;
  beangle.staticBase = null;
  beangle.contextPath = null;
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

  /** 无界子应用内嵌片段走 import-html-entry 一类解析时，常按 script 标签分段执行；响应末尾若无闭合的 script 段，内联脚本可能被漏执行，补无害占位脚本兜底。 */
  beangle.postProcessHtml = function(html) {
    const suffix="</script>"
    const endWithScript = html.indexOf(suffix, html.length - suffix.length) !== -1;
    return endWithScript ? html : html + "<script>void 0;</script>";
  };

  beangle.getContextPath = function () {
    if (beangle.contextPath) return beangle.contextPath;
    var baseElements = document.getElementsByTagName("base"),
      baseHref = "";
    if (baseElements.length === 1) {
      baseHref = baseElements[0].href.replace(/[^\/]+$/, "");
    } else {
      baseHref = document.location.origin + "/";
    }
    beangle.base = baseHref;
    var endPart = baseHref.substring(baseHref.indexOf(document.domain) + document.domain.length);
    beangle.contextPath = endPart.substring(endPart.indexOf("/"));
    return beangle.contextPath;
  };

  beangle.displayAjaxMessage = function () {
    var loadingMessage = "Loading...";
    var mz = document.getElementById("topLoadingMessageZone");
    if (!mz) {
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
  beangle.hideAjaxMessage = function () {
    var mz = document.getElementById("topLoadingMessageZone");
    if (mz) mz.style.display = "none";
  };

  var AjaxHistory = {};
  // beangle.history：对外 API；实现见 AjaxHistory（beangle.AjaxHistory）
  beangle.history = {
    isValidState: function (s) {
      return typeof s !== "undefined" && jQuery.type((s.data || {}).container) != "undefined" && jQuery.type((s.data || {}).content) != "undefined";
    },
    busy: false,
    init: function () {
      var history = window.history;
      AjaxHistory.init = function (options) {
        if (typeof AjaxHistory.init.initialized !== "undefined") {
          return false;
        }
        AjaxHistory.init.initialized = true;
        AjaxHistory.options = options || {};
        AjaxHistory.options.initialTitle = AjaxHistory.options.initialTitle || document.title;
        //最多存储20个状态
        AjaxHistory.options.maxStates = AjaxHistory.options.maxStates || 50;
        AjaxHistory.options.minStates = AjaxHistory.options.minStates || 20;
        AjaxHistory.extractEventData = function (key, event, extra) {
          return (event && event.originalEvent && event.originalEvent[key]) || (extra && extra[key]) || undefined;
        };
        /**
         * Ensures that we have an absolute URL and not a relative URL
         */
        AjaxHistory.getFullUrl = function (url) {
          var fullUrl = url;
          var firstChar = url.substring(0, 1);
          if (/[a-z]+\:\/\//.test(url)) {
          } else if (firstChar === "/") {
            fullUrl = document.location.origin + "/" + url.replace(/^\/+/, "");
          } else {
            fullUrl = beangle.base + url.replace(/^(\.\/)+/, "");
          }
          return fullUrl.replace(/\#$/, "");
        };

        AjaxHistory.getLocationHref = function (doc) {
          doc = doc || document;
          return doc.location.href;
        };

        AjaxHistory.idToState = new Map();
        AjaxHistory.urlToId = new Map();
        AjaxHistory.ids = [];
        AjaxHistory.lastState = {};

        AjaxHistory.getState = function (create) {
          var st = AjaxHistory.getLastState();
          if (typeof create === "undefined") {
            create = false;
          }
          if (!st && create) {
            st = AjaxHistory.createState();
          }
          return st;
        };

        AjaxHistory.genStateId = function (newState) {
          var id;
          while (true) {
            id = Date.now() + String(Math.random()).replace(/\D/g, "");
            if (typeof AjaxHistory.idToState.get(id) === "undefined") {
              break;
            }
          }
          return id;
        };

        AjaxHistory.createState = function (data, title, url) {
          var state = {};
          if (!data || typeof data !== "object") {
            data = {};
          }
          state.data = data;
          state.url = AjaxHistory.getFullUrl(url ? url : AjaxHistory.getLocationHref());
          state.id = AjaxHistory.genStateId(state);
          AjaxHistory.ids.push(state.id);
          AjaxHistory.idToState.set(state.id, state);
          AjaxHistory.urlToId.set(state.url, state.id);
          return state;
        };

        AjaxHistory.getStateById = function (id) {
          id = String(id);
          return AjaxHistory.idToState.get(id) || undefined;
        };

        AjaxHistory.extractState = function (url, create) {
          var st = null;
          var id = AjaxHistory.urlToId.get(url) || false;
          create = create || false;
          if (id) {
            st = AjaxHistory.getStateById(id);
          }
          if (!st && create) {
            st = AjaxHistory.createState(null, null, url);
          }
          return st;
        };

        AjaxHistory.getLastState = function () {
          return AjaxHistory.lastState || undefined;
        };

        AjaxHistory.isLastState = function (newState) {
          if (AjaxHistory.lastState) {
            return newState.id === AjaxHistory.lastState.id;
          } else {
            return false;
          }
        };

        AjaxHistory.saveState = function (newState) {
          AjaxHistory.lastState = newState;
        };

        AjaxHistory.onPopState = function (event, extra) {
          var stateId = false;
          var newState = false;
          stateId = AjaxHistory.extractEventData("state", event, extra) || false;
          if (stateId) {
            newState = AjaxHistory.getStateById(stateId);
          } else if (AjaxHistory.expectedStateId) {
            newState = AjaxHistory.getStateById(AjaxHistory.expectedStateId);
          } else {
            newState = AjaxHistory.extractState(AjaxHistory.getLocationHref());
          }
          if (!newState) {
            newState = AjaxHistory.createState(null, null, AjaxHistory.getLocationHref());
          }

          AjaxHistory.expectedStateId = false;
          if (AjaxHistory.isLastState(newState)) {
            return false;
          }
          AjaxHistory.saveState(newState);
          jQuery(window).trigger("statechange");
          return true;
        };
        jQuery(window).bind("popstate", AjaxHistory.onPopState);

        AjaxHistory.pushState = function (data, title, url) {
          var newState = AjaxHistory.createState(data, title, url);
          if (AjaxHistory.ids.length > AjaxHistory.options.maxStates) {
            AjaxHistory.shrink();
          }
          if (!AjaxHistory.isLastState(newState)) {
            AjaxHistory.expectedStateId = newState.id;
            history.pushState(newState.id, newState.title, newState.url);
            jQuery(window).trigger("popstate");
          }
          return true;
        };

        AjaxHistory.replaceState = function (data, title, url) {
          var newState = AjaxHistory.createState(data, title, url);
          if (!AjaxHistory.isLastState(newState)) {
            AjaxHistory.expectedStateId = newState.id;
            history.replaceState(newState.id, newState.title, newState.url);
            jQuery(window).trigger("popstate");
          }
          return true;
        };
        AjaxHistory.shrink = function () {
          while (AjaxHistory.ids.length > AjaxHistory.options.minStates) {
            var oldId = AjaxHistory.ids.shift();
            var ss = AjaxHistory.idToState.get(oldId);
            if (ss) {
              AjaxHistory.idToState.delete(oldId);
              AjaxHistory.urlToId.delete(ss.url);
            }
          }
        };
        AjaxHistory.saveState(AjaxHistory.extractState(AjaxHistory.getLocationHref(), true));

        jQuery(window).bind("hashchange", function () {
          jQuery(window).trigger("popstate");
        });
      }; // AjaxHistory.init

      AjaxHistory.init();
      jQuery(window).bind("statechange", function () {
        var currState = AjaxHistory.getState() || {};
        if (beangle.history.isValidState(currState)) {
          if (jQuery(currState.data.container).length > 0) {
            jQuery(currState.data.container).html(currState.data.content);
            beangle.history.applyState(currState);
            beangle.iframe.adaptSelf();
          } else {
            beangle.history.busy = true;
            var statePaths = []; //存储嵌套的state路径
            statePaths.push(currState);
            while (currState && currState.data.parentId) {
              currState = AjaxHistory.getStateById(currState.data.parentId);
              if (beangle.history.isValidState(currState)) {
                statePaths.push(currState);
                if (jQuery(currState.data.container).length > 0) {
                  break;
                }
              } else {
                break;
              }
            }
            for (var i = statePaths.length - 1; i >= 0; i--) {
              var state = statePaths[i];
              jQuery(state.data.container).html(state.data.content);
              beangle.history.applyState(state);
            }
            beangle.iframe.adaptSelf();
            beangle.history.busy = false;
          }
        }
      });
    },

    Go: function (url, target) {
      if (beangle.history.busy) return;
      jQuery.ajax({
        url: url,
        cache: false,
        type: "GET",
        dataType: "html",
        complete: function (jqXHR) {
          target = "#" + target;
          var state = AjaxHistory.getState() || { id: "" };
          var parentId = state.id;
          var content = beangle.postProcessHtml(jqXHR.responseText);
          if (jQuery(target).html().length > 0) {
            beangle.history.snapshot();
            AjaxHistory.pushState({ content: content, container: target, parentId: parentId }, "", beangle.history.convertUrl(url));
          } else {
            AjaxHistory.replaceState({ content: content, container: target, parentId: parentId }, "", beangle.history.convertUrl(url));
          }
          beangle.hideAjaxMessage();
        },
        beforeSend: beangle.displayAjaxMessage,
      });
    },
    snapshot: function () {
      var state = AjaxHistory.getState() || {};
      if (state.data && state.data.content) {
        var _t = [];
        jQuery(state.data.container + " .box:checked").each(function (index, e) {
          _t[_t.length] = e.value;
        });
        if (_t.length > 0) state.data.boxes = _t;
      }
    },
    applyState: function (state) {
      if (state.data.boxes) {
        jQuery(state.data.boxes).each(function (index, value) {
          jQuery(state.data.container + " .box[value=" + value + "]").prop("checked", true);
        });
      }
      if (typeof afterApplyState == "function") {
        afterApplyState();
        afterApplyState = null;
      }
    },
    convertUrl: function (url) {
      //转换url为beangle.base + "#" + /root/path/to/resources
      var tail = null;
      if (url.startsWith(document.location.origin)) {
        // http://localhost:8080/what_else_context/menu
        tail = url.substring(document.location.origin.length);
        return beangle.base + "#" + tail;
      } else if (url.startsWith(beangle.contextPath)) {
        // /context/menu
        return beangle.base + "#" + url;
      } else {
        return beangle.base + "#" + url;
      }
    },
    submit: function (form, action, target) {
      if (jQuery.type(form) == "string" && form.indexOf("#") != 0) {
        form = "#" + form;
      }
      if (jQuery.type(target) == "string" && target.indexOf("#") != 0) {
        target = "#" + target;
      }
      beangle.displayAjaxMessage();

      var handleResult = function (result) {
        beangle.history.snapshot();
        var state = AjaxHistory.getState() || { id: "" };
        var parentId = state.id;
        var content = typeof result.responseText == "undefined" ? result : result.responseText;
        content = beangle.postProcessHtml(content);
        AjaxHistory.pushState({ content: content, container: target, parentId: parentId }, "", beangle.history.convertUrl(action));
        beangle.hideAjaxMessage();
        return false;
      };
      beangle.amd.loadJsModules(["jquery-form"], function () {
        jQuery(form).ajaxForm({ success: handleResult, error: handleResult, url: action });
        jQuery(form).submit();
      });
    },
  };

  //Go and ajax---------------------------------
  /** jump to href or anchor */
  beangle.Go = function (obj, target, confirmMsg) {
    if (confirmMsg && !confirm(confirmMsg)) return false;
    var url = obj;
    if (typeof obj == "object" && obj.tagName.toLowerCase() == "a") {
      url = obj.href;
      if (!target) {
        target = beangle.findTarget(obj);
      }
    }
    if (!target) target = "_self";
    if ("_self" == target) {
      var wj = window.$wujie;
      if (wj && wj.props && typeof wj.props.jump === "function") {
        wj.props.jump(url);
      } else {
        self.location = url;
      }
    } else if ("_parent" == target) {
      self.parent.location = url;
    } else if ("_top" == target) {
      self.top.location = url;
    } else if ("_blank" == target) {
      window.open(url);
    } else {
      if (!beangle.isAjaxTarget(target)) {
        document.getElementById(target).src = url;
      } else {
        if (jQuery("#" + target).hasClass("ajax_container")) {
          beangle.history.Go(url, target);
        } else {
          jQuery.get(url, function (data) {
            jQuery("#" + target).html(beangle.postProcessHtml(data));
            beangle.iframe.adaptSelf();
          });
        }
      }
    }
    return false;
  };
  beangle.ready = function (fn) {
    jQuery(document).ready(fn);
  };
  beangle.isAjaxTarget = function (target) {
    if (!target) return false;
    if (target == "" || target == "_blank" || target == "_self" || target == "_parent" || target == "_top") {
      return false;
    }
    var targetEle = document.getElementById(target);
    if (!targetEle) return false;
    var tagName = targetEle.tagName.toLowerCase();
    if (tagName == "iframe" || tagName == "object") {
      return false;
    }
    return true;
  };
  beangle.normalTarget = function (target) {
    if (target == "" || target == "_blank" || target == "_self" || target == "_parent") {
      return target;
    }
    var targetObj = document.getElementById(target);
    if (!targetObj || targetObj.tagName.toLowerCase() != "iframe") return "_self";
    else return target;
  };
  beangle.findTarget = function (ele) {
    var p = ele.parentNode,
      finalTarget = "_self";
    while (p) {
      //FIXME ui-tabs-panel
      if (p.id && p.className && p.className.indexOf("ajax_container") > -1) {
        //||p.className.indexOf("ui-tabs-panel")>-1
        finalTarget = p.id;
        break;
      } else {
        if (p == p.parentNode) p = null;
        else p = p.parentNode;
      }
    }
    ele.target = finalTarget;
    return finalTarget;
  };

  // Assert------------------------
  beangle.assert = {
    notNull: function (object, message) {
      if (null == object) alert(message);
    },
  };
  beangle.randomInt = function () {
    var num = Math.random() * 10000000;
    num -= num % 1;
    return num;
  };
  // Logger----------------------------
  beangle.logger = {
    // debug=0;info=1;warn=2;error=3;fatal=4;disabled=5
    level: 1,
    debug: function (message) {
      if (beangle.logger.level <= 0) {
        var msg = "[beangle] " + message;
        if (window.console && window.console.log) {
          window.console.log(message);
        } else {
          alert(msg);
        }
      }
    },
    info: function (message) {
      if (beangle.logger.level <= 1) {
        var msg = "[beangle] " + message;
        if (window.console && window.console.info) {
          window.console.info(msg);
        } else if (window.console && window.console.log) {
          window.console.log(msg);
        } else {
          alert(msg);
        }
      }
    },
    error: function (message, err) {
      if (beangle.logger.level <= 3) {
        var msg = "[beangle] " + message;
        if (window.console && window.console.error) {
          if (err !== undefined && err !== null) {
            window.console.error(msg, err);
          } else {
            window.console.error(msg);
          }
        } else {
          alert(msg + (err ? " " + err : ""));
        }
      }
    },
  };

  // Event--------------------------------------------------
  beangle.event = {
    portable: function (e) {
      if (!e) return window.event;
      else return e;
    },
    /**获得事件背后的元素*/
    getTarget: function (e) {
      e = beangle.event.portable(e);
      return e.target || e.srcElement;
    },
  };

  // Input----------------------------------------------------
  beangle.input = {
    toggleCheckBox: function (chk, event) {
      beangle.input.boxAction(chk, "toggle", event);
    },
    /**
     * 返回单选列表中选择的值
     * @return 没有选中时,返回""
     */
    getRadioValue: function (radioName) {
      return beangle.input.boxAction(document.getElementsByName(radioName), "value");
    },

    /**
     * 返回多选列表中选择的值
     * @return 多个值以,相隔.没有选中时,返回""
     */
    getCheckBoxValues: function (chkname) {
      var tmpIds = beangle.input.boxAction(document.getElementsByName(chkname), "value");
      if (tmpIds == null) return "";
      else return tmpIds;
    },
    /**
     * modify by chaostone 2006-8-2
     * 将反选取消,改为全选或者全部取消
     */
    boxAction: function (box, action, event) {
      var val = "",
        srcElement,
        i;
      if (box) {
        if (!box[0]) {
          if (action == "selected") {
            return box.checked;
          } else if (action == "value") {
            if (box.checked) val = box.value;
          } else if (action == "toggle") {
            srcElement = beangle.event.getTarget(event);
            box.checked = srcElement.checked;
            if (typeof box.onchange == "function") {
              box.onchange();
            }
          }
        } else {
          for (i = 0; i < box.length; i++) {
            if (action == "selected") {
              if (box[i].checked) return box[i].checked;
            } else if (action == "value") {
              if (box[i].checked) {
                if (box[i].type == "radio") {
                  val = box[i].value;
                } else if (box[i].type == "checkbox") {
                  if (val != "") val = val + ",";
                  val = val + box[i].value;
                }
              }
            } else if (action == "toggle") {
              srcElement = beangle.event.getTarget(event);
              box[i].checked = srcElement.checked;
              if (typeof box[i].onchange == "function") {
                box[i].onchange();
              }
            }
          }
        }
      }
      if (action == "selected") return false;
      else return val;
    },
  };

  //IFrame--------------------------------------------------------
  beangle.iframe = {
    adaptSelf: function () {
      beangle.iframe.adapt(self);
    },
    /** 仅看 iframe 自身：计算样式 display 为 none 时不调高度 */
    isIframeSelfDisplayed: function (iframeEl) {
      if (!iframeEl || !iframeEl.ownerDocument || !iframeEl.ownerDocument.defaultView) return false;
      try {
        return iframeEl.ownerDocument.defaultView.getComputedStyle(iframeEl).display !== "none";
      } catch (eDisp) {
        return false;
      }
    },
    /**
     * iframe 内页面根据内容高度调整外层 iframe（入口一般为 adaptSelf → adapt(self)）。
     * 是否在 iframe 中只用 parent !== self 判断；勿依赖 self.frameElement，子页里常为 null（微前端沙箱等），父文档通过 name 查找节点。
     * 仅当父文档中同名节点为 IFRAME 时才调整（微前端等场景下 name 可能命中非 iframe，避免误改高度）。
     * 若 iframe 自身 display:none（不可见）则不调整。
     * @param targObj iframe 内的 window（须有 name，与父文档中嵌入节点的 name 一致）
     * @param extraHeight 额外高度
     */
    adapt: function (targObj, extraHeight) {
      var frames, targWin, totalHeight, myHeight;
      if (null == targObj || targObj.name === "") return;
      if (targObj.parent === targObj) return;
      if (targObj.parent === window.top) {
        if (targObj.parent.document.body.style.overflowY === "hidden") return;
      }
      frames = targObj.parent.document.getElementsByName(targObj.name);
      if (frames.length < 1) return;
      targWin = frames[0];
      if (targWin == null || targWin.tagName !== "IFRAME") return;
      if (!beangle.iframe.isIframeSelfDisplayed(targWin)) return;
      if (targWin.scrolling === "no" || targWin.className === "autoadapt") {
        totalHeight = targObj.document.body.scrollHeight + (null == extraHeight ? 0 : extraHeight);
        myHeight = 0;
        if (targWin.style.height) {
          myHeight = parseInt(targWin.style.height.substring(0, targWin.style.height.length - 2));
        }
        if (totalHeight > 0 && totalHeight > myHeight) {
          targWin.style.height = totalHeight + "px";
          beangle.logger.info("adapt frame:" + targObj.name + " height " + targWin.style.height);
        }
      }
      beangle.iframe.adapt(targObj.parent);
    },
  };
  //About From
  beangle.form = {
    submit: function (myForm, action, target, onsubmit, ajax, noHistory) {
      var submitTarget, rs, origin_target, origin_action;
      if (typeof myForm == "string") myForm = document.getElementById(myForm);
      //First native onsubmit will benefit to user"s onsubmit hook on data validation.
      //1.native onsubmit
      if (myForm.onsubmit) {
        rs = null;
        try {
          rs = myForm.onsubmit();
        } catch (e) {
          beangle.logger.error(e.message,e);
          return false;
        }
        if (!rs) {
          return false;
        }
      }
      //2. submit hook
      if (onsubmit) {
        rs = null;
        if (typeof onsubmit == "function") {
          try {
            rs = onsubmit(myForm);
          } catch (e) {
            beangle.logger.error(e.message,e);
            return false;
          }
        } else {
          rs = eval(onsubmit);
        }
        if (!rs) {
          return false;
        }
      }
      //3. check target and action
      submitTarget = null != target ? target : myForm.target;

      if (!submitTarget) submitTarget = beangle.findTarget(myForm);

      if (action == null) action = myForm.action;

      if (action.indexOf("http://") == 0) action = action.substring(action.indexOf("/", 7));
      if (action.indexOf("https://") == 0) action = action.substring(action.indexOf("/", 8));

      if (null == ajax || ajax) ajax = beangle.isAjaxTarget(submitTarget);

      // 4. fire
      if (ajax) {
        if (null == myForm.id || "" == myForm.id) {
          myForm.setAttribute("id", myForm.name);
        }
        if (!noHistory && !jQuery("input:file", myForm).length) {
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
    displayWaiting: function (formId, btn) {
      var disable = false;
      var form = document.getElementById(formId);
      if (form) {
        if (form.target) {
          var ele = form;
          var p = ele.parentNode;
          while (p) {
            if (p.id && p.id == form.target) {
              disable = true;
              break;
            } else {
              if (p == p.parentNode) p = null;
              else p = p.parentNode;
            }
          }
        } else {
          disable = true;
        }
      }
      if (disable) {
        btn.innerHTML = btn.innerHTML + "...";
        btn.disabled = true;
      }
    },
    ajaxSubmit: function (formId, action, target) {
      if (!action) action = document.getElementById(formId).action;
      beangle.amd.loadJsModules(["jquery-form"], function () {
        jQuery("#" + formId).ajaxForm({
          success: function (result) {
            try {
              jQuery("#" + target).html(beangle.postProcessHtml(result));
            } catch (e) {
              beangle.logger.error(e.message,e);
            }
          },
          error: function (response) {
            try {
              jQuery("#" + target).html(beangle.postProcessHtml(response.responseText));
            } catch (e) {
              beangle.logger.error(e.message,e);
            }
          },
          url: action,
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
    submitId: function (form, id, isMulti, action, promptMsg, ajax) {
      var selectId = beangle.input.getCheckBoxValues(id);
      if (null == isMulti) isMulti = false;

      if ("" == selectId) {
        alert(isMulti ? "请选择一个或多个进行操作" : "请选择一个进行操作");
        return;
      }
      if (!isMulti && selectId.indexOf(",") > 0) {
        alert("请仅选择一个");
        return;
      }
      if (null != action) {
        form.action = action;
      } else {
        action = form.action;
      }
      beangle.form.addInput(form, isMulti ? id + "s" : id, selectId, "hidden");
      if (null != promptMsg) {
        if (!confirm(promptMsg)) return;
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
    addInput: function (form, name, value, type) {
      if (!form) {
        return;
      }
      //防止设置form的属性
      if (form[name] != null && typeof form[name].tagName != "undefined") {
        form[name].value = value;
      } else {
        if (null == type) type = "hidden";
        var input = document.createElement("input");
        input.setAttribute("name", name);
        input.setAttribute("value", value);
        input.setAttribute("type", type);
        form.appendChild(input);
      }
    },
    addInputs: function (form, name, value, type) {
      if (!form) {
        console.log("add inputs to null form");
        return;
      }
      if (null == type) type = "hidden";
      for (i = 0; i < value.length; i++) {
        var input = document.createElement("input");
        input.setAttribute("name", name);
        input.setAttribute("value", value[i]);
        input.setAttribute("type", type);
        form.appendChild(input);
      }
    },
    removeInputs: function (form, name) {
      jQuery(form)
        .children("input[name=" + name.replace(".", "\\.") + "]")
        .remove();
    },
    ecodeParams: function (params) {
      if ("" == params) return "";
      var paramsPair = params.split("&"),
        newParams = "",
        i,
        eqIndex;
      for (i = 0; i < paramsPair.length; i++) {
        if (paramsPair[i] != "") {
          eqIndex = paramsPair[i].indexOf("=");
          newParams += "&" + paramsPair[i].substr(0, eqIndex);
          if (-1 != eqIndex) {
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
    setSearchParams: function (from, to, prefix) {
      beangle.form.addInput(to, "params", "");
      var params = beangle.form.getInputParams(from, prefix, false);
      beangle.form.addInput(to, "params", params);
    },

    addHiddens: function (form, paramSeq) {
      beangle.assert.notNull(paramSeq, "paramSeq for addHiddens must not be null");
      var params = paramSeq.split("&"),
        i,
        name,
        value;
      for (i = 0; i < params.length; i++) {
        if (params[i] != "") {
          name = params[i].substr(0, params[i].indexOf("="));
          value = params[i].substr(params[i].indexOf("=") + 1);
          beangle.form.addInput(form, name, value, "hidden");
        }
      }
    },

    addParamsInput: function (form, value) {
      beangle.form.addInput(form, "_params", value, "hidden");
    },
    transferParams: function (from, to, prefix, getEmpty) {
      if (getEmpty == null) getEmpty = true;
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
    getInputParams: function (form, prefix, getEmpty) {
      var elems = form.elements,
        params = "",
        i;
      if (null == getEmpty) getEmpty = true;

      for (i = 0; i < elems.length; i++) {
        if ("" != elems[i].name) {
          if ("_params" == elems[i].name) continue;
          if (elems[i].value == "" && !getEmpty) continue;
          if (null != prefix) {
            if (elems[i].name.indexOf(prefix) == 0 && elems[i].name.indexOf(".") > 1) {
              if ((elems[i].type == "radio" || elems[i].type == "checkbox") && !elems[i].checked) continue;
              if (elems[i].value.indexOf("&") != -1) {
                params += "&" + elems[i].name + "=" + escape(elems[i].value);
              } else {
                params += "&" + elems[i].name + "=" + elems[i].value;
              }
            }
          } else {
            if ((elems[i].type == "radio" || elems[i].type == "checkbox") && !elems[i].checked) continue;
            if (elems[i].value.indexOf("&") != -1) {
              params += "&" + elems[i].name + "=" + escape(elems[i].value);
            } else {
              params += "&" + elems[i].name + "=" + elems[i].value;
            }
          }
        }
      }
      return params;
    },
    goToPage: function (form, pageIndex, pageSize, orderBy) {
      if (typeof form != "object") {
        beangle.logger.error("[goToPage:]form is not well defined.");
        return;
      }
      //form.method="post"; for avoid "method" input
      if (null != pageIndex) {
        if (!/^[1-9]\d*$/.test(pageIndex)) {
          alert("输入分页的页码是:" + pageIndex + ",它不是个整数");
          return;
        }
        beangle.form.addInput(form, "pageIndex", pageIndex, "hidden");
      } else {
        beangle.form.addInput(form, "pageIndex", 1, "hidden");
      }
      if (null != pageSize) {
        if (!/^[1-9]\d*$/.test(pageSize)) {
          alert("输入分页的页长是:" + pageSize + ",它不是个整数");
          return;
        }
        beangle.form.addInput(form, "pageSize", pageSize, "hidden");
      } else {
        beangle.form.addInput(form, "pageSize", "", "hidden");
      }
      if (null != orderBy && orderBy != "null") {
        beangle.form.addInput(form, "orderBy", orderBy, "hidden");
      } else {
        beangle.form.addInput(form, "orderBy", "", "hidden");
      }
      form.submit();
    },
    goToFirstPage: function (form) {
      beangle.form.goToPage(form, 1);
    },
  };

  //select---------------------
  beangle.select = {
    getValues: function (select) {
      var val = "",
        i,
        options = select.options;
      for (i = 0; i < options.length; i++) {
        if (val != "") val = val + ",";
        val = val + options[i].value;
      }
      return val;
    },
    getSelectedValues: function (select) {
      var val = "",
        i,
        options = select.options;
      for (i = 0; i < options.length; i++) {
        if (options[i].selected) {
          if (val != "") val = val + ",";
          val = val + options[i].value;
        }
      }
      return val;
    },
    hasOption: function (select, op) {
      for (var i = 0; i < select.length; i++) {
        if (select.options[i].value == op.value) return true;
      }
      return false;
    },

    moveSelected: function (srcSelect, destSelect) {
      var i, op;
      for (i = 0; i < srcSelect.length; i++) {
        if (srcSelect.options[i].selected) {
          op = srcSelect.options[i];
          if (!beangle.select.hasOption(destSelect, op)) {
            destSelect.options[destSelect.length] = new Option(op.text, op.value);
          }
        }
      }
      beangle.select.removeSelected(srcSelect);
      beangle.select.clearStatus(srcSelect);
    },

    clearStatus: function (select) {
      for (var i = 0; i < select.options.length; i++) select.options[i].selected = false;
    },
    selectAll: function (select) {
      for (var i = 0; i < select.options.length; i++) select.options[i].selected = true;
      return select.options.length > 0;
    },
    removeSelected: function (select) {
      var options = select.options,
        i;
      for (i = options.length - 1; i >= 0; i--) {
        if (options[i].selected) {
          options[i] = null;
        }
      }
    },
    /**
     * 设定选择框中的选择项(单项)
     */
    setSelected: function (select, idSeq) {
      if (idSeq.indexOf(",") != 0) {
        idSeq = "," + idSeq;
      }
      if (idSeq.lastIndexOf(",") != idSeq.length - 1) {
        idSeq = idSeq + ",";
      }
      for (var i = 0; i < select.options.length; i++) {
        if (idSeq.indexOf("," + select.options[i].value + ",") != -1) select.options[i].selected = true;
      }
    },
    fillin: function (id, obj, value, keyName, valueName, chosenMin) {
      var is_restapi = Array.isArray(obj);
      var datas = is_restapi ? obj : obj.data;
      var select = $("#" + id);
      var cnt = 0;
      var rows = [];
      for (var i in datas) {
        cnt += 1;
        var data = datas[i];
        var k, v;
        if (Array.isArray(data)) {
          ((k = data[0]), (v = data[1]));
          rows = datas;
        } else {
          k = data[keyName];
          v = is_restapi ? data[valueName] : data.attributes[valueName];
          rows.push([k, v]);
        }
        select.append("<option value='" + k + "' title='" + v + "'>" + v + "</option>");
      }
      if (value) select.val(value);
      if (!chosenMin) chosenMin = 30;
      if (cnt >= chosenMin) {
        beangle.require(["chosen"], function () {
          $("#" + id).chosen({
            placeholder_text_single: "...",
            no_results_text: "没有找到结果！",
            search_contains: true,
            allow_single_deselect: true,
          });
        });
      }
      return rows;
    },
  };

  // Cookie----------------------------------------------------------------------------------------
  beangle.cookie = {
    get: function (cookieName) {
      var cookieString = document.cookie,
        start = cookieString.indexOf(cookieName + "="),
        end;
      if (start == -1) return null;
      start += cookieName.length + 1;
      end = cookieString.indexOf(";", start);
      if (end == -1) return unescape(cookieString.substring(start));
      return unescape(cookieString.substring(start, end));
    },
    set: function (name, value, path, days) {
      if (null == path) path = "/";
      if (!days) days = 30;
      var expires = new Date();
      expires.setTime(expires.getTime() + 86400 * 1000 * days); //30days
      document.cookie = name + "=" + value + "; expires=" + expires.toGMTString() + "; path=" + path + ";SameSite=Strict";
    },
    remove: function (name, path, domain) {
      if (beangle.cookie.get(name)) {
        document.cookie = name + "=" + (path ? ";path=" + path : "") + (domain ? ";domain=" + domain : "") + ";expires=Thu, 01 Jan 1970 00:00:01 GMT";
      }
    },
  };
  // data----------------------------------------------------------------------------------------
  beangle.data = {
    toCsv: function (rows) {
      if (rows && rows.length > 0) {
        var datas = [];
        for (var i = 0; i < rows.length; i++) {
          datas.push(rows[i].join(","));
        }
        return datas.join(";");
      } else {
        return "";
      }
    },
    parseCsv: function (str) {
      if (str && str.length > 0) {
        var rows = str.split(";");
        for (var i = 0; i < rows.length; i++) {
          rows[i] = rows[i].split(",");
        }
        return rows;
      } else {
        return [];
      }
    },
  };
  // Page---------------------------------------------------------------------
  function Page(action, target, pageIndex, pageSize, totalItems) {
    this.formid = "form_" + beangle.randomInt();
    this.actionurl = action;
    this.target = target;
    this.paramMap = {};
    this.params = function () {
      return this.paramMap;
    };

    this.pageInfo = function (pageIndex, pageSize, totalItems) {
      this.pageIndex = pageIndex;
      this.pageSize = pageSize;
      this.totalItems = totalItems;
      if (null != totalItems && null != pageSize && null != pageIndex) {
        var quotient = Math.floor(totalItems / pageSize);
        this.totalPages = 0 == totalItems % pageSize ? quotient : quotient + 1;
        this.startNo = (pageIndex - 1) * pageSize + 1;
        this.endNo = this.startNo + pageSize - 1 <= totalItems ? this.startNo + pageSize - 1 : totalItems;
      } else {
        this.totalPages = 1;
      }
    };

    this.pageInfo(pageIndex, pageSize, totalItems);

    this.action = function (actionurl) {
      this.actionurl = actionurl;
      return this;
    };
    this.orderBy = function (newstring) {
      this.orderby = newstring;
      return this;
    };

    this.setTarget = function (givenTarget, elemId) {
      if (givenTarget) {
        this.target = givenTarget;
      } else if (elemId) {
        this.target = beangle.findTarget(document.getElementById(elemId));
      }
      return this;
    };

    this.getForm = function () {
      var myForm = document.getElementById(this.formid);
      if (null == myForm) {
        myForm = document.createElement("form");
        myForm.setAttribute("id", this.formid);
        myForm.setAttribute("action", this.actionurl);
        myForm.setAttribute("method", "POST");
        if (document.getElementById(this.target)) {
          document.getElementById(this.target).appendChild(myForm);
        } else {
          document.body.appendChild(myForm);
        }
      }
      return myForm;
    };

    this.addParams = function (paramSeq) {
      beangle.assert.notNull(paramSeq, "paramSeq for addHiddens must not be null");
      this.paramstr = paramSeq;
      var paramArray = paramSeq.split("&"),
        i,
        name,
        value,
        oneParam;
      for (i = 0; i < paramArray.length; i++) {
        oneParam = paramArray[i];
        if (oneParam != "") {
          name = oneParam.substr(0, oneParam.indexOf("="));
          value = oneParam.substr(oneParam.indexOf("=") + 1);
          this.paramMap[name] = value;
        }
      }
      return this;
    };
    // 检查分页参数
    this.checkPageParams = function (pageIndex, pageSize, orderBy) {
      if (null != pageIndex) {
        if (!/^[1-9]\d*$/.test(pageIndex)) {
          beangle.alert("输入分页的页码是:" + pageIndex + ",它不是个整数");
          return false;
        }
        if (this.totalPages != null) {
          if (pageIndex > this.totalPages) {
            pageIndex = this.totalPages;
          }
        }
        this.paramMap["pageIndex"] = pageIndex;
      }
      if (null != pageSize) {
        if (!/^[1-9]\d*$/.test(pageSize)) {
          beangle.alert("输入分页的页长是:" + pageSize + ",它不是个整数");
          return false;
        }
        this.paramMap["pageSize"] = pageSize;
      }
      if (null != orderBy && orderBy != "null") {
        this.paramMap["orderBy"] = orderBy;
      }
      return true;
    };
    this.goPage = function (pageIndex, pageSize, orderBy) {
      var myForm = this.getForm(),
        key,
        value;
      if (this.checkPageParams(pageIndex, pageSize, orderBy)) {
        for (key in this.paramMap) {
          value = this.paramMap[key];
          if (value != "") beangle.form.addInput(myForm, key, value, "hidden");
        }
        if (this.target && document.getElementById(this.target)) {
          beangle.form.submit(this.formid, this.actionurl, this.target);
        } else {
          myForm.submit();
        }
      }
    };
  }

  beangle.page = function (action, target) {
    return new Page(action, target);
  };

  beangle.onReturn = function (event, action) {
    if (!event) {
      event = window.event;
    }
    if (event && event.keyCode && event.keyCode == 13) {
      action();
    }
  };

  beangle.displayFileInfo = function (domId, file, maxSize) {
    var maxStr = "";
    if (maxSize >= 1024 * 1024) {
      maxStr = (maxSize / 1024.0 / 1024.0).toFixed(1) + "MB";
    } else {
      maxStr = (maxSize / 1024.0).toFixed(1) + "KB";
    }
    jQuery("#" + domId).attr("title", "最大" + maxStr);
    var sizeStr = "";
    if (file.size >= 1024 * 1024) {
      sizeStr = (file.size / 1024.0 / 1024.0).toFixed(1) + "MB";
    } else {
      sizeStr = (file.size / 1024.0).toFixed(1) + "KB";
    }
    if (file.size > maxSize) {
      jQuery("#" + domId).css("color", "red");
      jQuery("#" + domId).html("大小" + sizeStr + ",超过" + maxStr);
    } else {
      jQuery("#" + domId).css("color", "black");
      jQuery("#" + domId).html("大小" + sizeStr + ",最大" + maxStr);
    }
  };

  /**
   * 轻量模块加载（替代 RequireJS）：按 amd.modules 注册表解析 URL、处理 deps 拓扑、
   * dynamic import 优先、失败则顺序插入 script；导出见 pickModuleExport。
   * 若页面无 RequireJS，会安装极简 define shim，捕获脚本内的 define("id",deps,factory)，
   * 便于 bg.require(["echarts"],function(echarts){}) 拿到与具名 id 一致的导出。
   * shim 在本对象赋值结束后调用一次 ensureDefineCapture 即可（内部幂等）。
   */
  beangle.amd = {
    /** beangle.xml / register 合并后的模块注册表 */
    modules: {},
    /** define(id,...) 同步执行时写入的导出（优先于 window 探测） */
    namedExports: {},
    /** requireCss 路径去重 */
    styleCache: {},
    _defineCaptureInstalled: false,
    /**
     * 在无全局 AMD 加载器时安装 window.define，仅用于顺序 script 执行阶段捕获具名模块；
     * 已有 define 且带 define.amd（如 RequireJS）时不覆盖。
     */
    ensureDefineCapture: function () {
      if (beangle.amd._defineCaptureInstalled) return;
      if (typeof define === "function" && define.amd) {
        beangle.amd._defineCaptureInstalled = true;
        return;
      }
      if (typeof define === "function") {
        beangle.amd._defineCaptureInstalled = true;
        return;
      }
      beangle.amd._defineCaptureInstalled = true;
      var named = beangle.amd.namedExports;
      function resolveSync(dep) {
        if (Object.prototype.hasOwnProperty.call(named, dep)) return named[dep];
        var low = String(dep).toLowerCase();
        if (low === "jquery") {
          if (typeof window.jQuery !== "undefined") return window.jQuery;
          if (typeof window.$ !== "undefined") return window.$;
        }
        if (typeof window[dep] !== "undefined") return window[dep];
        var camel = dep.replace(/-([a-z])/g, function (_, c) {
          return c.toUpperCase();
        });
        if (typeof window[camel] !== "undefined") return window[camel];
        throw new Error('beangle.amd define: missing dependency "' + dep + '"');
      }
      function defineFn() {
        var a = arguments;
        var id = null;
        var deps = [];
        var factory;
        if (a.length === 1) {
          if (typeof a[0] === "function") {
            factory = a[0];
          } else {
            var obj = a[0];
            factory = function () {
              return obj;
            };
          }
        } else if (a.length === 2) {
          if (typeof a[0] === "string") {
            id = a[0];
            deps = [];
            if (typeof a[1] === "function") factory = a[1];
            else if (typeof a[1] === "object" && a[1] !== null && !Array.isArray(a[1])) {
              var o = a[1];
              factory = function () {
                return o;
              };
            } else if (Array.isArray(a[1])) {
              /* define(id, deps) 缺少 factory，忽略 */
              return;
            } else {
              return;
            }
          } else {
            deps = Array.isArray(a[0]) ? a[0] : [];
            factory = a[1];
          }
        } else if (a.length >= 3) {
          id = a[0];
          deps = Array.isArray(a[1]) ? a[1] : [];
          factory = a[2];
        }
        if (typeof factory !== "function") return;
        var exp = {};
        var mod = { exports: exp };
        var inj = [];
        for (var di = 0; di < deps.length; di++) {
          var d = deps[di];
          if (d === "require") {
            inj.push(function () {
              throw new Error("beangle.amd define shim: require() not supported");
            });
          } else if (d === "exports") {
            inj.push(exp);
          } else if (d === "module") {
            inj.push(mod);
          } else {
            try {
              inj.push(resolveSync(d));
            } catch (errDep) {
              beangle.logger.error(errDep.message || String(errDep));
              inj.push(undefined);
            }
          }
        }
        var ret = factory.apply(null, inj);
        if (id != null && id !== "") {
          named[id] = ret !== undefined ? ret : exp;
        }
      }
      defineFn.amd = {};
      window.define = defineFn;
    },
    register: function (base, modules) {
      if (!beangle.staticBase) {
        beangle.staticBase = base;
      }
      for (var m in modules) {
        if (!beangle.amd.modules[m]) {
          beangle.amd.modules[m] = modules[m];
        }
      }
    },
    /** 已按 URL 加载完成的模块 id，避免重复插入 script */
    loadedModuleIds: {},
    /** 动态 import() 得到的模块命名空间（按模块 id），供 pickModuleExport 使用 */
    esmNamespaces: {},
    /** staticBase + mod.js，再解析为绝对 href（import 与 script 共用） */
    resolveModuleUrl: function (name) {
      var mod = beangle.amd.modules[name];
      if (!mod || !mod.js) return null;
      var base = beangle.staticBase || "";
      if (base && base.slice(-1) !== "/") base += "/";
      var path = base + mod.js;
      try {
        return new URL(path, window.location.href).href;
      } catch (e) {
        return path;
      }
    },
    /**
     * 按 deps 拓扑展开，保证依赖先于当前模块加载。
     */
    expandModuleLoadOrder: function (seedNames) {
      var order = [];
      var visiting = {};
      var visited = {};
      function visit(n) {
        if (visited[n]) return;
        if (visiting[n]) {
          throw new Error("beangle: circular module dependency involving " + n);
        }
        visiting[n] = true;
        var mod = beangle.amd.modules[n];
        if (mod && mod.deps) {
          for (var i = 0; i < mod.deps.length; i++) visit(mod.deps[i]);
        }
        visiting[n] = false;
        visited[n] = true;
        order.push(n);
      }
      for (var j = 0; j < seedNames.length; j++) visit(seedNames[j]);
      return order;
    },
    /**
     * 顺序插入 script（不经过 RequireJS）。适用于 UMD/IIFE/挂 window 的脚本；
     * 纯 AMD 且仅 define、无全局时仍须页面提供 define 或改为 ESM。
     */
    appendScriptOnce: function (name, done) {
      if (beangle.amd.loadedModuleIds[name]) {
        done(null);
        return;
      }
      var url = beangle.amd.resolveModuleUrl(name);
      if (!url) {
        done(new Error("beangle: unknown module or missing js path: " + name));
        return;
      }
      var s = document.createElement("script");
      s.async = false;
      s.src = url;
      s.onload = function () {
        beangle.amd.loadedModuleIds[name] = true;
        beangle.logger.info("loaded JS module: " + name);
        done(null);
      };
      s.onerror = function () {
        done(new Error("beangle: failed to load " + url));
      };
      var head = document.head || document.getElementsByTagName("head")[0];
      head.appendChild(s);
    },
    /**
     * 加载单个已注册模块：先动态 import；失败则回退 &lt;script&gt;。
     */
    loadModuleOnce: function (name, done) {
      if (beangle.amd.loadedModuleIds[name]) {
        done(null);
        return;
      }
      var url = beangle.amd.resolveModuleUrl(name);
      if (!url) {
        done(new Error("beangle: unknown module or missing js path: " + name));
        return;
      }
      import(url)
        .then(function (ns) {
          beangle.amd.loadedModuleIds[name] = true;
          beangle.amd.esmNamespaces[name] = ns;
          beangle.logger.info("loaded JS module: " + name);
          done(null);
        })
        .catch(function (err) {
          beangle.amd.appendScriptOnce(name, done);
        });
    },
    /**
     * 仅加载 JS（不处理 css）。callBack 参数顺序与 seedNames 一致，值为 ESM 命名空间或 window 探测（见 pickModuleExport）。
     */
    loadJsModules: function (seedNames, callBack) {
      var order;
      try {
        order = beangle.amd.expandModuleLoadOrder(seedNames);
      } catch (e) {
        beangle.logger.error("module dependency order failed", e);
        return;
      }
      var i = 0;
      function next(err) {
        if (err) {
          beangle.logger.error("module load failed", err);
          return;
        }
        if (i >= order.length) {
          if (callBack) {
            var args = [];
            for (var k = 0; k < seedNames.length; k++) {
              args.push(beangle.amd.pickModuleExport(seedNames[k]));
            }
            try {
              callBack.apply(null, args);
            } catch (ex) {
              beangle.logger.error("module load callback failed", ex);
            }
          }
          return;
        }
        var modName = order[i++];
        beangle.amd.loadModuleOnce(modName, next);
      }
      next(null);
    },
    /**
     * 回调里按模块名取导出：global → ESM 命名空间（default / esmNamedExport）→ window[name]、短横线转驼峰。
     */
    pickModuleExport: function (name) {
      if (Object.prototype.hasOwnProperty.call(beangle.amd.namedExports, name)) {
        return beangle.amd.namedExports[name];
      }
      var mod = beangle.amd.modules[name];
      if (mod && mod.global && typeof window[mod.global] !== "undefined") {
        return window[mod.global];
      }
      var ns = beangle.amd.esmNamespaces[name];
      if (ns) {
        if (mod && mod.esmNamedExport && typeof ns[mod.esmNamedExport] !== "undefined") {
          return ns[mod.esmNamedExport];
        }
        if (typeof ns.default !== "undefined") {
          return ns.default;
        }
        if (Object.keys(ns).length > 0) {
          return ns;
        }
        /* import() 成功但无导出（常见于 UMD 仅挂 window），继续用下面 window 规则 */
      }
      if (typeof window[name] !== "undefined") return window[name];
      var camel = name.replace(/-([a-z])/g, function (_, c) {
        return c.toUpperCase();
      });
      if (typeof window[camel] !== "undefined") return window[camel];
      return undefined;
    },
  };

  /* 尽早挂上 define shim，避免 history.init / ready 等同步路径里先执行 bg.require 时还未安装 */
  beangle.amd.ensureDefineCapture();

  beangle.require = function (names, callBack) {
    var requireModules = [];
    for (var i = 0; i < names.length; i++) {
      var module = beangle.amd.modules[names[i]];
      if (module) {
        if (module.css) {
          for (var j = 0; j < module.css.length; j++) {
            beangle.requireCss(module.css[j], beangle.staticBase);
          }
        }
        if (module.js) {
          requireModules.push(names[i]);
        }
      } else {
        beangle.logger.error("beangle.require: module not registered: " + names[i]);
      }
    }
    if (requireModules.length > 0) {
      beangle.amd.loadJsModules(requireModules, callBack);
    } else if (callBack) {
      try {
        callBack();
      } catch (e) {}
    }
  };
  /** Load required CSS Files */
  beangle.requireCss = function (cssFile, basePath) {
    var path = (basePath || "") + cssFile;
    if (!beangle.amd.styleCache[path]) {
      var link = document.createElement("link");
      link.setAttribute("rel", "stylesheet");
      link.setAttribute("type", "text/css");
      link.setAttribute("href", path);
      document.getElementsByTagName("head")[0].appendChild(link);
      beangle.amd.styleCache[path] = true;
    }
  };

  /** 门户主题色：localStorage beangle.ui.theme → :root CSS 变量（head 加载 beangle.js 时尽早应用） */
  beangle.ui = beangle.ui || {};
  beangle.ui.themeStorageKey = "beangle.ui.theme";
  beangle.ui.applyStoredTheme = function () {
    try {
      if (typeof localStorage === "undefined") return false;
      var raw = localStorage.getItem(beangle.ui.themeStorageKey);
      if (!raw) return false;
      var t = JSON.parse(raw);
      if (!t || typeof t !== "object") return false;
      var r = document.documentElement;
      if (t.primaryColor) r.style.setProperty("--primary-color", t.primaryColor);
      if (t.navbarBgColor) r.style.setProperty("--navbar-bg-color", t.navbarBgColor);
      if (t.searchBgColor) r.style.setProperty("--search-bg-color", t.searchBgColor);
      if (t.gridbarBgColor) r.style.setProperty("--gridbar-bg-color", t.gridbarBgColor);
      if (t.gridBorderColor) r.style.setProperty("--grid-border-color", t.gridBorderColor);
      return true;
    } catch (e) {
      return false;
    }
  };
  beangle.ui.applyStoredTheme();

  beangle.ready(beangle.iframe.adaptSelf);
  beangle.getContextPath();
  beangle.history.init();

  //register as a module
  if (typeof module === "object" && module && typeof module.exports === "object") {
    module.exports = beangle;
  } else {
    window.beangle = beangle;
    window.bg = beangle;
    if (typeof define === "function" && define.amd) {
      define("beangle", [], function () {
        return beangle;
      });
    }
  }
})(window);
