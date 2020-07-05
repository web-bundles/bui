(function() {
  (function($) {
    return $.fn.ajaxchosen = function(settings, callback, chosenOptions) {
      var defaultOptions, options, select;
      if (settings == null) {
        settings = {};
      }
      defaultOptions = {
        minLength : 1
      };
      select = this;
      options = $.extend({}, defaultOptions, $(select).data(), settings);
      if (!chosenOptions) {
        chosenOptions = {};
      }
      if (!chosenOptions.placeholder_text) {
        chosenOptions.placeholder_text = "请输入内容查询";
      }
      if (!chosenOptions.no_results_text) {
        chosenOptions.no_results_text = "没有匹配结果";
      }
      this.chosen(chosenOptions);
      var search_field;
      if (this.prop('multiple')) {
        search_field = this.next('.chosen-container').find(
            ".search-field > input");
      } else {
        search_field = this.next('.chosen-container').find(
            ".chosen-search > input");
      }

      search_field.unbind("keyup");

      search_field.bind('keyup.ajaxchosen', function() {
        var field, success, raw_val, val;
        raw_val = $(this).val();
        val = $.trim(raw_val);
        if (val === $(this).data('prevVal')) {
          return false;
        }
        $(this).data('prevVal', val);
        if (val.length < options.minTermLength) {
          return false;
        }
        field = $(this);
        if (options.data == null) {
          options.data = {};
        }
        options.url = settings.url.replace("{term}",val);
        if (options.postData != undefined) {
          var extraData = options.postData();
          $.each(extraData, function(key, value) {
            options.data[key] = value;
          });
        }
        success = options.success;
        options.success = function(data) {
          var items, nbItems, selected_values;
          if (data == null) {
            return;
          }
          selected_values = [];
          select.find('option').each(
              function() {
                if (!$(this).is(":selected")) {
                  return $(this).remove();
                } else {
                  return selected_values.push($(this).val()
                      + "-" + $(this).text());
                }
              });
          items = callback(data);
          nbItems = items.length;
          $.each(items,
              function(i, obj) {
                if ($.inArray(obj.value + "-" + obj.text,
                    selected_values) === -1) {
                  return $("<option />").val(obj.value)
                      .html(obj.text).appendTo(select);
                }
              });
          var chosen= select.data().chosen;
          if (nbItems) {
            select.trigger("chosen:updated.chosen");
            //field value missing after update.chosen
            field.val(raw_val);
            chosen.results_search();
          }else{
            chosen.update_results_content("");
            select.data().chosen.no_results(field.val());
          }
          if (settings.success != null) {
            settings.success(data);
          }
          return field.val(raw_val);
        };
        return $.ajax(options);
      });

      search_field.trigger('keyup.ajaxchosen');
      return search_field;
    };
  })(jQuery);
}).call(this);
