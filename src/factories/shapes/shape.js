(function () {
    'use strict';

    function primitiveShapeFactory(Canvas) {

        function Shape() {
            this.bbox = {};
        }

        Shape.prototype = {
            mutate: function() {
                 return this;
            },

            toSVG: function () { },

            /* get a new smaller canvas with this shape */
            rasterize: function (alpha) {
                const canvas = new Canvas(this.bbox.width, this.bbox.height);
                const ctx = canvas.ctx;
                ctx.fillStyle = '#000';
                ctx.globalAlpha = alpha;
                ctx.translate(-this.bbox.left, -this.bbox.top);
                this.render(ctx);

                return canvas;
            },

            render: function () { }
        };

        Shape.randomPoint = function (width, height) {
            return [~~(Math.random() * width), ~~(Math.random() * height)];
        };

        Shape.create = function (cfg) {
            const ctors = cfg.shapeTypes;
            const index = Math.floor(Math.random() * ctors.length);
            const Ctor = ctors[index];
            return new Ctor(cfg.width, cfg.height);
        }

        return Shape;
    }

    angular.module('umbraco.resources').factory('primitiveShapeFactory', ['primitiveCanvasFactory', primitiveShapeFactory]);
}());