'use strict';

(function () {
    angular
            .module('metaStoneCharts')
            .factory('msgservice', msgService);

    msgService.$inject = ['$log'];
    /**
     * Service zur Kommunikation von services und directives auch untereinander,
     * auf Grundlage des Observer Pattern mit zusaetzlichen Benachrrichtigungs Prioritaeten.
     * 
     * @param {type} $log
     * @returns {msg_service_L3.msgService.service}
     */
    function msgService($log) {

        var service = {
            register: register,
            notify: notify,
            unregister: unregister
        };
        
        var observerCallbacks = {};
        var observerCallbackPriorities = [];

        /**
         * Globalen observer registrieren, priority legt die Prioritaet fest 
         * mit der der callback aufgerufen wird, die Prioritaet beeinflusst 
         * die Reihenfolge der callback Aufrufe.
         * 
         * @param {type} callback
         * @param {type} priority
         * @returns {undefined}
         */
        function register(callback, priority) {
            if(priority === undefined) {
                priority = 0;
            }
            if(observerCallbacks[priority] === undefined) {
                observerCallbacks[priority] = [];
                observerCallbackPriorities.push(priority);
                observerCallbackPriorities.sort().reverse();
            }
            observerCallbacks[priority].push(callback);
        }

        /**
         * Informiere alles registrierten observer ueber ein Event
         * und uebergebe ggf Daten.
         * 
         * @param {type} event
         * @param {type} data
         * @param {type} info
         * @returns {undefined}
         */
        function notify(event, data, info) {
            if(info !== undefined) {
                $log.debug("notify: ", event, info);
            } else {
                $log.debug("notify: ", event);
            }
            observerCallbackPriorities.forEach(function (prio) {
                observerCallbacks[prio].forEach(function (callback) {
                    callback(event, data);
                });
            });
        }
        
        /**
         * Registrierung eines observers aufheben.
         * 
         * @param {type} callback
         * @param {type} info
         * @returns {undefined}
         */
        function unregister(callback, info) {
            if (info === undefined) {
                $log.debug("unregister: ");
            } else {
                $log.debug("unregister: ", info);
            }
            observerCallbackPriorities.forEach(function (prio) {
                var pos = observerCallbacks[prio].indexOf(callback);
                if (pos > -1) {
                    observerCallbacks[prio].splice(pos, 1);
                }
            });
        }
        return service;
    }

})();