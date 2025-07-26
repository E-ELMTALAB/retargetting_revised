(function($){
    function init() {
        var canvas = new fabric.Canvas('poster-canvas');
        var dataField = $('#poster-design');
        if (dataField.val()) {
            canvas.loadFromJSON(dataField.val(), canvas.renderAll.bind(canvas));
        }
        $('#save-poster-design').on('click', function(){
            dataField.val(JSON.stringify(canvas.toJSON()));
        });
    }
    if (typeof fabric !== 'undefined') {
        jQuery(init);
    }
})(jQuery);
