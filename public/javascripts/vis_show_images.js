/*
 * @Author: Rui Li
 * @Date: 2020-02-22 22:37:33
 * @LastEditTime: 2020-07-04 12:56:14
 * @Description: 
 * @FilePath: /VisImageNavigator.github.io/public/javascripts/vis_show_images.js
 */

//global variables
// confDic = {
//     'Vis': '#FBAF3F',
//     'InfoVis': '#EF4036',
//     'SciVis': '#1B75BB',
//     'VAST': '#38B449'
// }

var imgDataDic = {};

var gIndex = -1;

var paperImgData = []; //when show papers, push all image data into this array
var imgPerPagePaper = 0; //number of images in each page, under paper mode.

var unicycle;
var slider_img_size = 100;


/**
 * present the image in the page
 * @param imgData: the image dataset
 * @param showAnnotation: if show the value of sorted images
 * @param sortedKey: sorted column name
 * @param imgSize: the size of image
 * @param currentPage: current page
 */
function presentImg(imgData, showAnnotation, sortedKey = 0, imgSize = 1, currentPage) {
    //console.log(imgData);
    d3.selectAll(".image-div").remove();
    d3.selectAll(".paper-div").remove();
    d3.selectAll(".card").remove();
    d3.selectAll(".card-credit").remove();
    $('#pagination').css('display', 'block');
    scrollTo(0, 0);


    //convert data to json format
    imgDataDic = {};
    imgData.forEach((d, i) => {
        let imgID = d['imageID'];
        imgDataDic[imgID] = d;
    });

    //set default height
    var img_size = 94;

    //show the images
    for (let i = 0; i < imgData.length; i++) {
        let img_thumburl = imgData[i].url;
        //console.log(img_thumburl);
        if (img_thumburl != "") {
            let imageID = imgData[i].imageID;
            let img_width = imgData[i].sizeW;
            let img_height = imgData[i].sizeH;
            let asp = img_width / img_height; //aspect ratio
            let div_width = asp * img_size;
            let actual_width = div_width;
            let conf = imgData[i]['Conference'];
            var sorted_score = null;
            if (showAnnotation == 1) {
                sorted_score = parseFloat(data[i].score).toFixed(2);
            }
            var image_div = document.createElement("div");
            image_div.className = "image-div";
            //box-shadow: inset 0px 0px 0px 1px ${confDic[conf]};
            image_div.innerHTML = `
            <div class="img-panel image-grid" id="img-grid-${i}-${imageID}" 
            style="border: solid 3px ${confDic[conf]}; width:${div_width}px; ">
                <div class="image-a" id="thumb${i}">
                    <img class="vis-img" id="img-thumb-${i}-${imageID}" style="width:${actual_width}px; height:${img_size}px" src = ${img_thumburl} alt="">
                </div>
            </div>  
            `;
            document.getElementById("image-gallery").appendChild(image_div);
        }

    }



    //show the thumbnail
    var modal = document.getElementById('myModal');
    var modalImg = document.getElementById("ori-img");
    var paper_info = document.getElementById("paper-info");
    var author_info = document.getElementById("author-info");
    var link_info = document.getElementById("link-info");
    var year_info = document.getElementById("year-info");
    var type_info = document.getElementById("paper-type-info");
    var keyword_info = document.getElementById("keyword-info");
    var imagename_info = document.getElementById('imagename-info');
    $('.image-a').click(function(e) {
        var id = this.id.slice(5);
        gIndex = parseInt(id);
        modal.style.display = "block";
        modalImg.src = imgData[id].url;
        //determine the style of the vis-image
        let imageWidth = parseInt(imgData[id].sizeW);
        let imageHeight = parseInt(imgData[id].sizeH);
        //console.log(imageWidth, imageHeight);
        if (imageWidth >= imageHeight) {
            $('#ori-img').attr('class', 'origin-img');
            //compute the max width it can be
            let asp = imageWidth / imageHeight;
            let max_width = 600 * asp;
            $("#ori-img").css("max-width", max_width);
        } else {
            $('#ori-img').attr('class', 'origin-img-tall');
        }
        paper_info.innerHTML = imgData[id]['Paper Title'];
        author_info.innerHTML = imgData[id]['Author'].replace(/;/g, '; ');
        link_info.href = imgData[id]['paper_url'];
        link_info.innerHTML = imgData[id]['paper_url'].toString();
        year_info.innerHTML = imgData[id]['Year'];
        type_info.innerHTML = imgData[id]['Paper type'];
        let urlArr = imgData[id].url.split('/');
        imagename_info.innerHTML = urlArr[urlArr.length - 1];
        //set email content
        let oriImageName = urlArr[urlArr.length - 1].toString();
        let email_text = "mailto:chen.8028@osu.edu?subject=" +
            "VisImageNavigator: Update " + oriImageName + "&body=Dear Jian,%0D%0A%0D%0AMay I request to update the image file " +
            oriImageName + " please?%0D%0A%0D%0A best regards,%0D%0A"
        $("#email-btn").attr("href", email_text);
        //console.log(imgData[id]['Keywords Author'].replace(/,/g, '; ') == "");
        if (checkEmptyString(imgData[id]['Keywords Author'])) {
            $("#keyword-info").css("color", "#99a6ad");
            keyword_info.innerHTML = "none supplied";
        } else {
            $("#keyword-info").css("color", "#eeeeee");
            keyword_info.innerHTML = imgData[id]['Keywords Author'].replace(/,/g, '; ');
        }

        //previous and next button
        $('#modal-previous').unbind('click').click(function() {});
        $("#modal-previous").click(async function() {
            if (gIndex >= 1) {
                gIndex = gIndex - 1;
                updateModalImage();
            }
        });
        $('#modal-next').unbind('click').click(function() {});
        $("#modal-next").click(async function() {
            if (gIndex < img_per_page - 1) {
                gIndex = gIndex + 1;
                updateModalImage();
            }
        });

    });

    //update the modal image based on the id
    var updateModalImage = function() {
        modal.style.display = "block";
        modalImg.src = imgData[gIndex].url;
        //determine the style of the vis-image
        let imageWidth = parseInt(imgData[gIndex].sizeW);
        let imageHeight = parseInt(imgData[gIndex].sizeH);
        //console.log(imageWidth, imageHeight);
        if (imageWidth >= imageHeight) {
            $('#ori-img').attr('class', 'origin-img');
            //compute the max width it can be
            let asp = imageWidth / imageHeight;
            let max_width = 600 * asp;
            $("#ori-img").css("max-width", max_width);
        } else {
            $('#ori-img').attr('class', 'origin-img-tall');
        }
        paper_info.innerHTML = imgData[gIndex]['Paper Title'];
        author_info.innerHTML = imgData[gIndex]['Author'].replace(/;/g, '; ');
        link_info.href = imgData[gIndex]['paper_url'];
        link_info.innerHTML = imgData[gIndex]['paper_url'];
        year_info.innerHTML = imgData[gIndex]['Year'];
        type_info.innerHTML = imgData[gIndex]['Paper type'];
        let urlArr = imgData[gIndex].url.split('/');
        let oriImageName = urlArr[urlArr.length - 1].toString();
        imagename_info.innerHTML = urlArr[urlArr.length - 1];
        let email_text = "mailto:chen.8028@osu.edu?subject=" +
            "VisImageNavigator: Update " + oriImageName + "&body=Dear Jian,%0D%0A%0D%0AMay I request to update the image file " +
            oriImageName + " please?%0D%0A%0D%0A best regards,%0D%0A"
        $("#email-btn").attr("href", email_text);
        //console.log(imgData[id]['Keywords Author'].replace(/,/g, '; ') == "");
        if (checkEmptyString(imgData[gIndex]['Keywords Author'])) {
            $("#keyword-info").css("color", "#99a6ad");
            keyword_info.innerHTML = "none supplied";
        } else {
            $("#keyword-info").css("color", "#eeeeee");
            keyword_info.innerHTML = imgData[gIndex]['Keywords Author'].replace(/,/g, '; ');
        }

        //previous and next button
        $('#modal-previous').unbind('click').click(function() {});
        $("#modal-previous").click(async function() {
            if (gIndex >= 1) {
                gIndex = gIndex - 1;
                updateModalImage();
            }
        });
        $('#modal-next').unbind('click').click(function() {});
        $("#modal-next").click(async function() {
            if (gIndex < img_per_page - 1) {
                gIndex = gIndex + 1;
                updateModalImage();
            }
        });
    }

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        modal.style.display = "none";
    }

    // Change the image size as the range slider changes
    $(document).on('input', '#image-size-slider', function() {
        let size = $(this).val() * 4;
        slider_img_size = size;
        $(".img-panel").css("height", size + 'px');
        $(".img-panel").each(function() {
            //according to the id to determine the width of the div and the image
            let divID = $(this).attr("id");

            let imageID = $(this).attr("id").split('-')[3];
            //console.log($(this).attr("id"));
            let imageIDprefix = $(this).attr("id").slice(9);
            let img_width = imgDataDic[imageID].sizeW;
            let img_height = imgDataDic[imageID].sizeH;
            let asp = img_width / img_height; //aspect ratio
            let adjust_width = asp * size;
            let actual_width = adjust_width - 6;
            let actual_height = size - 6;
            $("#" + divID).css("width", adjust_width + 'px');
            $("#img-thumb-" + imageIDprefix).css("width", actual_width + 'px');
            $("#img-thumb-" + imageIDprefix).css("height", actual_height + 'px');
        });

    });
    //show year scent
    showYearScent();

    //rescale all images
    $(".img-panel").css("height", slider_img_size + 'px');
    $(".img-panel").each(function() {
        //according to the id to determine the width of the div and the image
        let divID = $(this).attr("id");
        let imageID = $(this).attr("id").split('-')[3];
        //console.log($(this).attr("id"));
        let imageIDprefix = $(this).attr("id").slice(9);
        let img_width = imgDataDic[imageID].sizeW;
        let img_height = imgDataDic[imageID].sizeH;
        let asp = img_width / img_height; //aspect ratio
        let adjust_width = asp * slider_img_size;
        let actual_width = adjust_width - 6;
        let actual_height = slider_img_size - 6;
        $("#" + divID).css("width", adjust_width + 'px');
        $("#img-thumb-" + imageIDprefix).css("width", actual_width + 'px');
        $("#img-thumb-" + imageIDprefix).css("height", actual_height + 'px');
    });


    $(window).resize(function() {
        showYearScent();
    });

}

/**
 * create the paperCard
 * lazy loading: https://web.dev/browser-level-image-lazy-loading/
 * @param {*} paperData 
 * @param {*} totalCount 
 */
function presentPaperCards(paperData, totalCount) {

    d3.selectAll(".paper-div").remove();
    d3.selectAll(".image-div").remove();

    d3.selectAll(".card").remove();
    d3.selectAll(".card-credit").remove();
    $('#pagination').css('display', 'none');
    $('#totalPageText').text(totalCount + ' paper(s) in total');
    $('#timeline-div').css('display', 'block');
    dragTimeLine();

    //debug_mode = 1: only keep 5 years
    //2: only keep first 10 papers
    var DEBUG_MODE = 5;

    if (DEBUG_MODE == 1) {
        Object.keys(paperData).forEach((year) => {
            if (parseInt(year) != 1995) {
                delete paperData[year];
            }
        })
    } else if (DEBUG_MODE == 2) {
        Object.keys(paperData).forEach((year) => {
            paperData[year] = paperData[year].slice(0, 5);
        })
    } else if (DEBUG_MODE == 3) {
        Object.keys(paperData).forEach((year) => {
            if (year <= 2016) {
                delete paperData[year];
            }
        })
    } else if (DEBUG_MODE == 4) {
        console.log(1);
        Object.keys(paperData).forEach((year) => {
            year = parseInt(year);
            if ([1990, 1995, 2000, 2005, 2010, 2015, 2019].includes(year) == false) {
                delete paperData[year];
            }
        })
    }


    console.log(paperData);

    let years = Object.keys(paperData);

    //add sharing button (only used for server version)
    // var sharing_div = document.createElement("div");
    // sharing_div.className = "sharing";
    // sharing_div.innerHTML = `

    // `;
    // document.getElementById("timeline-div").appendChild(sharing_div);
    // $('#capture-papercard').unbind('click').click(function() {});
    // $("#capture-papercard").click(function() {

    //     html2canvas(document.querySelector("#timeline-container"), { allowTaint: true }).then(canvas => {
    //         //document.body.appendChild(canvas)
    //         canvas.toBlob(function(blob) {
    //             saveAs(blob, "Dashboard.png");
    //         });
    //     });

    //     // html2canvas($("#horizontal-timeline-div"), {
    //     //     onrendered: function(canvas) {
    //     //         theCanvas = canvas;
    //     // canvas.toBlob(function(blob) {
    //     //     saveAs(blob, "Dashboard.png");
    //     // });
    //     //     }
    //     // });
    // });


    years.forEach((year) => {

        //console.log(year);

        //determine how many conferences in each year
        let conferences = paperData[year].map(item => item.Conference)
            .filter((value, index, self) => self.indexOf(value) === index);

        //console.log(conferences);

        //step 1: for each year, create the card box
        var card_div = document.createElement("div");
        card_div.className = "card";
        card_div.id = "card-" + year;
        card_div.innerHTML = `
    <div class="card-title">&nbsp;${year}</div>
    <div class="papercard-body">
        <div class="card-pointer">
            <button role="button" id="card-toggle-btn-${year}" class="btn-year-toggle" data-toggle="collapse" data-target="#card-content-${year}"></button>
        </div>
        <!-- the width of this div should be determined by the number of conference-->
        <div id="card-content-${year}" class="card-content card-collapse in show width">

        </div>
    </div>
    `;
        document.getElementById("timeline-container").appendChild(card_div);

        for (let i = 1990; i < 2021; i++) {
            if (timelineStatus[year] == 1) {
                $("#card-content-" + year).collapse('hide');
            }
        }

        //register the event for card collapse button, record which year has been collapsed
        $('.btn-year-toggle').unbind('click').click(function() {});
        $(".btn-year-toggle").click(function() {
            let year = this.id.slice(16);
            if ($("#card-content-" + year).hasClass('show') == true) {
                timelineStatus[year] = 1; //after clicking, this going to be the collapsed one
            } else {
                timelineStatus[year] = 0; //after clicking, this going to be the collapsed one
            }
        });

        //step 2: determine how many conferences in each year, create n columns
        //set the width of card-content
        let width = conferences.length * 102 + 2;
        //console.log(conferences.length, width);
        $("#card-content-" + year).css("width", width + "px");
        conferences.forEach((conf) => {
            var conf_div = document.createElement("div");

            conf_div.id = conf + "-" + year;
            if (conf == "Vis") {
                conf_div.className = "conf-div conf-div-Vis";
            } else if (conf == "SciVis") {
                conf_div.className = "conf-div conf-div-SciVis";
            } else if (conf == "InfoVis") {
                conf_div.className = "conf-div conf-div-InfoVis";
            } else if (conf == "VAST") {
                conf_div.className = "conf-div conf-div-VAST";
            }

            conf_div.innerHTML = `
        <div class="conf-div-title">${conf}</div>
        `;

            document.getElementById("card-content-" + year).appendChild(conf_div);
        })

        //step 3: add paper cards
        paperData[year].forEach((paper, i) => {
            //console.log(paper);
            let conf = paper['Conference'];
            var doi = paper['Paper DOI'].replace('/', '-');
            let title = paper['Paper Title'];
            let author = paper['Author'].replace(/;/g, '; ');
            let year = paper['Year'];
            let url = paper['paper_url'];
            doi = doi.replaceAll('.', '-');

            //step 4: for each paper, create a paper card box
            var paper_div = document.createElement("div");
            paper_div.className = "papercard-div row";
            paper_div.id = "papercard-div-" + doi;
            paper_div.innerHTML = `
            <p class="cardtooltiptext">${title}<br>${author},&nbsp;${year}
            </p>
            `;
            document.getElementById(conf + "-" + year).appendChild(paper_div);

            //add click event
            paper_div.addEventListener("click", () => {
                window.open(url);
            });


            //step 5: add figures into the box
            let imgData = paper['Figures'];
            //determine the height of paper div
            // let height = Math.ceil(imgData.length / 2) * 20;
            // $("#papercard-div-" + doi).css("height", height + "px");
            let cardImageSize = 20;
            // console.log(imgData, height);
            for (let i = 0; i < imgData.length; i++) {
                if ((imgData[i]['paperImageName'] != 'N/A') && (imgData[i]['url'] != "")) {
                    if (parseInt(imgData[i]['vis_type']) == 19 || parseInt(imgData[i]['vis_type']) == 18) {
                        cardImageSize = 10;
                    } else {
                        cardImageSize = 20;
                    }
                    paperImgData.push(imgData[i]);
                    let img_thumburl = imgData[i].thumb_url;
                    let imageID = imgData[i].imageID;
                    let img_width = imgData[i].sizeW;
                    let img_height = imgData[i].sizeH;
                    let asp = img_width / img_height; //aspect ratio
                    //console.log(img_width, asp);
                    let div_width = asp * cardImageSize;
                    if (div_width > 94) {
                        div_width = 94;
                    }
                    let actual_width = div_width - 2;
                    let conf = imgData[i]['Conference'];
                    let image_div = document.createElement("div");
                    image_div.className = "card-image-div";

                    //box-shadow: inset 0px 0px 0px 1px ${confDic[conf]};
                    image_div.innerHTML = `
        <div class="card-img-panel card-image-grid" id="img-grid-${imageID}" 
        style="border: solid 0px ${confDic[conf]}; width:${div_width}px; ">
            <div class="image-a" id="thumb${i}">
                <img class="card-vis-img" loading="lazy"  id="img-thumb-${imageID}" style="width:${actual_width}px; height:${cardImageSize - 2}px" src = ${img_thumburl} alt="">
            </div>
        </div>  

        `;
                    //console.log("p-"+paperIndex);
                    document.getElementById("papercard-div-" + doi).appendChild(image_div);

                }
            }
        })


        //show year scent
        showYearScent();

        $(window).resize(function() {
            showYearScent();
        });

    })

    //step 4: add credit information
    // var credit_div = document.createElement("div");
    // credit_div.className = "card-credit inline";
    // credit_div.innerHTML = `
    //     Have you tried VIN?
    //     <img class="QRCode" src="public/images/QRcode.png" />
    // `;
    // document.getElementById("timeline-container").appendChild(credit_div);




}


/**
 * show paper data
 * @param {} paperData 
 */
function presentUPPapers(paperData, totalCount) {
    d3.selectAll(".paper-div").remove();
    d3.selectAll(".image-div").remove();
    d3.selectAll(".card").remove();
    d3.selectAll(".card-credit").remove();
    $('#pagination').css('display', 'block');
    $('#totalPageText').text(totalCount + ' paper(s) in total');

    scrollTo(0, 0);

    //convert data to json format
    imgDataDic = {};
    paperData.forEach((d, i) => {
        //console.log(d);
        let figures = d['Figures'];
        figures.forEach((image, j) => {
            let imgID = image['imageID'];
            imgDataDic[imgID] = image;
        })
    });

    //set default height
    var img_size = 100;
    var img_count = 0;
    paperImgData = [];
    for (let paperIndex = 0; paperIndex < paperData.length; paperIndex++) {
        let paperTitle = paperData[paperIndex]['Paper Title'];
        let keywords = paperData[paperIndex]['Keywords Author'];
        let paperUrl = paperData[paperIndex]['paper_url'];
        let author = paperData[paperIndex]['Author'];
        let conf = paperData[paperIndex]['Conference'];
        let doi = paperData[paperIndex]['Paper DOI'];
        let year = paperData[paperIndex]['Year'];
        let firstPage = paperData[paperIndex]['Paper FirstPage'];
        if (firstPage == 6666) {
            firstPage = "";
        }
        let lastPage = paperData[paperIndex]['Paper LastPage'];
        let paper_div_id = 'p-' + paperIndex;
        var paper_div = document.createElement("div");
        paper_div.className = "paper-div";
        /**
         * <span class='paperAuthors'>Year: ${year}, Conference: ${conf}, Page(s): ${firstPage}-${lastPage}</span>
            <span class='paperAuthors'>Author(s): ${author}</span>
         */
        let keywordsClass = 'keywords-1';
        if (checkEmptyString(keywords)) {
            keywords = 'none supplied';
            keywordsClass = 'keywords-0';
        }
        let sharePosLeft = $(window).width() / 2 - 320;
        let sharePosTop = $(window).height() / 2 - 240;
        let broadcastText = encodeURIComponent("Have you tried VIN? ") + encodeURIComponent('https://visimagenavigator.github.io/');
        let shareText = encodeURIComponent(paperTitle) + '&amp;url=' + encodeURIComponent(paperUrl) + '%0A%0A' + broadcastText;
        //console.log(shareText);
        let shareUrl = encodeURIComponent(paperTitle) + encodeURIComponent('\n') + encodeURIComponent(paperUrl) + encodeURIComponent("\n\nHave you tried VIN? ") + encodeURIComponent('https://visimagenavigator.github.io/');
        let email_text = "mailto:?subject=" +
            paperTitle + "&body=" + shareUrl;
        /*
        <img src="public/images/brick.png" class="cite-icon" id="cite-${doi}" data-toggle="tooltip"
                data-html="true" title="Citation">
                <img src="public/images/list.png" class="cite-icon" id="ref-${doi}" data-toggle="tooltip"
                data-html="true" title="Reference">
        */
        paper_div.innerHTML = `
        <div class='paper-panel row' id=${paper_div_id}>
            <div class="col-md-10" style="padding-top:8px; padding-left:5px !important; text-align:left;">
                <a href=${paperUrl} target="_blank" class='paperTitle'>${paperTitle}</a>
            </div>
            <div class="col-md-2" style="padding-top:8px; text-align:right;">   
                
                
            
                <!-- Sharingbutton Twitter -->
                <a class="resp-sharing-button__link"
                    href="https://twitter.com/intent/tweet/?text=${shareText}"
                    target="_blank" rel="noopener" aria-label="" onclick="window.open(this.href,'targetWindow','toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=640,height=480,left=${sharePosLeft},top=${sharePosTop}'); return false;">
                    <div
                        class="resp-sharing-button resp-sharing-button--twitter resp-sharing-button--small">
                        <div aria-hidden="true"
                            class="resp-sharing-button__icon resp-sharing-button__icon--solid">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path
                                    d="M23.44 4.83c-.8.37-1.5.38-2.22.02.93-.56.98-.96 1.32-2.02-.88.52-1.86.9-2.9 1.1-.82-.88-2-1.43-3.3-1.43-2.5 0-4.55 2.04-4.55 4.54 0 .36.03.7.1 1.04-3.77-.2-7.12-2-9.36-4.75-.4.67-.6 1.45-.6 2.3 0 1.56.8 2.95 2 3.77-.74-.03-1.44-.23-2.05-.57v.06c0 2.2 1.56 4.03 3.64 4.44-.67.2-1.37.2-2.06.08.58 1.8 2.26 3.12 4.25 3.16C5.78 18.1 3.37 18.74 1 18.46c2 1.3 4.4 2.04 6.97 2.04 8.35 0 12.92-6.92 12.92-12.93 0-.2 0-.4-.02-.6.9-.63 1.96-1.22 2.56-2.14z" />
                                </svg>
                        </div>
                    </div>
                </a>
                <!-- Sharingbutton Facebook -->
                <a class="resp-sharing-button__link" href="https://facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" rel="noopener" aria-label="" onclick="window.open(this.href,'targetWindow','toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=640,height=480,left=${sharePosLeft},top=${sharePosTop}'); return false;">
                <div class="resp-sharing-button resp-sharing-button--facebook resp-sharing-button--small"><div aria-hidden="true" class="resp-sharing-button__icon resp-sharing-button__icon--solid">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/></svg>
                    </div>
                </div>
                </a>
                <!-- Sharing through email -->
                <a class="resp-sharing-button__link" href="${email_text}" target="_blank" rel="noopener" aria-label="">
                <div class="resp-sharing-button resp-sharing-button--facebook resp-sharing-button--small"><div aria-hidden="true" class="resp-sharing-button__icon resp-sharing-button__icon--solid">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="1 2 18 18"><path d="M16.999,4.975L16.999,4.975C16.999,4.975,16.999,4.975,16.999,4.975c-0.419-0.4-0.979-0.654-1.604-0.654H4.606c-0.584,0-1.104,0.236-1.514,0.593C3.076,4.928,3.05,4.925,3.037,4.943C3.034,4.945,3.035,4.95,3.032,4.953C2.574,5.379,2.276,5.975,2.276,6.649v6.702c0,1.285,1.045,2.329,2.33,2.329h10.79c1.285,0,2.328-1.044,2.328-2.329V6.649C17.724,5.989,17.441,5.399,16.999,4.975z M15.396,5.356c0.098,0,0.183,0.035,0.273,0.055l-5.668,4.735L4.382,5.401c0.075-0.014,0.145-0.045,0.224-0.045H15.396z M16.688,13.351c0,0.712-0.581,1.294-1.293,1.294H4.606c-0.714,0-1.294-0.582-1.294-1.294V6.649c0-0.235,0.081-0.445,0.192-0.636l6.162,5.205c0.096,0.081,0.215,0.122,0.334,0.122c0.118,0,0.235-0.041,0.333-0.12l6.189-5.171c0.099,0.181,0.168,0.38,0.168,0.6V13.351z"></path></svg>
                    </div>
                </div>
                </a>
            </div>
            <span class='paperAuthors' style="text-align:left;">${author.replace(/;/g, '; ')}, ${firstPage}-${lastPage}, ${conf}, ${year}</span>
            <span class='paperKeywords' style="text-align:left;">Keyword(s): <label  class='${keywordsClass}'>${keywords.replace(/,/g, '; ')}</label></span>
        </div>
        `;
        document.getElementById("image-gallery").appendChild(paper_div);
        let imgData = paperData[paperIndex]['Figures'];
        for (let i = 0; i < imgData.length; i++) {
            if (imgData[i]['paperImageName'] != 'N/A' && imgData[i]['url'] != "") {
                paperImgData.push(imgData[i]);
                let img_thumburl = imgData[i].url;

                let imageID = imgData[i].imageID;
                let img_width = imgData[i].img_width;
                let img_height = imgData[i].img_height;
                let asp = img_width / img_height; //aspect ratio
                let div_width = asp * img_size;
                let actual_width = div_width - 6;
                let conf = imgData[i]['Conference'];
                let image_div = document.createElement("div");
                image_div.className = "image-div";

                //box-shadow: inset 0px 0px 0px 1px ${confDic[conf]};
                image_div.innerHTML = `
            <div class="img-panel image-grid" id="img-grid-${img_count}-${imageID}" 
            style="border: solid 3px ${confDic[conf]}; width:${div_width}px; ">
                <div class="image-a" id="thumb${i}">
                    <img class="vis-img" id="img-thumb-${img_count}-${imageID}" style="width:${actual_width}px; height:${img_size - 6}px" src = ${img_thumburl} alt="">
                </div>
            </div>  
            `;
                img_count = img_count + 1;
                //console.log("p-"+paperIndex);
                document.getElementById("p-" + paperIndex).appendChild(image_div);
            } else {
                let image_div = document.createElement("div");
                image_div.innerHTML = `<span class='paperKeywords'>N/A</span>`;
                document.getElementById("p-" + paperIndex).appendChild(image_div);
            }

        }
        imgPerPagePaper = img_count;
    }

    // Change the image size as the range slider changes
    $(document).on('input', '#image-size-slider', function() {
        let size = $(this).val() * 4;
        slider_img_size = size;
        $(".img-panel").css("height", size + 'px');
        $(".img-panel").each(function() {
            //according to the id to determine the width of the div and the image
            let divID = $(this).attr("id");
            let imageID = $(this).attr("id").split('-')[3];
            let imageIDprefix = $(this).attr("id").slice(9);
            //console.log(imageIDprefix);
            let img_width = imgDataDic[imageID].sizeW;
            let img_height = imgDataDic[imageID].sizeH;
            let asp = img_width / img_height; //aspect ratio
            let adjust_width = asp * size;
            let actual_width = adjust_width - 6;
            let actual_height = size - 6;
            $("#" + divID).css("width", adjust_width + 'px');
            $("#img-thumb-" + imageIDprefix).css("width", actual_width + 'px');
            $("#img-thumb-" + imageIDprefix).css("height", actual_height + 'px');
        });

    });


    // //show the citation
    // $('.cite-icon').unbind('click').click(function () { });
    // $(".cite-icon").click(function () {
    //     let doi = this.id.slice(5);
    //     console.log(doi);
    // });

    //show the thumbnail
    var modal = document.getElementById('myModal');
    var modalImg = document.getElementById("ori-img");
    var paper_info = document.getElementById("paper-info");
    var author_info = document.getElementById("author-info");
    var link_info = document.getElementById("link-info");
    var year_info = document.getElementById("year-info");
    var type_info = document.getElementById("paper-type-info");
    var keyword_info = document.getElementById("keyword-info");
    var imagename_info = document.getElementById('imagename-info')
    $('.vis-img').click(function(e) {
        var id = this.id.split('-')[3];
        let currentIndex = this.id.split('-')[2];
        gIndex = parseInt(currentIndex);
        modal.style.display = "block";
        let imageWidth = parseInt(imgDataDic[id].sizeW);
        let imageHeight = parseInt(imgDataDic[id].sizeH);
        //console.log(imageWidth, imageHeight);
        if (imageWidth >= imageHeight) {
            $('#ori-img').attr('class', 'origin-img');
            //compute the max width it can be
            let asp = imageWidth / imageHeight;
            let max_width = 600 * asp;
            $("#ori-img").css("max-width", max_width);
        } else {
            $('#ori-img').attr('class', 'origin-img-tall');
        }
        modalImg.src = imgDataDic[id].url;
        paper_info.innerHTML = imgDataDic[id]['Paper Title'];
        author_info.innerHTML = imgDataDic[id]['Author'].replace(/;/g, '; ');
        link_info.href = imgDataDic[id]['paper_url'];
        link_info.innerHTML = imgDataDic[id]['paper_url'];
        year_info.innerHTML = imgDataDic[id]['Year'];
        type_info.innerHTML = imgDataDic[id]['Paper type'];
        let urlArr = imgDataDic[id].url.split('/');
        imagename_info.innerHTML = urlArr[urlArr.length - 1];
        let oriImageName = urlArr[urlArr.length - 1].toString();
        //set email content
        let email_text = "mailto:chen.8028@osu.edu?subject=" +
            "VisImageNavigator: Update " + oriImageName + "&body=Dear Jian,%0D%0A%0D%0AMay I request to update the image file " +
            oriImageName + " please?%0D%0A%0D%0A best regards,%0D%0A"
        $("#email-btn").attr("href", email_text);
        if (checkEmptyString(imgDataDic[id]['Keywords Author'])) {
            $("#keyword-info").css("color", "#99a6ad");
            keyword_info.innerHTML = "none supplied";
        } else {
            $("#keyword-info").css("color", "#eeeeee");
            keyword_info.innerHTML = imgDataDic[id]['Keywords Author'].replace(/,/g, '; ');
        }

        //previous and next button
        $('#modal-previous').unbind('click').click(function() {});
        $("#modal-previous").click(async function() {
            if (gIndex >= 1) {
                gIndex = gIndex - 1;
                updateModalImage();
            }
        });
        $('#modal-next').unbind('click').click(function() {});
        $("#modal-next").click(async function() {
            if (gIndex < imgPerPagePaper - 1) {
                gIndex = gIndex + 1;
                updateModalImage();
            }
        });
    });


    //update the modal image based on the id
    var updateModalImage = function() {
        modal.style.display = "block";
        modalImg.src = paperImgData[gIndex].url;
        //determine the style of the vis-image
        let imageWidth = parseInt(paperImgData[gIndex].sizeW);
        let imageHeight = parseInt(paperImgData[gIndex].sizeH);
        //console.log(imageWidth, imageHeight);
        if (imageWidth >= imageHeight) {
            $('#ori-img').attr('class', 'origin-img');
            //compute the max width it can be
            let asp = imageWidth / imageHeight;
            let max_width = 600 * asp;
            $("#ori-img").css("max-width", max_width);
        } else {
            $('#ori-img').attr('class', 'origin-img-tall');
        }
        paper_info.innerHTML = paperImgData[gIndex]['Paper Title'];
        author_info.innerHTML = paperImgData[gIndex]['Author'].replace(/;/g, '; ');
        link_info.href = paperImgData[gIndex]['paper_url'];
        link_info.innerHTML = paperImgData[gIndex]['paper_url'];
        year_info.innerHTML = paperImgData[gIndex]['Year'];
        type_info.innerHTML = paperImgData[gIndex]['Paper type'];
        let urlArr = paperImgData[gIndex].url.split('/');
        imagename_info.innerHTML = urlArr[urlArr.length - 1];
        let oriImageName = urlArr[urlArr.length - 1].toString();
        let email_text = "mailto:chen.8028@osu.edu?subject=" +
            "VisImageNavigator: Update " + oriImageName + "&body=Dear Jian,%0D%0A%0D%0AMay I request to update the image file " +
            oriImageName + " please?%0D%0A%0D%0A best regards,%0D%0A"
        $("#email-btn").attr("href", email_text);
        //console.log(imgData[id]['Keywords Author'].replace(/,/g, '; ') == "");
        if (checkEmptyString(paperImgData[gIndex]['Keywords Author'])) {
            $("#keyword-info").css("color", "#99a6ad");
            keyword_info.innerHTML = "none supplied";
        } else {
            $("#keyword-info").css("color", "#eeeeee");
            keyword_info.innerHTML = paperImgData[gIndex]['Keywords Author'].replace(/,/g, '; ');
        }

        //previous and next button
        $('#modal-previous').unbind('click').click(function() {});
        $("#modal-previous").click(async function() {
            if (gIndex >= 1) {
                gIndex = gIndex - 1;
                updateModalImage();
            }
        });
        $('#modal-next').unbind('click').click(function() {});
        $("#modal-next").click(async function() {
            if (gIndex < imgPerPagePaper - 1) {
                gIndex = gIndex + 1;
                updateModalImage();
            }
        });
    }

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        modal.style.display = "none";
    }


    //show year scent
    showYearScent();

    $(window).resize(function() {
        showYearScent();
    });

    //rescale all images
    $(".img-panel").css("height", slider_img_size + 'px');
    $(".img-panel").each(function() {
        //according to the id to determine the width of the div and the image
        let divID = $(this).attr("id");
        let imageID = $(this).attr("id").split('-')[3];
        let imageIDprefix = $(this).attr("id").slice(9);
        //console.log(imageIDprefix);
        let img_width = imgDataDic[imageID].sizeW;
        let img_height = imgDataDic[imageID].sizeH;
        let asp = img_width / img_height; //aspect ratio
        let adjust_width = asp * slider_img_size;
        let actual_width = adjust_width - 6;
        let actual_height = slider_img_size - 6;
        $("#" + divID).css("width", adjust_width + 'px');
        $("#img-thumb-" + imageIDprefix).css("width", actual_width + 'px');
        $("#img-thumb-" + imageIDprefix).css("height", actual_height + 'px');
    });

}

function showYearScent() {
    //Add scent to the year slider
    d3.selectAll('.year-scent').remove();
    //1. get the position of year slider
    let circle_width = convertRemToPixels(1) / 2;
    let pos_left = document.getElementById('year-slider').getBoundingClientRect().x + 40 + circle_width - 5;
    let pos_top = document.getElementById('year-slider').getBoundingClientRect().y - 10;
    let width = document.getElementById('year-slider').getBoundingClientRect().width - 40 - circle_width * 2 + 10;
    let height = 35;
    //irs-grids
    let html_text = `
    `;
    var div = d3.select("body").append("div")
        .attr('pointer-events', 'none')
        .attr("class", "year-scent")
        .attr("id", 'year-scent-div')
        .style("opacity", 1)
        .html(html_text)
        .style("width", width + 'px')
        .style("height", height + 'px')
        .style("left", (pos_left) + 'px')
        .style("top", (pos_top) + 'px');

    //draw the histogram on the div
    if (checkEmptyObj(scentData) == 0) {
        //console.log(1);
        renderYearStatistics('year-scent-div', width, height);
    }


}





function renderYearStatistics(divID, divWidth, divHeight) {

    var margin = { top: 5, right: 2, bottom: 5, left: 2 },
        width = divWidth - margin.left - margin.right,
        height = divHeight - margin.top - margin.bottom;
    // let padding = 2;
    // let bandwidth = width - padding * (scentDataArr.length + 1)

    var svg = d3.select("#" + divID)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
        return "<strong>" + d.year + ": </strong> <span style='color:#0088f3'>" + d.val + "</span>";
    });

    svg.call(tip);

    //console.log(width);
    var x = d3.scaleBand()
        .range([0, width])
        .domain(Object.keys(scentData))
        .paddingInner(0.4);

    var y = d3.scaleLinear()
        .domain([0, Math.max.apply(Math, scentDataArr.map(function(o) { return o.val; }))])
        .range([height, 0]);
    // svg.append("g")
    //     .attr("transform", "translate(0," + height + ")")
    //     .call(d3.axisBottom(x));

    svg.selectAll("bar")
        .data(scentDataArr)
        .enter()
        .append("rect")
        .attr("x", function(d, i) {
            return x(d.year);
        })
        .attr("y", function(d, i) {
            return y(d.val);
        })
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return height - y(d.val); })
        .attr("fill", function(d, i) {
            if (d.ifSelected == 1) {
                return '#99a6ad';
            } else {
                return '#dee2e6';
            }
        })
        .attr('cursor', 'pointer')
        .on("mouseover", function(d) {
            tip.show(d);
        })
        .on("mouseout", function() {
            tip.hide();
        })

}


function convertRemToPixels(rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}


function dragTimeLine() {
    const slider = document.querySelector(".horizontal-timeline");
    let isDown = false;
    let startX;
    let scrollLeft;


    //scroll the timeline horizontally
    // $('.horizontal-timeline').mousewheel(function(e, delta) {
    //     this.scrollLeft -= (delta * 20);
    //     e.preventDefault();
    // });


    slider.addEventListener("mousedown", e => {
        isDown = true;
        slider.classList.add("active");
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });
    slider.addEventListener("mouseleave", () => {
        setTimeout(function() {
            isDown = false;
            slider.classList.remove("active");
        }, 50);
    });
    slider.addEventListener("mouseup", () => {
        setTimeout(function() {
            isDown = false;
            slider.classList.remove("active");
        }, 50);
    });
    slider.addEventListener("mousemove", e => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 1; //scroll-fast
        slider.scrollLeft = scrollLeft - walk;
        //console.log(walk);
    });
}