'use strict';

(function () {
    angular
            .module('metaStoneCharts')
            .factory('trashholdservice', trashholdservice);

    trashholdservice.$inject = ['$log', 'msgservice', 'metadataservice', 'collectionservice', 'preferences', 'prefservice', 'characteristicservice'];
    /**
     * Zentrales Speichern von Labeln die auf Basis der samples in den collections
     * und auf Basis des eingestellten trashholds ausgeblendet werden.
     * 
     * @param {type} $log
     * @param {type} msgservice
     * @param {type} metadataservice
     * @param {type} collectionservice
     * @param {type} preferences
     * @param {type} prefservice
     * @param {type} characteristicservice
     * @returns {trashhold_service_L3.trashholdservice.service}
     */
    function trashholdservice($log, msgservice, metadataservice, collectionservice, preferences, prefservice, characteristicservice) {
        
        var service = {
            isLabelTrashholded: isLabelTrashholded,
            updateAllTrashholds: updateAllTrashholds
        };
        
        var notTrashholded = {};
        
        var msg = msgservice;
        var incommingEvents = {
            sample_added:       'collectionservice.sample.added',
            sample_removed:     'collectionservice.sample.removed',
            mod_trashhold:      'prefservice.pref.trashhold.changed',
            raw_inf_change:     'graphpanel.raw_inf.change',
            sub_char_changed:   'characteristicservice.subcharacteristic.changed',
            col_deleted:        'collectionservice.collection.deleted',
            col_reset:          'collectionservice.collection.reset'
        };
        var callback = function (event, data) {
            switch (event) {
                case incommingEvents.sample_added:
                case incommingEvents.sample_removed:
                case incommingEvents.mod_trashhold:
                case incommingEvents.raw_inf_change:
                case incommingEvents.sub_char_changed:
                case incommingEvents.col_deleted:
                case incommingEvents.col_reset:
                    updateAllTrashholds();
                    break;
            }
        };
        msg.register(callback, 101);
        
        /**
         * Ueberprueft alle collections auf Label die nicht ausgeblendet werden koennen,
         * das ist nur der Fall, wenn mindestens ein Werte fuer ein Label von allen collections 
         * oberhalb des trashholds liegt (muss feststehen, bevor die graph-Daten berechnet werden).
         * 
         * @returns {undefined}
         */
        function updateAllTrashholds() {
            var collections = collectionservice.getDataCollections();
            notTrashholded = {};
            for (var colId in collections) {
                updateTrashholdsByCollection(colId);
            }
        }

        /**
         * Ueberprueft alle collections auf Label die ausgeblendet werden koennen,
         * das ist nur der Fall, wenn alle Werte fuer ein Label von allen collections 
         * unterhalb des thresholds liegen (daher muessen auch die ausgeblendeten
         * Label feststehen, bevor die graph-Daten berechnet werden).
         * 
         * @param {type} colId
         * @returns {undefined}
         */
        function updateTrashholdsByCollection(colId) {
            var characteristic = characteristicservice.getCharacteristic();
            var subcharacteristic = characteristicservice.getSubcharacteristic();
            var isRaw = prefservice.isCollectionRaw(colId);
            var isInf = prefservice.isCollectionInf(colId);

            if(characteristic === '' || subcharacteristic === '') {
                return;
            }
         
            var samples = collectionservice.getSelectedSamples(colId, 'trashhold.service');
            
            if(isRaw) {
                updateTresholds(samples, colId, 'raw');
            }
            if(isInf) {
                updateTresholds(samples, colId, 'inf');
            }
        }
        
        //Hilfsfunktion
        function updateTresholds(samples, colId, ri) {
            var characteristic = characteristicservice.getCharacteristic();
            var subcharacteristic = characteristicservice.getSubcharacteristic();
            var metadata = metadataservice.getMetadata();
            var treshold = preferences.trashhold;
            var cntAll = 0;
            var tmp = {};
            for (var metagenome in samples) {
                samples[metagenome].forEach(function (sampleId, index, array) {

                    if (metadata[metagenome].samples[sampleId].characteristics[characteristic]
                            && metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic]) {

                        for (var label in metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic][ri]) {
                            var label_cnt = metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic][ri][label];
                            cntAll += label_cnt; // n

                            if (tmp[label] === undefined) {
                                tmp[label] = 0;
                            }
                            tmp[label] += label_cnt;
                        }
                    }
                });
            }
            for (var label in tmp) {
                var label_cnt = tmp[label];

                var label_cnt_percent;
                if (label_cnt > 0 && cntAll > 0) {
                    label_cnt_percent = (label_cnt / (1.0 * cntAll)) * 100;
                } else {
                    label_cnt_percent = 0;
                }

                // sobald eine collection drueber ist, wird das label nicht mehr deaktiviert.
                if (label_cnt_percent >= treshold) {
                    if (notTrashholded[label] === undefined) {
                        notTrashholded[label] = {};
                    }
                    notTrashholded[label][colId] = true;
                }
            }
        }

        /**
         * Ist das Label ausgeblendet unter Beachtung des trashholds?.
         * 
         * @param {type} label
         * @param {type} value
         * @returns {Boolean}
         */
        function isLabelTrashholded(label, value) {
            var trashhold = preferences.trashhold;
            if (trashhold === undefined || trashhold === 0) {
                return false;
            }
            if(value && value > trashhold && !notTrashholded[label]) {
                $log.debug("!!! Label is not under the trashhold and not in notTrashhlded !!!");
            }
            // es muessen dann alle zeichnen, damit die Balken wieder uebereinander sind
            return notTrashholded[label] === undefined;
        }

        return service;
    }
})();
