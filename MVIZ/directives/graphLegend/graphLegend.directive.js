(function () {
    angular
            .module("metaStoneCharts")
            .directive("graphLegend", graphLegend);

    graphLegend.$inject = [];
    function graphLegend() {
        var directive = {
            restrict: 'E',
            templateUrl: 'directives/graphLegend/graphLegend.template.html',
            scope: true,
            controller: graphLegendCntrl,
            controllerAs: 'cntrl'
        };
        return directive;
    }

    graphLegendCntrl.$inject = [ '$log', 'msgservice', 'colorservice', 'dataservice', 'labelservice', 'trashholdservice'];
    function graphLegendCntrl($log, msgservice, colorservice, dataservice, labelservice, trashholdservice) {
        var vm = this;
        vm.lservice = labelservice;
        vm.dservice = dataservice;
        vm.labels = [];
        vm.getLabelColor = function (label) {
            if (labelservice.isLabelActive(label)) {
                return colorservice.getColor(label);
            }
            return colorservice.getDeactiveColor();
        };
        
        var incommingEvents = {
            label_changed:  'graphservice.label.changed',
            mod_trashhold: 'prefservice.pref.trashhold.changed'
        };
        var callback = function (event, data) {
            switch (event) {
                case incommingEvents.label_changed:
                case incommingEvents.mod_trashhold:
                    vm.labels[0] = getLabelsTrashholded();
                    break;
            }
        };
        msgservice.register(callback);

        function getLabelsTrashholded() {
            var labels = labelservice.getLabels();
            var labels_ = {};
            for(var l in labels) {
                if(trashholdservice.isLabelTrashholded(l)) {
                    continue;
                }
                labels_[l] = labels[l];
            }
            return labels_;
        }
    }
})();