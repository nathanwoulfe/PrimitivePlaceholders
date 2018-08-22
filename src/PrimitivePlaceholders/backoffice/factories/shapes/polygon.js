(() => {

function primitivePolygonFactory(Shape) {

        const svgns = 'http://www.w3.org/2000/svg';

        function Polygon(w, h, count) {
            Shape.call(this);

            this.points = this._createPoints(w, h, count);
            this.computeBbox();
        }

        function render(ctx) {
            ctx.beginPath();
            this.points.forEach(([x, y], index) => {
                if (index) {
                    ctx.lineTo(x, y);
                } else {
                    ctx.moveTo(x, y);
                }
            });
            ctx.closePath();
            ctx.fill();
        };

        function toSVG() {
            const path = document.createElementNS(svgns, 'path');
            const d = this.points.map((point, index) => {
                const cmd = (index ? 'L' : 'M');
                return `${cmd}${point.join(',')}`;
            }).join('');

            path.setAttribute('d', `${d}Z`);

            return path;
        };

        function mutate() {
            const clone = new Polygon(0, 0);
            clone.points = this.points.map(p => p.slice());

            const index = Math.floor(Math.random() * this.points.length);
            const point = clone.points[index];

            const angle = Math.random() * 2 * Math.PI;
            const radius = Math.random() * 20;

            point[0] += ~~(radius * Math.cos(angle));
            point[1] += ~~(radius * Math.sin(angle));

            return clone.computeBbox();
        };

        function computeBbox() {
            const [left, top] = [
                this.points.reduce((v, p) => Math.min(v, p[0]), Infinity),
                this.points.reduce((v, p) => Math.min(v, p[1]), Infinity)
            ];
            const [right, bottom] = [
                this.points.reduce((v, p) => Math.max(v, p[0]), -Infinity),
                this.points.reduce((v, p) => Math.max(v, p[1]), -Infinity)
            ];

            this.bbox = {
                left,
                top,
                width: (right - left) || 1, /* fallback for deformed shapes */
                height: (bottom - top) || 1
            };

            return this;
        };

        function createPoints(w, h, count) {
            const first = Shape.randomPoint(w, h);
            const points = [first];

            for (let i = 1; i < count; i++) {
                const angle = Math.random() * 2 * Math.PI;
                const radius = Math.random() * 20;

                points.push([
                    first[0] + ~~(radius * Math.cos(angle)),
                    first[1] + ~~(radius * Math.sin(angle))
                ]);
            }
            return points;
        };


        Polygon.prototype = Object.create(Shape.prototype);

        angular.extend(Polygon.prototype,
            {
                render: render,
                toSVG: toSVG,
                mutate: mutate,
                computeBbox: computeBbox,
                _createPoints: createPoints
            });

        return Polygon;
    };

    angular.module('umbraco.resources').factory('primitivePolygonFactory', ['primitiveShapeFactory', primitivePolygonFactory]);
})();