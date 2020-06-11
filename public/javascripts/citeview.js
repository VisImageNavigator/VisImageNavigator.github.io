//Constants
var width = '100%'
var height = '100%'
var r = 7
var pt = 2*r
var initbuffer = r
var pbuffer = 0
var ybuffer = 0
var years,year_index

var svg = d3.select('#canvas')
  .attr('width', width)
  .attr('height', height)

var chartg = svg.append('g')
  .attr('transform','translate(30,0)')

var labelg = svg.append('g')

var x = function(paper){
  return initbuffer+(2*(r+pbuffer))*paper.index
}
var y = function(year){
  return initbuffer+(2*(r+ybuffer))*year_index[year]
}

var determine_indices = function(data){
  years = {}
  data.forEach(function(d){
    if (!years[d.year]){
      years[d.year] = []
    }
    years[d.year].push(d)
  })
  for (var y in years){
    years[y].sort(function(a,b){
      return b.cites - a.cites
    })
    years[y].forEach(function(d,i){
      d.index = i
    })
  }
  year_index = {}
  var y_keys = Object.keys(years)
  y_keys.sort()
  y_keys.forEach(function(d,i){
    year_index[d] = i
  })
}


var update = function(data){
  var papers = chartg.selectAll('circle.paper')
    .data(data)

  papers.enter().append('svg:circle')
    .classed('paper',true)
    .attr('r', r)
    .attr('cx', function(d){ return x(d)})
    .attr('cy', function(d){return y(d.year)})
    .attr('nodeid', function(d){return d.id})
    .on('mouseover', function(d){
      select(d)
    })
    .attr('opacity',function(d){return d.innodes.length/30 + 0.15})
    .append('title').text(function(d){
      return d.id+'\nTotal: '+d.cites+", Internal: "+d.innodes.length
    })
  papers.exit().remove()
}

var add_year_labels = function(){
  y_keys = Object.keys(year_index)
  var labels = labelg.selectAll('text.yearlabel').data(y_keys)
  labels.enter().append('svg:text')
    .classed('yearlabel',true)
    .text(String)
    .attr('y',function(d){return y(d)})
    .style('font-size',pt)
    .style('dominant-baseline','middle')
    .attr('dy',1)
}

var select = function(selected_paper){
  var ins = svg.selectAll('circle.paper.innode')
  ins.classed('innode',false)
  var outs = svg.selectAll('circle.paper.outnode')
  outs.classed('outnode',false)
  var sel = svg.selectAll('circle.paper.selected')
  sel.classed('selected',false)

  if(selected_paper){
    d3.select('[nodeid="'+selected_paper.id+'"]').classed('selected',true)
    selected_paper.innodes.forEach(function(id){
      innies = d3.selectAll('[nodeid="'+id+'"]')
      innies.classed('innode',true)
    })
    selected_paper.outnodes.forEach(function(id){
      d3.selectAll('[nodeid="'+id+'"]').classed('outnode',true)
    })
  }
}

//Driver
d3.json('data/citations-2013.json',function(data){
  // determine_indices(data)
  // update(data)
  // add_year_labels()
})