function Page(_ref) {
    var pageSize = _ref.pageSize,
        pageTotal = _ref.pageTotal,
        curPage = _ref.curPage,
        id = _ref.id,
        getPage = _ref.getPage,
        showPageTotalFlag = _ref.showPageTotalFlag,
        showSkipInputFlag = _ref.showSkipInputFlag,
        pageAmount = _ref.pageAmount,
        dataTotal = _ref.dataTotal;
    if (!pageSize) {
        pageSize = 0
    };
    if (!pageSize) {
        pageSize = 0
    };
    if (!pageTotal) {
        pageTotal = 0
    };
    if (!pageAmount) {
        pageAmount = 0
    };
    if (!dataTotal) {
        dataTotal = 0
    };
    this.pageSize = pageSize || 5; //分页个数
    this.pageTotal = pageTotal; //总共多少页
    this.pageAmount = pageAmount; //每页多少条
    this.dataTotal = dataTotal; //总共多少数据
    this.curPage = curPage || 1; //初始页码
    this.ul = document.createElement('ul');
    this.id = id;
    this.getPage = getPage;
    this.showPageTotalFlag = showPageTotalFlag || false; //是否显示数据统计
    this.showSkipInputFlag = showSkipInputFlag || false; //是否支持跳转
    if (dataTotal > 0 && pageTotal > 0) {
        this.init();
    } else {
        console.error("总页数或者总数据参数不对")
    }
};

// 给实例对象添加公共属性和方法
Page.prototype = {
    init: function init() {
        var pagination = document.getElementById(this.id);
        pagination.innerHTML = '';
        this.ul.innerHTML = '';
        pagination.appendChild(this.ul);
        var that = this;
        //select number of items shown on each page
        that.selectItemCount();
        //首页
        that.firstPage();
        //上一页
        that.lastPage();
        //分页
        that.getPages().forEach(function(item) {
            var li = document.createElement('li');
            if (item == that.curPage) {
                li.className = 'active';

            } else {
                li.onclick = function() {
                    that.curPage = parseInt(this.innerHTML);
                    that.init();
                    that.getPage(that.curPage);
                };
            }
            li.id = 'page-' + item;
            li.innerHTML = item;
            that.ul.appendChild(li);
        });
        //下一页
        that.nextPage();
        //尾页
        that.finalPage();

        //是否支持跳转
        if (that.showSkipInputFlag) {
            that.showSkipInput();
        }
        //是否显示总页数,每页个数,数据
        if (that.showPageTotalFlag) {
            that.showPageTotal();
        }
    },
    //select plugin, add by Rui
    selectItemCount: function selectItemCount() {
        var that = this;
        var li = document.createElement('li');
        li.className = 'totalPage';
        let span = document.createElement('span');
        if (visMode == 1)
            span.innerHTML = 'images per page&nbsp';
        else if (visMode == 2)
            span.innerHTML = 'papers per page&nbsp';
        li.appendChild(span);
        var selectList = document.createElement("select");
        selectList.id = "imageCountPerPage";
        var options;
        if (visMode == 1)
            options = [200, 240, 300, 400, 1000];
        else if (visMode == 2)
            options = [20, 24, 30, 40, 100];
        //Create and append the options
        for (let i = 0; i < options.length; i++) {
            let option = document.createElement("option");
            option.value = options[i];
            option.text = options[i];
            selectList.appendChild(option);
        }
        li.appendChild(span);
        li.appendChild(selectList);
        this.ul.appendChild(li);
        //console.log(that.pageAmount);
        $('#imageCountPerPage').val(that.pageAmount);
        //add change event
        $('#imageCountPerPage').on('change', function() {
            let figureCount = this.value;
            if (visMode == 1)
                img_per_page = figureCount;
            else if (visMode == 2)
                paper_per_page = figureCount;
            filterData();
        })


    },
    //首页
    firstPage: function firstPage() {
        var that = this;
        var li = document.createElement('li');
        li.innerHTML = 'First Page';
        this.ul.appendChild(li);
        //showYearScent();
        li.onclick = function() {
            var val = parseInt(1);
            that.curPage = val;
            that.getPage(that.curPage);
            that.init();
        };
    },
    //上一页
    lastPage: function lastPage() {
        var that = this;
        var li = document.createElement('li');
        li.innerHTML = '<';
        if (parseInt(that.curPage) > 1) {
            li.onclick = function() {
                that.curPage = parseInt(that.curPage) - 1;
                that.init();
                that.getPage(that.curPage);
            };
        } else {
            li.className = 'disabled';
        }
        this.ul.appendChild(li);
    },
    //分页
    getPages: function getPages() {
        var pag = [];
        if (this.curPage <= this.pageTotal) {
            if (this.curPage < this.pageSize) {
                //当前页数小于显示条数
                var i = Math.min(this.pageSize, this.pageTotal);
                while (i) {
                    pag.unshift(i--);
                }
            } else {
                //当前页数大于显示条数
                var middle = this.curPage - Math.floor(this.pageSize / 2),
                    //从哪里开始
                    i = this.pageSize;
                if (middle > this.pageTotal - this.pageSize) {
                    middle = this.pageTotal - this.pageSize + 1;
                }
                while (i--) {
                    pag.push(middle++);
                }
            }
        } else {
            // console.error('当前页数不能大于总页数');
            //console.error("current pages can not larger than total pages");
        }
        if (!this.pageSize) {
            // console.error('显示页数不能为空或者0');
            console.error("showing pages can not be empty or zero");
        }
        return pag;
    },
    //下一页
    nextPage: function nextPage() {
        var that = this;
        var li = document.createElement('li');
        li.innerHTML = '>';
        if (parseInt(that.curPage) < parseInt(that.pageTotal)) {
            li.onclick = function() {
                that.curPage = parseInt(that.curPage) + 1;
                that.init();
                that.getPage(that.curPage);
            };
        } else {
            li.className = 'disabled';
        }
        this.ul.appendChild(li);
    },
    //尾页
    finalPage: function finalPage() {
        var that = this;
        var li = document.createElement('li');
        li.innerHTML = 'Last page';
        this.ul.appendChild(li);
        //showYearScent();
        li.onclick = function() {
            var yyfinalPage = that.pageTotal;
            var val = parseInt(yyfinalPage);
            that.curPage = val;
            that.getPage(that.curPage);
            that.init();
        };
    },
    //是否支持跳转
    showSkipInput: function showSkipInput() {
        var that = this;
        var li = document.createElement('li');
        li.className = 'totalPage';
        var span1 = document.createElement('span');
        span1.innerHTML = 'go to page';
        li.appendChild(span1);
        var input = document.createElement('input');
        input.setAttribute("type", "number");
        input.onkeydown = function(e) {
            var oEvent = e || event;
            if (oEvent.keyCode == '13') {
                var val = parseInt(oEvent.target.value);
                if (typeof val === 'number' && val <= that.pageTotal && val > 0) {
                    that.curPage = val;
                    that.getPage(that.curPage);
                } else {
                    alert("Please enter the correct page number !")
                }
                that.init();
            }
        };
        li.appendChild(input);
        var span2 = document.createElement('span');
        span2.innerHTML = '';
        li.appendChild(span2);
        this.ul.appendChild(li);
    },
    //是否显示总页数,每页个数,数据
    showPageTotal: function showPageTotal() {
        var that = this;
        var li = document.createElement('li');
        li.innerHTML = that.pageTotal + '&nbsppage(s)';
        li.className = 'totalPage';
        this.ul.appendChild(li);
        // var li2 = document.createElement('li');
        // li2.innerHTML = '每页&nbsp' + that.pageAmount + '&nbsp条';
        // li2.className = 'totalPage';
        // this.ul.appendChild(li2);
        var li3 = document.createElement('li');
        li3.innerHTML = that.dataTotal + '&nbspimages in total';
        li3.className = 'totalPage';
        li3.id = 'totalPageText';
        this.ul.appendChild(li3);

        //add radio box
        var span = document.createElement('span');
        span.className = "scroll-opt-span";
        var scroll_check = document.createElement('input');
        scroll_check.setAttribute("type", "checkbox");
        scroll_check.id = "scroll-check";
        scroll_check.name = "scroll-option";
        scroll_check.value = "true";

        var label = document.createElement('label');
        label.className = "scroll-opt-label";
        label.htmlFor = "scroll-check";
        label.appendChild(document.createTextNode(' fixed this pane'));

        span.appendChild(scroll_check);
        span.appendChild(label);
        this.ul.appendChild(span);

        //set the checkbox status
        if (scrollMode == 1) {
            scroll_check.checked = 0;
        } else {
            scroll_check.checked = 1;
        }

        scroll_check.addEventListener('click', event => {

            if ($('#scroll-check').prop("checked")) {
                scrollMode = 0;
                //find the window size:
                let bodyHeight = $(window).height();
                //find the top position of the gallery
                let imageGalleryTop = document.getElementById("image-gallery").offsetTop;
                let maximumHeight = bodyHeight - imageGalleryTop - 10;
                console.log($(window).height() - document.getElementById("image-gallery").offsetTop);
                $("#image-gallery").css("overflow-y", "scroll");
                $("#image-gallery").css("max-height", maximumHeight);
                $("#image-gallery").css("border", "solid 0.5px #9aa6ad");


            } else {
                scrollMode = 1;
                $("#image-gallery").css("overflow-y", "unset");
                $("#image-gallery").css("border", "solid 0px #9aa6ad");
                //console.log("0");
            }

        });




    }
};