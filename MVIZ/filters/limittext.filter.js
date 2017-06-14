(function () {
    angular
            .module("metaStoneCharts")
            .filter("limittext", limittext);
    /*
     * Filter um die Laenge eines Textes/ Strings zu limitieren.
     * 
     * Usage: {{ some_text | limittext:100 }}
     * 
     * Vgl.: http://stackoverflow.com/a/18096071
     */
    limittext.$inject = [];
    function limittext() {
        var filter = function (text, max) {
            if (text === undefined || text === '')
                return '';
            max = parseInt(max, 10);
            if (!max || (text.length <= max))
                return text;
            text = text.substr(0, max);
            return text + '...';
        };
        return filter;
    }
}());


