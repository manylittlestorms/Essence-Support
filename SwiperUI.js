/**
 * Created by Sara on 6/10/2019.
 */
function SwiperUi() {

  var self = this;
  var _container = '.vc_container_reader .swiper-container';
  var edition = VNP.getEdition();
  var totalPages = VNP.Areas.Reader.getTotalPages();
  var booksPath = VNP.Areas.Reader.getBooksPath();
  var dateFormat = "DD/MM/YYYY"; // date format from settings
  var page = null;
  var $activePageNumber = $(".activePageNumber");
  var $totalPages = $(".totalPages");
  self.regions = new Regions();

  /* set double page */
  self.setDoublePage = function (swiper) {

    if( VNP.Areas.Reader.getActivePage() === 1 ){
      //first page and ghost one
      swiper.slideTo(1);
      location.hash = "/1/";
    }
  };

  /* set one page */
  self.unsetDoublePage = function (swiper) {

    if( $(swiper.slides[swiper.activeIndex]).attr("data-page") == 0 ){
      //first page and ghost one
      swiper.slideTo(1);
      location.hash = "/1/";
    }

    if( VNP.Areas.Reader.getActivePage() > VNP.Areas.Reader.getTotalPages() ){
      //last page and ghost one
      swiper.slideTo(VNP.Areas.Reader.getTotalPages());
      location.hash = "/" + VNP.Areas.Reader.getTotalPages() + "/";
    }
  };

  /* when resize window set or unset double page*/
  $(window).on("resize", function () {

    var $contImg = $(".vc_cont_img");
    VNP.Areas.Reader.isDoublePage = VNP.getDevice().isDoublePage;
    VNP.setIsMobile( VNP.getDevice().isMobile );

    renderCurrentPages();
    // because it removes a slide we need to recalculate the page number
    var page = (VNP.Areas.Reader.getActivePage() > VNP.Areas.Reader.getTotalPages()) ? VNP.Areas.Reader.getTotalPages() : VNP.Areas.Reader.getActivePage();
    $activePageNumber.text(page);

    // go to real slide and not the ghost one in monopage version
    if( !VNP.Areas.Reader.isDoublePage && $(".swiper-slide-active").hasClass("vc_visibility_hidden") && page === 1 ){
      swiper.activeIndex = 1;
    }

    //resize the cont images for positioning regions
    $contImg.width('auto');
    $contImg.height('auto');

  });


  var forcedElementsOpened = [];
  var triggerElementsForcedToShow = function (hashPageNumber) {
    // If you go from page 1 to next page hashPageNumber is 2, so the below if returns false. If you go from page 4 the hasPageNumber is 3 but i need it is 2
    if (hashPageNumber > 1 && hashPageNumber % 2 != 0) hashPageNumber = hashPageNumber - 1;
    for (var pageNumber = hashPageNumber; pageNumber <= hashPageNumber + 1; pageNumber++) { // Cycle the left and right page
      for (var i = 0; i < self.regions.getRegionsByPage(pageNumber).length; i++) { // Get all regions for these pages
        var region = self.regions.getRegion(self.regions.getRegionsByPage(pageNumber)[i], pageNumber);
        if (region.data.force_view && forcedElementsOpened.indexOf(region.id) < 0) { // Search the first one with force_view at 3 and open it
          forcedElementsOpened.push(region.id);
          $("#reg" + (i+1)).click();
          return;
        }
      }
    }
  };


  self.lockSwipes = function () {
    swiper.allowSlideNext = false;
    swiper.allowSlidePrev = false;
  };


  self.unlockSwipes = function () {
    swiper.allowSlideNext = true;
    swiper.allowSlidePrev = true;
  };


  self.getCurrentPages = function () {
    var pages = [];
    var page = VNP.Areas.Reader.getActivePage();
    pages.push(page);

    if (VNP.Areas.Reader.isDoublePage) {
      if (page > 1 && page + 1 < totalPages) {
        pages.push(page + 1);
      }
    }

    return pages;
  };


  /*
   * remove regions from reader
   * */
  var removeRegions = function () {
    $(_container).find('.region').remove();
  };

  // Render current visible pages
  var renderCurrentPages = function () {
    var pages = self.getCurrentPages();
    for (var i = 0; i < pages.length; i++) {
      self.renderPage(pages[i]);
    }
  };

  /*
   * get img by page
   * @param page {Integer} : page number
   *
   * */
  var getPageElement = function (page) {
    return $(_container).find('.swiper-slide[data-page=' + page + '] img');
  };

  // Render single page
  self.renderPage = function (page) {

    $(_container).find("[data-page=" + page + "] .region").remove();
    var regionsOnPage = self.regions.getRegionsByPage(page);
    for (var i = 0; i < regionsOnPage.length; i++) {
      renderRegionOnPage(regionsOnPage[i], page);
    }

  };

  //Render single region on page
  var renderRegionOnPage = function (reg, page) {
    /* Create region html element */
    var region = self.regions.getRegion(reg, page);
    var target = (region.object == "fullpage") ? "overlay" : "_blank";
    var counter = 0;
    var multimediaObject;

    if( region.x == 0 && region.y == 0 ) {
      return;
    }

    // check if the page is the same of the region and then remove it.
    // sometimes ids of the article's regions have the same id of the multimedia regions

    $(".swiper-slide[data-page=" + page + "]").find('#' + reg + "." + region.object).remove();

    var $region = $('<div>').attr("id", reg).addClass('region').addClass(region.object);
    $region.css({
      "top": region.y + "%",
      "left": region.x + "%",
      "width": region.width + "%",
      "height": region.height + "%"
    });

    $region.data("page", page);
    $region.data("type", region.object);
    var $infoBox = $("<div class='vc-info-box'></div>");

    if (region.object == "jumppage" && region.data) {
      $region.data("pageJump", region.data.page);
      var $edition = moment(region.data.issue).format(dateFormat);
      var $jumppage = $region.data("pageJump");

      $infoBox.html(VNP.getLanguagesKey["edition"] + ": " + $edition + " <br> "+ VNP.getLanguagesKey["page"] +": <span='vc-num-page'>" + $jumppage + "</span>");
      $region.append($infoBox);
    }

    getPageElement(page).before($region);

    var iconPosition = self.regions.getRegion(reg, page).iconPosition;

    $region.attr('data-id', region.id);
    $region.attr('data-target', target);
    $region.attr('data-num', counter);
    if (region.object == "textual-article") {
      $region.attr('data-url', region.data.url);
    }

    if(region.object === "fullpage"){
      $region.attr('onclick', "window.open('"+region.data.html5+"');");
    }

    if (region.object == "jumppage") {
      var titleEdition = region.data["titleEdition"];
      var pageToJump = region.data.page;
      if (region.data.page % 2 > 0) pageToJump = pageToJump - 1;

      if (titleEdition == edition) {
        $region.attr('onclick', "VNP.Areas.Reader.swiperUi.goToSlide(parseInt(" + pageToJump + "))");
        $region.removeAttr("data-source");
      } else {
        var urlToJump = VNP.baseUrl + "/" + booksPath + "#" + pageToJump;
        $region.addClass("jumppageWindow");
        $region.attr("data-source", urlToJump);
      }
    }

    $region.append("<p class='icon-media " + self.regions.getRegion(reg, page).class + "' style='left:" + iconPosition.x + "%;top:" + iconPosition.y + "%'></p>");

    // bind click on multimedia object
    $region.on("click", function () {
      VNP.Areas.Reader.module.Multimedia.openSingleMedia(region);
    });

    counter++;
    self.unlockSwipes();
  };

  /*
   * Navigation controls
   * */
  self.goToSlide = function (slide) {
    swiper.slideTo(slide, 10, true);
  };

  self.nextSlide = function () {
    if(VNP.Areas.Reader.getActivePage() == totalPages ) return;
    swiper.slideNext();
  };

  self.prevSlide = function () {
    swiper.slidePrev();
  };

  self.firstSlide = function () {
    self.goToSlide(parseInt(0));
  };

  self.lastSlide = function () {
    self.goToSlide(totalPages);
  };

  /* Initiliazing swiper script */
  var swiper = new Swiper(_container, {
    slidesPerView       : 2,
    slidesPerGroup      : 2,
    centeredSlides      : false,
    zoom                : true,
    paginationClickable : true,
    spaceBetween        : 0,
    mousewheel          : true,
    preloadImages       : true,
    noSwiping           : false,
    hashNavigation      : {
      watchState: true
    },
    keyboard            : true,
    lazy                : false,
    runCallbacksOnInit  : true,
    navigation          : {
      nextEl: "#vc_btn_next",
      prevEl: "#vc_btn_prev"
    },
    on                  : {
      init: function () {

        // notify the user to how enable zoom
        if( VNP.Areas.Reader.getConsultationTime() > 0 || VNP.Areas.Customer.getCanRead() ) {
          var message = (VNP.getDevice().isMobile) ? VNP.getLanguagesKey["pageflip_how_zoom_mob"] : VNP.getLanguagesKey["pageflip_how_zoom_desk"];
          VNP.Areas.Reader.module.Zoom.notify(message);
        }

        // callback for load multimedia elements to render the page active
        VNP.Areas.Reader.module.Multimedia.loadMediaSwiper(edition, function (data) {
          var page = VNP.Areas.Reader.getActivePage();
          self.regions.setRegions(data);
          VNP.Areas.Reader.module.Zoom.preload();
          renderCurrentPages();

          $activePageNumber.text(page);
          $totalPages.text(totalPages);

          if (VNP.getIsMobile()) {
            // count articles and multimedia objects per page
            VNP.Areas.Reader.setTotalAmount();
          }

        }, false);

      },

      slideChangeTransitionStart: function () {
        removeRegions();
        // set active page on swiper pages
        if ( VNP.Areas.Reader.swiperPages != undefined )
          VNP.Areas.Reader.setActivePageSwiperPages(VNP.Areas.Reader.getActivePage());

        /*if (VNP.getDevice().isMobile) {
          VNP.Areas.Reader.module.Zoom.preload();
        }*/




      },

      slideChangeTransitionEnd: function () {

        VNP.Areas.Reader.setActivePage();
        var page = VNP.Areas.Reader.getActivePage();
        $activePageNumber.text(page);
        renderCurrentPages();
        triggerElementsForcedToShow(page);
        VNP.Areas.Reader.module.Zoom.preload();
        VNP.Areas.Reader.module.Multimedia.setMultimediaByPage( page );
        VNP.Areas.Reader.module.Articles.setArticlesByPage( page );

        if (VNP.getDevice().isMobile) {
          // set the amount of articles and multimedia objects
          VNP.Areas.Reader.setTotalAmount();
        }

      },
      doubleTap: function (event) {
        VNP.Areas.Reader.module.Zoom.toggle(event);
      },
      reachEnd: function(){
        this.slideTo(VNP.Areas.Reader.getTotalPages());
      },
      reachBeginning: function(){
        this.slideTo(1);
      }
    },
    breakpoints:{
      // when window width is <= 320px
    480: {
        slidesPerGroup: 1,
        slidesPerView: 1,
        initialSlide: 1,
        centeredSlides: true
      },
      // when window width is <= 480px
      481: {
        slidesPerGroup: 2,
        slidesPerView: 2,
        initialSlide: 0,
        centeredSlides: false
      },
      // when window width is <= 569px
      569: {
        slidesPerGroup: 2,
        slidesPerView: 2,
        initialSlide: 0,
        centeredSlides: false
      },
      600:{
        slidesPerGroup: 1,
        slidesPerView: 1,
        initialSlide: 1,
        centeredSlides: true
      },
      640: {
        slidesPerGroup: 2,
        slidesPerView: 2,
        initialSlide: 0,
        centeredSlides: false
      },
      731: {
        slidesPerGroup: 2,
        slidesPerView: 2,
        initialSlide: 0,
        centeredSlides: false
      },
      736: {
        slidesPerGroup: 2,
        slidesPerView: 2,
        initialSlide: 0,
        centeredSlides: false
      },
      768: {
        slidesPerGroup: 1,
        slidesPerView: 1,
        initialSlide: 1,
        centeredSlides: true
      },
      900: {
        slidesPerGroup: 2,
        slidesPerView: 2,
        initialSlide: 0,
        centeredSlides: false
      },
      1024:{
        slidesPerGroup: 2,
        slidesPerView: 2,
        initialSlide: 0,
        centeredSlides: false
      }
    }
  });

  self.destroy = function () {
    swiper.destroy(true);
  };

}