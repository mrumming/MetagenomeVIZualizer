'use strict';

(function () {
    angular
            .module('metaStoneCharts')
            .factory('characteristicservice', characteristicService);

    characteristicService.$inject = ['$log','metadataservice', 'msgservice', 'collectionservice'];
    /**
     * Service der die ausgewaehlten characteristics zentral speichert und
     * die vorhandenen characteristics anhand der vorhandenen samples bereitstellt.
     * 
     * Events:
     * characteristicservice.characteristic.changed characteristic geaendert
     * characteristicservice.subcharacteristic.changed subcharacteristic geaendert
     * 
     * @param {type} $log
     * @param {type} metadataservice
     * @param {type} msgservice
     * @param {type} collectionservice
     * @returns {characteristic_service_L3.characteristicService.service}
     */
    function characteristicService($log, metadataservice, msgservice, collectionservice) {

        var service = {
            selectCharacteristic: selectCharacteristic,
            selectSubcharacteristic: selectSubcharacteristic,
            getCharacteristics: getCharacteristics,
            getSubcharacteristics: getSubcharacteristics,
            getCharacteristic: getCharacteristic,
            getSubcharacteristic: getSubcharacteristic
        };
        
        var characteristics = {};
        var selectedCharacteristic = '';
        var selectedSubcharacteristic = '';
                
        var msg = msgservice;
        var events = {
            c_changed:      'characteristicservice.characteristic.changed',
            s_c_changed:    'characteristicservice.subcharacteristic.changed'
        };
        var incomming_events = {
            sample_added:   'collectionservice.sample.added',
            sample_removed: 'collectionservice.sample.removed',
            col_pre_delete: 'collectionservice.collection.pre_delete',
            col_pre_reset:  'collectionservice.collection.pre_reset',
            col_deleted:    'collectionservice.collection.deleted',
            col_reset:      'collectionservice.collection.reset'
        };
        var callback = function (event, data) {
            switch (event) {
                case incomming_events.sample_added:
                case incomming_events.sample_removed:
                case incomming_events.col_deleted:
                case incomming_events.col_reset:
                    updateCharacteristics();
                    break;
            }
        };
        msg.register(callback);
        
        /**
         * Holt alle subcharacteristics aus den ausgewaehlten samples.
         * 
         * @returns {undefined}
         */
        function updateCharacteristics() {
            characteristics = {};
            var datacollections = collectionservice.getDataCollections();
            
            for (var dataCol in datacollections) {
                for (var metagenome in datacollections[dataCol]) {
                    var samples = datacollections[dataCol][metagenome];
                    samples.forEach(function (sampleId, index, array) {
                        addCharacteristics(metagenome, sampleId);
                    });
                }
            }
            checkAndModSelectedChars();
        }
        
        /**
         * Hilfsfunktion die fuer ein sample die characteristic-counter
         * hochsaetzt oder characteristics hinzufuegt.
         * 
         * @param {type} metagenome
         * @param {type} sampleId
         * @returns {undefined}
         */
        function addCharacteristics(metagenome, sampleId) {
            var metadata = metadataservice.getMetadata();
            var sample_characteristics = metadata[metagenome].samples[sampleId].characteristics;
            for(var char in sample_characteristics) {
                if(characteristics[char] === undefined) {
                    characteristics[char] = {};
                }
                for (var subchar in sample_characteristics[char]) {
                    if (characteristics[char][subchar] === undefined) {
                        characteristics[char][subchar] = true;
                    }
                }
            }
        }

        /**
         * Wenn das neue set aus characteristics
         * das Gewaelte nicht mehr enthaelt zuruecksetzen.
         * 
         * @returns {undefined}
         */
        function checkAndModSelectedChars() {
            if (!(selectedCharacteristic in characteristics)) {
                selectCharacteristic('');
                selectSubcharacteristic('');

            } else if (!(selectedSubcharacteristic in characteristics[selectedCharacteristic])) {
                selectSubcharacteristic('');
            }
        }

        /**
         * Setze die characteristig Gruppe.
         * 
         * @param {type} char
         * @returns {undefined}
         */
        function selectCharacteristic(char) {
            if (char === selectedCharacteristic) {
                return;
            }
            selectedCharacteristic = char;
            updateCharacteristics();
            msg.notify(events.c_changed);
        }
        
        /**
         * Getter fuer das characteristic.
         * 
         * @returns {char|String}
         */
        function getCharacteristic() {
            return selectedCharacteristic;
        }

        /**
         * Getter für alle Subcharacteristics.
         * 
         * @returns {unresolved}
         */
        function getCharacteristics() {
            return characteristics;
        }

        /**
         * Setze subcharacteristic.
         * 
         * @param {type} subchar
         * @returns {undefined}
         */
        function selectSubcharacteristic(subchar) {
            if (subchar === selectedSubcharacteristic) {
                return;
            }
            selectedSubcharacteristic = subchar;
            msg.notify(events.s_c_changed);
        }
        
        /**
         * Getter subcharacteristic.
         * 
         * @returns {subchar|String} subcharacteristic
         */
        function getSubcharacteristic() {
            return selectedSubcharacteristic;
        }
        
        /**
         * Liefert ein 
         * @returns {characteristic_service_L3.characteristicService.getSubcharacteristics.characteristic.serviceAnonym$1|characteristics.sub}
         */
        function getSubcharacteristics() {
            if(selectedCharacteristic === '' || !(selectedCharacteristic in characteristics)) {
                return {};
            }
            return characteristics[selectedCharacteristic];
        }
        
        /** DEPRECATED
         * Holt alle characteristics aus den ausgewaehlten samples
         * und setzt den counter herab.
         * 
         * @param {type} metagenome
         * @param {type} sampleId
         * @returns {undefined}
        
        function removeCharacteristics(metagenome, sampleId) {
            var metadata = metadataservice.getMetadata();
            var sample_characteristics = metadata[metagenome].samples[sampleId].characteristics;
            for (var characteristic in sample_characteristics) {
                characteristics[characteristic].cnt--;
                if (characteristics[characteristic].cnt === 0) {
                    delete characteristics[characteristic];
                }
                for (var subcharacteristic in sample_characteristics[characteristic]) {
                    if(characteristics[characteristic] === undefined) {
                        break;
                    }
                    characteristics[characteristic].sub[subcharacteristic]--;
                    if (characteristics[characteristic].sub[subcharacteristic] === 0) {
                        delete characteristics[characteristic].sub[subcharacteristic];
                    }
                } 
            } 
            
             // Wenn das neue set aus characteristics
             // das Gewaelte nicht mehr enthaelt zuruecksetzen.
             
            if (!(selectedCharacteristic in characteristics)) {
                selectCharacteristic('');
                selectSubcharacteristic('');
                
            } else if((!(selectedSubcharacteristic in characteristics[selectedCharacteristic].sub))) {
                selectSubcharacteristic('');
            }
        }*/
        
        /** DEPRECATED
         * Hilfsfunktion die fuer ein sample die characteristic-counter
         * hochsaetzt oder characteristics hinzufuegt.
         * 
         * @param {type} metagenome
         * @param {type} sampleId
         * @returns {undefined}
         
        function addCharacteristics(metagenome, sampleId) {
            var metadata = metadataservice.getMetadata();
            var sample_characteristics = metadata[metagenome].samples[sampleId].characteristics;
            for (var characteristic in sample_characteristics) {
                if (characteristics[characteristic] === undefined) {
                    characteristics[characteristic] = {};
                    characteristics[characteristic].cnt = 0;
                    characteristics[characteristic].sub = {};
                }
                characteristics[characteristic].cnt++;
                
                for (var subcharacteristic in sample_characteristics[characteristic]) {
                    if (characteristics[characteristic].sub[subcharacteristic] === undefined) {
                        characteristics[characteristic].sub[subcharacteristic] = 0;
                    }
                    characteristics[characteristic].sub[subcharacteristic]++;
                }
            }
        }*/

        /** DEPRECATED
         * Holt alle subcharacteristics aus den ausgewaehlten samples.
         * 
         * @returns {undefined}
        
        function updateCharacteristics() {
            characteristics = {};
            var datacollections = collectionservice.getDataCollections();

            for (var dataCol in datacollections) {
                for (var metagenome in datacollections[dataCol]) {
                    var samples = datacollections[dataCol][metagenome];
                    samples.forEach(function (sampleId, index, array) {
                        addCharacteristics(metagenome, sampleId);
                    });
                }
            }
        } */

        return service;
    }
})();
