'use strict';

(function(){
    angular
            .module("metaStoneCharts")
            .directive("prefPanel", prefPanel)
            .controller("prefPanelCntrl", prefPanelCntrl);
    
    prefPanel.$inject = [];
    function prefPanel() {
        var directive = {
            restrict: 'E',
            templateUrl: 'directives/prefPanel/prefPanel.template.html',
            scope: true,
            controller: prefPanelCntrl,
            controllerAs: 'cntrl'
        };
        return directive;
    }

    prefPanelCntrl.$inject = ['$log', 'collectionservice', 'characteristicservice', 'prefservice', 'preferences', 'exportservice'];
    function prefPanelCntrl($log, collectionservice, charactaristicservice, prefservice, preferences, exportservice) {
        var vm = this;
        vm.colservice = collectionservice;
        vm.chservice = charactaristicservice;
        vm.pservice = prefservice;
        
        vm.setToSingle = function() {
            prefservice.modify('combined','single'); 
            prefservice.modify('chart','pie');
            vm.chartRadioModel = 'pie';
        };
        
        var prefs = preferences;
        
        vm.trashholdModel = {
            setter: function(newVal) {
                if(isNumeric(newVal) || newVal >= 0 || newVal <= 100) {
                    prefservice.setTrashhold(newVal);
                }
                return preferences.trashhold;
            }
        };
        
        vm.barchartLabelModel = prefs.showBarLabels;

        vm.chartRadioModel    = prefs.chart.pie ? 'pie' : 'bar';
        vm.combinedRadioModel = prefs.combined.combined ? 'combined' : 'single';

        vm.exportAll = function () {
            var html = exportservice.getAllHtml();
            exportservice.saveToFile(html);
        };

        function isNumeric(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }
    }
})();


