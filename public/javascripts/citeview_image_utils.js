/**
 * @Description utils for citeview image module
 * @Author: Rui Li
 * @Date: 02/22/2020
 */


//control the logic of rendering the img flower
var renderImgControl = function (img) {
    if(img.isRendered == true){

    }
    else{
        renderImageFlower(img);
    }
};


/**
 * render the flower vis of images within a paper
 * @param img
 */
var renderImageFlower = function(img){

    tip = d3.tip().attr('class', 'd3-tip').html(function (d) {
        let url = d.thumb_url;
        let htmltext = `
        <img class="vis_img" src="${url}">
        `;
        return htmltext;
    });

    let html_text = `
        <div class="flower-box1">
            
        </div>
    `;

    let left = img.x - 12;
    let top = img.y - 12;
    let id = img.id.replace(/\./g, '').replace(/\//g, '');

    d3.select('#flower'+id).remove();

    //append a div above the circle
    d3.select("#canvas").append("div")
        .attr("id",'flower'+id)
        .attr("class", "flower-box")
        .style('left', left + "px")
        .style('top', top + "px")
        .style("width", '40px')
        .style("height", '40px')

    //construct the img data
    let img_data = [];
    img.img_name_list.forEach((d,i)=>{
        let img_obj = {};
        img_obj['name'] = img.img_name_list[i];
        img_obj['thumb_url'] = img.img_thumb_url_list[i];
        img_obj['dcolor'] = img.img_dcolor_list[i];
        img_data.push(img_obj);
    });
    if(img_data.length > 0){
        //render the circular layout
        var svg = d3.select("#flower"+id)
            .append("svg")
            .attr("width", 40)
            .attr("height", 40)
            .append("g")
            .attr("transform", "translate(20,20)");

        svg.call(tip);

        let radius = 360 / img_data.length;
        let circular = d3.range(0, 360, radius);
        var circle = svg.selectAll("circle")
            .data(img_data)
            .enter()
            .append("circle")
            .attr("transform", function(d, i) {
                let offset = circular[i];
                return "rotate(" + offset + ")";
            })
            .attr("cx", 15)
            .attr("r", 3)
            .attr("fill",function (d,i) {
                return d.dcolor;
            })
            .on("mouseover", function (d, i) {
                // d3.select(this).style("cursor", "pointer");
                tip.show(d);
            })
            .on("mouseout", function () {
                tip.hide();
            })
            .attr("stroke-width",'0.5')
            .attr("stroke", "black");
    }







};

var removeFlower = function (img) {
    let id = img.id.replace(/\./g, '').replace(/\//g, '');
    d3.select('#flower'+id).remove();

};

