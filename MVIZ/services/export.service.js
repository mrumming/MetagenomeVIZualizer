'use strict';

(function () {
    angular
            .module('metaStoneCharts')
            .factory('exportservice', exportservice);

    /**
     * Ist fuer den Export der Plots und der Legende zustaendig,
     * Export als HTML mit den plots (SVG).
     * 
     * @param {type} $log
     * @returns {export_service_L3.exportservice.service}
     */
    exportservice.$inject = ['$log','FileSaver', 'Blob', '$window'];
    function exportservice($log, FileSaver, Blob, $window) {

        var service = {
            getSingleHtml: getSingleHtml,
            getAllHtml: getAllHtml,
            saveToFile: saveToFile,
            openInNewWindow: openInNewWindow
        };
        
        /**
         * Speichert den uebergebenen string auf der Festplatte.
         * 
         * @param {type} html
         * @returns {undefined}
         */
        function saveToFile(html) {
            var data = new Blob([html], {type: 'text/html;charset=utf-8'});
            FileSaver.saveAs(data, 'export.html');
        }
        
        /**
         * Oeffnet den uebergebenen HTML string in einem neuen Fenster.
         * 
         * @param {type} html
         * @returns {undefined}
         */
        function openInNewWindow(html) {
            var popupWin = $window.open('', '_blank');
            popupWin.document.open();
            popupWin.document.write(html);
            popupWin.document.close();
        }
        
        /**
         * Liefert den HTML Inhalt fuer einen einzelnen Plot mit Legende.
         * 
         * @param {type} id Id des Plot-Divs
         * @returns {String} HTML String
         */
        function getSingleHtml(id) {
            var html =
                    '<html><head>' +
                    '<title>Export</title>' +
                    //'<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">' +
                    //'<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap-theme.min.css">' +
                    //'<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/nvd3/1.8.3/nv.d3.min.css">' +
                    '<style>' +
                    getAllCSS() +
                    '</style>' +
                    '</head><body>' +
                    '<div class="panel panel-default"><div class="panel-heading">Legend</div>' +
                    '<div class="panel-body">' +
                    getLegendElement().innerHTML +
                    '</div></div><div>' +
                    getModifiedElement(id).innerHTML +
                    '<div></body></html>';

            return html;
        }

        /**
         * Liefert den HTML Inhalt fuer alle Plots mit Legende.
         * 
         * @returns {String} HTML String
         */
        function getAllHtml() {
            var html =
                    '<html><head>' +
                    '<title>Export</title>' +
                    //'<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">' +
                    //'<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap-theme.min.css">' +
                    //'<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/nvd3/1.8.3/nv.d3.min.css">' +
                    '<style>' +
                    getAllCSS() +
                    '</style>' +
                    '</head><body>' +
                    '<div id="export">' +
                    '<div class="panel panel-default"><div class="panel-heading">Legend</div>' +
                    '<div class="panel-body">' +
                    getLegendElement().innerHTML +
                    '</div></div>';

            var graphPlots = document.getElementsByClassName('graphplot');
            var added = {};
            for (var i in graphPlots) {
                var plotDiv = graphPlots[i];
                if (!plotDiv.id || added[plotDiv.id]) {
                    continue;
                }
                html += '<div>';
                html += getModifiedElement(plotDiv.id).innerHTML;
                html += '</div>';
                added[plotDiv.id] = true;
            }
            html += '</div></div></div>';
            //html += getJs();
            html += '</body></html>';
            
            return html;
        }
        
        /**
         * Liefert saemtliche aktive css Konfigurationen.
         * 
         *  http://stackoverflow.com/a/1679709
         *  http://stackoverflow.com/a/23613052
         *  
         * @returns {String}
         */
        function getAllCSS() {
            var css = [];
            for (var i = 0; i < document.styleSheets.length; i++) {
                var sheet = document.styleSheets[i];
                var rules;
                try {
                    rules = ('cssRules' in sheet) ? sheet.cssRules : sheet.rules;
                    if (!rules || !rules.length) {
                        continue;
                    }
                } catch (e) {
                    if (e.name !== 'SecurityError') {
                        throw e;
                    }
                    continue;
                }
                for (var rulei = 0; rulei < rules.length; rulei++) {
                    var rule = rules[rulei];
                    if ('cssText' in rule)
                        css.push(rule.cssText);
                    else
                        css.push(rule.selectorText + ' {\n' + rule.style.cssText + '\n}\n');
                }
            }
            return css.join('\n');
        }

        /**
         * Liefert das Plot-Element mit der
         * uebergebenen Id.
         * 
         * @param {type} id
         * @returns {Node} 
         */
        function getModifiedElement(id) {
            var printContents = document.getElementById(id).cloneNode(true);
            removeElementsByClass('no-png', printContents);
            removeClassFromelements('activeGraphPanel', printContents);
            removeClassFromelements('activeGraphPanelLabel', printContents);

            return printContents;
        }
        
        /**
         * Liefert das Element mit der Legende.
         * 
         * @returns {Node}
         */
        function getLegendElement() {
            return document.getElementById('graph_legend').cloneNode(true);
        }

        /**
         * Entfernt alle Vorkommen der CSS Klasse unterhalb des
         * uebergebenen Elements.
         * 
         * @param {type} className
         * @param {type} content
         * @returns {undefined}
         */
        function removeClassFromelements(className, content) {
            var elements = content.getElementsByClassName(className);
            for (var i in elements) {
                var elem = elements[i];
                if (!elem.className) {
                    continue;
                }
                elem.className = elem.className.replace(new RegExp('\\b' + className + '\\b'), '');
            }
        }
        
        /**
         * Entfernt alle Elemente aus dem uebergebenen Element
         * die die uebergebenen Klasse enthalten.
         * 
         * @param {type} className
         * @param {type} content
         * @returns {undefined}
         */
        function removeElementsByClass(className, content) {
            var elements = content.getElementsByClassName(className);
            while (elements.length > 0) {
                elements[0].parentNode.removeChild(elements[0]);
            }
        }

        return service;
    }
})();