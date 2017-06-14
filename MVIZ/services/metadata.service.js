'use strict';

(function () {
    angular
            .module('metaStoneCharts')
            .factory('metadataservice', metadataservice);

    metadataservice.$inject = ['$log'];
    /**
     * Berechnet ein Metadaten Objekt aus dem geladenen Datensatz,
     * das Metadaten Objekt erlaubt einen effizienteren Zugriff auf
     * counts die andernfalls viele Iterationen ueber den primaeren
     * Datensatz erfordert haetten.
     * 
     * @param {type} $log
     * @returns {metadata_service_L3.metadataservice.service}
     */
    function metadataservice($log) {

        var service = {
            getMetadata: getMetadata,
            getMetadataForCollection: getMetadataForCollection,
            calculateMetadataMap: calculateMetadataMap
        };
        
        
//        Example:
//          
//        var metainfo = {
//            mockdata: {
//                sampleCnt: 8,
//                genomes_raw: 500,
//                genomes_inf: 700,
//                profile_type: '',
//                name: 'mockdata',
//                samples: {
//                    sampleId1: {
//                       characteristics: {
//                         "Ecosystem related characteristics": {
//                            "Ecosystem": {
//                                "raw": {
//                                    "label1": 100,
//                                    "label2": 300,
//                                    "label3": 50
//                                },
//                                "inf": {
//                                    "label1": 100,
//                                    "label2": 300,
//                                    "label3": 50
//                                }
//                            },
//                            "Ecosystem Subtype": {
//                                "raw": {
//                                    "label4": 100,
//                                    "label5": 300,
//                                    "labelx": 50
//                                },
//                                "inf": {
//                                    "label4": 100,
//                                    "label5": 300,
//                                    "labely": 50
//                                }
//                            },
//                            ...
//                        },
//                        ...
//                        }
//                    }
//                }
//            }
//        };     
        var metadata;

        /**
         * Getter fuer das metadata-Objekt.
         * 
         * @returns {unresolved}
         */
        function getMetadata() {
            if (metadata === undefined) {
                throw new Error("load data fist with the 'dataservice'");
            }
            return metadata;
        }
        
        /**
         * Liefert die der samples innerhalb einer collection.
         * @param {type} samples
         * @returns {metadata_service_L3.metadataservice.getMetadataForCollection.meta}
         */
        function getMetadataForCollection(samples) {
            var metagenomeCnt = 0;
            var sampleCnt = 0;
            var genomeCnt = 0;
            for (var metagenome in samples) {
                metagenomeCnt++;
                samples[metagenome].forEach(function (sampleId, index, array) {
                    sampleCnt++;
                    genomeCnt += metadata[metagenome].samples[sampleId].genomes;
                });
            }
            var meta = {};
            meta.metagenomes = metagenomeCnt;
            meta.samples = sampleCnt;
            meta.genomes = genomeCnt;
            
            return meta;
        }

        /**
         * Berechnet die metadatamap.
         * 
         * @param {type} data
         * @returns {undefined}
         */
        function calculateMetadataMap(data) {
            //var data = dataservice.getData();
            if (data === undefined || data === {}) {
                return;
            }
            metadata = {};
            for (var metagenome in data.metagenomes) {
                metadata[metagenome] = {};
                metadata[metagenome].sampleCnt = 0;
                metadata[metagenome].genomes = 0;
                metadata[metagenome].profile_type = data.metagenomes[metagenome].profile_type;
                metadata[metagenome].name = data.metagenomes[metagenome].name;
                metadata[metagenome].samples = {};
                for (var sampleId in data.metagenomes[metagenome].samples) {
                    metadata[metagenome].samples[sampleId] = {};
                    metadata[metagenome].samples[sampleId].genomes = 0;
                    
                    if (metadata[metagenome].samples[sampleId].characteristics === undefined) {
                        metadata[metagenome].samples[sampleId].characteristics = {};
                    }

                    //data.metagenomes[metagenome].forEach(function (sampleId, index, array) {
                    // zaehle raw Genome
                    for (var genome in data.metagenomes[metagenome].samples[sampleId]) {
                        var genomeCnt = data.metagenomes[metagenome].samples[sampleId][genome];
                        // counts:
                        // fuer sample
                        metadata[metagenome].samples[sampleId].genomes 
                                += genomeCnt;
                        
                        // gesamt fuer metagenome
                        metadata[metagenome].genomes
                                += genomeCnt;
                        
                        for(var characteristic in data.genomes[genome]) {
                            if (metadata[metagenome].samples[sampleId].characteristics[characteristic] === undefined) {
                                metadata[metagenome].samples[sampleId].characteristics[characteristic] = {};
                            }
                            for(var subcharacteristic in data.genomes[genome][characteristic]) {
                                // initialize
                                if (metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic] === undefined) {
                                    metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic] = {};
                                }
                                if (metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic].raw === undefined) {
                                    metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic].raw = {};
                                }
                                if (metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic].inf === undefined) {
                                    metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic].inf = {};
                                }
                                // get label for raw and inf
                                var label_raw = data.genomes[genome][characteristic][subcharacteristic][0];
                                var label_inf = data.genomes[genome][characteristic][subcharacteristic][1];
                                label_raw = substituteLabel(label_raw);
                                label_inf = substituteLabel(label_inf);
                                
                                // insert label in metaMap and add the genome count
                                if(label_raw in metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic].raw) {
                                    metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic].raw[label_raw] += genomeCnt;
                                } else {
                                    metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic].raw[label_raw] = genomeCnt;
                                }
                                if (label_inf in metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic].inf) {
                                    metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic].inf[label_inf] += genomeCnt;
                                } else {
                                    metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic].inf[label_inf] = genomeCnt;
                                }
                            }
                        }
                    }
                    metadata[metagenome].sampleCnt += 1;
                }
            }
        }
        
        /**
         * Ersetzt Label Namen.
         * 
         * @param {type} label
         * @returns {String}
         */
        function substituteLabel(label) {
            if (
                    label === '' || 
                    label === 'Unknown' || 
                    label === 'unknown' || 
                    label === 'unclassified' || 
                    label === 'Unclassified') {
                
                return 'Not defined';
            }
            return label;
        }

        return service;
    }
}());
