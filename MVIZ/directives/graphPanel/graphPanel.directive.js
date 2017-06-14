'use strict';

(function(){
    angular
            .module("metaStoneCharts")
            .directive("graphPanel", graphPanel);
    
    graphPanel.$inject = [];
    function graphPanel() {
        var directive = {
            restrict: 'E',
            templateUrl: 'directives/graphPanel/graphPanel.template.html',
            scope: {
                datacollectionid : '='
            },
            controller: graphPanelCntrl,
            controllerAs: 'cntrl'
        };
        return directive;
    }

    graphPanelCntrl.$inject = ['$scope', '$log', 'msgservice', 'graphservice', 'collectionservice', 
        'characteristicservice', 'preferences', 'metadataservice','prefservice',
        'progressservice', 'exportservice'];
    
    function graphPanelCntrl($scope, $log, msgservice, graphservice, collectionservice, 
    characteristicservice, preferences, metadataservice, prefservice, 
    progressservice, exportservice) {
        
        var vm = this;
        vm.service = collectionservice;
        vm.collectionId = $scope.datacollectionid;
        vm.isUncollapsed = true;
        vm.isDataCollectionActive = true;
        vm.activateDataCollection = function() {
            collectionservice.setCurrDataCollection(vm.collectionId);
            vm.isDataCollectionActive = true;
        };
        vm.rawinfRadioModel = 'raw';//prefservice.isCollectionRaw(vm.collectionId) ? 'raw': 'infered';
        vm.rawinf = function() {
            var isBar = preferences.chart.bar;
            var isPie = !isBar;
            var isRaw = vm.rawinfRadioModel === 'raw';
            var isInf = !isRaw;
            
            if(isPie && isInf) {
                prefservice.setCollectionInf(vm.collectionId, true);
                
            } else {
                prefservice.setCollectionRaw(vm.collectionId, isRaw);
                prefservice.setCollectionInf(vm.collectionId, isInf);
            }
            updateGraphdata(false);
        };
        vm.combinedGraphdata = [];
        vm.combinedGraphdata_inf = [];
        vm.singleGraphdata = [];
        vm.singleGraphdata_inf = [];
        
        vm.graphoptions = graphservice.getPiechartOptions();
        vm.graphoptions_single = graphservice.getSinglePiechartOptions();
        
        vm.isCombinedGraphdata = preferences.combined.combined;
        vm.collectionMetadata = [];
        
        /*ng-switch*/
        var ngSwitchItems = [
            "combined__raw_pie_or_*_bar",
            "combined__inf_pie",
            "single__raw",
            "single__inf"
        ];
        vm.ngSwitchModel;
        updateNgSwitchModel();
        
        /*Editierbares label*/
        vm.labelEditEnabled = false;
        vm.labelText = collectionservice.getLabel(vm.collectionId);
        vm.saveLabel = function () {
            collectionservice.setLabel(vm.collectionId, vm.labelText);
            vm.labelEditEnabled = false;
        };
        
        /*Export funktion*/
        vm.divId = 'graphplot_' + vm.collectionId;
        vm.export = function () {
            var html = exportservice.getSingleHtml(vm.divId);
            exportservice.saveToFile(html);
        };

        var msg = msgservice;
        var incommingEvents = {
            label_deactivated:  'graphservice.label.activated',
            label_activated:    'graphservice.label.deactivated',
            label_changed:      'graphservice.label.changed',
            col_deleted:        'collectionservice.collection.deleted',
            col_reset:          'collectionservice.collection.reset',
            col_changed:        'collectionservice.collection.changed',
            sample_added:       'collectionservice.sample.added',
            sample_removed:     'collectionservice.sample.removed',
            char_changed:       'characteristicservice.characteristic.changed',
            subchar_changed:    'characteristicservice.subcharacteristic.changed',
            pref_changed:       'prefservice.pref.changed',
            mod_trashhold:      'prefservice.pref.trashhold.changed',
            mod_labels:         'prefservice.pref.labels.changed'
        };
        var callback = function (event, data) {
            switch(event) {
                case incommingEvents.label_deactivated:
                case incommingEvents.label_activated:
                case incommingEvents.pref_changed:
                case incommingEvents.mod_trashhold:
                case incommingEvents.mod_labels:
                    updateGraphdata(false);
                    break;
                case incommingEvents.sample_added:
                case incommingEvents.sample_removed:
                    // nur neu zeichnen wenn ein sample zu dieser collection hinzugefuegt wurde
                    var colId = data.colId;
                    if (vm.collectionId === colId) {
                        updateGraphdata(false);
                        updateMetadata();
                    }
                    break
                case incommingEvents.subchar_changed:
                    progressservice.add(vm.collectionId);
                    updateGraphdata(true);
                    progressservice.remove(vm.collectionId);
                    break;
                case incommingEvents.label_changed:
                    if (preferences.chart.bar === true) {
                        progressservice.add(vm.collectionId);
                        updateGraphdata(true);
                        progressservice.remove(vm.collectionId);
                    }
                    break;
                case incommingEvents.col_changed:
                    if (vm.collectionId === collectionservice.getCurrDataCollection()) {
                        vm.isDataCollectionActive = true;
                    } else {
                        vm.isDataCollectionActive = false;
                    }
                    break;  
                case incommingEvents.col_deleted:
                    if(data === vm.collectionId) {
                        msg.unregister(callback, 'graphpanel ' + vm.collectionId);
                    }
                    break;
                case incommingEvents.col_reset:
                    if (data === vm.collectionId) {
                        updateGraphdata(false);
                        updateMetadata();
                    }
                    break;
            }
        };
        msg.register(callback);

        /**
         * Den ausgewaehlten buttons entsprechend wird hier die
         * zugehoerige graph-Ansicht aktiviert.
         * 
         * @returns {undefined}
         */
        function updateNgSwitchModel() {
            var isSingle = preferences.combined.single;
            var isCombined = !isSingle;
            var isBar = preferences.chart.bar;
            var isPie = !isBar;
            var isRaw = vm.rawinfRadioModel === 'raw';
            var isInf = !isRaw;
            
            if (isCombined && ((isRaw && isPie) || isBar)) {
                vm.ngSwitchModel = ngSwitchItems[0]; // "combined__raw_pie_or_*_bar",

            } else if (isCombined && isInf && isPie) {
                vm.ngSwitchModel = ngSwitchItems[1]; // "combined__inf_pie",

            } else if (isSingle && isRaw) {
                vm.ngSwitchModel = ngSwitchItems[2]; // "single__raw",

            } else if (isSingle && isInf) {
                vm.ngSwitchModel = ngSwitchItems[3]; // "single__inf"
            }
        }
        
        /**
         * Zuruecksetzen aller graph-Daten.
         * 
         * @returns {undefined}
         */
        function resetGraphData() {
            vm.combinedGraphdata = [];
            vm.combinedGraphdata_inf = [];
            vm.singleGraphdata = [];
            vm.singleGraphdata_inf = [];
        }

        function updateGraphdata(initColorMap) {
            updateNgSwitchModel();
            resetGraphData();
            
            var isSingle = preferences.combined.single;
            if(isSingle) {
                updateSingleGraphdata(initColorMap);
                vm.isCombinedGraphdata = false;
                $log.debug('update: single graphdata');
                
            } else {
                updateCombinedGraphdata(initColorMap);
                vm.isCombinedGraphdata = true;
                $log.debug('update: combined graphdata');
            }
        }
        
        /**
         * Update der Informationen zu der aktuellen Datenauswahl
         * (#Metagenome, #Genome, #Samples).
         * 
         * @returns {undefined}
         */
        function updateMetadata() {
            var samples = collectionservice.getSelectedSamples(vm.collectionId, 'graph.panel');
            vm.collectionMetadata[0] = metadataservice.getMetadataForCollection(samples);
        }
        
        /**
         * Berechnet die graph-Daten fuer die single Ansicht.
         * 
         * @param {type} initColorMap neu initialisieren der colormap.
         * @returns {Array}
         */
        function updateSingleGraphdata(initColorMap) {
            vm.graphoptions_single = graphservice.getSinglePiechartOptions();
            vm.singleGraphdata = [];
            var samples = collectionservice.getSelectedSamples(vm.collectionId, 'graph.panel');
            var fillLabels = false;
            var isRaw = vm.rawinfRadioModel === 'raw';
            var metadata = metadataservice.getMetadata();
            
            for (var metagenome in samples) {
                var metagenome_samples = samples[metagenome];
                for (var sample in metagenome_samples) {
                    var singleSample = {};
                    singleSample[metagenome] = [metagenome_samples[sample]];
                    var ssobject = {}; // single sample objekt
                    ssobject.metagenome = metagenome;
                    ssobject.metagenome_name = metadata[metagenome].name;
                    ssobject.sampleId = metagenome_samples[sample];
                    ssobject.data = getGraphdata(initColorMap, singleSample, fillLabels, true);
                    if(!isRaw) {
                       ssobject.data_inf = getGraphdata(initColorMap, singleSample, fillLabels, false);
                    }
                    vm.singleGraphdata.push(ssobject);
                }
            }
            return vm.singleGraphdata;
        }
        
        /**
         * Berechnet die graph-Daten fuer die combined Ansicht.
         * 
         * @param {type} initColorMap neu initialisieren der colormap.
         * @returns {Array}
         */
        function updateCombinedGraphdata(initColorMap) {
            vm.combinedGraphdata = [];
            vm.combinedGraphdata_inf = [];
            //vm.combinedGraphdata_inf[0] = {};
            var samples = collectionservice.getSelectedSamples(vm.collectionId, 'graph.panel');

            var isBar = preferences.chart.bar;
            var isPie = !isBar;
            var isRaw = vm.rawinfRadioModel === 'raw';
            var isInf = !isRaw;
            var fillLabels;
            
            if(isBar) {
                fillLabels = true;
                vm.graphoptions = graphservice.getBarchartOptions();
                vm.combinedGraphdata = graphservice.modForBarchart(getGraphdata(initColorMap, samples, fillLabels, isRaw));
                
            } else if (isPie && isRaw) {
                fillLabels = false;
                vm.graphoptions = graphservice.getPiechartOptions();
                vm.combinedGraphdata = getGraphdata(initColorMap, samples, fillLabels, true);
                
            } else if (isPie && isInf) {
                fillLabels = false;
                vm.graphoptions = graphservice.getPiechartOptions();
                vm.combinedGraphdata = getGraphdata(initColorMap, samples, fillLabels, true);
                vm.combinedGraphdata_inf = getGraphdata(initColorMap, samples, fillLabels, false);
            }
        }
        
        /**
         * Hilfsfunktion die den graphservice anspricht.
         * 
         * @param {type} initColorMap initialisierung der color map
         * @param {type} samples die zu zeichnenden samples
         * @param {type} fillLabels einfuegen von 0 Labeln aus anderen Plots.
         * @param {type} isRaw 
         * @returns {unresolved}
         */
        function getGraphdata(initColorMap, samples, fillLabels, isRaw) {
            var gd = graphservice.generateGraphFromSamples(
                    samples,
                    characteristicservice.getCharacteristic(),
                    characteristicservice.getSubcharacteristic(),
                    isRaw,
                    initColorMap,
                    fillLabels);
            return gd;
        }
    }
})();