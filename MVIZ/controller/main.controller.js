'use strict';

(function () {
    angular
            .module("metaStoneCharts")
            .controller('MainCntrl', MainCntrl)
            .config(config);
    
    config.$inject = ['$locationProvider'];
    function config($locationProvider) {
        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });
    }

    MainCntrl.$inject = ['$log', 'collectionservice', 'dataservice' , 'characteristicservice', 'preferences', 'msgservice', '$location'];
    function MainCntrl($log, collectionservice, dataservice, characteristicservice, preferences, msgservice, $location) {
        var vm = this;
        vm.prefs = preferences;
        /*var defaultUrl = 'data/mockdata_update_pprint_raw_inf.json';
        dataservice.load(defaultUrl);*/
        vm.dataFailed = false;
        vm.failedMsg = "For further informations on how to " +
            "load data go to: Help > Application Setup > How to load data";
        //var defaultUrl_Zip = 'data/data.json.zip';
        var dataUrl = $location.search().data; 
        if(!dataUrl) {
            vm.dataFailed = true;
        } else {
            dataservice.load(dataUrl);
        }
        if(preferences.data_failed) {
            vm.dataFailed = true;
        }
        
        vm.service = collectionservice;
        vm.chservice = characteristicservice;
 
        var msg = msgservice;
        var incommingEvents = {
            data_failed:    'dataservice.data.failure'
        };
        var callback = function (event, data) {
            switch (event) {
                case incommingEvents.data_failed: 
                    vm.dataFailed = true;
                    vm.failedMsg = data + vm.failedMsg;
                    break;
            }
        };
        msg.register(callback);
    }
})();