/**
 * History.js Core 1.8b2
 * @author Benjamin Arthur Lupton <contact@balupton.com>
 * @copyright 2010-2011 Benjamin Arthur Lupton <contact@balupton.com>
 * @license New BSD License <http://creativecommons.org/licenses/BSD/>
 */
(function(window,undefined){
  "use strict";
  var
    document = window.document, // Make sure we are using the correct document
    alert = window.alert,
    History = window.History = window.History||{}, // Public History Object
    history = window.history; // Old History Object

  History.bind = function(el,event,callback){
    jQuery(el).bind(event,callback);
  };
  History.trigger = function(el,event,extra){
    jQuery(el).trigger(event,extra);
  };
  History.extractEventData = function(key,event,extra){
    return (event && event.originalEvent && event.originalEvent[key]) || (extra && extra[key]) || undefined;
  };

  // Initialise
  History.init = function(options){
    if ( typeof History.init.initialized !== 'undefined' ) {
      return false;
    }else {
      History.init.initialized = true;
    }
    History.options = options||{}
    History.options.initialTitle = History.options.initialTitle || document.title;
    //最多存储20个状态
    History.options.maxStates = History.options.maxStates || 50;
    History.options.minStates = History.options.minStates || 20;

    History.getRootUrl = function(){
      return document.location.origin+'/';
    };

    History.getBaseUrl = function(){
      var
        baseElements = document.getElementsByTagName('base'),
        baseElement = null,
        baseHref = '';

      if ( baseElements.length === 1 ) {
        baseElement = baseElements[0];
        baseHref = baseElement.href.replace(/[^\/]+$/,'');
      }
      baseHref = baseHref.replace(/\/+$/,'');
      return baseHref?(baseHref + '/' ):History.getRootUrl();
    };

    History.baseUrl = History.getBaseUrl();
    /**
     * Ensures that we have an absolute URL and not a relative URL
     */
    History.getFullUrl = function(url){
      var fullUrl = url, firstChar = url.substring(0,1);
      if ( /[a-z]+\:\/\//.test(url) ) {
      }else if ( firstChar === '/' ) {
        fullUrl = History.getRootUrl()+url.replace(/^\/+/,'');
      }else {
        fullUrl = History.baseUrl+url.replace(/^(\.\/)+/,'');
      }
      return fullUrl.replace(/\#$/,'');
    };

    History.getLocationHref = function(doc) {
      doc = doc || document;
      return doc.location.href;
    };

    History.idToState = new Map();
    History.urlToId = new Map();
    History.ids = [];
    History.lastState = {};

    History.getState = function(create){
      if ( typeof create === 'undefined' ) { create = false; }
      var State = History.getLastState();
      if ( !State && create ) State = History.createState();
      return State;
    };

    History.genStateId = function(newState){
      var id;
      while ( true ) {
        id = (new Date()).getTime() + String(Math.random()).replace(/\D/g,'');
        if ( typeof History.idToState.get(id) === 'undefined') break;
      }
      return id;
    };

    History.createState = function(data,title,url){
      if ( !data || (typeof data !== 'object') ) data = {};
      var state = {}
      state.data = data;
      state.url = History.getFullUrl(url?url:(History.getLocationHref()));
      state.id = History.genStateId(state);
      History.ids.push(state.id);
      History.idToState.set(state.id,state);
      History.urlToId.set(state.url,state.id);
      return state;
    };

    History.getStateById = function(id){
      id = String(id);
      return History.idToState.get(id) || undefined;
    };

    History.extractState = function(url,create){
      var State = null, id;
      create = create||false;
      id = History.urlToId.get(url)||false;
      if (id) State = History.getStateById(id);
      if (!State && create) State = History.createState(null,null,url);
      return State;
    };

    History.getLastState = function(){
      return History.lastState||undefined;
    };

    History.isLastState = function(newState){
      if ( History.lastState ) {
        return (newState.id === History.lastState.id);
      }else{
        return false;
      }
    };

    History.saveState = function(newState){
      History.lastState = newState;
    };

    History.onPopState = function(event,extra){
      var stateId = false, newState = false;
      stateId = History.extractEventData('state',event,extra) || false;
      if ( stateId ) {
        newState = History.getStateById(stateId);
      }else if ( History.expectedStateId ) {
        newState = History.getStateById(History.expectedStateId);
      }else {
        newState = History.extractState(History.getLocationHref());
      }
      if (!newState) {
        newState = History.createState(null,null,History.getLocationHref());
      }

      History.expectedStateId = false;
      if ( History.isLastState(newState) ) return false;
      History.saveState(newState);
      History.trigger(window,'statechange');
      return true;
    };
    History.bind(window,'popstate',History.onPopState);

    History.pushState = function(data,title,url){
      var newState = History.createState(data,title,url);
      if(History.ids.length > History.options.maxStates) History.shrink();
      if (!History.isLastState(newState) ) {
        History.expectedStateId = newState.id;
        history.pushState(newState.id,newState.title,newState.url);
        History.trigger(window,'popstate');
      }
      return true;
    };

    History.replaceState = function(data,title,url){
      var newState = History.createState(data,title,url);
      if (!History.isLastState(newState) ) {
        History.expectedStateId = newState.id;
        history.replaceState(newState.id,newState.title,newState.url);
        History.trigger(window,'popstate');
      }
      return true;
    };
    History.shrink = function(){
      while(History.ids.length > History.options.minStates){
         var oldId= History.ids.shift();
         var ss = History.idToState.get(oldId);
         if(ss){
           History.idToState.delete(oldId);
           History.urlToId.delete(ss.url);
         }
      }
    };
    History.saveState(History.extractState(History.getLocationHref(),true));
    History.bind(window,'hashchange',function(){
      History.trigger(window,'popstate');
    });
  }; // History.init

  History.init();
})(window);
