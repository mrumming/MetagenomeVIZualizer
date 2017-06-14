'use strict';

(function () {
    angular
            .module("metaStoneCharts")
            .factory('dataservice', dataservice);

    dataservice.$inject = ['$q', '$http', '$log', 'msgservice', 'metadataservice', 'preferences', 'cfpLoadingBar'];
    /**
     * Service der Datensaetze in die Applikation laed.
     * Stellt eine Funktion zum laden von ZIP komprimierten Datensaetzen bereit.
     * 
     * Events:
     * dataservice.data.loaded Datensatz geladen und Metadaten berechnet
     * 
     * @param {type} $q
     * @param {type} $http
     * @param {type} $log
     * @param {type} msgservice
     * @param {type} metadataservice
     * @param {type} preferences
     * @param {type} cfpLoadingBar
     * @returns {data_service_L3.dataservice.service}
     */
    function dataservice($q, $http, $log, msgservice, metadataservice, preferences, cfpLoadingBar) {
        var service = {
            load: load,
            load_zip: load_zip,
            getData: getData
        };

        var data = {};
        var msg = msgservice;
        var events = {
            data_loaded:    'dataservice.data.loaded',
            data_failed:    'dataservice.data.failure'
        };
        /*
         var callback = function (event, data) {
         switch (event) {
         case 1:
         break;
         case 2:
         break;
         }
         };
         msg.register(callback);*/

        /**
         * Lade einen ZIP komprimierten oder unkomprimierten Datansatz.
         * @param {type} url
         * @returns {undefined}
         */
        function load(url) {
            if(url.match('[.]zip$')) {
                load_zip(url);
            } else {
                load_(url);
            }
        }
        
        /**
         * Lade einen unkomprimierten Datansatz.
         * @param {type} url
         * @returns {undefined}
         */
        function load_(url) {
            cfpLoadingBar.start();
            getAll(url).then(function (d) {
                var json = d;
                metadataservice.calculateMetadataMap(json);
                cfpLoadingBar.complete();
                checkIfDataIsLoaded('File not available. ');
                
                preferences.data_loaded = true;
                msg.notify(events.data_loaded); 
                
            });
            cfpLoadingBar.complete();
        }
        
        /**
         * Lade einen mit ZIP komprimierten Datensatz.
         * @param {type} url
         * @returns {undefined}
         */
        function load_zip(url) {
            JSZipUtils.getBinaryContent(url, function (err, data_) {
                if (err) {
                    preferences.data_failed = true;
                    msg.notify(events.data_failed, 'File not available. ');
                    $log.error('Failed to get data: ');
                    throw err;
                }
                var base = baseName(url);
                var zip = new JSZip();
                zip.loadAsync(data_).then(function (z) {
                    z.file(base).async("string").then(function (d) {
                        cfpLoadingBar.start();
                        var json = JSON.parse(d);
                        metadataservice.calculateMetadataMap(json);
                        
                        cfpLoadingBar.complete();
                        
                        checkIfDataIsLoaded('File not available. ');
                        
                        preferences.data_loaded = true;
                        msg.notify(events.data_loaded);

                    }).catch(getAllFailed);
                }).catch(getAllFailed);
                cfpLoadingBar.complete();
            });
            
        }
        
        /**
         * Ueberprueft ob die metadaten leer sind und gibt einen
         * Fehler aus.
         * 
         * @param m
         * @returns {undefined}
         */
        function checkIfDataIsLoaded(m) {
            var meta = {};
            var e = false;
            try {
                meta = metadataservice.getMetadata();
            } catch(err) {
                e = true;
            }         
            if (e || isEmpty(meta)) {
                if(!m) {
                    m = "Wrong format or empty set. ";
                }
                $log.error(m);
                preferences.data_failed = true;
                msg.notify(events.data_failed, m);
            }
        }

        /**
         * Hilfsfunktion liefert den basename von einer Datei und entfernt
         * die Endung zip oder gz.
         * 
         * @param {type} str
         * @returns {String}
         */
        function baseName(str) {
            var base = new String(str).substring(str.lastIndexOf('/') + 1);
            if (base.lastIndexOf(".") !== -1)
                base = base.substring(0, base.lastIndexOf("."));
            
            // Endung entfernen
            base = base.replace("[.]gz$", "");
            base = base.replace("[.]zip$", "");
            
            return base;
        }
        
        /**
         * Getter: data
         * @returns {unresolved}
         */
        function getData() {
            return data;
        }
        
        /**
         * Hilfsfunktion: load
         * 
         * @param {type} url
         * @returns {unresolved}
         */
        function getAll(url) {
            return $http.get(url)
                    .then(getAllComplete)
                    .catch(getAllFailed);
        }
        
        /**
         * Hilfsfunktion: load
         * 
         * @param {type} response
         * @returns {$q@call;defer.promise}
         */
        function getAllComplete(response) {
            var defer = $q.defer();
            defer.resolve(response.data);
            return defer.promise;
        }
        
        /**
         * Hilfsfunktion: load.
         * 
         * @param {type} error
         * @returns {undefined}
         */
        function getAllFailed(error) {
            $log.error('Failed to get data: ' + error);
            preferences.data_failed = true;
            msg.notify(events.data_failed, 'File not available. ');
            cfpLoadingBar.complete();
        }

        /**
         * Hilfsfunktion: ist map leer.
         * @param {type} obj
         * @returns {Boolean}
         */
        function isEmpty(obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop))
                    return false;
            }
            return true && JSON.stringify(obj) === JSON.stringify({});
        }

        return service;
    }
})();


