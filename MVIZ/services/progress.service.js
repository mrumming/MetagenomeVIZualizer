'use strict';

(function () {
    angular
            .module('metaStoneCharts')
            .factory('progressservice', progressservice);

    progressservice.$inject = ['$log', 'cfpLoadingBar'];
    /**
     * Zustandig fuer die progress bar.
     * 
     * @param {type} $log
     * @param {type} cfpLoadingBar
     * @returns {progress_service_L3.progressservice.service}
     */
    function progressservice($log, cfpLoadingBar) {

        var service = {
            add: add,
            remove: remove
        };
        
        var itemsInProgress = {};
        
        /**
         * Fuege einen von mehreren Prozessen hinzu die gemeinsam eine
         * Fortschrittsanzeige bilden.
         * 
         * @param {type} id
         * @returns {undefined}
         */
        function add(id) {
            if(isEmpty(itemsInProgress)) {
                cfpLoadingBar.start();
            }
            itemsInProgress[id] = true;
        }

        /**
         * Loesche einen von mehreren Prozessen, die gemeinsam eine
         * Fortschrittsanzeige bilden.
         * 
         * @param {type} id
         * @returns {undefined}
         */
        function remove(id) {
            delete itemsInProgress[id];
            if (isEmpty(itemsInProgress)) {
                cfpLoadingBar.complete();
            } else {
                cfpLoadingBar.inc();
            }
        }
        
        /**
         * Hilfsfunktion: ist map leer.
         * @param {type} obj
         * @returns {Boolean}
         */
        function isEmpty(obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop))
                    return false;
            }
            return true && JSON.stringify(obj) === JSON.stringify({});
        }

        return service;
    }
})();

