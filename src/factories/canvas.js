(function () {
	'use strict';

	function primitiveCanvasFactory(Helper) {

		const svgns = 'http://www.w3.org/2000/svg';

		function Canvas(width, height) {
			this.node = document.createElement('canvas');
			this.node.width = width;
			this.node.height = height;
			this.ctx = this.node.getContext('2d');
			this._imageData = null;
		}

		Canvas.prototype = {

			clone: function () {
				const otherCanvas = new Canvas(this.node.width, this.node.height);
				otherCanvas.ctx.drawImage(this.node, 0, 0);
				return otherCanvas;
			},

			fill: function (color) {
				this.ctx.fillStyle = color;
				this.ctx.fillRect(0, 0, this.node.width, this.node.height);
				return this;
			},

			getImageData: function () {
				if (!this._imageData) {
					this._imageData = this.ctx.getImageData(0, 0, this.node.width, this.node.height);
				}
				return this._imageData;
			},

			difference: function (otherCanvas) {
				const data = this.getImageData();
				const dataOther = otherCanvas.getImageData();

				let sum = 0,
					diff;
				for (let i = 0; i < data.data.length; i++) {
					if (i % 4 === 3) {
						continue;
					}
					diff = dataOther.data[i] - data.data[i];
					sum = sum + diff * diff;
				}

				return sum;
			},

			distance: function (otherCanvas) {
				const difference$$1 = this.difference(otherCanvas);
				return Helper.differenceToDistance(difference$$1, this.node.width * this.node.height);
			},

			drawStep: function (step) {
				this.ctx.globalAlpha = step.alpha;
				this.ctx.fillStyle = step.color;
				step.shape.render(this.ctx);
				return this;
			}
		};

		Canvas.empty = function (cfg, svg) {
			if (svg) {
				const node = document.createElementNS(svgns, 'svg');
				node.setAttribute('viewBox', `0 0 ${cfg.width} ${cfg.height}`);
				node.setAttribute('clip-path', 'url(#clip)');

				const defs = document.createElementNS(svgns, 'defs');
				node.appendChild(defs);

				const cp = document.createElementNS(svgns, 'clipPath');
				defs.appendChild(cp);
				cp.setAttribute('id', 'clip');
				cp.setAttribute('clipPathUnits', 'objectBoundingBox');

				let rect = Helper.svgRect(cfg.width, cfg.height);
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
			return new Promise(resolve => {
				const img = new Image();
				img.src = url;
				img.onload = () => {
					const w = img.naturalWidth;
					const h = img.naturalHeight;

					const computeScale = Helper.getScale(w, h, cfg.computeSize);
					cfg.width = w / computeScale;
					cfg.height = h / computeScale;

					const viewScale = Helper.getScale(w, h, cfg.viewSize);

					cfg.scale = computeScale / viewScale;

					const canvas = this.empty(cfg);
					canvas.ctx.drawImage(img, 0, 0, cfg.width, cfg.height);

					cfg.fill = Helper.getFill(canvas);

					resolve(canvas);
				};
			});
		}

		return Canvas;
	}

	angular.module('umbraco.resources').factory('primitiveCanvasFactory', ['primitiveHelperService', primitiveCanvasFactory]);
}());
