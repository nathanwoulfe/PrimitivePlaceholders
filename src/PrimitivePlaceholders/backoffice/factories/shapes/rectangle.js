(() => {

function primitiveRectangleFactory(Polygon, Shape) {

        function Rectangle(w, h) {
            Polygon.call(this, w, h, 4);
        }

        function mutate() {
            const clone = new Rectangle(0, 0);
            clone.points = this.points.map(point => point.slice());

            const amount = ~~((Math.random() - 0.5) * 20);

            switch (Math.floor(Math.random() * 4)) {
                case 0: /* left */
                    clone.points[0][0] += amount;
                    clone.points[3][0] += amount;
                    break;
                case 1: /* top */
                    clone.points[0][1] += amount;
                    clone.points[1][1] += amount;
                    break;
                case 2: /* right */
                    clone.points[1][0] += amount;
                    clone.points[2][0] += amount;
                    break;
                case 3: /* bottom */
                    clone.points[2][1] += amount;
                    clone.points[3][1] += amount;
                    break;
            }

            return clone.computeBbox();
        };

        function createPoints(w, h) {
            const p1 = Shape.randomPoint(w, h);
            const p2 = Shape.randomPoint(w, h);

            const left = Math.min(p1[0], p2[0]);
            const right = Math.max(p1[0], p2[0]);
            const top = Math.min(p1[1], p2[1]);
            const bottom = Math.max(p1[1], p2[1]);

            return [
                [left, top],
                [right, top],
                [right, bottom],
                [left, bottom]
            ];
        };


        Rectangle.prototype = Object.create(Polygon.prototype);

        angular.extend(Rectangle.prototype,
            {
                mutate: mutate,
                _createPoints: createPoints
            });

        return Rectangle;
    }

    angular.module('umbraco.resources').factory('primitiveRectangleFactory', ['primitivePolygonFactory', 'primitiveShapeFactory', primitiveRectangleFactory]);
})();