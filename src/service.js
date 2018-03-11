(function () {
    'use strict';

    // create service method full of witchcraft and blackmagick
    function primitiveHelperService() {

        const svgns = 'http://www.w3.org/2000/svg';

        function clampColor(x) {
            return Math.max(0, Math.min(255, x));
        }

        function distanceToDifference(distance, pixels) {
            return Math.pow(distance * 255, 2) * (3 * pixels);
        }

        function differenceToDistance(diff, pixels) {
            return Math.sqrt(diff / (3 * pixels)) / 255;
        }

        function computeColor(offset, imageData, alpha) {
            let color = [0, 0, 0];
            let { shape, current, target } = imageData;
            let shapeData = shape.data;
            let currentData = current.data;
            let targetData = target.data;

            let si, sx, sy, fi, fx, fy; /* shape-index, shape-x, shape-y, full-index, full-x, full-y */
            let sw = shape.width;
            let sh = shape.height;
            let fw = current.width;
            let fh = current.height;
            let count = 0;

            for (sy = 0; sy < sh; sy++) {
                fy = sy + offset.top;
                if (fy < 0 || fy >= fh) { continue; } /* outside of the large canvas (vertically) */

                for (sx = 0; sx < sw; sx++) {
                    fx = offset.left + sx;
                    if (fx < 0 || fx >= fw) { continue; } /* outside of the large canvas (horizontally) */

                    si = 4 * (sx + sy * sw); /* shape (local) index */
                    if (shapeData[si + 3] === 0) { continue; } /* only where drawn */

                    fi = 4 * (fx + fy * fw); /* full (global) index */
                    color[0] += (targetData[fi] - currentData[fi]) / alpha + currentData[fi];
                    color[1] += (targetData[fi + 1] - currentData[fi + 1]) / alpha + currentData[fi + 1];
                    color[2] += (targetData[fi + 2] - currentData[fi + 2]) / alpha + currentData[fi + 2];

                    count++;
                }
            }

            return color.map(x => ~~(x / count)).map(clampColor);
        }

        function computeDifferenceChange(offset, imageData, color) {
            let { shape, current, target } = imageData;
            let shapeData = shape.data;
            let currentData = current.data;
            let targetData = target.data;

            let a, b, d1r, d1g, d1b, d2r, d2b, d2g;
            let si, sx, sy, fi, fx, fy; /* shape-index, shape-x, shape-y, full-index */
            let sw = shape.width;
            let sh = shape.height;
            let fw = current.width;
            let fh = current.height;

            var sum = 0; /* V8 opt bailout with let */

            for (sy = 0; sy < sh; sy++) {
                fy = sy + offset.top;
                if (fy < 0 || fy >= fh) { continue; } /* outside of the large canvas (vertically) */

                for (sx = 0; sx < sw; sx++) {
                    fx = offset.left + sx;
                    if (fx < 0 || fx >= fw) { continue; } /* outside of the large canvas (horizontally) */

                    si = 4 * (sx + sy * sw); /* shape (local) index */
                    a = shapeData[si + 3];
                    if (a === 0) { continue; } /* only where drawn */

                    fi = 4 * (fx + fy * fw); /* full (global) index */

                    a = a / 255;
                    b = 1 - a;
                    d1r = targetData[fi] - currentData[fi];
                    d1g = targetData[fi + 1] - currentData[fi + 1];
                    d1b = targetData[fi + 2] - currentData[fi + 2];

                    d2r = targetData[fi] - (color[0] * a + currentData[fi] * b);
                    d2g = targetData[fi + 1] - (color[1] * a + currentData[fi + 1] * b);
                    d2b = targetData[fi + 2] - (color[2] * a + currentData[fi + 2] * b);

                    sum -= d1r * d1r + d1g * d1g + d1b * d1b;
                    sum += d2r * d2r + d2g * d2g + d2b * d2b;
                }
            }

            return sum;
        }

        function computeColorAndDifferenceChange(offset, imageData, alpha) {
            let rgb = computeColor(offset, imageData, alpha);
            let differenceChange = computeDifferenceChange(offset, imageData, rgb);

            let color = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

            return { color, differenceChange };
        }

        function getScale(width, height, limit) {
            return Math.max(width / limit, height / limit, 1);
        }

        function getFill(canvas) {
            let data = canvas.getImageData();
            let w = data.width;
            let h = data.height;
            let d = data.data;
            let rgb = [0, 0, 0];
            let count = 0;
            let i;

            for (let x = 0; x < w; x++) {
                for (let y = 0; y < h; y++) {
                    if (x > 0 && y > 0 && x < w - 1 && y < h - 1) { continue; }
                    count++;
                    i = 4 * (x + y * w);
                    rgb[0] += d[i];
                    rgb[1] += d[i + 1];
                    rgb[2] += d[i + 2];
                }
            }

            rgb = rgb.map(x => ~~(x / count)).map(clampColor);
            return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        }

        function svgRect(w, h) {
            const node = document.createElementNS(svgns, 'rect');
            node.setAttribute('x', 0);
            node.setAttribute('y', 0);
            node.setAttribute('width', w);
            node.setAttribute('height', h);

            return node;
        }

        const service = {
            distanceToDifference: distanceToDifference,
            differenceToDistance: differenceToDistance,
            computeColor: computeColor,
            computeColorAndDifferenceChange: computeColorAndDifferenceChange,
            getScale: getScale,
            getFill: getFill,
            svgRect: svgRect
        }

        return service;
    };

    // register service factory 
    angular.module('umbraco.resources').factory('primitiveHelperService', primitiveHelperService);
})();

