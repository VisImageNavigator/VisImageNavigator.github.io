

var tri = {
    h: 42,
    w: 42,
    dx: 5,
    dy: 10,
    x0: 100,
    y0: 200,
    cnt: 5
};

//cnts: how many circles in each conference
var confs = ['InfoVis', 'VAST', 'SciVis'],
    cnts = [5, 5, 5],
    ycoords = {};


var stacked_layout = function() {

    //flatten data
    papers = Array.prototype.concat.apply([], _.map(data, function(d) {return d.papers}));
    papers = Array.prototype.concat.apply([], _.map(papers, function(d) {return d.papers}));
    papers = _.groupBy(papers, function(p) {return p.conference;});
    //group papers by conference and year
    for (var conf in papers) {
        papers[conf] = _.groupBy(papers[conf], function(p) {return p.year})
    }

    //sort papers by citation
    //

    //layout
    var k = -1,
        y = tri.y0;
    while (++ k < confs.length) {
        var conf = confs[k];
        var years = _.keys(papers[conf]).sort().reverse(),
            i = -1,
            x = tri.x0;
        while(++ i < years.length) {
            var year = years[i],
                lpapers = papers[conf][year],
                j = -1;

            while( ++ j < lpapers.length) {
                lpapers[j].x = j % cnts[k] * tri.w + x;
                lpapers[j].y = Math.floor(j / cnts[k]) * tri.h + y;
                lpapers[j].innerIndex = j;
            }

            x += tri.w * cnts[k]  + tri.dx;  //finish one year, then the x should offset

        }

        ycoords[conf] = y;

        y += tri.dy + tri.h * Math.ceil(_.max(_.values(papers[conf]), function(d) {return d.length;}).length / cnts[k]);  //finish one year
    }


    //update paper positions
    d3.selectAll('.papercell')
        .each(function(d) {
            d3.select(this)
                // .transition()
                // .duration(2000)
                .style('left', d.x+'px')
                .style('top', d.y+'px')
                .style('position', 'absolute');
        });

    // d3.selectAll('.papercircle')
    //     .each(function(d) {
    //         d3.select(this)
    //             .text(d.innerIndex);
    //     });


    d3.selectAll('.conflabel').remove();

    d3.select('#canvas')
        .selectAll('.conflabel')
        .data(confs)
        .enter()
        .append('div')
        .attr('class', 'conflabel')
        // .transition()
        // .delay(2000)
        .style('position', 'absolute')
        .style('left', 20+'px')
        .style('top', function(c) {return ycoords[c]+'px';})
        .text(function(c) {return c;});
        // .attr('text-anchor', 'end');

    d3.selectAll('.yearlabel').remove();


    d3.select('#canvas')
        .selectAll('.yearlabel')
        .data(function(){
            if(filter_mode == 0){
                return d3.range(2019, 1989, -1);
            }
            else{
                return filter_years.reverse()
            }
        })
        .enter()
        .append('div')
        .attr('class', 'yearlabel')
        .style('position', 'absolute')
        .style('left', function(y, i) {
            return (tri.x0 + 40 + (tri.cnt * tri.w + tri.dx ) * i + tri.cnt * tri.w / 4)+'px';
        })
        .style('top', (tri.y0 - 50)+'px')
        .text(function(y) {return y;});
        // .attr('text-anchor', 'end');    


    d3.select('#details')
        // .transition()
        // .duration(2000)    
        .style('left', tri.x0+'px')
        .style('top', 36+'px')
        .style('position', 'absolute');


    d3.select('#selection')
        // .transition()   
        // .duration(2000)    
        .style('left', tri.x0 + 800+'px')
        .style('top', 36+'px')
        .style('position', 'absolute');


};


// triangular_layout();