(function () {
	'use strict';

	// create controller 
	function primitivePlaceholderController($scope, editorState, Helper, Canvas, Triangle, Rectangle, Ellipse, Optimizer) {

		let steps;
		const vector = document.querySelector('#vector');

		let vm = this;
		vm.regenerate = regenerate;
		vm.fullscreen = fullscreen;

		/**
		 * Do the work - creates Optimizer to process the original image, appending each shape to the DOM. When complete, pushes the SVG back into scope
		 * @param {any} original
		 * @param {any} cfg
		 */
		function go(original, cfg) {

			const optimizer = new Optimizer(original, cfg);
			const svg = Canvas.empty(cfg, true);

			steps = 0;

			vector.innerHTML = '';
			vector.appendChild(svg);

			optimizer.onStep = (step) => {
				if (step) {
					svg.appendChild(step.toSVG());
				}
			};

			optimizer.onComplete = () => {
				$scope.$apply(function () {
					const serializer = new XMLSerializer();
					$scope.model.value = serializer.serializeToString(svg);
				});
			};

			optimizer.start();
		}

		const shapeMap = {
			"triangle": Triangle,
			"rectangle": Rectangle,
			"ellipse": Ellipse
		};

		/**
		 * Return a config object either using defaults or values from the stored model
		 */
		function getConfig() {
			const o = {
				steps: +$scope.model.config.steps || 50,
				alpha: +$scope.model.config.alpha || 0.5,
				computeSize: +$scope.model.config.computeSize || 150,
				viewSize: 700, // this is arbitrary as we only deal with the exported svg string, which has a width set in the template/view
				shapes: +$scope.model.config.shapes || 75,
				mutations: +$scope.model.config.mutations || 20,

				mutateAlpha: $scope.model.config.mutateAlpha || true,

				// default to triangles only, but overwrite with values from config below
				shapeTypes: [Triangle],

				fill: 'auto',
			};

			if ($scope.model.config.shapeTypes) {
				o.shapeTypes = [];
				$scope.model.config.shapeTypes.forEach(type => {
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

			const state = editorState.getCurrent();
			const prop = state.properties.filter(function (v) {
				return v.alias.toLowerCase() === $scope.model.config.source.toLowerCase();
			})[0];

			if (prop) {

				// image cropper is nested, file upload stores the file path in value
				const url = prop.view === 'imagecropper' ? prop.value.src : prop.value;
				const cfg = getConfig();

				Canvas.original(url, cfg).then(original => go(original, cfg));
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
