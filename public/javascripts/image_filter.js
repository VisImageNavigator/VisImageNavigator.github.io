/*
 * @Author: Rui Li
 * @Date: 2020-01-16 12:03:29
 * @LastEditTime: 2020-06-27 17:53:49
 * @Description: 
 * @FilePath: /VisImageNavigator.github.io/public/javascripts/image_filter.js
 */

var figureIndex = [-1, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 50, 51, 100];
var tableIndex = [16];
var algoIndex = [18];
var equaIndex = [19];

/**
 * find all keywords
 * @param data
 */
function getAllKeywords(data) {
    var keyword_list = [];
    for (let i = 0; i < data.length; i++) {
        let keywords = data[i]["Keywords Author"].split(/[;,]+/);
        for (let j = 0; j < keywords.length; j++) {
            keyword_list.push(keywords[j].toLowerCase());
        }
    }
    var uniq_keywords = [...new Set(keyword_list)];
    uniq_keywords = uniq_keywords.sort();
    return uniq_keywords;
}


function getAllAuthors(data) {
    var author_list = [];
    for (let i = 0; i < data.length; i++) {
        let authors = data[i]["Author"].split(';');
        for (let j = 0; j < authors.length; j++) {
            if (authors[j] == 'Torsten Möller') {
                authors[j] = 'Torsten Möller';
            }
            author_list.push(authors[j]);
        }
    }
    var uniq_authors = [...new Set(author_list)];
    return uniq_authors;
}

/**
 * return a subset of datasets based on the given keyword
 * @param keyword
 */
function filterDataByKeywords(data, keyword) {
    if (searchMode == 1) {
        var filterData = data.filter(function(item) {
            //console.log(item['Keywords Author']);
            return item['Keywords Author'].toLowerCase().includes(keyword);
        });
        //console.log(filterData);
        return filterData;
    } else if (searchMode == 2) {

        //1. using regex: \b token \b to filter paper dois
        //regex testing: https://regex101.com/
        var filterPaper = G_PAPER.filter((item) => {
                let paragraph = (item['Title'] + ' ' + item['Abstract']).toLowerCase();
                let regex = new RegExp("\\b" + keyword + "\\b");
                //let regex = new RegExp(keyword);
                let found = paragraph.match(regex);
                return found != null;
            })
            .map((obj) => {
                return obj['DOI'];
            });
        //console.log(filterPaper);
        //2. based on paper dois to get the images
        var filterData = data.filter(function(item) {
            //console.log(item['Keywords Author']);
            return filterPaper.includes(item['Paper DOI']);
        });
        //console.log(filterData);
        return filterData;
    }


}

/**
 * return a subset of datasets based on the given authors
 * @param {} data 
 * @param {*} author 
 */
function filterDataByAuthors(data, author) {
    var filterData = data.filter(function(item) {
        let authorList = swapArrayString(item['Author'].split(';'));
        return authorList.includes(author);
    });
    return filterData;
}

/**
 * return a subset of datasets based on the given figure types
 * Figure, Table, Algorithm (18), Equation
 * @param {*} data 
 * @param {*} type 
 */
function filterDataByFigureType(data, type) {

    //create an array to store all types digits based on type
    var typeList = [];
    type.forEach((d, i) => {
        if (d == "Figure") {
            typeList = typeList.concat(figureIndex);
        }
        if (d == "Table") {
            typeList = typeList.concat(tableIndex);
        }
        if (d == "Algorithm") {
            typeList = typeList.concat(algoIndex);
        }
        if (d == "Equation") {
            typeList = typeList.concat(equaIndex);
        }
    });
    //console.log(typeList);
    var filterData = data.filter(function(item) {
        return typeList.includes(parseInt(item['vis_type']));
    });
    return filterData;
}

/**
 * given the encoding type, filter the data
 * the basic idea is for each data item, check if the encoding_type includes any of the selected types
 * if there is no type selected, return the full dataset
 * @param {*} data 
 * @param {*} type 
 * @param {*} mode: //-0: empty; 1: select single; 2: select multiple; 3: select both
 */
function filterDataByEncodingType(data, type, mode){
    if(type.length == 0){
        return data;
    }
    let filterData;
    if (mode == 1){
        filterData = data.filter(function(item){
            let isFlag = false;
            if(parseInt(item['check_encoding_type']) == 1){
                for(let i = 0; i < type.length; i++){
                    if(item['encoding_type']==type[i]){
                        isFlag = true;
                        break;
                    }
                }
            }
            return isFlag;
        });
    }else if(mode == 2){
        filterData = data.filter(function(item){
            let isFlag = false;
            if(parseInt(item['check_encoding_type']) == 1){
                for(let i = 0; i < type.length; i++){
                    if(item['encoding_type']!=type[i] && item['encoding_type'].split(';').includes(type[i])){
                        isFlag = true;
                        break;
                    }
                }
            }
            return isFlag;
        });
    }
    else if(mode == 3 || mode == 0){
        filterData = data.filter(function(item){
            let isFlag = false;
            if(parseInt(item['check_encoding_type']) == 1){
                for(let i = 0; i < type.length; i++){
                    if(item['encoding_type'].split(';').includes(type[i])){
                        isFlag = true;
                        break;
                    }
                }
            }
            return isFlag;
        });
    }

    return filterData;
    
}

/**
 * filter dataset by functional type
 * @param {*} data 
 * @param {*} type 
 * @returns 
 */
function filterDataByFunctionType(data, type, mode){
    if(type.length == 0){
        return data;
    }
    let filterData;
    if (mode == 1){
        filterData = data.filter(function(item){
            let isFlag = false;
            if(parseInt(item['check_encoding_type']) == 1){
                for(let i = 0; i < type.length; i++){
                    if(item['encoding_type']==type[i]){
                        isFlag = true;
                        break;
                    }
                }
            }
            return isFlag;
        });
    }else if(mode == 2){
        filterData = data.filter(function(item){
            let isFlag = false;
            if(parseInt(item['check_encoding_type']) == 1){
                for(let i = 0; i < type.length; i++){
                    if(item['encoding_type']!=type[i] && item['encoding_type'].split(';').includes(type[i])){
                        isFlag = true;
                        break;
                    }
                }
            }
            return isFlag;
        });
    }
    else if(mode == 3 || mode == 0){
        filterData = data.filter(function(item){
            let isFlag = false;
            if(parseInt(item['check_encoding_type']) == 1){
                for(let i = 0; i < type.length; i++){
                    if(item['encoding_type'].split(';').includes(type[i])){
                        isFlag = true;
                        break;
                    }
                }
            }
            return isFlag;
        });
    }

    return filterData;
}

/**
 * filter data by hardness
 * @param {*} data 
 * @param {*} hardness 
 * @returns 
 */
function filterDataByHardness(data, hardness) {
    if(hardness == ''){
        return data;
    }
    else{
        var filterData = data.filter(function(item) {
            return hardness == item['hardness_type'];
        });
        return filterData;
    }
}

/**
 * 
 * @param {*} data 
 * @param {*} type 
 * @param {*} mode - 0: empty; 1: select single; 2: select multiple; 3: select both
 * @returns 
 */
function filterDataByDimensions(data, type, mode){
    if(type.length == 0){
        return data;
    }
    let filterData;
    if (mode == 1){
        filterData = data.filter(function(item){
            let isFlag = false;
            if(parseInt(item['check_dim_type']) == 1){
                for(let i = 0; i < type.length; i++){
                    if(item['dim_type']==type[i]){
                        isFlag = true;
                        break;
                    }
                }
            }
            return isFlag;
        });
    }else if(mode == 2){
        filterData = data.filter(function(item){
            let isFlag = false;
            if(parseInt(item['check_dim_type']) == 1){
                for(let i = 0; i < type.length; i++){
                    if(item['dim_type']!=type[i] && item['dim_type'].split(';').includes(type[i])){
                        isFlag = true;
                        break;
                    }
                }
            }
            return isFlag;
        });
    }
    else if(mode == 3 || mode == 0){
        filterData = data.filter(function(item){
            let isFlag = false;
            if(parseInt(item['check_dim_type']) == 1){
                for(let i = 0; i < type.length; i++){
                    if(item['dim_type'].split(';').includes(type[i])){
                        isFlag = true;
                        break;
                    }
                }
            }
            return isFlag;
        });
    }

    return filterData;
}

function filterDataByComposition(data, type){
    if(type.length == 0){
        return data;
    }
    var filterData = data.filter(function(item){
        let isFlag = false;
        if(parseInt(item['check_comp_type']) == 1){
            for(let i = 0; i < type.length; i++){
                if(item['comp_type'].split(';').includes(type[i])){
                    isFlag = true;
                    break;
                }
            }
        }
        return isFlag;
    });
    return filterData;
}

function filterDataByNest(data, type){
    if(type.length == 0){
        return data;
    }
    var filterData = data.filter(function(item){
        let isFlag = false;
        if(parseInt(item['check_nest_type']) == 1){
            for(let i = 0; i < type.length; i++){
                if(item['nest_type'].split(';').includes(type[i])){
                    isFlag = true;
                    break;
                }
            }
        }
        return isFlag;
    });
    return filterData;
}

/**
 * 
 * @param {} data 
 * @param {*} type 
 */
function filterDataByAlgoEquaType(data, type) {
    if (type.length == 2) {
        var filterData = data.filter(function(item) {
            let boolean = parseInt(item['vis_type']) == 18 || parseInt(item['vis_type']) == 19;
            return boolean;
        });
        return filterData;
    } else if (type.length == 0) {
        var filterData = data.filter(function(item) {
            let boolean = parseInt(item['vis_type']) != 18 && parseInt(item['vis_type']) != 19;
            return boolean;
        });
        return filterData;
    } else if (type.length == 1) {
        if (type[0] == 'Algorithm') {
            var filterData = data.filter(function(item) {
                let boolean = parseInt(item['vis_type']) == 18;
                return boolean;
            });
            return filterData;
        } else if (type[0] == 'Equation') {
            var filterData = data.filter(function(item) {
                let boolean = (parseInt(item['vis_type']) == 19);
                return boolean;
            });
            return filterData;
        }
    }
}


/**
 * return conference subset
 * @param {selected conferences} confs 
 */
function filterDataByConference(data, confs) {
    var filterData = data.filter(function(item) {
        return confs.includes(item['Conference']);
    });
    return filterData;
}

/**
 * return image dataset with the year range
 * @param {*} minYear 
 * @param {*} maxYear 
 */
function filterDataByYear(data, minYear, maxYear) {
    var filterData = data.filter(function(item) {
        return (minYear <= item['Year']) & (item['Year'] <= maxYear);
    });
    return filterData;
}