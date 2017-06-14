'use strict';

(function () {
    angular
            .module("metaStoneCharts")
            .factory('collectionservice', collectionService);
    
    collectionService.$inject = ['$log', 'msgservice'];
    /**
     * Service fuer collections: 
     * hinzufuegen/entfernen von collections,
     * hinzufuegen/entfernen von samples,
     * Reihenfolge von collections speichern und aendern.
     * 
     * Events:
     * collectionservice.collection.added collection hinzugefuegt
     * collectionservice.collection.pre_delete bevor eine collection geloescht wird
     * collectionservice.collection.deleted collection geloescht
     * collectionservice.collection.changed eine andere collection zum editieren gewaehlt
     * collectionservice.collection.pre_reset bevor col. zurueckgestzt wird
     * collectionservice.collection.reset collection zurueckgesetzt
     * collectionservice.sample.added sample hinzugefuegt
     * collectionservice.sample.removed sample entfernt
     * 
     * @param {type} $log
     * @param {type} msgservice
     * @returns {collection_service_L3.collectionService.service}
     */
    function collectionService($log, msgservice) {

        var service = {
            setCurrDataCollection: setCurrDataCollection,
            addDataCollection: addDataCollection,
            removeDataCollection: removeDataCollection,
            getDataCollectionIds: getDataCollectionIds,
            getDataCollections: getDataCollections,
            getCurrDataCollection: getCurrDataCollection,
            toggleSample: toggleSample,
            addSample: addSample,
            removeSample: removeSample,
            getSelectedSamples: getSelectedSamples,
            moveCollectionUp: moveCollectionUp,
            moveCollectionDown: moveCollectionDown,
            setLabel: setLabel,
            getLabel: getLabel
        };

        var dataCollectionIds = []; // hier wird die Reihenfolge der collections gespeichert
        var dataCollections = {};
        var currDataCollection = 0;
        var labelForCollections = {};

        var msg = msgservice;
        var events = {
            col_added:      'collectionservice.collection.added',
            col_pre_delete: 'collectionservice.collection.pre_delete',
            col_deleted:    'collectionservice.collection.deleted',
            col_changed:    'collectionservice.collection.changed',
            col_pre_reset:  'collectionservice.collection.pre_reset',
            col_reset:      'collectionservice.collection.reset',
            sample_added:   'collectionservice.sample.added',
            sample_removed: 'collectionservice.sample.removed'
        };
        
        /**
         * Fuege eine neue collection hinzu.
         * 
         * @returns {item|Number} zugewiesene Id
         */
        function addDataCollection() {
            var id = 0;
            dataCollectionIds.forEach(function (item, index, array) {
                if (id <= item) {
                    id = item;
                    id++;
                }
            });
            dataCollectionIds.unshift(id);
            dataCollections[id] = {};
            setCurrDataCollection(id);
            addDefaultLabel(id);
            msg.notify(events.col_added, id);
            return id;
        }
        
        function addDefaultLabel(colId) {
            labelForCollections[colId] = 'Plot ' + colId;
        }
        
        function removeLabel(colId) {
            delete labelForCollections[colId];
        }
        
        function setLabel(colId, value) {
            labelForCollections[colId] = value;
        }
        
        function getLabel(colId) {
            return labelForCollections[colId];
        }
        
        /**
         * Losche die collection.
         * 
         * @param {type} id
         * @returns {undefined}
         */
        function removeDataCollection(id) {
            if (dataCollectionIds.length > 1) {
                // entferne aus array
                var pos = dataCollectionIds.indexOf(id);
                if (pos > -1) {
                    dataCollectionIds.splice(pos, 1);
                }
                // entferne aus data object
                msg.notify(events.col_pre_delete, id);
                delete dataCollections[id];
                msg.notify(events.col_deleted, id);
                
                // setzte die naechste collection als die aktuelle
                if (currDataCollection === id) {
                    setCurrDataCollection(dataCollectionIds[0]);
                }
                
                removeLabel(id);
                
                // letzte collection wird nicht geloescht, nur deren samples.
            } else if (dataCollectionIds.length === 1) {
                resetCollection(id);
                
                removeLabel(id);
                addDefaultLabel(id);
            }
        }
        
        /**
         * Alle Samples einer collection werden aus ihr geloescht.
         * 
         * @param {type} colId
         * @returns {undefined}
         */
        function resetCollection(colId) {
            if(!isEmpty(dataCollections[colId])) {
                msg.notify(events.col_pre_reset, colId);
                dataCollections[colId] = {};
                msg.notify(events.col_reset, colId);
            }
        }

        /**
         * Liefert alle Ids von dataCollections.
         * 
         * @returns {Array}
         */
        function getDataCollectionIds() {
            return dataCollectionIds;
        }
        
        /**
         * Liefert alle dataCollections
         * 
         * @returns Object
         */
        function getDataCollections() {
            return dataCollections;
        }
        
        /**
         * Setzt die zum editieren gewaehlte collection.
         * 
         * @param {type} currDC
         * @returns {undefined}
         */
        function setCurrDataCollection(currDC) {
            if (currDataCollection === currDC) {
                return;
            }
            currDataCollection = currDC;
            msg.notify(events.col_changed, currDataCollection);
        }
        
        /**
         * Liefert die zum editieren gewaehlte collection.
         * 
         * @returns {Number|currDC} colId
         */
        function getCurrDataCollection() {
            return currDataCollection;
        }
        
        /**
         * Wenn sample in collection dann wird es entfernt, andernfalls 
         * hinzugefuegt.
         * 
         * @param {type} sampleId
         * @param {type} metagenome
         * @returns {undefined}
         */
        function toggleSample(sampleId, metagenome) {
            if (dataCollections[currDataCollection]
                    && dataCollections[currDataCollection][metagenome]
                    && dataCollections[currDataCollection][metagenome].indexOf(sampleId) !== -1) {

                removeSample(sampleId, metagenome);

            } else {
                addSample(sampleId, metagenome);
            }
        }

        /**
         * Sample wird der collection hinzugefuegt.
         * 
         * @param {type} sampleId
         * @param {type} metagenome
         * @param {type} colId
         * @returns {undefined}
         */
        function addSample(sampleId, metagenome, colId) {
            if(colId === undefined) {
                colId = currDataCollection;
            }
            if (!dataCollections[colId]) {
                dataCollections[colId] = {};
            }
            if (!dataCollections[colId][metagenome]) {
                dataCollections[colId][metagenome] = [];
            }
            var pos = dataCollections[colId][metagenome][sampleId];
            if (pos > -1) {
                return;
            }
            dataCollections[colId][metagenome].push(sampleId);
            var notifyData = {};
            notifyData.metagenome = metagenome;
            notifyData.sampleId = sampleId;
            notifyData.colId = colId;
            msg.notify(events.sample_added, notifyData, 'added:' + sampleId + ' in ' + currDataCollection);
        }

        /**
         * Sample wird aus collection entfernt.
         * 
         * @param {type} sampleId
         * @param {type} metagenome
         * @param {type} colId
         * @returns {undefined}
         */
        function removeSample(sampleId, metagenome, colId) {
            if(colId === undefined) {
                colId = currDataCollection;
            }
            if (!(dataCollections[colId]
                    && dataCollections[colId][metagenome]
                    && dataCollections[colId][metagenome].indexOf(sampleId) !== -1)) {
                
                return;
            }
            var pos = dataCollections[colId][metagenome].indexOf(sampleId);
            if (pos >= 0) {
                dataCollections[colId][metagenome].splice(pos, 1);
            }
            if ( dataCollections[colId][metagenome].length === 0 ) { // wenn metagenome keine samples enth loeschen
                delete dataCollections[colId][metagenome];
            }
            var notifyData = {};
            notifyData.metagenome = metagenome;
            notifyData.sampleId = sampleId;
            notifyData.colId = colId;
            msg.notify(events.sample_removed, notifyData, 'removed:' + sampleId + ' from ' + colId);
        }
        
        /**
         * Liefert die samples der collection.
         * 
         * @param {type} collectionId
         * @param {type} debug
         * @returns {unresolved}
         */
        function getSelectedSamples(collectionId, debug) {
            var selectedSamples = {};
            for (var metagenome in dataCollections[collectionId]) {
                var selectedSamples_ = dataCollections[collectionId][metagenome];
                selectedSamples[metagenome] = [];
                for (var smpl in selectedSamples_) {
                    selectedSamples[metagenome].push(selectedSamples_[smpl]);
                }
            }
            return selectedSamples;
        }
        
        /**
         * Bewegt die collection in dem dataCollectionIds array eine 
         * Position aufwaerts.
         * 
         * @param {type} colId
         * @returns {undefined}
         */
        function moveCollectionUp(colId) {
            moveUp(dataCollectionIds, colId, 1);
        }

        /**
         * Bewegt die collection in dem dataCollectionIds array eine 
         * Position abwaerts.
         * 
         * @param {type} colId
         * @returns {undefined}
         */
        function moveCollectionDown(colId) {
            moveDown(dataCollectionIds, colId, 1);
        }
        
        // Hilfsfunktion
        function isEmpty(obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop))
                    return false;
            }
            return true && JSON.stringify(obj) === JSON.stringify({});
        }

        // Hilfsfunktion
        function moveUp(arr, value, by) {
            var index = arr.indexOf(value);
            var newPos = index - (by || 1);
            if (index === -1) {
                throw new Error("Element not found in array");
            }  
            if (newPos < 0) {
                newPos = 0;
            } 
            arr.splice(index, 1);
            arr.splice(newPos, 0, value);
        }

        // Hilfsfunktion
        function moveDown(arr, value, by) {
            var index = arr.indexOf(value);
            var newPos = index + (by || 1);
            if (index === -1) {
                throw new Error("Element not found in array");
            }
            if (newPos >= arr.length) {
                 newPos = arr.length;
            }
            arr.splice(index, 1);
            arr.splice(newPos, 0, value);
        }
        
        return service;
    }
})();
