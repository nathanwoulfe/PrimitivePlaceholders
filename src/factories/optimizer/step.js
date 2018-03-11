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
			toSVG: function () {
				const node = this.shape.toSVG();
				node.setAttribute('fill', this.color);
				node.setAttribute('fill-opacity', this.alpha ? this.alpha.toFixed(2) : 0.5);
				return node;
			},

			/* apply this step to a state to get a new state. call only after .compute */
			apply: function (state) {
				const newCanvas = state.canvas.clone().drawStep(this);
				return new State(state.target, newCanvas, this.distance);
			},

			/* find optimal color and compute the resulting distance */
			compute: function (state) {
				const pixels = state.canvas.node.width * state.canvas.node.height;
				const offset = this.shape.bbox;

				const imageData = {
					shape: this.shape.rasterize(this.alpha).getImageData(),
					current: state.canvas.getImageData(),
					target: state.target.getImageData()
				};

				const {
					color,
					differenceChange
				} =
				Helper.computeColorAndDifferenceChange(offset, imageData, this.alpha);
				this.color = color;
				const currentDifference = Helper.distanceToDifference(state.distance, pixels);
				if (-differenceChange > currentDifference) debugger;
				this.distance =
					Helper.differenceToDistance(currentDifference + differenceChange, pixels);

				return Promise.resolve(this);
			},

			/* return a slightly mutated step */
			mutate: function () {
				const newShape = this.shape.mutate(this.cfg);
				const mutated = new Step(newShape, this.cfg);
				if (this.cfg.mutateAlpha) {
					const mutatedAlpha = this.alpha + (Math.random() - 0.5) * 0.08;
					mutated.alpha = Math.max(.1, Math.min(1, mutatedAlpha));

				}
				return mutated;
			}
		};

		return Step;
	}

	angular.module('umbraco.resources').factory('primitiveStepFactory', ['primitiveHelperService', 'primitiveStateFactory', primitiveStepFactory]);
}());
