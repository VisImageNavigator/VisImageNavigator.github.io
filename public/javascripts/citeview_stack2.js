

var stk2 = {
    h: 42,
    w: 42,
    dx: 10,
    dy: 30,
    x0: 100,
    y0:  150,
    cnt: 120
}

stk2.cnt = Math.floor(($( window ).width() - 100 - stk2.x0) / stk2.w)

var confs = ['InfoVis', 'VAST', 'SciVis'],
    ycoords = {};

var stacked_layout2 = function() {

    //flatten data
    papers = Array.prototype.concat.apply([], _.map(data, function(d) {return d.papers}))
    papers = Array.prototype.concat.apply([], _.map(papers, function(d) {return d.papers}))
    papers = _.groupBy(papers, function(p) {return p.conference;})

    papers_by_year = {}
    for (var conf in papers) {
        papers_by_year[conf] = _.groupBy(papers[conf], function(p) {return p.year})
    }

    //sort papers by citation
    for (var conf in papers) {
        papers[conf] = _.sortBy(papers[conf], function(p) {return p.incites.length;}).reverse();
    }

    //layout
    var y = stk2.y0,
        x = stk2.x0,
        k = -1;

    while(++ k < confs.length) {
        var conf = confs[k];
        var lpapers = papers[conf],
            i = -1;

        while(++i < lpapers.length) {
            lpapers[i].x = x + i % stk2.cnt * stk2.w;
            lpapers[i].y = y + Math.floor(i / stk2.cnt) * stk2.h;
        }

        ycoords[conf] = y;

        y += stk2.dy + stk2.h * lpapers.length / stk2.cnt;

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
        })

    d3.selectAll('.yearlabel').remove();


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


    d3.select('#details')
        .style('left', tri.x0+'px')
        .style('top', y+'px')
        .style('position', 'absolute');


    d3.select('#selection')
        .style('left', tri.x0+'px')
        .style('top', (y + 150)+'px')
        .style('position', 'absolute');


}


// triangular_layout();