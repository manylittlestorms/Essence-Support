VNP.Areas.Customer = new function () {

  var self = this;
  var social_SOCIAL = '';
  var social_UDID = 'web';
  var social_DEVICE = 'web';
  var social_ISSHOP = false;
  var autoLogin = false;
  var canRead = null;
  var deviceOs = "";
  var idCustomer = $(".vc_open_login").attr("data-id-customer");
  self.validator;     // used to external html template to hide the error message for forgot password


  /* //////////////////////////////
   // start social login facebook //
   ///////////////////////////// */

  self.fb_render = function () {
    //console.log('fb_render');
    FB.login(function (response) {
      //console.log("fb_render response ",response)
      if (response.status === 'connected') {
        connected();
      } else if (response.status === 'not_authorized') {
        // The person is logged into Facebook, but not your app.
      } else {
        // The person is not logged into Facebook, so we're not sure if
        // they are logged into this app or not.
      }
      // handle the response
    }, {scope: 'public_profile,email'});
  };

  var connected = function () {
    //console.log("connected")
    FB.getLoginStatus(function (response) {
      if (response.status === 'connected') {
        statusChangeCallback(response);
        //console.log("response auth ", response.authResponse.accessToken);
      }
    })
  };

  var statusChangeCallback = function (response) {
    //console.log("statusChangeCallback");
    // The response object is returned with a status field that lets the
    // app know the current login status of the person.
    // Full docs on the response object can be found in the documentation
    // for FB.getLoginStatus().
    if (response.status === 'connected') {
      // Logged into your app and Facebook.
      //console.log(response)
      fb_saveUser(response.authResponse.accessToken)
      //testAPI();
    } else if (response.status === 'not_authorized') {
      // The person is logged into Facebook, but not your app.
    } else {
      // The person is not logged into Facebook, so we're not sure if
      // they are logged into this app or not.
    }
  };

  var fb_saveUser = function (access_token) {
    handleUser("facebook", access_token);
    //console.log("access_token ", access_token)
  };

  /*
   * @param social {String} : possible values are "facebook" , "google" , "yahoo"
   * @access_token {String} : response from facebook or google or yahoo
   * */
  var handleUser = function (social, access_token) {

    $.ajax({
      url: VNP.baseUrl + "/webservice/socialResponse.jsp",
      type: "POST",
      dataType: "json",
      data: {social: social, accessToken: access_token},
      beforeSend:function(){
        $('.vc_loading').show();
      },
      success: function (data) {
        if (data.exists) {

          self.loginUser(data.email, data.password);

        } else {

          if (social_ISSHOP) {
            location.href = VNP.baseUrl + "/shop/privacy.jsp";
          } else {
            var objGet = {
              returnURL: location.href,
              social: social,
              udid: social_UDID,
              device: social_DEVICE,
              isShop: social_ISSHOP

            }
            location.href = VNP.baseUrl + "/includes/login/privacy.jsp?" + $.param(objGet)
          }

        }
      }
    });

  };

  /*//////////////////////////////
   // end social login facebook //
   //////////////////////////// */

  /*
   *  get if user can read or not
   *  @return canRead {Boolean} : true / false
   * */
  self.getCanRead = function () {
    return canRead;
  };


  /*
   *  set if user can read or not
   *  @param value {Boolean} : true / false
   */
  self.setCanRead = function (value) {
    canRead = true;
  };

  /*//////////////////////////////
   // start social login google ///
   /////////////////////////// */
  var clicked_trigger = false;
  self.gplus_render = function (clicked) {
    if (clicked == true) {
      clicked_trigger = true;
      // Additional params including the callback, the rest of the params will
      // come from the page-level configuration.
      var additionalParams = {
        'callback': signinCallback
      };
      gapi.auth.signIn(additionalParams); // Will use page level configuration
    }
  }

  var signinCallback = function (authResult) {
    if (authResult['status']['signed_in']) {
      // Update the app to reflect a signed in user
      // Hide the sign-in button now that the user is authorized, for example:
      //console.log(authResult);
      gplus_saveUser(authResult['access_token'])
    } else {
      // Update the app to reflect a signed out user
      // Possible error values:
      //   "user_signed_out" - User is signed-out
      //   "access_denied" - User denied access to your app
      //   "immediate_failed" - Could not automatically log in the user
      //console.log('Sign-in state: ' + authResult['error']);
    }
  }

  var gplus_saveUser = function (access_token) {
    if (clicked_trigger) {
      handleUser("google", access_token);
    }
  }

  /*/////////////////////////////
   //   end social login google //
   /////////////////////////// */

  /* login user */
  self.loginUser = function (username, password, returnUrl) {

    var $loginErrors = $('#vc_login_errors');
    var remember = $('#input_rememberme').is(':checked');
    var device = $('input[name=device]').val();
    var udid = $('input[name=udid]').val();

    var validator = new FormValidator({
      selectorForm: "#vc_form_login form",
      classRequired: ".required",
      errorFormClass: "has-error",
      errorRequiredText: VNP.getLanguagesKey["login.error.required"],
      errorEmailText: VNP.getLanguagesKey["login.error.email_invalid"],
      errorPasswordConfirmText: VNP.getLanguagesKey["login.error.password"],
      bootstrap: {
        mode: true,
        selector: "#vc_login_errors"
      }
    });

    self.validator = validator;

    if(username === "" || password === ""){
      validator.checkRequiredFields();
      return false;
    }

    var params = {
      username: username,
      password: password,
      remember: remember,
      device: device,
      udid: udid
    };

    $.ajax({
      url: VNP.baseUrl + "/webservice/internal_login.jsp",
      dataType: "json",
      data: params,
      method: "POST",
      beforeSend:function(){
        $('.vc_loading').show();
      },
      success: function (data) {
        // set stats
        push_stats(stats.category.title, stats.event.login, params.username);

        if (!data.success && data.status == 0) {

          validator.showErrorMessage("", data.error);

          $('.vc_loading').hide();
          $.ajax({
            url: VNP.baseUrl + "/includes/login/setLoginError.jsp",
            data: data,
            dataType: "json"
          });

        } else {

          if (returnUrl) {
            location.href = returnUrl;
          } else {
            location.reload();
          }

        }
      }
    });

    return false;
  };

  self.recoverPassword = function(email){
    if( email && $.trim(email) != "") {
      $.ajax({
        type: "POST",
        data: $.param({emailRecover: email}),
        dataType: "jsonp",
        jsonpCallback: 'result',
        url: VNP.baseUrl + "/webservice/recoverPwSendMail.jsp",
        success: function (data) {
          eModal.alert({
            css: {"padding": "35px 70px 35px 70px"},
            message: data.result,
            title: VNP.getLanguagesKey["change_password"],
            useBin: true,
            classname: "vc_no_footer_dg text-center",
            buttons: []
          })
        }
      });
    } else {
      console.error('Email is empty');
    }

  };


  /* recover the password */
  self.forgotPassword = function () {

    var validator = new FormValidator({
      selectorForm: "#vc_forgot_password_form",
      classRequired: ".required",
      errorFormClass: "has-error",
      bootstrap: {
        mode: true,
        selector: "#vc_login_errors"
      }

    });

    self.validator = validator;

    $(validator.mandatoryFields).on("keyup", function () {
      validator.required(this);
    });

    var $emailField = $('#input_email');
    var $emailValue = $.trim($($emailField).val());

    validator.checkEmailFormat($emailField[0]);
    var checkForm = validator.submit();

    if (checkForm) {

      var params = {emailRecover: $emailValue};
      var jsonPost = $.param(params);

      $.ajax({
        type: "POST",
        data: jsonPost,
        dataType: "jsonp",
        jsonpCallback: 'result',
        beforeSend:function(){
          $('.vc_loading').show();
        },
        url: VNP.baseUrl + "/webservice/recoverPwSendMail.jsp",
        success: function (data) {

          $('.vc_loading').hide();

          if (data.status == 0) {

            validator.showErrorMessage("", data.result);

          } else {

            validator.showSuccessMessage("", data.result);
            // set stats
            push_stats(stats.category.title, stats.event.recover_password, deviceOs);
            $("#vc_forgot_password_form").hide();
          }
        }

      });
    }

    return false;

  };


  /* social login with facebook */
  self.loginFacebook = function (flowv2) {
    if (flowv2) {
      if (VNP.isAnApp) {
        location.href = "inapp://login?social=" + social_SOCIAL + "&callback=handleUser"
      } else {
        VNP.Areas.Customer.fb_render();
      }
    } else {
      var thisURL = location.href;
      var socialURL = VNP.baseUrl + "/books/loginsocial.jsp?social=facebook&urlReturn=" + encodeURIComponent(thisURL);
      if (window.location.href == top.location.href) {
        location.href = socialURL;
      } else {
        window.open(socialURL, '', 'width=500,height=400');
      }
    }
  };

  /* social login with google */
  self.loginGoogle = function (flowv2) {

    self.gplus_render(flowv2);

  };

  /* social login with yahoo */
  self.loginYahoo = function () {

    $.ajax({
      url: VNP.baseUrl + '/social/yahooclient.jsp',
      dataType: "json",
      data: {"getYahooAuthenticationUrl": true, "returnUrl": location.href},
      beforeSend:function(){
        $('.vc_loading').show();
      },
      success: function (data) {
        if (data.authenticationUrl != undefined && data.authenticationUrl.length > 0) {
          parent.location.href = data.authenticationUrl;
        } else {
          alert("Error login with yahoo.");
        }
      },
      error: function (data) {
        alert("Error login with yahoo.");
      }
    });

  };

  /* open order details */
  self.openOrderDetails = function (orderId) {
    var url = VNP.baseUrl + "/includes/shop/return_page_ok.jsp?orderId=" + orderId + "&onlySummary=true";
    eModal.iframe(url, VNP.getLanguagesKey["order_details"]);
    return false;
  };

  /* open voucher business */
  self.openBusinessForm = function (orderId) {
    var url = VNP.baseUrl + "/includes/shop/prepareBusinessPage.jsp?orderId=" + orderId;
    eModal.iframe(url, VNP.getLanguagesKey["order_business_voucher"]);
    return false;
  };

  /* open voucher gift */
  self.openGiftForm = function (orderId) {
    var url = VNP.baseUrl + "/includes/shop/prepareGiftPage.jsp?orderId=" + orderId;
    eModal.iframe(url, VNP.getLanguagesKey["order_gift_voucher"]);
    return false;
  };

  /* open help desk */
  self.openHelpDesk = function (event) {
    event.preventDefault();
    var options = {
      title: VNP.getLanguagesKey["help_desk_title"],
      message: $("#vc_help_desk").show(),
      classname: "vc_no_footer_dg",
      useBin: true,
      buttons: []
    };
    eModal.alert(options);
  };

  /* open custom popup, enbled in settings (table editore)*/
  self.openCustomPopup = function (event, element, label) {
    event.preventDefault();
    var url = $(element).attr("href");
    eModal.iframe(url, label).then(function(response){
      $('.v').on('hide.bs.modal', function () {
        location.reload();
      })
    });
  };

  /* orders my profile */

  /* filter to show orders with the same type
  * @checkbox {HTMLDomElement} element html, must have data-value-type attribute with set the value of the type
  * */
  self.showOrdersByType = function(checkbox){

    var isShow = checkbox.checked;
    var type = $(checkbox).attr("data-value-type");
    var container = $(".vc_order_details");
    var elements = container.find(".vc_order_" + type);
    var size = elements.length;

    if(size === 0){
      return;
    }

    // show only the selected ones
    $.each(elements,function(index, $el){
      if($($el).parent().parent().hasClass("vc_order_details")){

        if(isShow){
          $($el).parent().parent().parent().removeClass("hidden");
        } else {
          $($el).parent().parent().parent().addClass("hidden");
        }

      }
    });
  };


  /*
  * set the order number for any type of order we have
  * the elements must have data-value-type with the type set
  * */
  self.setOrdersNumberByType = function(){

    var container = $(".vc_filters");
    var input = container.find("input");
    var types = [];

    $.each(input, function(index, element){
      var type = $(element).attr("data-value-type")
      types.push( type );
    });

    $.each(types, function(index, type){
      var size = $(".vc_order_" + type).length;
      var badge = container.find(".number_" + type);
      if( badge.length > 0){
        badge.html("(" + size + ")");
      }
    });

  };

  /* logout */
  self.logout = function (email) {
    // set stats
    push_stats(stats.category.title, stats.event.logout, email);
    location.href = VNP.baseUrl + "/shop/user.jsp?logout=true&comingFrom=";
    return false;
  };

  // get info user

  // favorites
  self.deleteFavorites = function (id, element) {
    var options = {
      message: VNP.getLanguagesKey["deletePreferitiConfirm"],
      title: VNP.getLanguagesKey["favorites"],
      useBin: true,
      classname: "vc_confirm_dg vc_favorites_dg"
    };

    var canDelete = true;

    var response = eModal.confirm(options, null)
        .then(function () {

          return $.ajax({
            url: VNP.baseUrl + '/shop/deletePreferiti.jsp?id=' + id
          });

        }, null);

    response.done(function (data) {

      if (data == "OK") {

        $(element).parent().parent().fadeOut(function () {
          $(this).remove();

          if ($(".vc_card_favorite").length == 0) {


            $("#vc_favorites .vc_container_cards").html('<div class="vc_no_results">'
                + VNP.getLanguagesKey["preferitisuggest"]
                + '</div>')

          }
        });

      } else {

        window.setTimeout(function () {
          eModal.alert({
            css: {"padding": "35px 70px 35px 70px"},
            message: VNP.getLanguagesKey["cannotDelete"],
            useBin: true,
            classname: "vc_no_footer_dg text-center",
            buttons: []
          })
        }, 1000);

      }

    });

  };

  self.confirmCancellation = function() {
    if( confirm(VNP.getLanguagesKey["del_confirmation"]) ) {
      if(idCustomer != null && !isNaN(parseInt(idCustomer)) && $.trim(idCustomer) != ""){
        deleteAccount(idCustomer);
      }
    }
  };

  function deleteAccount(userId) {
    if(userId != null && !isNaN(parseInt(userId)) && $.trim(userId) != ""){
      $.ajax({
        url: VNP.baseUrl + "/webservice/askDeleteAccount.jsp",
        data: {"userId" : userId},
        success: function() {
          alert(VNP.getLanguagesKey["del_confirmation_ok"]);
        }
      });
    }

  };


  var getRegistrationForm = function() {

    $.ajax({
      url: VNP.baseUrl + '/webservice/userFormHTML5.jsp',
      data: {
        "app": "",
        "destination": VNP.baseUrl + "/customer/" + idCustomer + "/update",
        "business": "",
        "notitle": "",
        "customerId": idCustomer,
      },
      cache: true,
      beforeSend:function(){
        $('.vc_loading').show();
      },
      success: function (data) {

        $('.vc_loading').hide();
        $("#vc_registration_form").append(data);

        setTimeout(function(){
          if(typeof initAutocomplete === 'function'){
            initAutocomplete();
          }
        },500);

      },
      error: function (data) {}
    });

  };

  self.init = function () {
    getRegistrationForm();
  }

};
