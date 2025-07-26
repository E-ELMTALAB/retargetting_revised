(function($){
    function init() {
        var canvas = new fabric.Canvas('poster-canvas-front');
        if (POSTER_DATA) {
            try { canvas.loadFromJSON(POSTER_DATA, canvas.renderAll.bind(canvas)); } catch(e) {}
        }
        $('#download-poster').on('click', function(){
            var link = document.createElement('a');
            link.download = 'poster.png';
            link.href = canvas.toDataURL({format: 'png'});
            link.click();
        });
    }
    if (typeof fabric !== 'undefined') {
        jQuery(init);
    }
})(jQuery);
