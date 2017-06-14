'use strict';

(function () {
    angular
            .module("metaStoneCharts", ['cfp.loadingBar', 'ngAnimate', 'ui.bootstrap', 'nvd3', 'ngFileSaver']);
})();

/**
 * sed um die input daten anzupassen: raw und infered:
 * 
 * sed -i 's/\([[:space:]]*\)\([^:]*\): "\(.*\)".*$/\1\2: ["\3", "\3"],/' datei
 */
