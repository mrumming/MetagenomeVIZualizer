'use strict';

(function() {
    angular
            .module('metaStoneCharts')
            .factory('graphservice', graphservice);
    
    graphservice.$inject = ['$log', 'colorservice', 'labelservice', 'metadataservice', 'preferences'];
    /**
     * Stellt die Optionen fuer die unterschiedlichen charts bereit, und berechnet
     * den chart-input anhand von uebergebenen samples und weiteren Parametern.
     * 
     * @param {type} $log
     * @param {type} colorservice
     * @param {type} labelservice
     * @param {type} metadataservice
     * @param {type} preferences
     * @returns {graph_service_L3.graphservice.service}
     */
    function graphservice ($log, colorservice, labelservice, metadataservice, preferences) {
        var service = {
          generateGraphFromSamples: generateGraphFromSamples,
          getPiechartOptions: getPiechartOptions,
          getBarchartOptions: getBarchartOptions,
          getSinglePiechartOptions: getSinglePiechartOptions,
          modForBarchart: modForBarchart
        };
        
        var colorFkt = function (t, u) {
            var key = t.key;
            if (labelservice.isLabelActive(key)) {
                return colorservice.getColor(key);
            }
            return colorservice.getDeactiveColor();
        };
        
        /**
         * Getter fuer die combined barchart Optionen.
         * @returns {graph_service_L3.graphservice.getBarchartOptions.graph.serviceAnonym$0}
         */
        function getBarchartOptions() {
            var marg_bottom = preferences.showLabels ? 100 : 10;
            return {
                chart: {
                    type: 'discreteBarChart',
                    height: 250,
                    margin: {
                        top: 15,
                        right: 20,
                        bottom: marg_bottom,
                        left: 35
                    },
                    x: function (d) {
                        return d.key;
                    },
                    y: function (d) {
                        return d.y;
                    },
                    color: colorFkt,
                    showValues: false,
                    valueFormat: function (d) {
                        return d3.format(',.4f')(d);
                    },
                    wrapLabels: true,
                    showXAxis: preferences.showLabels,
                    rotateLabels: -90,
                    staggerLabels: true,
                    xAxis: {
                        axisLabel: ''
                    },
                    yAxis: {
                        axisLabel: 'Amount in %',
                        axisLabelDistance: -5
                    },
                    forceY: [0, 100]
                }
            };
        }
        
        /**
         * Getter fuer die combined piechart Optionen.
         * @returns {graph_service_L3.graphservice.getPiechartOptions.graph.serviceAnonym$1}
         */
        function getPiechartOptions() {
            return {
                chart: {
                    type: 'pieChart',
                    height: 400,
                    width: 400,
                    x: function (d) {
                        return d.key;
                    },
                    y: function (d) {
                        return d.y;
                    },
                    showLegend: false,
                    showLabels: preferences.showLabels,
                    labelThreshold: 0.05,
                    labelSunbeamLayout: true,
                    labelsOutside: false,
                    color: colorFkt
                }
            };
        }
        
        /**
         * Getter fuer die single piechart Optionen.
         * @returns {graph_service_L3.graphservice.getSinglePiechartOptions.graph.serviceAnonym$2}
         */
        function getSinglePiechartOptions() {
            return {
                chart: {
                    type: 'pieChart',
                    height: 270,
                    width: 270,
                    x: function (d) {
                        return d.key;
                    },
                    y: function (d) {
                        return d.y;
                    },
                    showLegend: false,
                    showLabels: preferences.showLabels,
                    labelThreshold: 0.05,
                    labelSunbeamLayout: true,
                    labelsOutside: false,
                    color: colorFkt
                }
            };
        }
        
        /**
         * Input Daten unterscheiden sich von bar- zu piechart, Modifikation
         * der Daten fuer den barchart:
         *  
         * key: name des charts
         * values: das eigentliche graphdata Objekt.
         * 
         * @param {type} graphdata
         * @returns {graph_service_L3.graphservice.modForBarchart.graphdata_}
         */
        function modForBarchart(graphdata) {
            var graphdata_ = [{
                key: 'barchart',
                values: graphdata
            }];
            return graphdata_;
        }
        
        /**
         * Generiert aus der metadataMap und den uebergebenen samples die Daten fuer den Graphen.
         * 
         * @param {type} samples
         * @param {type} characteristic 
         * @param {type} subcharacteristic 
         * @param {type} isRaw raw version der samples verwenden
         * @param {type} initColorMap initialisiere colormap
         * @param {type} fillLabels hinzufuegen von null-Labeln (Barchart)
         * @returns {Array}
         */
        function generateGraphFromSamples(samples, characteristic, subcharacteristic, isRaw, initColorMap, fillLabels) {
            if (subcharacteristic === undefined || subcharacteristic === '') {
                return [];
            }
            var metadata = metadataservice.getMetadata();
            var cntAll = 0;
            var graphdata = [];
            var tmp = {};
            var ri = isRaw ? 'raw' : 'inf';
            
            for (var metagenome in samples) {
                samples[metagenome].forEach(function (sampleId, index, array) {

                    if ( metadata[metagenome].samples[sampleId].characteristics[characteristic] 
                            && metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic]) {
                        
                        for (var label in metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic][ri]) {
                            var label_cnt = metadata[metagenome].samples[sampleId].characteristics[characteristic][subcharacteristic][ri][label];
                            cntAll += label_cnt;
                            
                            if (/*trashholdservice.isLabelTrashholded(label) ||*/ !labelservice.isLabelActive(label)) {
                                continue;
                            }
                            if(tmp[label] === undefined) {
                                tmp[label] = 0;
                            }
                            tmp[label] += label_cnt;
                        }
                    }
                });
            }
            var labelForColorInit = [];
            var allLabelsSorted = labelservice.getLabelsSorted();
            allLabelsSorted.forEach(function (key) {
                var m = {};
                m.key = key;
                
                if (key in tmp) {
                    m.y = tmp[key];
                    if (m.y > 0 && cntAll > 0) {
                        m.y = (m.y / (1.0 * cntAll)) * 100;  // setze Wert auf Prozent
                    } else {
                        m.y = 0;
                    }
                    graphdata.push(m);
                } else if (fillLabels !== undefined && fillLabels 
                        && labelservice.isLabelActive(key) /*&& !trashholdservice.isLabelTrashholded(key)*/) {
                    
                    m.y = 0;
                    graphdata.push(m);
                }
                labelForColorInit.push(key);
            });
            if (initColorMap) {
                colorservice.initColorMap(labelForColorInit);
            }
            return graphdata;
        }

        return service;
    }
})();