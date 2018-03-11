(function() {
    'use strict';

    function primitiveTriangleFactory(Polygon) {

        function Triangle(w, h) {
            Polygon.call(this, w, h, 3);
        }

        Triangle.prototype = Object.create(Polygon.prototype);

        return Triangle;
    }

    angular.module('umbraco.resources').factory('primitiveTriangleFactory', ['primitivePolygonFactory', primitiveTriangleFactory]);
}());