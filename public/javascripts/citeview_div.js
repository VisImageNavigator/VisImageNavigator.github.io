var data;
var lookup = {};
var active = null
var oscale;
var concepts = {};
var authors = {};
var active_concept = "---";
var active_author = "---";
var fillby = "internal";
var filter_years = [1990, 1995, 2000, 2005, 2010, 2015, 2019];
var filter_mode = 1; //0: show all years, 1: show specific years

//single,each,multi
var MODE = 'each';

//update the style and the layout
var update = function () {
	d3.select('#shading').text(function () {
		if (fillby == 'external') {
			return "Shade by Internal Cites"
		} else {
			return "Shade by External Cites"
		}
	});

	var years = d3.select("#canvas").selectAll('div.year')
		.data(data.sort(function (a, b) { return b.year - a.year }))


	var year_enter = years.enter()
		.append('div')
		.classed('year', true)

	//insert the label of each year
	year_enter.append('div')
		.classed("yearlabel", true)
		.html(function (d) { return d.year })

	var conferences = years.selectAll('div.conference')
		.data(function (d) { return d.papers });

	conferences_enter = conferences.enter().append('div')
		.classed('conference', true);

	var papers = conferences.selectAll('div.paper')
		.data(function (d) { return d.papers })


	var papers_enter = papers.enter()
		.append('div')
		.classed("papercell", true)
		.append('div')
		.classed('paper', true)
		.on('mouseover', function (d) {
			select(d);
			//add 8 paper cells to form a large cell
			renderImgControl(d);
		})
		.on('mouseout', function (d) {
			deselect(d);
			if (d.isRendered == false) {
				removeFlower(d);
			}
		})
		.on('click', function (d) {
			d.isRendered = true;
			renderImageFlower(d);
			if (d.active == true) {
				deactivate()
			} else {
				set_active(d)
			}
		});


	papers_enter.append('div')
		.classed('corners', true)
		.classed('paperglyph', true)

	papers_enter.append('div')
		.classed('papercircle', true)
		.classed('paperglyph', true);


	papers_enter.append('div')
		.classed("best", true)
		.style('display', function (d) { return d.best ? null : 'none' })

	papers.selectAll(".papercircle")
		.classed("selected", function (d) { return d.selected == true })
		.classed("innode", function (d) { return d.innode == true })
		.classed("outnode", function (d) { return d.outnode == true })
		.style("background-color", function (d) {
			if (d.selected == true || d.innode == true || d.outnode == true) {
				return null; //covered by css
			} else {
				return (fillby == "external") ? d.fillval : d.ifillval;
			}
		})
		.style("border", function (d) {
			if (d.active == true || d.innode_sel == true || d.outnode_sel == true) {
				return null; //covered by css
			} else {
				return "2px " + ((fillby == "external") ? d.fillval : d.ifillval) + " solid";
			}
		})
		.classed("selinnode", function (d) { return d.innode_sel == true })
		.classed("seloutnode", function (d) { return d.outnode_sel == true })
		.classed("sel", function (d) { return d.active == true })
		.classed("hauthor", function (d) { return last_highlight(d) == 'hauthor' })
		.classed("hconcept", function (d) { return last_highlight(d) == 'hconcept' })
		.classed("hkeyword", function (d) { return last_highlight(d) == 'hkeyword' })

	papers.selectAll(".corners")
		.classed("hauthor", function (d) { return last_highlight(d) == 'hauthor' })
		.classed("hconcept", function (d) { return last_highlight(d) == 'hconcept' })
		.classed("hkeyword", function (d) { return last_highlight(d) == 'hkeyword' })

};

var last_highlight = function (d) {
	return d.highlights[d.highlights.length - 1];
};

var select = function (d) {
	d.selected = true;
	d.citations.forEach(function (out) {
		out.innode = true;
	});
	d.incites.forEach(function (incite) {
		incite.outnode = true
	});
	d3.select("#details").html(d.tooltip);
	update();
};

var deselect = function (d) {
	d.selected = false;
	d.citations.forEach(function (out) {
		out.innode = false;
	});

	d.incites.forEach(function (incite) {
		incite.outnode = false
	});
	d3.select('#details').html('')
	update()
}

var set_active = function (d) {
	if (active !== null) {
		deactivate()
	}
	active = d
	d.active = true

	d.citations.forEach(function (out) {
		out.innode_sel = true
	})
	// for (var c in d.citations) {
	// 	c = d.citations[c]
	// 	out = lookup[c.id]
	// 	out.innode_sel = true
	// }
	d.incites.forEach(function (incite) {
		incite.outnode_sel = true
	})
	// for (var c in d.incites) {
	// 	c = d.incites[c]
	// 	incite = lookup[c.id]
	// 	incite.outnode_sel = true
	// }
	d3.select("#selection").html(d.tooltip)
	d3.select('#selection').style('display', 'block')
	update()
};

var tooltip = function (d) {
	var conf = '<div>' + d.conference + ' ' + d.year + '</div>'
	var title = '<div><b>' + (d.best ? "*" : '') + d.title + '</b></div>'
	var authors = '<div>' + d.authors.join("; ") + '</div>'
	var citations = '<div>' + d.incites.length + " VIS " + ((d.incites.length !== 1) ? "citations" : "citation") + '</div>'
	// var concepts = '<div>'+'Concepts: '+d.concepts.join(', ')+'</div>'
	return conf + title + authors + citations//+concepts
};

var deactivate = function () {
	var d = active
	d.active = false
	d.citations.forEach(function (out) {
		out.innode_sel = false
	})
	// for (var c in d.citations) {
	// 	c = d.citations[c]
	// 	out = lookup[c.id]
	// 	out.innode_sel = false
	// }
	d.incites.forEach(function (incite) {
		incite.outnode_sel = false
	})
	// for (var c in d.incites) {
	// 	c = d.incites[c]
	// 	incite = lookup[c.id]
	// 	incite.outnode_sel = false
	// }
	d3.select('#selection').text('')
	d3.select('#selection').style('display', null)
	active = null
	update()
}


$(document).ready(function () {
	loadData();
})


function loadData() {
	//Driver  Rui Li: program begins
	d3.csv("public/dataset/result.csv", function (rawdata) {

		d3.selectAll(".year").remove();

		//region load data
		dict = d3.map();

		//only preserve C and J papers
		rawdata.filter(function (d) {
			d.type = d["Paper type: C=conference paper, J = journal paper, M=miscellaneous (capstone, keynote, VAST challenge, panel, poster, ...)"]
			delete d["Paper type: C=conference paper, J = journal paper, M=miscellaneous (capstone, keynote, VAST challenge, panel, poster, ...)"]
			return d.type == "C" || d.type == "J";
		});

		// console.log(rawdata)

		//https://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string-in-javascript
		String.prototype.replaceAll = function (search, replacement) {
			var target = this;
			return target.replace(new RegExp(search, 'g'), replacement);
		};

		rawdata.forEach(function (d) {

			if (d.Conference === "Vis") {
				d.conference = "SciVis"
			} else {
				d.conference = d.Conference
			}
			d.conf = d.Conference;
			delete d.Conference;

			d.year = d.Year;
			delete d.Year;

			d.isRendered = false;

			d.doi = d["Paper DOI"];
			delete d["Paper DOI"];

			d.authors = d["Author Names"].split(";");
			delete d["Author Names"];

			d.id = d.doi;

			d.gscholar = "";

			d.title = d["Paper Title"];
			delete d["Paper Title"];

			d.concepts = [];
			d.citations = [];
			d.references = [];
			d.incites = [];
			d.highlights = [];
			d.img_name_list = [];
			d.img_thumb_url_list = [];
			d.img_dcolor_list = [];

			if (d.img_name != "") {
				d.img_name.split('; ').forEach((p, i) => {
					d.img_name_list.push(p);
				});
				d.img_thumb_url.split('; ').forEach((p, i) => {
					d.img_thumb_url_list.push(p);
				});
				d.img_dcolor.split('; ').forEach((p, i) => {
					d.img_dcolor_list.push(p);
				});
			}


			// d.author_keywords = d["Author Keywords"].split(",")
			d.title_str = d.title.replaceAll(" ", "").replaceAll(";", "").toLowerCase()
			// if (d.title_str.length > 0) { console.log(d.title_str) }
			// delete d["Author Keywords"]

			delete d["Experimental: OCRd Author Affiliations"]

			//d["Author Keywords"]

			dict.set(d.doi, d);  //build the dictionary of papers using their dois
		});



		rawdata.forEach(function (d) {

			d.refs = d.References.split(";")
			if (d.refs == "") { d.refs = [] }
			d.refs.forEach(function (r) {
				let ref = dict.get(r)
				if (ref === undefined) {
					// console.log(d,r,ref)
				}
				//if one paper has internal references, then push it to the d.citations
				// ref.citations.push(d)
				d.citations.push(ref);
				try {
					ref.incites.push(d);  //for the ref paper. add one in-citation
				}
				catch (e) {
					console.log(e);
				}

				//d.references.push({id: d.doi, loc:""})
			})
		});

		//endregion

		let internal_max = d3.max(rawdata, function (d) {
			return d.incites.length
		});

		let maxifill = 0;
		let minifill = 200000000000;
		rawdata.forEach(function (d) {
			conceptsAndAuthors(d)
			d.tooltip = tooltip(d)

			d.ifillval = (d.incites.length) / (internal_max + 1)
			d.ifillval = (1 - d.ifillval) * 240
			d.ifillval = Math.floor(d.ifillval)
			d.ifillval = 'rgb(' + d.ifillval + ',' + d.ifillval + ',' + d.ifillval + ')'

			maxifill = Math.max(d.ifillval, maxifill)
			minifill = Math.min(d.ifillval, minifill)
		});

		//construct the structure of the whole dataset
		let papers = d3.nest()
			.key(function (d) {
				return d.year
			})
			.key(function (d) {
				return d.conference
			})
			.sortValues(function (a, b) {
				return b.incites.length - a.incites.length
			})
			.entries(rawdata);

		papers.forEach(function (d) {
			d.year = d.key;
			d.papers = d.values;
			delete d.key;
			delete d.values;

			d.papers.forEach(function (f) {
				f.conference = f.key;
				f.papers = f.values;
				delete f.key;
				delete f.values
			})
		});

		//add by Rui, remove
		if(filter_mode == 1){
			for (let i = papers.length - 1; i >= 0; i--) {
				if (filter_years.includes(parseInt(papers[i].year))) {
	
				}
				else {
					papers.splice(i, 1);
				}
			}
		}
		console.log(papers);
		data = papers;

		initConcepts();
		initAuthors();
		initKeywords();
		initButtons();
		initKeyboardShortcuts();
		update();  //create all divs on the webpage
		stacked_layout();

	});
}



/**
 *
 */
var initConcepts = function () {
	concepts['---'] = []
	var con = d3.select('#concepts')
	con.selectAll("option")
		.data(Object.keys(concepts).sort())
		.enter().append('option')
		.attr('value', function (d) { return d })
		.text(function (d) { return d })

	con.on('change', function () {
		if (MODE == 'single') {
			clearCategoryHighlights('hkeyword')
			clearCategoryHighlights('hconcept')
			clearCategoryHighlights('hauthor')
		} else if (MODE == 'each') {
			clearCategoryHighlights('hconcept')
		} else {//if (MODE=='multi')
			//pass
		}
		active_concept = this.options[this.selectedIndex].value
		d3.select("#highlightlist").append('div')
			.classed('hlabel', true)
			.classed('hconcept', true)
			.text('Concept: ' + active_concept)
		for (var p in concepts[active_concept]) {
			p = concepts[active_concept][p]
			p.highlights.push('hconcept')
		}
		if (MODE == 'single') {
			clearFormElement('hkeyword')
			clearFormElement('hauthor')
		} else if (MODE == 'each') {
		} else {//if (MODE=='multi')
			//pass
		}
		update();
	})
};

var initAuthors = function () {
	authors['---'] = []
	var auth = d3.select('#authors')
	auth.selectAll("option")
		.data(_.sortBy(Object.keys(authors), function (str) { return str.toLowerCase(); }))
		.enter().append('option')
		.attr('value', function (d) { return d })
		.text(function (d) { return d })
	auth.on('change', function () {
		if (MODE == 'single') {
			clearCategoryHighlights('hkeyword')
			clearCategoryHighlights('hconcept')
			clearCategoryHighlights('hauthor')
		} else if (MODE == 'each') {
			clearCategoryHighlights('hauthor')
		} else {//if (MODE=='multi')
			//pass
		}
		active_author = this.options[this.selectedIndex].value
		d3.select("#highlightlist").append('div')
			.classed('hlabel', true)
			.classed('hauthor', true)
			.text('Author: ' + active_author)
		for (var p in authors[active_author]) {
			p = authors[active_author][p]
			p.highlights.push('hauthor')
		}
		if (MODE == 'single') {
			clearFormElement('hkeyword')
			clearFormElement('hconcept')
			//clearFormElement('hauthor')
		} else if (MODE == 'each') {
		} else {//if (MODE=='multi')
			//pass
		}
		update()
	})
}

var initKeywords = function () {
	$("#keywords").keypress(function (event) {
		if (event.which == 13) {
			event.preventDefault()

			if (MODE == 'single') {
				clearCategoryHighlights('hkeyword')
				clearCategoryHighlights('hconcept')
				clearCategoryHighlights('hauthor')
			} else if (MODE == 'each') {
				clearCategoryHighlights('hkeyword')
			} else {//if (MODE=='multi')
				//pass
			}


			var val = this.value
			var key = val.replace(/[^\w]|_/g, "").toLowerCase()


			if (key != "") {
				d3.select("#highlightlist").append('div')
					.classed('hlabel', true)
					.classed('hkeyword', true)
					.text('Keyword: ' + val.trim())

				papers = Array.prototype.concat.apply([], _.map(data, function (d) { return d.papers }))
				papers = Array.prototype.concat.apply([], _.map(papers, function (d) { return d.papers }))

				i = -1;
				while (++i < papers.length) {
					if (papers[i].title_str.indexOf(key) != -1) {
						papers[i].highlights.push('hkeyword')
					}
				}
			}
			update()
			if (MODE == 'single') {
				clearFormElement('hconcept')
				clearFormElement('hauthor')
			} else if (MODE == 'each') {
			} else {//if (MODE=='multi')
			}
		}
	});
}

var initButtons = function () {
	d3.select("#clear")
		.on('click', function () {
			clearAll()
		})
	d3.select("#shading")
		.on('click', function () {
			if (fillby == 'external') {
				fillby = 'internal'
			} else {
				fillby = 'external'
			}
			update()
		})
}

var conceptsAndAuthors = function (d) {
	for (var a in d.authors) {
		a = d.authors[a]
		if (!(a in authors)) {
			authors[a] = []
		}
		authors[a].push(d)
	}
	for (var c in d.concepts) {
		c = d.concepts[c]
		if (!(c in concepts)) {
			concepts[c] = []
		}
		concepts[c].push(d)
	}
}

var clearAll = function () {
	for (var year in data) {
		year = data[year]
		for (var conf in year.papers) {
			conf = year.papers[conf]
			for (var paper in conf.papers) {
				paper = conf.papers[paper];
				paper.highlights = [];
				paper.active = null;
				paper.innode_sel = null;
				paper.outnode_sel = null;
				paper.isRendered = false;
			}
		}
	}
	d3.selectAll('.flower-box').remove();
	$("#highlightlist").empty()
	$('#selection').empty()
	clearFormElement('hconcept')
	clearFormElement('hauthor')
	clearFormElement('hkeyword')
	d3.select('#selection').style('display', null)
	update();
}

var clearCategoryHighlights = function (category) {

	d3.select('#highlightlist').selectAll('div.' + category).remove()

	for (var year in data) {
		year = data[year]
		for (var paper in year.papers) {
			paper = year.papers[paper]
			//paper[category] = null
			paper.highlights = _.without(paper.highlights, category)
		}
	}
}

var clearFormElement = function (category) {
	if (category == 'hconcept') {
		var concepts = $('#concepts')[0]
		concepts.options[concepts.selectedIndex].selected = false
		concepts.options[0].selected = true
	}
	if (category == 'hauthor') {
		var authors = $('#authors')[0]
		authors.options[authors.selectedIndex].selected = false
		authors.options[0].selected = true
	}
	if (category == 'hkeyword') {
		var keywords = $('#keywords')[0]
		keywords.value = ""
	}
}

var initKeyboardShortcuts = function () {
	$(document).bind('keydown.c', function (event) {
		clearAll()
	})
	$(document).bind('keydown.e', function (event) {
		fillby = "external"
		update()
	})
	$(document).bind('keydown.i', function (event) {
		fillby = "internal"
		update()
	})
}