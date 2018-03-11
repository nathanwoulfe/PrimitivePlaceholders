(function() {
    'use strict';

    function primitiveStateFactory() {

        function State(target, canvas, distance = Infinity) {
            this.target = target;
            this.canvas = canvas;
            this.distance = (distance === Infinity ? target.distance(canvas) : distance);
        }

        return State;
    }

    angular.module('umbraco.resources').factory('primitiveStateFactory', [primitiveStateFactory]);
}());