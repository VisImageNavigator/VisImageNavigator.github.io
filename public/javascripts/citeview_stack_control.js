
$(function() {

    var stack_functions = [stacked_layout3, stacked_layout2 , stacked_layout];

    $('input[name=mode]').on('change', function() {
        var i = parseInt($('input[name=mode]:checked').val());
        stack_functions[i].call(null);
    })

    $('input[name=filter]').on('change', function() {
        var i = parseInt($('input[name=filter]:checked').val());
        if(i == 0){
            filter_mode = 0;
            loadData();
        }
        else{
            filter_mode = 1;
            loadData();
        }
    })

});



