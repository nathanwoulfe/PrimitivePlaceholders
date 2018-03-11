'use strict';

(function () {
	'use strict';

	// create controller 

	function primitivePlaceholderController($scope, editorState, Helper, Canvas, Triangle, Rectangle, Ellipse, Optimizer) {

		var steps = void 0;
		var vector = document.querySelector('#vector');

		var vm = this;
		vm.regenerate = regenerate;
		vm.fullscreen = fullscreen;

		/**
   * Do the work - creates Optimizer to process the original image, appending each shape to the DOM. When complete, pushes the SVG back into scope
   * @param {any} original
   * @param {any} cfg
   */
		function go(original, cfg) {

			var optimizer = new Optimizer(original, cfg);
			var svg = Canvas.empty(cfg, true);

			steps = 0;

			vector.innerHTML = '';
			vector.appendChild(svg);

			optimizer.onStep = function (step) {
				if (step) {
					svg.appendChild(step.toSVG());
				}
			};

			optimizer.onComplete = function () {
				$scope.$apply(function () {
					var serializer = new XMLSerializer();
					$scope.model.value = serializer.serializeToString(svg);
				});
			};

			optimizer.start();
		}

		var shapeMap = {
			"triangle": Triangle,
			"rectangle": Rectangle,
			"ellipse": Ellipse
		};

		/**
   * Return a config object either using defaults or values from the stored model
   */
		function getConfig() {
			var o = {
				steps: +$scope.model.config.steps || 50,
				alpha: +$scope.model.config.alpha || 0.5,
				computeSize: +$scope.model.config.computeSize || 150,
				viewSize: 700, // this is arbitrary as we only deal with the exported svg string, which has a width set in the template/view
				shapes: +$scope.model.config.shapes || 75,
				mutations: +$scope.model.config.mutations || 20,

				mutateAlpha: $scope.model.config.mutateAlpha || true,

				// default to triangles only, but overwrite with values from config below
				shapeTypes: [Triangle],

				fill: 'auto'
			};

			if ($scope.model.config.shapeTypes) {
				o.shapeTypes = [];
				$scope.model.config.shapeTypes.forEach(function (type) {
					o.shapeTypes.push(shapeMap[type.value]);
				});
			}

			return o;
		}

		/**
   * 
   */
		function fullscreen(e) {
			e.preventDefault();

			var newWindow = window.open();
			newWindow.document.write('<html><head></head><body><div style="height:100vh">' + $scope.model.value + '</div></body></html>');
		}

		/**
   * Generate a low-poly svg preview of the uploaded image asset
   * @param {} e 
   * @returns {} 
   */
		function regenerate(e) {

			if (e) {
				e.preventDefault();
			}

			var state = editorState.getCurrent();
			var prop = state.properties.filter(function (v) {
				return v.alias.toLowerCase() === $scope.model.config.source.toLowerCase();
			})[0];

			if (prop) {

				// image cropper is nested, file upload stores the file path in value
				var url = prop.view === 'imagecropper' ? prop.value.src : prop.value;
				var cfg = getConfig();

				Canvas.original(url, cfg).then(function (original) {
					return go(original, cfg);
				});
			}
		}

		// on load, if a value exists, display the svg, otherwise create a new one
		if ($scope.model.value.length) {
			vector.innerHTML = $scope.model.value;
		} else {
			regenerate();
		}
	};

	// register controller 
	angular.module('umbraco').controller('primitivePlaceholderController', ['$scope', 'editorState', 'primitiveHelperService', 'primitiveCanvasFactory', 'primitiveTriangleFactory', 'primitiveRectangleFactory', 'primitiveEllipseFactory', 'primitiveOptimizerFactory', primitivePlaceholderController]);
})();
'use strict';

(function () {
    'use strict';

    // create service method full of witchcraft and blackmagick

    function primitiveHelperService() {

        var svgns = 'http://www.w3.org/2000/svg';

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
            var color = [0, 0, 0];
            var shape = imageData.shape,
                current = imageData.current,
                target = imageData.target;

            var shapeData = shape.data;
            var currentData = current.data;
            var targetData = target.data;

            var si = void 0,
                sx = void 0,
                sy = void 0,
                fi = void 0,
                fx = void 0,
                fy = void 0; /* shape-index, shape-x, shape-y, full-index, full-x, full-y */
            var sw = shape.width;
            var sh = shape.height;
            var fw = current.width;
            var fh = current.height;
            var count = 0;

            for (sy = 0; sy < sh; sy++) {
                fy = sy + offset.top;
                if (fy < 0 || fy >= fh) {
                    continue;
                } /* outside of the large canvas (vertically) */

                for (sx = 0; sx < sw; sx++) {
                    fx = offset.left + sx;
                    if (fx < 0 || fx >= fw) {
                        continue;
                    } /* outside of the large canvas (horizontally) */

                    si = 4 * (sx + sy * sw); /* shape (local) index */
                    if (shapeData[si + 3] === 0) {
                        continue;
                    } /* only where drawn */

                    fi = 4 * (fx + fy * fw); /* full (global) index */
                    color[0] += (targetData[fi] - currentData[fi]) / alpha + currentData[fi];
                    color[1] += (targetData[fi + 1] - currentData[fi + 1]) / alpha + currentData[fi + 1];
                    color[2] += (targetData[fi + 2] - currentData[fi + 2]) / alpha + currentData[fi + 2];

                    count++;
                }
            }

            return color.map(function (x) {
                return ~~(x / count);
            }).map(clampColor);
        }

        function computeDifferenceChange(offset, imageData, color) {
            var shape = imageData.shape,
                current = imageData.current,
                target = imageData.target;

            var shapeData = shape.data;
            var currentData = current.data;
            var targetData = target.data;

            var a = void 0,
                b = void 0,
                d1r = void 0,
                d1g = void 0,
                d1b = void 0,
                d2r = void 0,
                d2b = void 0,
                d2g = void 0;
            var si = void 0,
                sx = void 0,
                sy = void 0,
                fi = void 0,
                fx = void 0,
                fy = void 0; /* shape-index, shape-x, shape-y, full-index */
            var sw = shape.width;
            var sh = shape.height;
            var fw = current.width;
            var fh = current.height;

            var sum = 0; /* V8 opt bailout with let */

            for (sy = 0; sy < sh; sy++) {
                fy = sy + offset.top;
                if (fy < 0 || fy >= fh) {
                    continue;
                } /* outside of the large canvas (vertically) */

                for (sx = 0; sx < sw; sx++) {
                    fx = offset.left + sx;
                    if (fx < 0 || fx >= fw) {
                        continue;
                    } /* outside of the large canvas (horizontally) */

                    si = 4 * (sx + sy * sw); /* shape (local) index */
                    a = shapeData[si + 3];
                    if (a === 0) {
                        continue;
                    } /* only where drawn */

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
            var rgb = computeColor(offset, imageData, alpha);
            var differenceChange = computeDifferenceChange(offset, imageData, rgb);

            var color = 'rgb(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ')';

            return { color: color, differenceChange: differenceChange };
        }

        function getScale(width, height, limit) {
            return Math.max(width / limit, height / limit, 1);
        }

        function getFill(canvas) {
            var data = canvas.getImageData();
            var w = data.width;
            var h = data.height;
            var d = data.data;
            var rgb = [0, 0, 0];
            var count = 0;
            var i = void 0;

            for (var x = 0; x < w; x++) {
                for (var y = 0; y < h; y++) {
                    if (x > 0 && y > 0 && x < w - 1 && y < h - 1) {
                        continue;
                    }
                    count++;
                    i = 4 * (x + y * w);
                    rgb[0] += d[i];
                    rgb[1] += d[i + 1];
                    rgb[2] += d[i + 2];
                }
            }

            rgb = rgb.map(function (x) {
                return ~~(x / count);
            }).map(clampColor);
            return 'rgb(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ')';
        }

        function svgRect(w, h) {
            var node = document.createElementNS(svgns, 'rect');
            node.setAttribute('x', 0);
            node.setAttribute('y', 0);
            node.setAttribute('width', w);
            node.setAttribute('height', h);

            return node;
        }

        var service = {
            distanceToDifference: distanceToDifference,
            differenceToDistance: differenceToDistance,
            computeColor: computeColor,
            computeColorAndDifferenceChange: computeColorAndDifferenceChange,
            getScale: getScale,
            getFill: getFill,
            svgRect: svgRect
        };

        return service;
    };

    // register service factory 
    angular.module('umbraco.resources').factory('primitiveHelperService', primitiveHelperService);
})();
'use strict';

(function () {
	'use strict';

	function primitiveCanvasFactory(Helper) {

		var svgns = 'http://www.w3.org/2000/svg';

		function Canvas(width, height) {
			this.node = document.createElement('canvas');
			this.node.width = width;
			this.node.height = height;
			this.ctx = this.node.getContext('2d');
			this._imageData = null;
		}

		Canvas.prototype = {

			clone: function clone() {
				var otherCanvas = new Canvas(this.node.width, this.node.height);
				otherCanvas.ctx.drawImage(this.node, 0, 0);
				return otherCanvas;
			},

			fill: function fill(color) {
				this.ctx.fillStyle = color;
				this.ctx.fillRect(0, 0, this.node.width, this.node.height);
				return this;
			},

			getImageData: function getImageData() {
				if (!this._imageData) {
					this._imageData = this.ctx.getImageData(0, 0, this.node.width, this.node.height);
				}
				return this._imageData;
			},

			difference: function difference(otherCanvas) {
				var data = this.getImageData();
				var dataOther = otherCanvas.getImageData();

				var sum = 0,
				    diff = void 0;
				for (var i = 0; i < data.data.length; i++) {
					if (i % 4 === 3) {
						continue;
					}
					diff = dataOther.data[i] - data.data[i];
					sum = sum + diff * diff;
				}

				return sum;
			},

			distance: function distance(otherCanvas) {
				var difference$$1 = this.difference(otherCanvas);
				return Helper.differenceToDistance(difference$$1, this.node.width * this.node.height);
			},

			drawStep: function drawStep(step) {
				this.ctx.globalAlpha = step.alpha;
				this.ctx.fillStyle = step.color;
				step.shape.render(this.ctx);
				return this;
			}
		};

		Canvas.empty = function (cfg, svg) {
			if (svg) {
				var node = document.createElementNS(svgns, 'svg');
				node.setAttribute('viewBox', '0 0 ' + cfg.width + ' ' + cfg.height);
				node.setAttribute('clip-path', 'url(#clip)');

				var defs = document.createElementNS(svgns, 'defs');
				node.appendChild(defs);

				var cp = document.createElementNS(svgns, 'clipPath');
				defs.appendChild(cp);
				cp.setAttribute('id', 'clip');
				cp.setAttribute('clipPathUnits', 'objectBoundingBox');

				var rect = Helper.svgRect(cfg.width, cfg.height);
				cp.appendChild(rect);

				rect = Helper.svgRect(cfg.width, cfg.height);
				rect.setAttribute('fill', cfg.fill);
				node.appendChild(rect);

				return node;
			} else {
				return new this(cfg.width, cfg.height).fill(cfg.fill);
			}
		};

		Canvas.original = function (url, cfg) {
			var _this = this;

			return new Promise(function (resolve) {
				var img = new Image();
				img.src = url;
				img.onload = function () {
					var w = img.naturalWidth;
					var h = img.naturalHeight;

					var computeScale = Helper.getScale(w, h, cfg.computeSize);
					cfg.width = w / computeScale;
					cfg.height = h / computeScale;

					var viewScale = Helper.getScale(w, h, cfg.viewSize);

					cfg.scale = computeScale / viewScale;

					var canvas = _this.empty(cfg);
					canvas.ctx.drawImage(img, 0, 0, cfg.width, cfg.height);

					cfg.fill = Helper.getFill(canvas);

					resolve(canvas);
				};
			});
		};

		return Canvas;
	}

	angular.module('umbraco.resources').factory('primitiveCanvasFactory', ['primitiveHelperService', primitiveCanvasFactory]);
})();
'use strict';

(function () {
    'use strict';

    function primitiveOptimizerFactory(Shape, Step, State, Canvas) {

        function Optimizer(original, cfg) {
            this.cfg = cfg;
            this.state = new State(original, Canvas.empty(cfg));
            this._steps = 0;
            this.onStep = function () {};
            this.onComplete = function () {};
        }

        Optimizer.prototype = {
            start: function start() {
                this._ts = Date.now();
                this._addShape();
            },

            _addShape: function _addShape() {
                var _this = this;

                this._findBestStep().then(function (step) {
                    return _this._optimizeStep(step);
                }).then(function (step) {
                    _this._steps++;
                    if (step.distance < _this.state.distance) {
                        /* better than current state, epic */
                        _this.state = step.apply(_this.state);
                        _this.onStep(step);
                    } else {
                        /* worse than current state, discard */
                        _this.onStep(null);
                    }
                    _this._continue();
                });
            },

            _continue: function _continue() {
                var _this2 = this;

                if (this._steps < this.cfg.steps) {
                    setTimeout(function () {
                        return _this2._addShape();
                    }, 10);
                } else {
                    this.onComplete(null);
                }
            },

            _findBestStep: function _findBestStep() {
                var limit = this.cfg.shapes;

                var bestStep = null;
                var promises = [];

                for (var i = 0; i < limit; i++) {
                    var shape = Shape.create(this.cfg);

                    var promise = new Step(shape, this.cfg).compute(this.state).then(function (step) {
                        if (!bestStep || step.distance < bestStep.distance) {
                            bestStep = step;
                        }
                    });
                    promises.push(promise);
                }

                return Promise.all(promises).then(function () {
                    return bestStep;
                });
            },

            _optimizeStep: function _optimizeStep(step) {
                var _this3 = this;

                var limit = this.cfg.mutations;

                var totalAttempts = 0;
                var successAttempts = 0;
                var failedAttempts = 0;
                var resolve = null;
                var bestStep = step;
                var promise = new Promise(function (r) {
                    return resolve = r;
                });

                var tryMutation = function tryMutation() {
                    if (failedAttempts >= limit) {
                        return resolve(bestStep);
                    }

                    totalAttempts++;
                    bestStep.mutate().compute(_this3.state).then(function (mutatedStep) {
                        if (mutatedStep.distance < bestStep.distance) {
                            /* success */
                            successAttempts++;
                            failedAttempts = 0;
                            bestStep = mutatedStep;
                        } else {
                            /* failure */
                            failedAttempts++;
                        }

                        tryMutation();
                    });
                };

                tryMutation();

                return promise;
            }
        };

        return Optimizer;
    }

    angular.module('umbraco.resources').factory('primitiveOptimizerFactory', ['primitiveShapeFactory', 'primitiveStepFactory', 'primitiveStateFactory', 'primitiveCanvasFactory', primitiveOptimizerFactory]);
})();
'use strict';

(function () {
    'use strict';

    function primitiveStateFactory() {

        function State(target, canvas) {
            var distance = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : Infinity;

            this.target = target;
            this.canvas = canvas;
            this.distance = distance === Infinity ? target.distance(canvas) : distance;
        }

        return State;
    }

    angular.module('umbraco.resources').factory('primitiveStateFactory', [primitiveStateFactory]);
})();
'use strict';

(function () {
	'use strict';

	function primitiveStepFactory(Helper, State) {

		function Step(shape, cfg) {
			this.shape = shape;
			this.cfg = cfg;
			this.alpha = cfg.alpha;

			/* these two are computed during the .compute() call */
			this.color = '#000';
			this.distance = Infinity;
		}

		Step.prototype = {
			toSVG: function toSVG() {
				var node = this.shape.toSVG();
				node.setAttribute('fill', this.color);
				node.setAttribute('fill-opacity', this.alpha ? this.alpha.toFixed(2) : 0.5);
				return node;
			},

			/* apply this step to a state to get a new state. call only after .compute */
			apply: function apply(state) {
				var newCanvas = state.canvas.clone().drawStep(this);
				return new State(state.target, newCanvas, this.distance);
			},

			/* find optimal color and compute the resulting distance */
			compute: function compute(state) {
				var pixels = state.canvas.node.width * state.canvas.node.height;
				var offset = this.shape.bbox;

				var imageData = {
					shape: this.shape.rasterize(this.alpha).getImageData(),
					current: state.canvas.getImageData(),
					target: state.target.getImageData()
				};

				var _Helper$computeColorA = Helper.computeColorAndDifferenceChange(offset, imageData, this.alpha),
				    color = _Helper$computeColorA.color,
				    differenceChange = _Helper$computeColorA.differenceChange;

				this.color = color;
				var currentDifference = Helper.distanceToDifference(state.distance, pixels);
				if (-differenceChange > currentDifference) debugger;
				this.distance = Helper.differenceToDistance(currentDifference + differenceChange, pixels);

				return Promise.resolve(this);
			},

			/* return a slightly mutated step */
			mutate: function mutate() {
				var newShape = this.shape.mutate(this.cfg);
				var mutated = new Step(newShape, this.cfg);
				if (this.cfg.mutateAlpha) {
					var mutatedAlpha = this.alpha + (Math.random() - 0.5) * 0.08;
					mutated.alpha = Math.max(.1, Math.min(1, mutatedAlpha));
				}
				return mutated;
			}
		};

		return Step;
	}

	angular.module('umbraco.resources').factory('primitiveStepFactory', ['primitiveHelperService', 'primitiveStateFactory', primitiveStepFactory]);
})();
'use strict';

(function () {
    'use strict';

    function primitiveEllipseFactory(Shape) {

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
            var node = document.createElementNS(svgns, 'ellipse');
            node.setAttribute('cx', this.center[0]);
            node.setAttribute('cy', this.center[1]);
            node.setAttribute('rx', this.rx);
            node.setAttribute('ry', this.ry);
            return node;
        };

        function mutate() {
            var clone = new Ellipse(0, 0);
            clone.center = this.center.slice();
            clone.rx = this.rx;
            clone.ry = this.ry;

            switch (Math.floor(Math.random() * 3)) {
                case 0:
                    {
                        var angle = Math.random() * 2 * Math.PI;
                        var radius = Math.random() * 20;
                        clone.center[0] += ~~(radius * Math.cos(angle));
                        clone.center[1] += ~~(radius * Math.sin(angle));
                    }
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
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

(function () {
    'use strict';

    function primitivePolygonFactory(Shape) {

        var svgns = 'http://www.w3.org/2000/svg';

        function Polygon(w, h, count) {
            Shape.call(this);

            this.points = this._createPoints(w, h, count);
            this.computeBbox();
        }

        function render(ctx) {
            ctx.beginPath();
            this.points.forEach(function (_ref, index) {
                var _ref2 = _slicedToArray(_ref, 2),
                    x = _ref2[0],
                    y = _ref2[1];

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
            var path = document.createElementNS(svgns, 'path');
            var d = this.points.map(function (point, index) {
                var cmd = index ? 'L' : 'M';
                return '' + cmd + point.join(',');
            }).join('');

            path.setAttribute('d', d + 'Z');

            return path;
        };

        function mutate() {
            var clone = new Polygon(0, 0);
            clone.points = this.points.map(function (p) {
                return p.slice();
            });

            var index = Math.floor(Math.random() * this.points.length);
            var point = clone.points[index];

            var angle = Math.random() * 2 * Math.PI;
            var radius = Math.random() * 20;

            point[0] += ~~(radius * Math.cos(angle));
            point[1] += ~~(radius * Math.sin(angle));

            return clone.computeBbox();
        };

        function computeBbox() {
            var _ref3 = [this.points.reduce(function (v, p) {
                return Math.min(v, p[0]);
            }, Infinity), this.points.reduce(function (v, p) {
                return Math.min(v, p[1]);
            }, Infinity)],
                left = _ref3[0],
                top = _ref3[1];
            var _ref4 = [this.points.reduce(function (v, p) {
                return Math.max(v, p[0]);
            }, -Infinity), this.points.reduce(function (v, p) {
                return Math.max(v, p[1]);
            }, -Infinity)],
                right = _ref4[0],
                bottom = _ref4[1];


            this.bbox = {
                left: left,
                top: top,
                width: right - left || 1, /* fallback for deformed shapes */
                height: bottom - top || 1
            };

            return this;
        };

        function createPoints(w, h, count) {
            var first = Shape.randomPoint(w, h);
            var points = [first];

            for (var i = 1; i < count; i++) {
                var angle = Math.random() * 2 * Math.PI;
                var radius = Math.random() * 20;

                points.push([first[0] + ~~(radius * Math.cos(angle)), first[1] + ~~(radius * Math.sin(angle))]);
            }
            return points;
        };

        Polygon.prototype = Object.create(Shape.prototype);

        angular.extend(Polygon.prototype, {
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
'use strict';

(function () {
    'use strict';

    function primitiveRectangleFactory(Polygon) {

        function Rectangle(w, h) {
            Polygon.call(this, w, h, 4);
        }

        function mutate() {
            var clone = new Rectangle(0, 0);
            clone.points = this.points.map(function (point) {
                return point.slice();
            });

            var amount = ~~((Math.random() - 0.5) * 20);

            switch (Math.floor(Math.random() * 4)) {
                case 0:
                    /* left */
                    clone.points[0][0] += amount;
                    clone.points[3][0] += amount;
                    break;
                case 1:
                    /* top */
                    clone.points[0][1] += amount;
                    clone.points[1][1] += amount;
                    break;
                case 2:
                    /* right */
                    clone.points[1][0] += amount;
                    clone.points[2][0] += amount;
                    break;
                case 3:
                    /* bottom */
                    clone.points[2][1] += amount;
                    clone.points[3][1] += amount;
                    break;
            }

            return clone.computeBbox();
        };

        function createPoints(w, h) {
            var p1 = Shape.randomPoint(w, h);
            var p2 = Shape.randomPoint(w, h);

            var left = Math.min(p1[0], p2[0]);
            var right = Math.max(p1[0], p2[0]);
            var top = Math.min(p1[1], p2[1]);
            var bottom = Math.max(p1[1], p2[1]);

            return [[left, top], [right, top], [right, bottom], [left, bottom]];
        };

        Rectangle.prototype = Object.create(Polygon.prototype);

        angular.extend(Rectangle.prototype, {
            mutate: mutate,
            _createPoints: createPoints
        });

        return Rectangle;
    }

    angular.module('umbraco.resources').factory('primitiveRectangleFactory', ['primitivePolygonFactory', primitiveRectangleFactory]);
})();
'use strict';

(function () {
    'use strict';

    function primitiveShapeFactory(Canvas) {

        function Shape() {
            this.bbox = {};
        }

        Shape.prototype = {
            mutate: function mutate() {
                return this;
            },

            toSVG: function toSVG() {},

            /* get a new smaller canvas with this shape */
            rasterize: function rasterize(alpha) {
                var canvas = new Canvas(this.bbox.width, this.bbox.height);
                var ctx = canvas.ctx;
                ctx.fillStyle = '#000';
                ctx.globalAlpha = alpha;
                ctx.translate(-this.bbox.left, -this.bbox.top);
                this.render(ctx);

                return canvas;
            },

            render: function render() {}
        };

        Shape.randomPoint = function (width, height) {
            return [~~(Math.random() * width), ~~(Math.random() * height)];
        };

        Shape.create = function (cfg) {
            var ctors = cfg.shapeTypes;
            var index = Math.floor(Math.random() * ctors.length);
            var Ctor = ctors[index];
            return new Ctor(cfg.width, cfg.height);
        };

        return Shape;
    }

    angular.module('umbraco.resources').factory('primitiveShapeFactory', ['primitiveCanvasFactory', primitiveShapeFactory]);
})();
'use strict';

(function () {
    'use strict';

    function primitiveTriangleFactory(Polygon) {

        function Triangle(w, h) {
            Polygon.call(this, w, h, 3);
        }

        Triangle.prototype = Object.create(Polygon.prototype);

        return Triangle;
    }

    angular.module('umbraco.resources').factory('primitiveTriangleFactory', ['primitivePolygonFactory', primitiveTriangleFactory]);
})();