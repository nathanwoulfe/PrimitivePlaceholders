(() => {

    function primitiveEllipseFactory(Shape) {

        const svgns = 'http://www.w3.org/2000/svg';
        
        function Ellipse(w, h) {
            Shape.call(this);

            this.center = Shape.randomPoint(w, h);
            this.rx = 1 + ~~(Math.random() * 20);
            this.ry = 1 + ~~(Math.random() * 20);

            this.computeBbox();
        }

        function render(ctx) {
            ctx.beginPath();
            ctx.ellipse(this.center[0], this.center[1], this.rx, this.ry, 0, 0, 2 * Math.PI, false);
            ctx.fill();
        };

        function toSVG() {
            const node = document.createElementNS(svgns, 'ellipse');
            node.setAttribute('cx', this.center[0]);
            node.setAttribute('cy', this.center[1]);
            node.setAttribute('rx', this.rx);
            node.setAttribute('ry', this.ry);
            return node;
        };

        function mutate() {
            const clone = new Ellipse(0, 0);
            clone.center = this.center.slice();
            clone.rx = this.rx;
            clone.ry = this.ry;

            switch (Math.floor(Math.random() * 3)) {
                case 0:
                    const angle = Math.random() * 2 * Math.PI;
                    const radius = Math.random() * 20;
                    clone.center[0] += ~~(radius * Math.cos(angle));
                    clone.center[1] += ~~(radius * Math.sin(angle));
                    break;
                case 1:
                    clone.rx += (Math.random() - 0.5) * 20;
                    clone.rx = Math.max(1, ~~clone.rx);
                    break;

                case 2:
                    clone.ry += (Math.random() - 0.5) * 20;
                    clone.ry = Math.max(1, ~~clone.ry);
                    break;
            }

            return clone.computeBbox();
        };

        function computeBbox() {
            this.bbox = {
                left: this.center[0] - this.rx,
                top: this.center[1] - this.ry,
                width: 2 * this.rx,
                height: 2 * this.ry
            };
            return this;
        };


        Ellipse.prototype = Object.create(Shape.prototype);

        angular.extend(Ellipse.prototype, {
            render: render,
            toSVG: toSVG,
            mutate: mutate,
            computeBbox: computeBbox
        });

        return Ellipse;

    }

    angular.module('umbraco.resources').factory('primitiveEllipseFactory', ['primitiveShapeFactory', primitiveEllipseFactory]);
})();
