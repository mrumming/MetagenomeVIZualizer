(function () {
    angular
            .module("metaStoneCharts")
            .directive('selectionTable', selectionTable);
    
    selectionTable.$inject = [];
    function selectionTable() {
        var directive = {
            priority: 100,
            restrict: 'E',
            templateUrl: 'directives/selectionTable/selectionTable.template.html',
            scope: true,
            controller: SelectionTableCntrl,
            controllerAs: 'cntrl'
        };
        return directive;
    };
    
    SelectionTableCntrl.$inject = ['$log', 'collectionservice', 'msgservice', 'metadataservice', 'preferences'];
    function SelectionTableCntrl($log, collectionservice, msgservice, metadataservice, preferences) {
        var vm = this;
        vm.colservice = collectionservice;
        vm.metaData = [];
        if(preferences.data_loaded) {
            vm.metaData[0] = metadataservice.getMetadata();
        }
        vm.selected = {};
        vm.selectAll = function(metagenome) {
            var samples = vm.metaData[0][metagenome].samples;
            var colId = collectionservice.getCurrDataCollection();
            for(var sampleId in samples) {
                
                if(vm.selected[colId] === undefined) {
                    vm.selected[colId] = {};
                }
                if(vm.selected[colId][metagenome] === undefined) {
                    vm.selected[colId][metagenome] = {};
                }
                if(vm.selected[colId][metagenome][sampleId] === undefined 
                        || vm.selected[colId][metagenome][sampleId] === false) {
                    
                    collectionservice.toggleSample(sampleId, metagenome);
                    vm.selected[colId][metagenome][sampleId] = true;
                }
            }
        };
        
        var msg = msgservice;
        var incommingEvents = {
            col_changed:    'collectionservice.collection.changed',
            col_reset:      'collectionservice.collection.reset',
            col_deleted:    'collectionservice.collection.deleted',
            data_loaded:    'dataservice.data.loaded',
            sample_removed: 'collectionservice.sample.removed'
        };
        var callback = function (event, data) {
            var colId_;
            switch (event) {
                case incommingEvents.col_reset: 
                case incommingEvents.col_deleted:
                    colId_ = data;
                    vm.selected[colId_] = [];
                    break;
                    
                case incommingEvents.data_loaded:
                    vm.metaData[0] = metadataservice.getMetadata();
                    break;
                    
                case incommingEvents.sample_removed:
                    var metagenome = data.metagenome;
                    var sampleId = data.sampleId;
                    var colId_ = data.colId;
                    vm.selected[colId_][metagenome][sampleId] = false;
                    break;
            }
        };
        msg.register(callback);
    };
})();

