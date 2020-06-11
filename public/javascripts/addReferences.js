/*
 * @Author: Rui Li
 * @Date: 2020-05-24 23:52:32
 * @LastEditTime: 2020-05-25 00:10:33
 * @Description: 
 * @FilePath: /VisPubFigures/public/javascripts/addReferences.js
 */ 
$(document).ready(async function () {
	//1. show all visualization ordered by memorability score


	
    var paperData = await d3.csv("public/dataset/citeDataset.csv");
    showReference(paperData);

});

function showReference(data) {
    console.log(data);
	globalImgInfo = data;

	for (var i = 1; i < data.length; i++) {
		var img_thumburl = data[i].thumburl;
		var img_url = data[i].url;
        var img_score = data[i].score;
        let type = data[i]['Type'];
        let conf = data[i]['Conference'];
        let publisher = '';
        if(type == 'J'){
            publisher = '. IEEE Transactions on Visualization and Computer Graphics, ';
        }
        else{
            publisher = '. IEEE '+conf+',';
        }

		var refe_list = document.createElement("div");
        refe_list.innerHTML = '<span>['+(i)+'] '+data[i]['Author Names']+', '+data[i]['Paper Title']+ 
        '<span class="italy-font">'+
        publisher+'</span>'+
        data[i]['First Page'] + '-' + data[i]['Last Page']+ ', ' + 
        data[i]['Year']+ ', ' + '<a target="blank" href='+ data[i]['Link'] +'>' + data[i]['Link'] +
        '</a></span><br>';
		document.getElementById("refer-container").appendChild(refe_list);
    }
}