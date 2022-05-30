/**
 * Created by Sara e Stefano on 6/10/2019
 * Miles33
 */
VNP.Areas.Reader.module.Zoom = new function(){

  var self = this;
  var enabled = false;
  var $container = $(".iframeZoom");
  var $navigator = $("#sliderZoom");
  var $loading = $(".vc_container_reader .vc_loading");
  var $boxZoomMessage = $("<div class='exit-message'></div>");
  var counterToggle = 0;
  self.zoomHeight = 0;
  self.zoomWeight = 0;

  // when double-clicking, the zoom is set to this percentage
  var entryZoomPercentage = 100; // 100 = max, 25 = min

  // pictures
  var picImage1;
  var picImage1Width = 0;
  var picImage1Height = 0;
  var oldPicImage1Number = 0;
  var picImage2;
  var picImage2Width = 0;
  var picImage2Height = 0;
  var oldPicImage2Number = 0;
  var picWidth = 0;
  var picHeight = 0;

  var originX = 0;
  var originY = 0;
  var clickXAmount = 0;
  var clickYAmount = 0;
  var moveXAmount = 0;
  var moveYAmount = 0;
  var currentMoveXAmount = 0;
  var currentMoveYAmount = 0;
  var pictureMoveXAmount = 0; // the X move from the center in the original picture (not zoomed)
  var pictureMoveYAmount = 0; // the Y move from the center in the original picture (not zoomed)
  var initialZoomRatio = 2; // automatically calculated to fit the picture
  var sliderZoomRatio = 2; // min = 1 (25%), max = 4 (100%)
  var currentZoomRatio = 2; // automatically calculated runtime
  var isInitialized = false;
  var isDragging = false;
  var oldCanvasWidth = 0;
  var oldCanvasHeight = 0;
  var isDoubleClicking = false; // to skip recalculating origins

  // to manage the initial double-click on slider
  var initialClickX = 0;
  var initialClickY = 0;
  var initialMoveAmountX = 0;
  var initialMoveAmountY = 0;

  // to manage pinch
  var isPinching = false;
  var evCache = new Array();
  var prevDiff = -1;

  var _in = function(){
    if( !isEnabled() ) enable();

 

    // user can read
    // make visible the zoom container
    $("body").addClass("zoomin");
    $(".iframeZoom").addClass("zoomed");

    // Disable scrolling on document
    document.addEventListener('touchmove', function (event) {
      event.preventDefault();
    }, { passive: false });
  };

  var _out = function(){

  };

  var enable = function(){
    enabled = true;
  };

  var disable = function(){
    enabled = true;
  };

  var isEnabled = function(){
    return enabled;
  };

  var toggle = function (event) {
    enabled = enabled;

    // zoom out
    if ( $container.hasClass("zoomed") ) {
      $boxZoomMessage.hide();
      _out();

      initialClickX = 0;
      initialClickY = 0;
      initialMoveAmountX = 0;
      initialMoveAmountY = 0;

    } else {

      var eventX = 0;
      var eventY = 0;
      var targetPictureWidth = event.target.width;
      var targetPictureHeight = event.target.height;
      if (!targetPictureWidth || !targetPictureHeight) {
        return false; // not onto the image
      }

      $loading.show();
      // notify the user how to disable zoom just on time
      var message = (VNP.getDevice().isMobile) ? VNP.getLanguagesKey["pageflip_exit_zoom_mob"] : VNP.getLanguagesKey["pageflip_exit_zoom_desk"];
      if(counterToggle < 1) {
        $loading.hide();
        notify(message);
      }

      var isOddPage = parseInt($(event.target).attr("data-page")) % 2 > 0;
      var isLandscape = VNP.getDevice().orientation === "landscape";
      var showTwoPages = VNP.Areas.Reader.swiperUi.getCurrentPages().length > 1;

      if (showTwoPages) {
        picWidth = picImage1Width * 2;
      } else {
        picWidth = picImage1Width;
      }

      var isTouch = typeof event.changedTouches !== "undefined" && event.changedTouches.length > 0;
      if (isTouch) {
        // read container size
        var offsetX = 0;
        var offsetY = 0;
        var containerWidth = 0;
        var containerHeight = 0;
        if (event.currentTarget) {
          containerWidth = event.currentTarget.clientWidth;
          containerHeight = event.currentTarget.clientHeight;
          offsetX = event.currentTarget.offsetLeft;
          offsetY = event.currentTarget.offsetTop;
        } else {
          var $reader = $(".vc_container_reader");
          if ($reader.length === 0) {
            containerWidth = $container.width();
            containerHeight = $container.height();
          } else {
            containerWidth = $reader.width();
            containerHeight = $reader.height();
          }
        }
        if (containerWidth === 0) {
          $loading.hide();
          return false; // cannot find the container
        }

        var emptySpaceLeft = 0;
        if (showTwoPages) {
          emptySpaceLeft = ((containerWidth - (targetPictureWidth * 2)) / 2);
          if (isOddPage) {
            eventX = (event.changedTouches[0].pageX - offsetX) - targetPictureWidth - emptySpaceLeft;
          } else {
            eventX = (event.changedTouches[0].pageX - offsetX) - emptySpaceLeft;
          }
        } else {
          if (isLandscape) {
            // only one picture from/to center
            if (isOddPage) { // from center
              emptySpaceLeft = (containerWidth / 2);
            } else { // to center
              emptySpaceLeft = ((containerWidth / 2) - targetPictureWidth);
            }
          } else {
           // only one picture centered
           emptySpaceLeft = ((containerWidth - targetPictureWidth) / 2);
          }
          eventX = (event.changedTouches[0].pageX - offsetX) - emptySpaceLeft;
        }
        eventY = (event.changedTouches[0].pageY - offsetY) - ((containerHeight - targetPictureHeight) / 2);
      } else {
        eventX = event.offsetX;
        eventY = event.offsetY;
      }

      // find eventX and eventX, that are the actual pixels from the top-left corner of the clicked image (first or second)
      // 5 pixels tolerance
      if (eventX > -5 && eventX <= 0) {
        eventX = 1;
      }
      if (eventY > -5 && eventY <= 0) {
        eventY = 1;
      }
      if (eventX < 0 && eventY < 0) {
        $loading.hide();
        return false; // invalid double click
      }

      // find the ratio by the size of the original big picture
      var sliderPicRatioX = 0;
      if (showTwoPages) {
        sliderPicRatioX = targetPictureWidth / (picWidth / 2);
      } else {
        sliderPicRatioX = targetPictureWidth / picWidth;
      }
      var sliderPicRatioY = targetPictureHeight / picHeight;

      // find the clicked pixel on the original big picture
      initialClickX = eventX / sliderPicRatioX;
      if (showTwoPages && isOddPage) {
        initialClickX += (picWidth / 2);
      }
      initialClickY = eventY / sliderPicRatioY;

      // find the initial move amount (from the center of the screen) on the original big picture
      if (showTwoPages) {
        initialMoveAmountX = (initialClickX - (picWidth / 2)) * sliderPicRatioX;
      } else {
        if (isTouch && !isLandscape) {
          initialMoveAmountX = (initialClickX - (picWidth / 2)) * sliderPicRatioX;
        } else {
          if (isOddPage) {
            // the center of the screen is on the left side of the picture
            initialMoveAmountX = initialClickX * sliderPicRatioX;
          } else {
            // the center of the screen is on the right side of the picture
            initialMoveAmountX = (initialClickX - picWidth) * sliderPicRatioX;
          }
        }
      }
      initialMoveAmountY = (initialClickY - (picHeight / 2)) * sliderPicRatioY;

      // zoom in
      var targetZoomRatio = entryZoomPercentage / 100;
      var targetSliderRatio = targetZoomRatio / 0.25;
      scale(targetSliderRatio);

      // store stats
      push_stats(stats.category.title, stats.event.zoom + '-' + EDITION_LABEL, VNP.Areas.Reader.getActivePage() + '-' + hasAccess_label);
      counterToggle ++;
    }

    return false;
  };

  var increase = function(){
    var currentStep = parseFloat( $navigator.val() );
    var max = parseFloat( $navigator.attr("max") );
    var step = parseFloat( $navigator.attr("step") );

    if( currentStep < max ){
      currentStep += step;
      $navigator.val(currentStep);
      scale(currentStep);
    }
  };

  var decrease = function(){
    var currentStep = parseFloat( $navigator.val() );
    var min = parseFloat( $navigator.attr("min") );
    var step = parseFloat( $navigator.attr("step") );

    if( currentStep > min ){
      currentStep -= step;
      $navigator.val(currentStep);
      scale(currentStep);
    }
  };

  var notify = function(message) {

    $boxZoomMessage.html('<div>' + message + '</div>');
    $boxZoomMessage.show().animate({opacity: 1});
    $boxZoomMessage.appendTo('body').delay(2000).animate({opacity: 0}, 500,function() {
      $boxZoomMessage.hide();
    });

  };

  var preload = function () {

    // create container
    var currentPic1Number = 0;
    var currentPic2Number = 0;
    if (VNP.Areas.Reader.swiperUi.getCurrentPages().length > 0) {
      currentPic1Number = VNP.Areas.Reader.swiperUi.getCurrentPages()[0];
      if (VNP.Areas.Reader.swiperUi.getCurrentPages().length > 1) {
        currentPic2Number = VNP.Areas.Reader.swiperUi.getCurrentPages()[1];
      }
    }
    if (currentPic1Number !== oldPicImage1Number || currentPic2Number !== oldPicImage2Number) {
      sliderZoomRatio = parseFloat($navigator.val());
      loadPictures();
    }
  };

  var clearVariables = function () {
    originX = 0;
    originY = 0;
    initialClickX = 0;
    initialClickY = 0;
    initialMoveAmountX = 0;
    initialMoveAmountY = 0;
    clickXAmount = 0;
    clickYAmount = 0;
    moveXAmount = 0;
    moveYAmount = 0;
    currentMoveXAmount = 0;
    currentMoveYAmount = 0;
    pictureMoveXAmount = 0;
    pictureMoveYAmount = 0;
    initialZoomRatio = 2;
    currentZoomRatio = 2;
    isInitialized = false;
    isDragging = false;
    oldCanvasWidth = 0;
    oldCanvasHeight = 0;
    isDoubleClicking = false;

    isPinching = false;
    evCache = [];
    prevDiff = -1;

    // update the navigator
    var min = parseFloat($navigator.attr("min"));
    $navigator.val(min);

    sliderZoomRatio = min;
    // set the current zoom ratio
    if (sliderZoomRatio < 1) {
      currentZoomRatio = 2;
    } else {
      currentZoomRatio = 2; // every step is 25%
    }
  };

  var loadPictures = function () {
    clearVariables();

    // clear the canvas
    picImage1 = null;
    picImage2 = null;
    oldPicImage1Number = 0;
    oldPicImage2Number = 0;

    var mainCanvas = document.getElementById('main-canvas');
    var canvasWidth = mainCanvas.clientWidth;
    var canvasHeight = mainCanvas.clientHeight;
    var ctx = mainCanvas.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    var showTwoPages = VNP.Areas.Reader.swiperUi.getCurrentPages().length > 1;

    // load pictures only once
    picImage1 = new Image();
    picImage1.onload = function () {
      if (picImage1 === null) {
        console.log("picImage1 is null");
        return;
      }
      // read the actual size
      picImage1Width = picImage1.width;
      picImage1Height = picImage1.height;
      picWidth = picImage1Width;
      picHeight = picImage1Height;

      if (showTwoPages) {
        picImage2 = new Image();
        picImage2.onload = function () {
          if (picImage2 === null) {
            console.log("picImage2 is null");
            return;
          }
          // read the actual size
          picImage2Width = picImage2.width;
          picImage2Height = picImage2.height;
          picWidth = picImage1Width + picImage2Width;
          if (picImage2Height > picImage1Height) {
            picHeight = picImage2Height;
          }

          // first execution (only after having read the correct pictures size)
          showImage();
        };
        oldPicImage2Number = VNP.Areas.Reader.swiperUi.getCurrentPages()[1];
        if (oldPicImage2Number > 0) {
          picImage2.src = VNP.baseUrl + VNP.Areas.Reader.getBooksPath() + 'images/zoompages/Zoom-' + oldPicImage2Number + '.jpg';
        }
      } else {
        // first execution (only after having read the correct pictures size)
        showImage();
      }
    };
    if (VNP.Areas.Reader.swiperUi.getCurrentPages().length > 0) {
      oldPicImage1Number = VNP.Areas.Reader.swiperUi.getCurrentPages()[0];
      if (oldPicImage1Number > 0) {
        picImage1.src = VNP.baseUrl + VNP.Areas.Reader.getBooksPath() + 'images/zoompages/Zoom-' + oldPicImage1Number + '.jpg';
      }
    }
  };

  var onDoubleClickOnImage = function (pixelX, pixelY) {
    var mainCanvas = document.getElementById('main-canvas');
    var canvasWidth = mainCanvas.clientWidth;
    var canvasHeight = mainCanvas.clientHeight;

    var targetZoomRatio = entryZoomPercentage / 100;
    var targetSliderRatio = targetZoomRatio / 0.25;
    $navigator.val(targetSliderRatio);

    // find the corresponding pixel on the original image
    var targetCenterX = (picWidth * targetZoomRatio) / 2;
    var targetCenterY = (picHeight * targetZoomRatio) / 2;

    // set the target zoom ratio and show the image
    pictureMoveXAmount = targetCenterX - (pixelX * targetZoomRatio) + initialMoveAmountX;
    pictureMoveYAmount = targetCenterY - (pixelY * targetZoomRatio) + initialMoveAmountY;

    currentZoomRatio = 2;
    sliderZoomRatio = targetSliderRatio;
    calculateImageOrigin(canvasWidth, canvasHeight);

    currentMoveXAmount = (pictureMoveXAmount * currentZoomRatio);
    currentMoveYAmount = (pictureMoveYAmount * currentZoomRatio);

    isDoubleClicking = true; // to skip recalculating origins
    try {
      showImage();
    } finally {
      isDoubleClicking = false;
    }
  };

  var onMouseDownOnCanvas = function (pixelX, pixelY) {
    var mainCanvas = document.getElementById('main-canvas');
    var canvasWidth = mainCanvas.clientWidth;
    var canvasHeight = mainCanvas.clientHeight;

    // find the x,y coordinates of the click from the center
    var clickXFromCenter = pixelX - (canvasWidth / 2);
    var clickYFromCenter = pixelY - (canvasHeight / 2);

    startDragging(clickXFromCenter, clickYFromCenter);
  };

  var onMouseMoveOnCanvas = function (pixelX, pixelY) {
    var mainCanvas = document.getElementById('main-canvas');
    var canvasWidth = mainCanvas.clientWidth;
    var canvasHeight = mainCanvas.clientHeight;

    // find the x,y coordinates of the click from the center
    pixelX = pixelX - (canvasWidth / 2) - clickXAmount;
    moveXAmount = isValidXMove(pixelX, canvasWidth);
    pixelY = pixelY - (canvasHeight / 2) - clickYAmount;
    moveYAmount = isValidYMove(pixelY, canvasHeight);

    showImage();
  };

  var onWindowResize = function() {
    // adjust according to the canvas size changes
    var mainCanvas = document.getElementById('main-canvas');
    if( mainCanvas === null) return;
    var canvasWidth = mainCanvas.clientWidth;
    var canvasHeight = mainCanvas.clientHeight;

    if (oldCanvasWidth === 0 || oldCanvasHeight === 0) {
      oldCanvasWidth = canvasWidth;
      oldCanvasHeight = canvasHeight;
    } else if (canvasWidth !== oldCanvasWidth || canvasHeight !== oldCanvasHeight) {
      var currentPic1Number = 0;
      var currentPic2Number = 0;
      if (VNP.Areas.Reader.swiperUi.getCurrentPages().length > 0) {
        currentPic1Number = VNP.Areas.Reader.swiperUi.getCurrentPages()[0];
        if (VNP.Areas.Reader.swiperUi.getCurrentPages().length > 1) {
          currentPic2Number = VNP.Areas.Reader.swiperUi.getCurrentPages()[1];
        }
      }
      if (currentPic1Number !== oldPicImage1Number || currentPic2Number !== oldPicImage2Number) {
        // the resize changed the loaded pictures: let's reload them
        loadPictures();
      } else {
        oldCanvasWidth = canvasWidth;
        oldCanvasHeight = canvasHeight;

        calculateInitialZoomRatio(canvasWidth, canvasHeight);
        currentZoomRatio = 2;
        calculateImageOrigin(canvasWidth, canvasHeight);

        currentMoveXAmount = pictureMoveXAmount * currentZoomRatio;
        currentMoveYAmount = pictureMoveYAmount * currentZoomRatio;

        showImage();
      }
    }
  };

  var onTouchStartOnCanvas = function (event) {
    // cache the starting touches coordinates
    for (var it = 0; it < event.changedTouches.length; it++) {
      evCache.push(event.changedTouches[it]);
    }

    if (evCache.length === 1) {
      // startDragging
      stopPinching();

      var mainCanvas = document.getElementById('main-canvas');
      var canvasWidth = mainCanvas.clientWidth;
      var canvasHeight = mainCanvas.clientHeight;
      var touch = event.changedTouches[0] || event.touches[0];

      var pixelX = (touch.pageX / $(window).width()) * canvasWidth;
      var pixelY = (touch.pageY / $(window).height()) * canvasHeight;

      onMouseDownOnCanvas(pixelX, pixelY);

    } else if (evCache.length === 2) {
      // start pinching
      stopDragging();

      prevDiff = Math.abs(evCache[0].clientX - evCache[1].clientX);
      var curDiffY = Math.abs(evCache[0].clientY - evCache[1].clientY);
      if (curDiffY > prevDiff) {
        prevDiff = curDiffY;
      }
      isPinching = true;
    }
  };

  var onTouchMoveOnCanvas = function (event) {
    // console.log("touchmove: " + evCache.length);

    // update the touches coordinates
    for (var it = 0; it < event.targetTouches.length; it++) {
      for (var ic = 0; ic < evCache.length; ic++) {
        if (event.targetTouches[it].identifier === evCache[ic].identifier) {
          evCache[ic] = event.targetTouches[it];
          break;
        }
      }
    }

    var mainCanvas = document.getElementById('main-canvas');
    var canvasWidth = mainCanvas.clientWidth;
    var canvasHeight = mainCanvas.clientHeight;

    if (evCache.length === 1) {
      if (isDragging === true) {
        var touch = event.changedTouches[0] || event.touches[0];
        var pixelX = (touch.pageX / $(window).width()) * canvasWidth;
        var pixelY = (touch.pageY / $(window).height()) * canvasHeight;

        onMouseMoveOnCanvas(pixelX, pixelY);
      }
    } else if (evCache.length === 2) {
      if (isPinching === true) {
        // If the distance between the two pointers has increased is zoom-in,
        // if the distance is decreasing is zoom-out.

        // calculate the distance between the two pointers
        var eventDiff = Math.abs(evCache[0].clientX - evCache[1].clientX);
        var eventDiffY = Math.abs(evCache[0].clientY - evCache[1].clientY);
        if (eventDiffY > eventDiff) {
          eventDiff = eventDiffY;
        }

        if (prevDiff > 0) {
          var pinchMove = eventDiff - prevDiff;

          // multiply the pinchMove to have a faster zoom
          pinchMove = pinchMove * 4;

          // calculate the new scale
          var curWidth = (picWidth * currentZoomRatio) + pinchMove;
          var newRatio = curWidth / picWidth;
          if (newRatio > 1) {
            newRatio = 1;
          } else if (newRatio < initialZoomRatio) {
            newRatio = initialZoomRatio;
          }

          if (newRatio !== currentZoomRatio) {
            sliderZoomRatio = newRatio / 0.25;
            if (sliderZoomRatio < 1) {
              sliderZoomRatio = 2;
            }
            showImage();

            // update the navigator
            // $navigator.val(sliderZoomRatio);
          }
        }
        // cache the distance for the next move event
        prevDiff = eventDiff;
      }
    }
  };

  var onTouchEndOnCanvas = function (event) {
    if (event.targetTouches.length === 0) {
      evCache = []; // clear the array
    } else {
      // remove these touches from the target's cache
      for (var it = 0; it < event.changedTouches.length; it++) {
        for (var ic = 0; ic < evCache.length; ic++) {
          if (event.changedTouches[it].identifier === evCache[ic].identifier) {
            evCache.splice(ic, 1);
            break;
          }
        }
      }
    }

    // if the number of pointers down is less than two then reset diff tracker
    if (evCache.length < 1) {
      // stop dragging
      stopDragging();
    } else if (evCache.length < 2) {
      // stop pinching
      prevDiff = -1;
      isPinching = false;
    }
  };

  var calculateInitialZoomRatio = function(canvasWidth, canvasHeight) {
    var widthRatio = canvasWidth / picWidth;
    var heightRatio = canvasHeight / picHeight;

    // calculate initial zoom ratio
    if ((picWidth < canvasWidth && picHeight < canvasHeight)
        || (picWidth >= canvasWidth && picHeight >= canvasHeight)) {
      // the image is smaller or bigger than canvas by the both axis
      if (heightRatio >= widthRatio) {
        initialZoomRatio = widthRatio; // calculated by width
      } else {
        initialZoomRatio = heightRatio; // calculated by height
      }
    } else if (picWidth >= canvasWidth) {
      // the image is bigger than canvas by width and smaller by height
      initialZoomRatio = widthRatio; // calculated by width
    } else if (picHeight >= canvasHeight) {
      // the image is bigger than canvas by height and smaller by width
      initialZoomRatio = heightRatio; // calculated by height
    } else {
      console.log('Error: wrong zoom ratio calculation');
      initialZoomRatio = 2;
    }
  };

  var calculateImageOrigin = function(canvasWidth, canvasHeight) {
    // calculate the size of the zoomed image
    var zoomedPicWidth = picWidth * currentZoomRatio;
    var zoomedPicHeight = picHeight * currentZoomRatio;

    currentMoveXAmount = pictureMoveXAmount * currentZoomRatio;
    currentMoveYAmount = pictureMoveYAmount * currentZoomRatio;
    originX = ((canvasWidth - zoomedPicWidth) / 2);
    originY = ((canvasHeight - zoomedPicHeight) / 2);
  };

  var startDragging = function (clickXFromCenter, clickYFromCenter) {
    if (isDragging === false) {
      clickXAmount = clickXFromCenter;
      clickYAmount = clickYFromCenter;

      isDragging = true;
    }
  };

  var stopDragging = function () {
    if (isDragging === true) {
      isDragging = false;

      // save the current distance from the center
      currentMoveXAmount += moveXAmount;
      currentMoveYAmount += moveYAmount;
      pictureMoveXAmount = currentMoveXAmount / currentZoomRatio;
      pictureMoveYAmount = currentMoveYAmount / currentZoomRatio;

      // reset variables
      clickXAmount = 0;
      clickYAmount = 0;
      moveXAmount = 0;
      moveYAmount = 0;
    }
  };

  var stopPinching = function () {
    if (isPinching === true) {
      isPinching = false;
      prevDiff = -1;
    }
  };

  var showImage = function() {
    var mainCanvas = document.getElementById('main-canvas');
    var canvasWidth = mainCanvas.clientWidth;
    var canvasHeight = mainCanvas.clientHeight;
    var ctx = mainCanvas.getContext('2d');
    var showTwoPages = VNP.Areas.Reader.swiperUi.getCurrentPages().length > 1;

    if (!isInitialized) {
      isInitialized = true;
      oldCanvasWidth = canvasWidth;
      oldCanvasHeight = canvasHeight;
      calculateInitialZoomRatio(canvasWidth, canvasHeight);
    }

    // set the current zoom ratio
    if (sliderZoomRatio < 1) {
      currentZoomRatio = 2;
    } else {
      currentZoomRatio = 2; // every step is 25%
    }

    if (!isDragging && !isDoubleClicking) {
      // we are changing the zoom, not moving the image
      calculateImageOrigin(canvasWidth, canvasHeight);
    }

    // updateLabels();

    mainCanvas.width = canvasWidth;
    mainCanvas.height = canvasHeight;
    //when the server doesn't provide the zoom page picImage1.width is equals to 0
    if (picImage1 !== null && picImage1.width > 0) {
      ctx.drawImage(picImage1,
        originX + currentMoveXAmount + moveXAmount,
        originY + currentMoveYAmount + moveYAmount,
        picImage1Width * currentZoomRatio, picImage1Height * currentZoomRatio);
    } else {
      console.log("the server doesn't provide picImage1");
    }

    if (showTwoPages) {
      //when the server doesn't provide the zoom page picImage2.width is equals to 0
      if (picImage2 !== null && picImage2.width > 0) {
        ctx.drawImage(picImage2,
          originX + currentMoveXAmount + moveXAmount + (picImage1Width * currentZoomRatio),
          originY + currentMoveYAmount + moveYAmount,
          picImage2Width * currentZoomRatio, picImage2Height * currentZoomRatio);
      } else {
        console.log("the server doesn't provide picImage2");
      }
    }
    if(isEnabled()){
      $loading.hide();
    }
  };

  var isValidXMove = function(tempXAmount, canvasWidth) {
    // ignore the mouse movement if the center exits from the picture
    if ((originX + currentMoveXAmount + tempXAmount) > (canvasWidth / 2)) {
      tempXAmount = (canvasWidth / 2) - (originX + currentMoveXAmount);
    } else if ((originX + currentMoveXAmount + tempXAmount + (picWidth * currentZoomRatio)) < (canvasWidth / 2)) {
      tempXAmount = (canvasWidth / 2) - (originX + currentMoveXAmount + (picWidth * currentZoomRatio));
    }
    return tempXAmount;
  };

  var isValidYMove = function(tempYAmount, canvasHeight) {
    // ignore the mouse movement if the center exits from the picture
    if ((originY + currentMoveYAmount + tempYAmount) > (canvasHeight / 2)) {
      tempYAmount = (canvasHeight / 2) - (originY + currentMoveYAmount);
    } else if ((originY + currentMoveYAmount + tempYAmount + (picHeight * currentZoomRatio)) < (canvasHeight / 2)) {
      tempYAmount = (canvasHeight / 2) - (originY + currentMoveYAmount + (picHeight * currentZoomRatio));
    }
    return tempYAmount;
  };

  var scale = function(step){
    var min = parseFloat( $navigator.attr("min") );

    if (!$container.hasClass("zoomed")) {
      _in();

      if (initialClickX > 0 && initialClickY > 0) {
        // double-click on slider
        onDoubleClickOnImage(initialClickX, initialClickY);
      } else {
        // we are entering into zoom using the slider, not the double-click
        sliderZoomRatio = step;
        showImage();
      }
    } else {
      //update the navigator
      $navigator.val(step);
      sliderZoomRatio = step;

      showImage();
    }

    initialClickX = 0;
    initialClickY = 0;
    initialMoveAmountX = 0;
    initialMoveAmountY = 0;
  };



  /*/////////////////////////////////////////////////////
   //                    handle events                  //
   /////////////////////////////////////////////////////*/

  var containerZoom = document.querySelector('.iframeZoom');
  if (containerZoom) {
    // double click to disable zoom only for desktop
    containerZoom.addEventListener('dblclick', toggle, false);

    // disable zoom on double tap on the container
    var lastClick = 0;
    containerZoom.addEventListener('touchend', function (event) {
      if (event.targetTouches.length === 0) {
        var now = (new Date()).getTime();
        if (now - lastClick <= 300) {
          VNP.Areas.Reader.module.Zoom.toggle(event);
        }
        lastClick = now;
      }
    }, false);
  }

  // disable double tap on the document
  var lastTouchEnd = 0;
  document.addEventListener('touchend', function (event) {
    var now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, {passive: false});

  // esc to zoom out
  document.addEventListener('keydown', function (e) {
    var esc = 27;
    var left = 37;
    var right = 39;
    var isZoomEnabled = isEnabled();

    switch (e.keyCode) {
      case esc:
        if (isZoomEnabled) {
          _out();
        }
        break;
      case left:
        if (isZoomEnabled) e.preventDefault();
        break;
      case right:
        if (isZoomEnabled) e.preventDefault();
        break;
    }
  });

  var mainCanvas = document.getElementById('main-canvas');

  $(mainCanvas).mousedown(function (event) {
    if (event.which === 1) { // left-button
      event.preventDefault();

      // find the x,y coordinates of the click
      var $self = this;
      const rect = $self.getBoundingClientRect();
      var pixelX = event.clientX - rect.left;
      var pixelY = event.clientY - rect.top;

      // startDragging
      // console.log("mousedown");
      onMouseDownOnCanvas(pixelX, pixelY);
    }
  });

  $(mainCanvas).mousemove(function (event) {
    if (isDragging === true) {
      event.preventDefault();

      // find the x,y coordinates of the click
      var $self = this;
      const rect = $self.getBoundingClientRect();
      var pixelX = event.clientX - rect.left;
      var pixelY = event.clientY - rect.top;

      onMouseMoveOnCanvas(pixelX, pixelY);
    }
  });

  $(mainCanvas).mouseout(function (event) {
    event.preventDefault();
    stopDragging();
  });

  if ($(mainCanvas).length > 0) {
    mainCanvas.addEventListener('touchstart', onTouchStartOnCanvas, { passive: true });
    mainCanvas.addEventListener('touchmove', onTouchMoveOnCanvas, { passive: true });
    mainCanvas.addEventListener('touchend', onTouchEndOnCanvas, { passive: true });
  }

  $(window).mouseup(function () {
    stopDragging();
  });

  window.addEventListener('resize', function (event) {
    // adjust according to the canvas size changes
    onWindowResize();
    event.stopPropagation();
  });


  // public methods
  return {
    in:_in,
    out:_out,
    scale:scale,
    toggle:toggle,
    increase:increase,
    decrease:decrease,
    enable: enable,
    disable: disable,
    isEnabled: isEnabled,
    notify: notify,
    preload: preload
  };

};
