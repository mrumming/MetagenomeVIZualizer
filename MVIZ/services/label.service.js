'use strict';

(function () {
    angular
            .module('metaStoneCharts')
            .factory('labelservice', labelservice);

    labelservice.$inject = ['$log', 'msgservice', 'characteristicservice', 'metadataservice', 'prefservice', 'collectionservice', 'trashholdservice'];
    /**
     * Stellt alle vorhandenen Label bereit auf Basis der ausgewaehlten Samples aller collections und 
     * auf Basis des ausgewaehlten characteristic, speichert den aktiven oder inaktiven
     * Zustand von Labeln.
     * 
     * Events:
     * graphservice.label.activated: Label wurde aktiviert
     * 
     * @param {type} $log
     * @param {type} msgservice
     * @param {type} characteristicservice
     * @param {type} metadataservice
     * @param {type} prefservice
     * @param {type} collectionservice
     * @param {type} trashholdservice
     * @returns {label_service_L3.labelservice.service}
     */
    function labelservice($log, msgservice, characteristicservice, metadataservice, prefservice, collectionservice, trashholdservice) {
        var service = {
            getLabels: getLabels,
            getLabelsSorted: getLabelsSorted,
            toggleLabel: toggleLabel,
            removeLabel: removeLabel,
            resetLabels: resetLabels,
            isLabelActive: isLabelActive
        };
        var labels = {};
        var labelsDeactivated = {};
        
        var msg = msgservice;
        var incommingEvents = {
            sample_added:       'collectionservice.sample.added',
            sample_removed:     'collectionservice.sample.removed',
            col_deleted:        'collectionservice.collection.deleted',
            col_reset:          'collectionservice.collection.reset',
            sub_char_changed:   'characteristicservice.subcharacteristic.changed',
            mod_trashhold:      'prefservice.pref.trashhold.changed',
            raw_inf_change:     'graphpanel.raw_inf.change'
        };
        var events = {
            label_deactivated:  'graphservice.label.activated',
            label_activated:    'graphservice.label.deactivated',
            label_changed:      'graphservice.label.changed'
        };
        var callback = function(event, data) {
            switch(event) {
                case incommingEvents.sample_added:           
                case incommingEvents.sample_removed:   
                case incommingEvents.col_deleted:
                case incommingEvents.col_reset:
                case incommingEvents.mod_trashhold:
                case incommingEvents.raw_inf_change:
                case incommingEvents.sub_char_changed:
                    updateAllLabels();
                    updateDeactivatedMap();
                    break;
            }
        };
        msg.register(callback, 10);

        /**
         * Aktiviert oder deaktiviert ein Label.
         * 
         * @param {type} item
         * @returns {undefined}
         */
        function toggleLabel(item) {
            if (item in labelsDeactivated) {
                delete labelsDeactivated[item];
                msg.notify(events.label_activated, item);

            } else {
                labelsDeactivated[item] = true;
                msg.notify(events.label_deactivated, item);
            }
        }
        
        /**
         * Entfernt das label.
         * 
         * @param {type} label
         * @returns {undefined}
         */
        function removeLabel(label) {
            if(labelsDeactivated[label] !== undefined) {
                delete labelsDeactivated[label];
            }
            if(labels[label] !== undefined) {
                delete labels[label];
            }
        }
     
        /**
         * Liefert die labels map.
         * 
         * @returns {unresolved}
         */
        function getLabels() {
            return labels;
        }
        
        /**
         * Liefert ein sortiertes array mit allen Labeln.
         * 
         * @returns {Array}
         */
        function getLabelsSorted() {
            var lsorted = [];
            for(var l in labels) {
                lsorted.push(l);
            }
            lsorted.sort();
            return lsorted;
        }
        
        /**
         * Setze die labels map zurueck.
         * 
         * @returns {Boolean}
         */
        function resetLabels() {
            if (! isEmpty(labels)) {
                labels = {};
                msg.notify(events.label_changed);
                return true;
            }
            return false;
        }
        
        /**
         * Setze die labelsDeactivated map zurueck.
         * 
         * @returns {Boolean}
         */
        function resetLabelsDeactivated() {
            if (!isEmpty(labelsDeactivated)) {
                labelsDeactivated = {};
                return true;
            }
            return false;
        }
        
        /**
         * Ist das Label aktiv?
         * 
         * @param {type} label
         * @returns {unresolved}
         */
        function isLabelActive(label) {
            return !(label in labelsDeactivated) && label in labels;
        }
        
        /**
         * Update aller Labels auf Basis aller datacollections.
         * 
         * @returns {undefined}
         */
        function updateAllLabels() {
            resetLabels();
            var dataColIds = collectionservice.getDataCollectionIds();
            for (var i in dataColIds) {
                var colId = dataColIds[i];
                var samples = collectionservice.getSelectedSamples(colId, 'label.service');
                var isRaw = prefservice.isCollectionRaw(colId);
                var isInf = prefservice.isCollectionInf(colId);
                // raw wird immer berechnet:
                for (var metagenome in samples) {
                    var metagenome_samples = samples[metagenome];
                    for (var i in metagenome_samples) {
                        var sampleId = metagenome_samples[i];
                        if (isRaw) {
                            addLabels(metagenome, sampleId, true);
                        }
                        if (isInf) {
                            addLabels(metagenome, sampleId, false);
                        }
                    }
                }
            }
        }
        
        /**
         * Fuegt Label auf basis der Metadaten und des uebergebenen 
         * samples hinzu.
         * 
         * @param {type} metagenome
         * @param {type} sampleId
         * @param {type} isRaw
         * @returns {undefined}
         */
        function addLabels(metagenome, sampleId, isRaw) {
            var characteristic = characteristicservice.getCharacteristic();
            var subcharacteristic = characteristicservice.getSubcharacteristic();
            if(characteristic === '' || subcharacteristic === '') {
                //if(
                resetLabels();
                resetLabelsDeactivated();
                /*) {
                 msg.notify(events.label_changed);
                 }*/
                return;
            }
            var metadata = metadataservice.getMetadata();
            if (metadata[metagenome].samples[sampleId].characteristics[characteristic] === undefined
                    || metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic] === undefined) {

                return;
            }
            var sample_labels;
            if (isRaw) {
                sample_labels = metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic].raw;
            } else {
                sample_labels = metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic].inf;
            }
            var labelChanged = false;
            for(var label in sample_labels) {
                if(trashholdservice.isLabelTrashholded(label)) {
                    continue;
                }
                if(label in labels) {
                    labels[label]++;
                } else {
                    labels[label] = 1;
                    labelChanged = true;
                }
            }
            if(labelChanged) {
                msg.notify(events.label_changed);
            }
        }
        
        /**
         * Wenn ein Label entfernt wurde, dann auch aus den deaktivierten
         * Labeln entfernt.
         * 
         * @returns {undefined}
         */
        function updateDeactivatedMap() {
            for(var label in labelsDeactivated) {
                if(!(label in labels)) {
                    delete labelsDeactivated[label];
                }
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
        
        /* DEPRECATED
        function removeLabels(metagenome, sampleId, isRaw) {
            var characteristic = characteristicservice.getCharacteristic();
            var subcharacteristic = characteristicservice.getSubcharacteristic();
            if(characteristic === '' || subcharacteristic === '') {
                if(resetLabels() || resetLabelsDeactivated() ) {
                    msg.notify(events.label_changed);
                }
                return;
            }
            var metadata = metadataservice.getMetadata();
            if(metadata[metagenome].samples[sampleId].characteristics[characteristic] === undefined 
                    || metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic] === undefined ) {
                
                return;
            }
            var sample_labels;
            if(isRaw) {
                sample_labels = metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic].raw;
            } else {
                sample_labels = metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic].inf;
            }
            var changed = false;
            for(var label in sample_labels) {
                if(label in labels) {
                    labels[label]--;
                }
                if (labels[label] === 0) {
                    delete labels[label];
                    changed = true;
                }
            }
            if(changed) {
                msg.notify(events.label_changed);
            }
        }*/                
        
        /* DEPRECATED
        function rawInfchange(colId) {
            var samples = collectionservice.getSelectedSamples(colId);
            var isRaw = prefservice.isCollectionRaw(colId);
            for (var metagenome in samples) {
                var metagenome_samples = samples[metagenome];
                for (var i in metagenome_samples) {
                    var sampleId = metagenome_samples[i];
                    removeLabels(metagenome, sampleId, !isRaw);
                    addLabels(metagenome, sampleId, isRaw);
                }
            }
        }*/
        
        /* DEPRECATED
        function removeLabelsForCollection(colId) {
            var samples = collectionservice.getSelectedSamples(colId);
            var isRaw = prefservice.isCollectionRaw(colId);
            for (var metagenome in samples) {
                var metagenome_samples = samples[metagenome];
                for (var i in metagenome_samples) {
                    var sampleId = metagenome_samples[i];
                    removeLabels(metagenome, sampleId, isRaw);
                }
            }
        }*/
        
        return service;
    }
})();
