

    VNP.baseUrl      = "https://edicoladigitale.prealpina.it/sev";
    VNP.formatDate   = "dd/MM/yyyy".toUpperCase();
    VNP.setIsMobile(VNP.getDevice().isMobile);

    VNP.getLanguagesKey = {
        "requiredFileds"              : "Campi obbligatori",
        "order_details"               : "Dettaglio dell\'ordine:",
        "help_desk_title"             : "Hai bisogno di assistenza?",
        "search_title"                : " Ricerca",
        "articles"                    : "Articoli",
        "articlesTooltip"             : "",
        "no_articles"                 : "Nessun Articolo per questa pagina.",
        "favorites"                   : "Preferiti",
        "vai_pagina"                  : " Vai a Pagina",
        "cflacquista"                 : "Acquista",
        "deletePreferitiConfirm"      : "Cancella dai Preferiti: Sei sicuro?",
        "cannotDelete"                : "Questo elemento non è eliminabile",
        "preferitisuggest"            : "<h3>Non hai ancora aggiunto nessun preferito.<\/h3><p>Inizia ad utilizzare i preferiti cliccando sul pulsante Stella del tuo sfogliatore.<\/p>",
        "cflchiudis"                  : "Chiudi",
        "login_title"                 : "Login",
        "del_confirmation"            : "Sei sicuro di voler procedere? Non potrai piu\' consutare le edizioni acquistate",
        "del_confirmation_ok"         : "La tua richiesta di cancellazione e\' stata inviata",
        "modifiche_successo"          : "Grazie per avere aggiornato i tuoi dati",
        "customer_update"             : "Modifica Dati",
        "controllacampi"              : " Controlla di aver completato tutti i campi obbligatori e prova ancora.<br />",
        "cflemailfr11"                : "Per proseguire &egrave; necessario scegliere le modalit&agrave; del trattamento dei propri dati personali ",
        "privacypolicy"               : "Privacy policy",
        "cflcleggitermsandconditions" : "Termini e condizioni",
        "count_down_time_plural"      : "secondi",
        "count_down_time_singular"    : "secondo",
        "pageflip_favorites_to_add"   : "Clicca la pagina per salvarla nei preferiti",
        "pageflip_pdf_to_open"        : "Clicca la pagina che desideri scaricare",
        "pageflip_exit_zoom_desk"     : "Premi ESC per uscire",
        "pageflip_exit_zoom_mob"      : "Doppio tap per uscire",
        "pageflip_how_zoom_desk"      : "Doppio click per zoom",
        "pageflip_how_zoom_mob"       : "Doppio tap per zoom",
        "msg_pdfDownload_confirm"     : "HO COMPRESO",
        "msg_pdfDownload_reject"      : "NON HO COMPRESO",
        "msg_pdfDownload"             : "Gentile cliente ti ricordiamo che stai per effettuare il download di una rivista soggetta a copyright e che l\'uso che ne farai dovrà essere strettamente personale e che ne è vietata la diffusione senza la preventiva autorizzazione dell\'editore. Grazie per la collaborazione",
        "msg_pdfDownloadTitle"        : "Download PDF",
        "msg_pdfDownloadTitle_header" : "Download pdf",
        "faq_title"                   : "On-line Help",
        "order_business_voucher"      : "Business Voucher",
        "order_gift_voucher"          : "Gift Voucher",
        "change_password"             : " Cambia password",
        "wall_zoom_denied_title"      : "Zoom disabilitato",
        "wall_zoom_denied_text"       : "Gentile lettore, non è possibile visualizzare questa pagina in modalità Ultrazoom. Per procedere è necessario acquistare questa edizione o accedere allo shop e valutare le nostre soluzioni di abbonamento.",
        "wall_zoom_denied_btn"        : "Ho capito",
        "alert_credit_message"        : "Puoi usare <strong>1<\/strong> delle tue <strong>Copie<\/strong> per sfogliare questa edizione e consultarla in qualsiasi momento.",
        "alert_credit_usecredit"      : "Attiva",
        "reader_share_title"          : "Condividi...",
        "allTopics"                   : "Tutti i temi",
        "archive.change.section"      : "Change section",
        "rssPopupTitle"               : "Ultim'ora",
        "edition"                     : "Edizione",
        "page"                        : "Pagina",
        "reader.jumpPage.goto"        : "Go to:",
        "login.error.required"        : "Campi obbligatori",
        "login.error.email_invalid"   : "Inserire indirizzo email valido",
        "login.error.password"        : "Password non corretta"
    };

        var hasAccess_label = "preview";
       // VNP.Areas.Customer.setCanRead(true);


    /*
    * set global var for stats.js
    * */
    var EDITION_LABEL = "";
    var UA = 'UA-24094400-1';
    var TITLE_NAME = "";
    var TITLE_TYPE = "";




        VNP.setPlatform("virtualnewspaper");

         VNP.Areas.Reader.verticalSummary = "";

            VNP.Areas.Reader.setConsultationTime(10);


    

        /* global var for stats.js */
        TITLE_NAME = "La Prealpina";
        EDITION_LABEL = "03/05/2022";
        /* end */

        VNP.editionDate = '20220503';
        VNP.editionDateFourDigit = '20220503';
        VNP.setTitleType("virtualnewspaper"); // type of platform for the title selected
        VNP.setTitle('laprealpina');
        VNP.setEdition('20220503laprealpina');
        VNP.Areas.Reader.setBooksPath('/books/laprealpina/2022/20220503laprealpina/');
        VNP.Areas.Reader.setTotalPages(48);

        VNP.Areas.Reader.setMaxPageToZoom(3);


    VNP.init();

