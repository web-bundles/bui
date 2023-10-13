(function() {
  (function($) {
    return $.fn.ajaxchosen = function(settings, callback, chosenOptions) {
      var defaultOptions, options, select;
      if (settings == null) { settings = {}; }
      defaultOptions = {
        minLength : 1
      };
      settings.url = settings.url.replace("%7Bterm%7D","{term}");
      select = this;//jquery select object
      options = $.extend({}, defaultOptions, $(select).data(), settings);
      if (!chosenOptions) {
        chosenOptions = {};
      }
      if (!chosenOptions.placeholder_text) {
        chosenOptions.placeholder_text = "请输入内容查询";
      }
      if (!chosenOptions.no_results_text) {
        chosenOptions.no_results_text = "没有找到结果!";
      }

      this.chosen(chosenOptions);//first init chosen
      var search_field;
      if (this.prop('multiple')) {
        search_field = this.next('.chosen-container').find(".search-field > input");
      } else {
        search_field = this.next('.chosen-container').find(".chosen-search > input");
      }

      /**fill in data to select*/
      function fillin(data){
        var items, nbItems, selected_values;
        if (data == null) {
          return;
        }
        selected_values = [];
        select.find('option').each(function() {
          if ($(this).val() !="" && !$(this).is(":selected")) {//ignore empty
            return $(this).remove();
          } else {
            return selected_values.push($(this).val()  + "-" + $(this).text());
          }
        });
        items = callback(data);
        $.each(items, function(i, obj) {
          if($.inArray(obj.value + "-" + obj.text, selected_values) === -1) {
            return $("<option />").val(obj.value).html(obj.text).appendTo(select);
          }
        });
        select.trigger("chosen:updated.chosen");
        return items.length;
      }
      function triggerChosen(nbItems,search_value){
        var chosen= select.data().chosen;
        if (nbItems) {
          //search_field value missing after update.chosen
          search_field.val(search_value);
          chosen.results_search();
        }else{
          if(typeof chosenOptions.as_combobox != "undefined" && chosenOptions.as_combobox){
            select.find('option').each(function() {
              if ($(this).val().startsWith('0:')) return $(this).remove();
            });
            $("<option selected='selected'/>").val('0:'+search_value).html(search_value).prependTo(select);
            select.trigger("chosen:updated.chosen");
          }else{
            chosen.update_results_content("");
            select.data().chosen.no_results(search_field.val());
          }
        }
        return search_field.val(search_value);
      }

      function fetchData(options,triggleSearch,search_value){
        if (options.data == null) {
          options.data = {};
        }
        options.url = settings.url.replace("{term}",search_value);
        if (options.postData != undefined) {
          var extraData = options.postData();
          $.each(extraData, function(key, value) {
            options.data[key] = value;
          });
        }
        options.success = function(data) {
          var nItems=fillin(data)
          if (settings.success != null) {
            settings.success(data);
          }
          if(triggleSearch){
            triggerChosen(nItems,search_value)
          }
        };
        return $.ajax(options);
      }

      search_field.bind('ajaxchosen', function() {
        var field, raw_val, val;
        raw_val = $(this).val();
        if(raw_val == chosenOptions.placeholder_text){
          raw_val="";
        }
        val = $.trim(raw_val);
        if (val === $(this).data('prevVal')) {
          return false;
        }
        $(this).data('prevVal', val);
        if (val.length < options.minTermLength) {
          return false;
        }
        field = $(this);
        return fetchData(options,true,val);
      });

      fetchData(options,false,"");

      var inComposition=false;
      search_field.on('compositionstart',function(){inComposition=true;})
      search_field.on('compositionend',function(){inComposition=false;})
      search_field.unbind("keyup");
      var lastKeyUpTime = null;
      // 界定是否在输入的阈值（单位:毫秒）,如果一个用户在n毫秒内没有输入动作，那么就可以认为用户已经输入完毕可以执行ajax动作了
      var typingThreshold = 300;
      search_field.bind("keyup.chosen", function() {
        lastKeyUpTime = new Date().getTime();
        setTimeout(function() {
          var timeElapse = (new Date().getTime()) - lastKeyUpTime;
          if (!inComposition && timeElapse >= typingThreshold) {
            search_field.trigger('ajaxchosen');
          }
        }, typingThreshold);
      });
      return search_field;
    };
  })(jQuery);
}).call(this);
