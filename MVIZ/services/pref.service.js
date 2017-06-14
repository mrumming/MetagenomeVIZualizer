'use strict';

(function () {
    angular
            .module('metaStoneCharts')
            .factory('prefservice', prefService)
            .value('preferences', {
                chart: {
                    pie: true,
                    bar: false
                },
                combined: {
                    combined: true,
                    single: false
                },
                data_loaded: false,
                data_failed: false,
                trashhold: 0.0,
                showLabels: false
            });

    prefService.$inject = ['$log', 'preferences', 'msgservice'];
    /**
     * Speichern und aendern von globalen Einstellungen.
     * 
     * @param {type} $log
     * @param {type} preferences
     * @param {type} msgservice
     * @returns {pref_service_L3.prefService.service}
     */
    function prefService($log, preferences, msgservice) {
        var service = {
            modify: modify,
            getPrefs: getPrefs,
            isCollectionRaw: isCollectionRaw,
            setCollectionRaw: setCollectionRaw,
            isCollectionInf: isCollectionInf,
            setCollectionInf: setCollectionInf,
            setDataLoaded: setDataLoaded,
            setTrashhold: setTrashhold,
            toggleBarLabels: toggleBarLabels,
            isBarLabels: isBarLabels
        };
        
        var pref = preferences;
        var collectionIsRaw = {};
        var collectionIsInf = {};
        var defaultIsRaw = true;
        var defaultIsInf = false;
        var msg = msgservice;
        var events = {
            mod:            'prefservice.pref.changed',
            mod_trashhold:  'prefservice.pref.trashhold.changed',
            mod_labels:     'prefservice.pref.labels.changed',
            raw_inf_change: 'graphpanel.raw_inf.change'
        };
        var incommingEvents = {
            col_deleted: 'collectionservice.collection.deleted',
            col_added:   'collectionservice.collection.added'
        };
        var callback = function (event, data) {
            switch (event) {
                case incommingEvents.col_added:
                    var colId = data;
                    collectionIsRaw[colId] = defaultIsRaw;
                    break;
                case incommingEvents.col_deleted:
                    if (colId in collectionIsRaw) {
                        delete collectionIsRaw[colId];
                    }
                    break;
            }
        };
        msg.register(callback);
        
        /**
         * Modifikation von Einstellungen.
         * 
         * @param {type} key1
         * @param {type} key2
         * @returns {undefined}
         */
        function modify(key1, key2) {
            if (pref[key1][key2] === true) {
                return;
            }
            switch (key2) {
                case 'pie':
                    pref.chart.bar = false;
                    break;
                case 'bar':
                    pref.chart.pie = false;
                    break;
                case 'combined':
                    pref.combined.single = false;
                    break;
                case 'single':
                    pref.combined.combined = false;
                    break;
            }
            pref[key1][key2] = true;
            msg.notify(events.mod, key2);
        }
        
        /**
         * Getter fuer Einstellungen.
         * 
         * @returns {pref_service_L3.prefService.pref}
         */
        function getPrefs() {
            return pref;
        }
        
        /**
         * Ist die collection im raw Modus.
         * 
         * @param {type} colId
         * @returns {pref_service_L3.prefService.collectionIsRaw|collectionIsRaw}
         */
        function isCollectionRaw(colId) {
            if(!(colId in collectionIsRaw)) {
                collectionIsRaw[colId] = defaultIsRaw;
            }
            // Wenn auf barchart geswitcht wird und inf aktiviert ist,
            // dann duerfen die raw labels und thresholds nicht beruecksichtigt werden.
            if(isCollectionInf(colId) && pref.chart.bar) {
                collectionIsRaw[colId] = false;
                
            // der switch von bar auf pie muss auch berucksichtigt werden
            } else if(isCollectionInf(colId) && pref.chart.pie ) {
                collectionIsRaw[colId] = true;
            }
            return collectionIsRaw[colId];
        }

        /**
         * Ist die collection im raw Modus.
         * 
         * @param {type} colId
         * @returns {pref_service_L3.prefService.collectionIsRaw|collectionIsRaw}
         */
        function isCollectionInf(colId) {
            if (!(colId in collectionIsInf)) {
                collectionIsInf[colId] = defaultIsInf;
            }
            return collectionIsInf[colId];
        }
        
        /**
         * Setze collection in den raw Modus.
         * 
         * @param {type} colId
         * @param {type} isRaw
         * @returns {undefined}
         */
        function setCollectionRaw(colId, isRaw) {
            if (collectionIsRaw[colId] !== isRaw) {
                collectionIsInf[colId] = !isRaw;
                collectionIsRaw[colId] = isRaw;
                msg.notify(events.raw_inf_change, colId, colId);
            }
        }
        
        /**
         * Setze collection in den raw Modus.
         * 
         * @param {type} colId
         * @param {type} isInf
         * @returns {undefined}
         */
        function setCollectionInf(colId, isInf) {
            if (collectionIsInf[colId] !== isInf) {
                collectionIsRaw[colId] = !isInf;
                collectionIsInf[colId] = isInf;
                msg.notify(events.raw_inf_change, colId, colId);
            }
        }

        /**
         * Setzte data_loaded auf true.
         * 
         * @returns {undefined}
         */
        function setDataLoaded() {
            pref.data_loaded = true;
        }
        
        /**
         * Setze trashhold.
         * 
         * @param {type} trashhold
         * @returns {undefined}
         */
        function setTrashhold(trashhold) {
            if(trashhold < 0 || trashhold > 100) {
                $log.warn("Trashhold is out of range and will not be set.");
                return;
            }
            if(trashhold === undefined || trashhold === preferences.trashhold) {
                return;
            }
            preferences.trashhold = trashhold;
            msg.notify(events.mod_trashhold, trashhold, trashhold);
        }
        
        /**
         * Setze Anzeige von Labeln auf true bzw false.
         * 
         * @returns {undefined}
         */
        function toggleBarLabels() {
            pref.showLabels = ! pref.showLabels;
            msg.notify(events.mod_labels);
        }
        
        /**
         * Sollen Label auf den plots angezeigt werden.
         * 
         * @returns {pref.showLabels|Boolean}
         */
        function isBarLabels() {
            return pref.showLabels;
        }
        
        return service;
    }
})();