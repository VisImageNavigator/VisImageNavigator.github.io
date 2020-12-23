/**
 * @Description The global control of the system
 * @Author: Rui Li
 * @Date: 9/10/19
 */

//global variables
var ifDB = 0; //if use database
var G_PAP_DATA = new Object(); // image-paper dataset
var G_IMG_DATA = new Object(); // image dataset
var G_PAPER; //paper dataset
var G_IMG_FULL_DATA = new Object(); //image dataset with null images
var G_KEYWORDS = null;
var G_AUTHORS = null; //all authors
var searchMode = 1; //1: keywords search, 2: word search (title and abstract)
var ifAllImage = 1; //if all image are presented
var visMode = 1; //1: image mode, 2: paper mode, 3: paper card mode
var yearPageDic = {}; //store the page index of each year for images
var yearPageDicPaper = {}; //store the 
var currentKeywords = ''; //store the current keywords results
var currentYearRange = [1990, 2020]; //store the current year range
var currentConferences = ['Vis', 'SciVis', 'InfoVis', 'VAST'];
var currentFigures = ['Figure', 'Table'];
var currentAuthors = 'All';
var img_per_page = 200;
var paper_per_page = 20;
var showCaption = 0; //if show figure with caption
var scrollMode = 1; //if used the scroll mode

var confDic = {
    'Vis': '#FBAF3F',
    'InfoVis': '#EF4036',
    'SciVis': '#1B75BB',
    'VAST': '#38B449'
}


var pageUI = new Object();
var scentData = {

};
var scentDataArr = [];

//used for timeline papercard: if user hide one time dot, set it to 1
var timelineStatus = {};


$(document).ready(function() {
    if (ifDB == 0) {
        dbStart();
    } else {

    }
});


/**
 * init dataset
 * @returns {Promise<void>}
 */
async function dbStart() {

    G_IMG_DATA = await d3.csv("public/dataset/vispubData30.csv");
    G_PAPER = await d3.csv("public/dataset/paperData.csv");
    //G_PAPER = stratifyPaperData(G_PAPER);
    G_IMG_DATA = sortImageByYear(G_IMG_DATA); //sort images by year, then sort by conference, the sort by first page.
    //group images to paper dataset
    G_IMG_FULL_DATA = [...G_IMG_DATA];
    G_PAP_DATA = extractPaperData(G_IMG_FULL_DATA);
    //remove null images from image dataset, i.e. papers without image
    G_IMG_DATA = G_IMG_DATA.filter(function(item) {
        let flag = item['paperImageName'] != 'N/A';
        return flag;
    });

    //initialize variables
    initializeGlobalVariables();

    countImageByYear(G_IMG_DATA); //update image data

    //params of image numbers
    var img_count = G_IMG_DATA.length;
    var total_pages = Math.ceil(img_count / img_per_page);


    //console.log(G_PAP_DATA);

    //create the dictionary to store the scent information, i.e. 1990: 1, 1995: 5, year: pageIndex
    resetYearIndexDic(G_IMG_DATA);
    resetYearIndexDicPaper(G_PAP_DATA);

    //back to top ui
    var btn = $('#back-to-top-button');

    $(window).scroll(function() {
        if ($(window).scrollTop() > 300) {
            btn.addClass('show');
        } else {
            btn.removeClass('show');
        }
    });

    //press esc to close the paper details
    $("body").keydown(function(e) {
        // esc
        if ((e.keyCode || e.which) == 27) {
            var modal = document.getElementById('myModal');
            modal.style.display = "none";
        }

    });

    btn.on('click', function(e) {
        e.preventDefault();
        $('html, body').animate({ scrollTop: 0 }, '300');
    });

    //detect if the window size changes
    $(window).resize(function() {
        if (scrollMode == 0) {
            let bodyHeight = $(window).height();
            //find the top position of the gallery
            let imageGalleryTop = document.getElementById("image-gallery").offsetTop;
            let maximumHeight = bodyHeight - imageGalleryTop - 10;
            $("#image-gallery").css("max-height", maximumHeight);
        }
    });



    //set up multi-page interface
    pageUI = new Page({
        id: 'pagination',
        pageTotal: total_pages, //total pages
        pageAmount: img_per_page, //numbers of items per page
        dataTotal: img_count, //number of all items
        curPage: 1, //initial page number
        pageSize: 10, //how many papes divides
        showPageTotalFlag: true, //show data statistics
        showSkipInputFlag: true, //show skip
        getPage: function(page) {
            //get current page number
            let currentData = G_IMG_DATA.slice(img_per_page * (page - 1), img_per_page * page);
            presentImg(currentData, 0, 0, 1, 0);
        }
    });


    //DEBUG:
    //visMode = 3;


    //present images
    if (visMode == 1) {
        ifAllImage = 1;
        filterData();
        //var currentData = G_IMG_DATA.slice(img_per_page * 0, img_per_page * 1);
        //presentImg(currentData, 0, 0, 1, 0);
    } else if (visMode == 2) {
        ifAllImage = 0;
        let img_count = G_PAP_DATA.length;
        let img_per_page = 20;
        let total_pages = Math.ceil(img_count / img_per_page);
        pageUI.pageTotal = total_pages;
        pageUI.pageAmount = img_per_page;
        pageUI.dataTotal = img_count;
        pageUI.getPage = function(page) {
            let currentData = G_PAP_DATA.slice(img_per_page * (page - 1), img_per_page * page);
            presentUPPapers(currentData, img_count);
        };
        pageUI.init();
        var currentData = G_PAP_DATA.slice(img_per_page * 0, img_per_page * 1);
        presentUPPapers(currentData, img_count);
    } else if (visMode == 3) {
        filterData();
    }


    //set up keywords
    G_KEYWORDS = getAllKeywords(G_IMG_FULL_DATA);
    autocomplete(document.getElementById("search-box"), G_KEYWORDS);

    //set up author filters
    G_AUTHORS = getAllAuthors(G_IMG_FULL_DATA);
    G_AUTHORS = G_AUTHORS.filter(function(el) {
        return el != "";
    });

    // G_AUTHORS = G_AUTHORS.sort((a, b) => {
    //     return a.toLowerCase().localeCompare(b.toLowerCase());
    // });
    G_AUTHORS = swapArrayString(G_AUTHORS);
    G_AUTHORS = G_AUTHORS.sort(function(a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });
    //console.log(G_AUTHORS);
    //swap authors

    var auth = d3.select('#authors');
    auth.selectAll("option")
        .data(G_AUTHORS)
        .enter().append('option')
        .attr('value', function(d) {
            return d
        })
        .text(function(d) { return d });

    $("#authors").selectpicker("refresh");
    //filter authors
    auth.on('change', function() {
        currentAuthors = this.options[this.selectedIndex].value;
        filterData();
    })

    //change search mode
    d3.select("#searchModeSelect").on('change', function() {
        searchMode = parseInt(this.options[this.selectedIndex].value);
        if (searchMode == 1) {
            autocomplete(document.getElementById("search-box"), G_KEYWORDS);
        } else {
            autocomplete(document.getElementById("search-box"), []);
        }
    })


    //filter keywords
    $('#search-btn').unbind('click').click(function() {});
    $("#search-btn").click(function() {
        //resetTimelineStatus();  //if we want to reset the timeline collapse status
        var keyword = $('#search-box').val();
        currentKeywords = keyword;
        filterData();
    });

    //filter conferences
    $('input[name="visOptions"]').unbind('click').click(function() {});
    $('input[name="visOptions"]').click(function() {
        let activeConf = [];
        if ($('#vis-check').prop("checked")) {
            $('#vis-check-label').css('background', confDic['Vis']);
            $('#vis-check-label').css('border', '0px');
            activeConf.push('Vis');
        } else {
            $('#vis-check-label').css('background', '#fff');
            $('#vis-check-label').css('border', '1px solid #95a5a6');
        }

        if ($('#scivis-check').prop("checked")) {
            $('#scivis-check-label').css('background', confDic['SciVis']);
            $('#scivis-check-label').css('border', '0px');
            activeConf.push('SciVis');
        } else {
            $('#scivis-check-label').css('background', '#fff');
            $('#scivis-check-label').css('border', '1px solid #95a5a6');
        }

        if ($('#infovis-check').prop("checked")) {
            $('#infovis-check-label').css('background', confDic['InfoVis']);
            $('#infovis-check-label').css('border', '0px');
            activeConf.push('InfoVis');
        } else {
            $('#infovis-check-label').css('background', '#fff');
            $('#infovis-check-label').css('border', '1px solid #95a5a6');
        }

        if ($('#vast-check').prop("checked")) {
            $('#vast-check-label').css('background', confDic['VAST']);
            $('#vast-check-label').css('border', '0px');
            activeConf.push('VAST');
        } else {
            $('#vast-check-label').css('background', '#fff');
            $('#vast-check-label').css('border', '1px solid #95a5a6');
        }
        currentConferences = activeConf;
        filterData();
    });

    //filter tables and figures
    $('input[name="figureOptions"]').unbind('click').click(function() {});
    $('input[name="figureOptions"]').click(function() {
        let activeFigure = [];
        if ($('#figure-check').prop("checked")) {
            $('#figure-check-label').css('background', '#359bd7');
            $('#figure-check-label').css('border', '0px');
            activeFigure.push('Figure');
        } else {
            $('#figure-check-label').css('background', '#fff');
            $('#figure-check-label').css('border', '1px solid #95a5a6');
        }

        if ($('#table-check').prop("checked")) {
            $('#table-check-label').css('background', '#359bd7');
            $('#table-check-label').css('border', '0px');
            activeFigure.push('Table');
        } else {
            $('#table-check-label').css('background', '#fff');
            $('#table-check-label').css('border', '1px solid #95a5a6');
        }
        //equations and algorithms
        if ($('#algo-check').prop("checked")) {
            $('#algo-check-label').css('background', '#359bd7');
            $('#algo-check-label').css('border', '0px');
            activeFigure.push('Algorithm');
        } else {
            $('#algo-check-label').css('background', '#fff');
            $('#algo-check-label').css('border', '1px solid #95a5a6');
        }

        if ($('#equa-check').prop("checked")) {
            $('#equa-check-label').css('background', '#359bd7');
            $('#equa-check-label').css('border', '0px');
            activeFigure.push('Equation');
        } else {
            $('#equa-check-label').css('background', '#fff');
            $('#equa-check-label').css('border', '1px solid #95a5a6');
        }

        currentFigures = activeFigure;
        filterData();
    });



    //determine if used caption version
    $('input[name="captionCheck"]').unbind('click').click(function() {});
    $('input[name="captionCheck"]').click(function() {
        if ($('#caption-check').prop("checked")) {
            $('#caption-check-label').css('background', '#34495e');
            $('#caption-check-label').css('border', '0px');
            showCaption = 1;
        } else {
            $('#caption-check-label').css('background', '#fff');
            $('#caption-check-label').css('border', '1px solid #95a5a6');
            showCaption = 0;
        }


    });

    //filter years
    function yearString(number) {
        return number.toString();
    }
    $(".js-range-slider").ionRangeSlider({
        type: "double",
        grid: true,
        min: '1990',
        max: '2020',
        step: 1,
        skin: "square",
        prettify: yearString,
        onChange: function(data) {

        },
        onFinish: function(data) {
            // fired on every range slider update
            let leftVal = data.from;
            let rightVal = data.to;
            currentYearRange[0] = leftVal;
            currentYearRange[1] = rightVal;
            filterData();
        },
    });


    //switch mode, image mode or paper mode
    $('#image-mode').unbind('click').click(function() {});
    $("#image-mode").click(function() {
        visMode = 1;
        ifAllImage = 1;
        $("#image-mode").css('border', 'solid 2px #333');
        $("#card-mode").css('border', '0px');
        $("#paper-mode").css('border', '0px');
        filterData();


    });
    $('#paper-mode').unbind('click').click(function() {});
    $("#paper-mode").click(function() {
        visMode = 2;
        ifAllImage = 0;
        $("#image-mode").css('border', '0px');
        $("#card-mode").css('border', '0px');
        $("#paper-mode").css('border', 'solid 2px #333');
        filterData();
    });

    $('#card-mode').unbind('click').click(function() {});
    $("#card-mode").click(function() {
        visMode = 3;
        ifAllImage = 0;
        $("#image-mode").css('border', '0px');
        $("#card-mode").css('border', 'solid 2px #333');
        $("#paper-mode").css('border', '0px');
        filterData();
    });


    //tooltip register
    $("#image-mode").tooltip();
    $("#paper-mode").tooltip();
    $("#card-mode").tooltip();
    //$("#image-size-slider").tooltip();
}


/**
 * filter the data given current conditions
 */
function filterData() {
    console.log(currentYearRange, currentConferences, currentKeywords, currentAuthors, currentFigures);
    //update the interface
    if (visMode == 1) {

        //1. filtering data by conference
        var data = filterDataByConference(G_IMG_DATA, currentConferences);
        //2. filtering data by keywords, determine whether show year scent
        if (currentKeywords == '') {
            ifAllImage = 1;
        } else {
            ifAllImage = 0;
            console.time("search begins");
            data = filterDataByKeywords(data, currentKeywords);
            console.timeEnd("search begins");
        }
        //3. filtering data by authors
        if (currentAuthors == 'All') {
            ifAllImage = 1;
        } else {
            ifAllImage = 0;
            data = filterDataByAuthors(data, currentAuthors);
        }
        //4. filtering data by figure type (figure or table)
        data = filterDataByFigureType(data, currentFigures);

        //create the scent data
        countImageByYear(data);

        //5. filtering data by year
        let minYear = currentYearRange[0];
        let maxYear = currentYearRange[1];
        data = filterDataByYear(data, minYear, maxYear);

        //6. reset year index dictionary
        resetYearIndexDic(data);


        var img_count = data.length;
        var total_pages = Math.ceil(img_count / img_per_page);

        pageUI.pageTotal = total_pages;
        pageUI.pageAmount = img_per_page;
        pageUI.dataTotal = img_count;
        pageUI.curPage = 1;
        pageUI.getPage = function(page) {
            let currentData = data.slice(img_per_page * (page - 1), img_per_page * page);
            presentImg(currentData, 0, 0, 1, 0);
        };
        pageUI.init();
        var currentData = data.slice(img_per_page * 0, img_per_page * 1);
        presentImg(currentData, 0, 0, 1, 0);
    } else if (visMode == 2) {

        //1. filtering data by conference
        var data = filterDataByConference(G_IMG_FULL_DATA, currentConferences);
        //2. filtering data by keywords, determine whether show year scent
        if (currentKeywords == '') {
            ifAllImage = 1;
        } else {
            ifAllImage = 0;
            data = filterDataByKeywords(data, currentKeywords);
        }
        //3. filtering data by authors
        if (currentAuthors == 'All') {
            ifAllImage = 1;
        } else {
            ifAllImage = 0;
            data = filterDataByAuthors(data, currentAuthors);
        }
        //4. filtering data by figure type (figure or table)
        data = filterDataByFigureType(data, currentFigures);

        //create the scent data
        countImageByYearPaperMode(data);

        //5. filtering data by year
        let minYear = currentYearRange[0];
        let maxYear = currentYearRange[1];
        data = filterDataByYear(data, minYear, maxYear);

        //6. reset year index dictionary
        resetYearIndexDic(data);
        var paperData = extractPaperData(data);

        ifAllImage = 0;
        let img_count = paperData.length;
        //paper_per_page = 20;
        let total_pages = Math.ceil(img_count / paper_per_page);
        pageUI.pageTotal = total_pages;
        pageUI.pageAmount = paper_per_page;
        pageUI.dataTotal = img_count;
        pageUI.curPage = 1;
        pageUI.getPage = function(page) {
            let currentData = paperData.slice(paper_per_page * (page - 1), paper_per_page * page);
            presentUPPapers(currentData, img_count);
        };
        pageUI.init();
        var currentData = paperData.slice(paper_per_page * 0, paper_per_page * 1);
        presentUPPapers(currentData, img_count);
    } else if (visMode == 3) {
        //1. filtering data by conference
        var data = filterDataByConference(G_IMG_FULL_DATA, currentConferences);

        //2. filtering data by keywords, determine whether show year scent
        if (currentKeywords == '') {
            ifAllImage = 1;
        } else {
            ifAllImage = 0;
            data = filterDataByKeywords(data, currentKeywords);
        }
        //3. filtering data by authors
        if (currentAuthors == 'All') {
            ifAllImage = 1;
        } else {
            ifAllImage = 0;
            data = filterDataByAuthors(data, currentAuthors);
        }
        //4. filtering data by figure type (figure or table)
        data = filterDataByFigureType(data, currentFigures);

        //create the scent data
        countImageByYearPaperMode(data);

        //5. filtering data by year
        let minYear = currentYearRange[0];
        let maxYear = currentYearRange[1];
        data = filterDataByYear(data, minYear, maxYear);



        //6. reset year index dictionary
        resetYearIndexDic(data);
        var paperData = extractPaperData(data);

        ifAllImage = 0;
        let img_count = paperData.length;

        //group dataset by year
        let paperByYear = paperData.reduce((r, a) => {
            r[a.Year] = [...r[a.Year] || [], a];
            return r;
        }, {});

        presentPaperCards(paperByYear, img_count);
    }

}

/**
 * count image numbers by year
 */
function countImageByYear(data) {
    //console.log(scentData);
    //reset scent data
    Object.keys(scentData).forEach((d, i) => {
        scentData[d] = 0;
    });
    data.forEach((d, i) => {
        let year = d.Year;
        scentData[year] += 1;
    })
    let minYear = currentYearRange[0];
    let maxYear = currentYearRange[1];
    //console.log(minYear, maxYear);
    scentDataArr = [];
    Object.keys(scentData).forEach((d, i) => {
        let subData = {};
        if (parseInt(d) >= minYear & parseInt(d) <= maxYear) {
            subData['year'] = d;
            subData['val'] = scentData[d];
            subData['ifSelected'] = 1;
        } else {
            subData['year'] = d;
            subData['val'] = scentData[d];
            subData['ifSelected'] = 0;
        }
        scentDataArr.push(subData);
    });
    //console.log(scentDataArr);
}

function countImageByYearPaperMode(data) {
    //console.log(scentData);
    //reset scent data
    Object.keys(scentData).forEach((d, i) => {
        scentData[d] = 0;
    });
    data.forEach((d, i) => {
        let year = d.Year;
        if (d.paperImageName != 'N/A')
            scentData[year] += 1;
    })
    let minYear = currentYearRange[0];
    let maxYear = currentYearRange[1];
    //console.log(minYear, maxYear);
    scentDataArr = [];
    Object.keys(scentData).forEach((d, i) => {
        let subData = {};
        if (parseInt(d) >= minYear & parseInt(d) <= maxYear) {
            subData['year'] = d;
            subData['val'] = scentData[d];
            subData['ifSelected'] = 1;
        } else {
            subData['year'] = d;
            subData['val'] = scentData[d];
            subData['ifSelected'] = 0;
        }
        scentDataArr.push(subData);
    });
    //console.log(scentDataArr);
}

/**
 * reset the year index pair for image dataset
 * @param {} data 
 */
function resetYearIndexDic(data) {
    let lastYear = -1;
    yearPageDic = {};
    data.forEach((d, i) => {
        if (d['Year'] != lastYear) {
            yearPageDic[d['Year']] = Math.floor(i / 204) + 1;
            lastYear = d['Year'];
        }
    });
}


function resetYearIndexDicPaper(data) {
    let lastYear = -1;
    yearPageDicPaper = {};
    data.forEach((d, i) => {
        if (d['Year'] != lastYear) {
            yearPageDicPaper[d['Year']] = Math.floor(i / 204) + 1;
            lastYear = d['Year'];
        }
    });
}


/**
 * sort images by year
 * @param {} arr 
 */
function sortImageByYear(arr) {
    arr.sort(function(a, b) {
        let imageIDA = a.recodeRank;
        let imageIDB = b.recodeRank;
        return imageIDA - imageIDB;
    });
    return arr;
}


/**
 * group image data into 2D array, where axis = 0 is the paper, axis = 1 correspond to the images
 * @param {} imgData 
 */
function extractPaperData(imgData) {

    //console.log(imgData);

    var paperData = [];
    var paperDic = {};

    imgData.forEach((d, i) => {
        let paperTitle = d['Paper Title'];
        if (paperTitle in paperDic) {
            // if (d['isUP'] == 1) {

            // }
            paperDic[paperTitle]['Figures'].push(d);
        } else {
            let subDataDic = {}; //store the paper information
            subDataDic['Paper Title'] = d['Paper Title'];
            subDataDic['Conference'] = d['Conference'];
            subDataDic['Keywords Author'] = d['Keywords Author'];
            subDataDic['Paper DOI'] = d['Paper DOI'];
            subDataDic['Paper FirstPage'] = d['Paper FirstPage'];
            subDataDic['Paper LastPage'] = d['Paper LastPage'];
            subDataDic['Paper type'] = d['Paper type'];
            subDataDic['Year'] = d['Year'];
            subDataDic['isUP'] = d['isUP'];
            subDataDic['Author'] = d['Author'];
            subDataDic['paper_url'] = d['paper_url'];
            subDataDic['Figures'] = [d];
            // if (d['isUP'] == 1) {

            // }
            paperDic[paperTitle] = subDataDic;
        }
    });

    Object.keys(paperDic).forEach((d, i) => {
        paperData.push(paperDic[d]);
    });

    return paperData;

}


/**
 * convert the array of papers to object by paper doi
 * @param {Array} paperData - the array to store paper objects
 */
function stratifyPaperData(paperData) {
    var paperDic = {};
    paperData.forEach((d, i) => {
        doi = d.DOI;
        paperDic[doi] = d;
    })
    return paperDic;
}


/**
 * initialize global variables used in the program
 */
function initializeGlobalVariables() {
    for (let year = 1990; year < 2021; year++) {
        scentData[year] = 0;
        timelineStatus[year] = 0;
    }
}

/**
 * when starting a new search, all status for timeline should be reset
 */
function resetTimelineStatus() {
    for (let year = 1990; year < 2021; year++) {
        timelineStatus[year] = 0;
    }
}