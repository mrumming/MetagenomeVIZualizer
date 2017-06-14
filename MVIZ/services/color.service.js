'use strict';

(function() {
    angular
            .module('metaStoneCharts')
            .factory('colorservice', colorservice);
    
    colorservice.$inject = ['$log'];
    /**
     * Service zum initialisieren von Farbpaletten und zur Bereitstellung der
     * Farben.
     * 
     * @param {type} $log
     * @returns {color_service_L3.colorservice.service}
     */
    function colorservice ($log) {
        var service = {
            getColor: getColor,
            getDeactiveColor: getDeactiveColor,
            initColorMap: initColorMap
        };
        
        var colors = {
            default: '#000',
            deactive: '#A4A4A4'
        };
        
        /**
         * Defaul Funktion, solange die colormap nicht initialisiert wurde.
         * 
         * @param {type} key
         * @returns {String|colors.default}
         */
        function color(key) {
            return colors.default;
        };
        
        /**
         * Liefert die Farbe fuer ein Label aus dem color mapping.
         * 
         * @param {type} key
         * @returns {String|colors.default}
         */
        function getColor(key) {
            return color(key);
        }
        
        /**
         * Liefert die Farbe fuer deaktivierte item.
         * 
         * @returns {colors.deactive|String}
         */
        function getDeactiveColor() {
            return colors.deactive;
        }

        /**
         * Initialisiere Farbpalette fuer uebergebene Label.
         * 
         * @param {type} labels
         * @returns {undefined}
         */
        function initColorMap(labels) {
            $log.debug("initColorMap");
            /*var labels_ = [];
            for (var k in labels) {
                labels_.push(labels[k].key);
            }*/
            color = d3.scale.ordinal()
                    .domain(labels)
                    .range(colorbrewer.RdBu[9]);
        }
        
        return service;
    }
})();


