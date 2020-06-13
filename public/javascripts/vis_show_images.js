/*
 * @Author: Rui Li
 * @Date: 2020-02-22 22:37:33
 * @LastEditTime: 2020-06-12 22:16:51
 * @Description: 
 * @FilePath: /VisImageNavigator.github.io/public/javascripts/vis_show_images.js
 */

//global variables
confDic = {
    'Vis': '#c0392b',
    'InfoVis': '#f39c12',
    'SciVis': '#2980b9',
    'VAST': '#8e44ad'
}

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
    scrollTo(0, 0);

    //convert data to json format
    imgDataDic = {};
    imgData.forEach((d, i) => {
        let imgID = d['imageID'];
        imgDataDic[imgID] = d;
    });

    //set default height
    var img_size = 100;

    //show the images
    for (let i = 0; i < imgData.length; i++) {
        let img_thumburl = imgData[i].url;
        let imageID = imgData[i].imageID;
        let img_width = imgData[i].sizeW;
        let img_height = imgData[i].sizeH;
        let asp = img_width / img_height;  //aspect ratio
        let div_width = asp * img_size;
        let actual_width = div_width - 6;
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
                <img class="vis-img" id="img-thumb-${i}-${imageID}" style="width:${actual_width}px; height:${img_size - 6}px" src = ${img_thumburl} alt="">
            </div>
        </div>  
        `;
        document.getElementById("image-gallery").appendChild(image_div);
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
    $('.image-a').click(function (e) {
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
        }
        else {
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
        let oriImageName = urlArr[urlArr.length - 1].toString();
        //set email content
        let email_text = "mailto:chen.8028@osu.edu?subject="+
        "VisImageNavigator: Update "+oriImageName+"&body=May I request to update the image file "+
        oriImageName+" please?%0D%0A%0D%0A best regards,%0D%0A"
        $("#email-btn").attr("href",email_text);
        //console.log(imgData[id]['Keywords Author'].replace(/,/g, '; ') == "");
        if (imgData[id]['Keywords Author'].replace(/,/g, '; ') == "") {
            $("#keyword-info").css("color", "#99a6ad");
            keyword_info.innerHTML = "none supplied";
        }
        else {
            $("#keyword-info").css("color", "#eeeeee");
            keyword_info.innerHTML = imgData[id]['Keywords Author'].replace(/,/g, '; ');
        }

        //previous and next button
        $('#modal-previous').unbind('click').click(function () { });
        $("#modal-previous").click(async function () {
            if (gIndex >= 1) {
                gIndex = gIndex - 1;
                updateModalImage();
            }
        });
        $('#modal-next').unbind('click').click(function () { });
        $("#modal-next").click(async function () {
            if (gIndex < img_per_page - 1) {
                gIndex = gIndex + 1;
                updateModalImage();
            }
        });

    });

    //update the modal image based on the id
    var updateModalImage = function () {
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
        }
        else {
            $('#ori-img').attr('class', 'origin-img-tall');
        }
        paper_info.innerHTML = imgData[gIndex]['Paper Title'];
        author_info.innerHTML = imgData[gIndex]['Author'].replace(/;/g, '; ');
        link_info.href = imgData[gIndex]['paper_url'];
        link_info.innerHTML = imgData[gIndex]['paper_url'];
        year_info.innerHTML = imgData[gIndex]['Year'];
        type_info.innerHTML = imgData[gIndex]['Paper type'];
        let urlArr = imgData[gIndex].url.split('/');
        imagename_info.innerHTML = urlArr[urlArr.length - 1];
        //console.log(imgData[id]['Keywords Author'].replace(/,/g, '; ') == "");
        if (imgData[gIndex]['Keywords Author'].replace(/,/g, '; ') == "") {
            $("#keyword-info").css("color", "#99a6ad");
            keyword_info.innerHTML = "none supplied";
        }
        else {
            $("#keyword-info").css("color", "#eeeeee");
            keyword_info.innerHTML = imgData[gIndex]['Keywords Author'].replace(/,/g, '; ');
        }

        //previous and next button
        $('#modal-previous').unbind('click').click(function () { });
        $("#modal-previous").click(async function () {
            if (gIndex >= 1) {
                gIndex = gIndex - 1;
                updateModalImage();
            }
        });
        $('#modal-next').unbind('click').click(function () { });
        $("#modal-next").click(async function () {
            if (gIndex < img_per_page - 1) {
                gIndex = gIndex + 1;
                updateModalImage();
            }
        });
    }

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    // When the user clicks on <span> (x), close the modal
    span.onclick = function () {
        modal.style.display = "none";
    }

    // Change the image size as the range slider changes
    $(document).on('input', '#image-size-slider', function () {
        let size = $(this).val() * 4;
        slider_img_size = size;
        $(".img-panel").css("height", size + 'px');
        $(".img-panel").each(function () {
            //according to the id to determine the width of the div and the image
            let divID = $(this).attr("id");

            let imageID = $(this).attr("id").split('-')[3];
            //console.log($(this).attr("id"));
            let imageIDprefix = $(this).attr("id").slice(9);
            let img_width = imgDataDic[imageID].sizeW;
            let img_height = imgDataDic[imageID].sizeH;
            let asp = img_width / img_height;  //aspect ratio
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
    $(".img-panel").each(function () {
        //according to the id to determine the width of the div and the image
        let divID = $(this).attr("id");
        let imageID = $(this).attr("id").split('-')[3];
        //console.log($(this).attr("id"));
        let imageIDprefix = $(this).attr("id").slice(9);
        let img_width = imgDataDic[imageID].sizeW;
        let img_height = imgDataDic[imageID].sizeH;
        let asp = img_width / img_height;  //aspect ratio
        let adjust_width = asp * slider_img_size;
        let actual_width = adjust_width - 6;
        let actual_height = slider_img_size - 6;
        $("#" + divID).css("width", adjust_width + 'px');
        $("#img-thumb-" + imageIDprefix).css("width", actual_width + 'px');
        $("#img-thumb-" + imageIDprefix).css("height", actual_height + 'px');
    });


    $(window).resize(function () {
        showYearScent();
    });

}





/**
 * show paper data
 * @param {} paperData 
 */
function presentUPPapers(paperData, totalCount) {
    d3.selectAll(".paper-div").remove();
    d3.selectAll(".image-div").remove();
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
        let year = paperData[paperIndex]['Year'];
        let firstPage = paperData[paperIndex]['Paper FirstPage'];
        let lastPage = paperData[paperIndex]['Paper LastPage'];
        let paper_div_id = 'p-' + paperIndex;
        var paper_div = document.createElement("div");
        paper_div.className = "paper-div";
        /**
         * <span class='paperAuthors'>Year: ${year}, Conference: ${conf}, Page(s): ${firstPage}-${lastPage}</span>
            <span class='paperAuthors'>Author(s): ${author}</span>
         */
        let keywordsClass = 'keywords-1';
        if (keywords == '') {
            keywords = 'none supplied';
            keywordsClass = 'keywords-0';
        }
        paper_div.innerHTML = `
        <div class='paper-panel row' id=${paper_div_id}>
            <a href=${paperUrl} target="_blank" class='paperTitle'>${paperTitle}</a>
            <span class='paperAuthors'>${author.replace(/;/g, '; ')}, ${firstPage}-${lastPage}, ${conf}, ${year}</span>
            <span class='paperKeywords'>Keyword(s): <label  class='${keywordsClass}'>${keywords.replace(/,/g, '; ')}</label></span>
        </div>
        `;
        document.getElementById("image-gallery").appendChild(paper_div);
        let imgData = paperData[paperIndex]['Figures'];
        for (let i = 0; i < imgData.length; i++) {
            paperImgData.push(imgData[i]);
            let img_thumburl = imgData[i].url;
            let imageID = imgData[i].imageID;
            let img_width = imgData[i].img_width;
            let img_height = imgData[i].img_height;
            let asp = img_width / img_height;  //aspect ratio
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
        }
        imgPerPagePaper = img_count;
    }

    // Change the image size as the range slider changes
    $(document).on('input', '#image-size-slider', function () {
        let size = $(this).val() * 4;
        slider_img_size = size;
        $(".img-panel").css("height", size + 'px');
        $(".img-panel").each(function () {
            //according to the id to determine the width of the div and the image
            let divID = $(this).attr("id");
            let imageID = $(this).attr("id").split('-')[3];
            let imageIDprefix = $(this).attr("id").slice(9);
            //console.log(imageIDprefix);
            let img_width = imgDataDic[imageID].sizeW;
            let img_height = imgDataDic[imageID].sizeH;
            let asp = img_width / img_height;  //aspect ratio
            let adjust_width = asp * size;
            let actual_width = adjust_width - 6;
            let actual_height = size - 6;
            $("#" + divID).css("width", adjust_width + 'px');
            $("#img-thumb-" + imageIDprefix).css("width", actual_width + 'px');
            $("#img-thumb-" + imageIDprefix).css("height", actual_height + 'px');
        });

    });

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
    $('.vis-img').click(function (e) {
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
        }
        else {
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
        let email_text = "mailto:chen.8028@osu.edu?subject="+
        "VisImageNavigator: Update "+oriImageName+"&body=May I request to update the image file "+
        oriImageName+" please?%0D%0A%0D%0A best regards,%0D%0A"
        $("#email-btn").attr("href",email_text);
        if (imgDataDic[id]['Keywords Author'].replace(/,/g, '; ') == "") {
            $("#keyword-info").css("color", "#99a6ad");
            keyword_info.innerHTML = "none supplied";
        }
        else {
            $("#keyword-info").css("color", "#eeeeee");
            keyword_info.innerHTML = imgDataDic[id]['Keywords Author'].replace(/,/g, '; ');
        }

        //previous and next button
        $('#modal-previous').unbind('click').click(function () { });
        $("#modal-previous").click(async function () {
            if (gIndex >= 1) {
                gIndex = gIndex - 1;
                updateModalImage();
            }
        });
        $('#modal-next').unbind('click').click(function () { });
        $("#modal-next").click(async function () {
            if (gIndex < imgPerPagePaper - 1) {
                gIndex = gIndex + 1;
                updateModalImage();
            }
        });
    });


    //update the modal image based on the id
    var updateModalImage = function () {
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
        }
        else {
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
        //console.log(imgData[id]['Keywords Author'].replace(/,/g, '; ') == "");
        if (paperImgData[gIndex]['Keywords Author'].replace(/,/g, '; ') == "") {
            $("#keyword-info").css("color", "#99a6ad");
            keyword_info.innerHTML = "none supplied";
        }
        else {
            $("#keyword-info").css("color", "#eeeeee");
            keyword_info.innerHTML = paperImgData[gIndex]['Keywords Author'].replace(/,/g, '; ');
        }

        //previous and next button
        $('#modal-previous').unbind('click').click(function () { });
        $("#modal-previous").click(async function () {
            if (gIndex >= 1) {
                gIndex = gIndex - 1;
                updateModalImage();
            }
        });
        $('#modal-next').unbind('click').click(function () { });
        $("#modal-next").click(async function () {
            if (gIndex < imgPerPagePaper - 1) {
                gIndex = gIndex + 1;
                updateModalImage();
            }
        });
    }

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    // When the user clicks on <span> (x), close the modal
    span.onclick = function () {
        modal.style.display = "none";
    }

    //left and right image event

    //show year scent
    showYearScent();

    $(window).resize(function () {
        showYearScent();
    });

    //rescale all images
    $(".img-panel").css("height", slider_img_size + 'px');
    $(".img-panel").each(function () {
        //according to the id to determine the width of the div and the image
        let divID = $(this).attr("id");
        let imageID = $(this).attr("id").split('-')[3];
        let imageIDprefix = $(this).attr("id").slice(9);
        //console.log(imageIDprefix);
        let img_width = imgDataDic[imageID].sizeW;
        let img_height = imgDataDic[imageID].sizeH;
        let asp = img_width / img_height;  //aspect ratio
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

    tip = d3.tip().attr('class', 'd3-tip').html(function (d) {
        return "<strong>" + d.year + ": </strong> <span style='color:#0088f3'>" + d.val + " figures</span>";
    });

    svg.call(tip);

    //console.log(width);
    var x = d3.scaleBand()
        .range([0, width])
        .domain(Object.keys(scentData))
        .paddingInner(0.4);

    var y = d3.scaleLinear()
        .domain([0, Math.max.apply(Math, scentDataArr.map(function (o) { return o.val; }))])
        .range([height, 0]);
    // svg.append("g")
    //     .attr("transform", "translate(0," + height + ")")
    //     .call(d3.axisBottom(x));

    svg.selectAll("bar")
        .data(scentDataArr)
        .enter()
        .append("rect")
        .attr("x", function (d, i) {
            return x(d.year);
        })
        .attr("y", function (d, i) {
            return y(d.val);
        })
        .attr("width", x.bandwidth())
        .attr("height", function (d) { return height - y(d.val); })
        .attr("fill", function (d, i) {
            if (d.ifSelected == 1) {
                return '#99a6ad';
            }
            else {
                return '#dee2e6';
            }
        })
        .attr('cursor', 'pointer')
        .on("mouseover", function (d) {
            tip.show(d);
        })
        .on("mouseout", function () {
            tip.hide();
        })

}


function convertRemToPixels(rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}




