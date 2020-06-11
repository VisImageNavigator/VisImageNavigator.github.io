

var tri = {
    center: {x: 300, y: 640},
    d : 500,
    h: 20,
    w: 20
}

var confs = ['InfoVis', 'SciVis', 'VAST']


var triangular_layout = function() {

    //flatten data
    papers = Array.prototype.concat.apply([], _.map(data, function(d) {return d.papers}))
    papers = Array.prototype.concat.apply([], _.map(papers, function(d) {return d.papers}))
    papers = _.groupBy(papers, function(p) {return p.conference;})
    for (var conf in papers) {
        papers[conf] = _.groupBy(papers[conf], function(p) {return p.year})
    }

    //sort papers by citation
    //


    //layout
    var theta = 0,
        k = -1;
    while (++ k < confs.length) {

        var conf = confs[k];
        
        var years = _.keys(papers[conf]).sort().reverse(),
            i = -1,
            d = tri.d;

        var v2 = {x: - Math.sin(theta) * tri.w , y: Math.cos(theta) * tri.w};

        while(++ i < years.length) {

            var lpapers = papers[conf][years[i]],
                j = -1;

            var p0 = {x: Math.cos(theta) * d + tri.center.x, y: Math.sin(theta) * d + tri.center.y};

            while(++ j < lpapers.length) {
                var shift = (1/2 - j % 2) * 2 * Math.floor(j / 2) + 1;
                lpapers[j].x = shift * v2.x + p0.x;
                lpapers[j].y = shift * v2.y + p0.y;
            }

            d += tri.h;
        }

        theta += Math.PI * 2 / 3;

    }

    //update paper positions
    d3.selectAll('.papercell')
        .each(function(d) {
            d3.select(this)
                .style('left', d.x)
                .style('top', d.y)
                .style('position', 'absolute');
            d3.select(this)
                .select('.papercircle')
                .style('min-width', 14)
                .style('min-height', 14);
        })

    d3.select('#canvas')
        // .style('position', 'absolute')
        .style('transform', 'scale(0.4, 0.4)');

    d3.selectAll('.yearlabel').remove();

    d3.select('#details')
        .style('left', 400)
        .style('top', 360)
        .style('position', 'absolute')
        .style('max-width', 250)
        .style('transform', 'scale(0.8, 0.8)')
        .style('display', 'block');


    d3.select('#selection')
        .style('left', 1000)
        .style('top', 600)
        .style('position', 'absolute')
        .style('width', 300)
        .style('transform', 'scale(0.8, 0.8)');


}


// triangular_layout();