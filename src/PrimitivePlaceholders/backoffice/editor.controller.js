(() => {

    function primitivePlaceholderController($scope, $timeout, editorState, cropperHelper, Helper, Canvas, Triangle, Rectangle, Ellipse, Optimizer) {

        $scope.model.value = $scope.model.value || {
            src: '',
            shapes: []
        };

        const getShapeValue = val => {
            const s = $scope.model.value.shapes.filter(x => x.alias === val)[0];
            return s ? s.value : 0;
        }        
        
        $scope.model.value.shapes = $scope.model.config.shapeTypes.map((v, i) => {
            return {
                label: v.value[0].toUpperCase() + v.value.substr(1),
                alias: v.value,
                view: 'boolean',
                value: getShapeValue(v.value)
            }
        });
        
        
        let steps;
        const maxCropSize = 75;
        const vector = document.getElementById('pp-vector');        
                
        const shapeMap = {
            "triangle": Triangle,
            "rectangle": Rectangle,
            "ellipse": Ellipse
        };
        
        const state = editorState.getCurrent();

        const prop = state.properties.filter(v =>
            v.alias.toLowerCase() === $scope.model.config.source.toLowerCase())[0];

        if (prop.value.src && prop.value.crops && prop.value.focalPoint) {
            this.crops = prop.value.crops;
        }
        

        /**
         * Do the work - creates Optimizer to process the original image, appending each shape to the DOM. When complete, pushes the SVG back into scope
         * @param {any} original
         * @param {any} cfg
         */
        const go = (original, cfg) => {

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
                $scope.$apply(() => {
                    const serializer = new XMLSerializer();
                    $scope.model.value.src = serializer.serializeToString(svg);
                });
            };

            optimizer.start();
        }

        /**
         * Do the work - creates Optimizer to process the crop, appending each shape to the DOM. When complete, pushes the SVG back into scope using the alias as a key
         * @param {any} original
         * @param {any} cfg
         * @param {any} alias
         */
        const goCrop = (original, cfg, alias) => {

            const optimizer = new Optimizer(original, cfg);
            const svg = Canvas.empty(cfg, true);

            steps = 0;

            const el = document.getElementById('pp-' + alias);
            el.innerHTML = '';
            el.appendChild(svg);

            optimizer.onStep = (step) => {
                if (step) {
                    svg.appendChild(step.toSVG());
                }
            };

            optimizer.onComplete = () => {
                $scope.$apply(() => {
                    const serializer = new XMLSerializer();
                    $scope.model.value[alias] = serializer.serializeToString(svg);
                });
            };

            optimizer.start();
        }

        
        /**
         * Return a config object either using defaults or values from the stored model
         */
        const getConfig = () => {
            const o = {
                steps: +$scope.model.config.steps || 50,
                alpha: +$scope.model.config.alpha || 0.5,
                computeSize: +$scope.model.config.computeSize || 150,
                viewSize: 700, // this is arbitrary as we only deal with the exported svg string, which has a width set in the template/view
                shapes: +$scope.model.config.shapes || 75,
                mutations: +$scope.model.config.mutations || 20,
                mutateAlpha: $scope.model.config.mutateAlpha || true,
                fill: 'auto',
            };

            if ($scope.model.value.shapes) {
                o.shapeTypes = [];
                $scope.model.value.shapes.forEach(type => {
                    if (type.value === '1') {
                        o.shapeTypes.push(shapeMap[type.alias]);
                    }
                });
            }

            if (o.shapeTypes.length === 0) {
                // default to triangles only, but overwrite with values from config below
                o.shapeTypes = [Triangle];
            }

            return o;
        }
        
        
        // generate markup for each defined crop
        const generateCrops = (crops, cfg) => {
            crops.forEach(c => {
                Canvas.original(c.url, cfg).then(original => goCrop(original, cfg, c.alias));
            });
        };
        

        /**
         * 
         */
        this.fullscreen = e => {
            e.preventDefault();

            var newWindow = window.open();
            newWindow.document.write('<html><head></head><body><div style="height:100vh">' + $scope.model.value.src + '</div></body></html>');
        }

        
        /**
         * When the list of crops have rendered, populate existing lowpoly data
         */
        this.cropListRendered = () => {
            // check for existing crops
            if (prop && prop.value.crops) {
                prop.value.crops.forEach(c => {
                    $timeout(() => {
                        const el = document.getElementById('pp-' + c.alias);
                        if (el && $scope.model.value[c.alias]) {
                            el.innerHTML = $scope.model.value[c.alias];
                        }
                    });
                });
            }            
        };
        
        
        /**
         * longest side becomes half of the shorts
         */
        this.cropSize = (crop, isHeight) => {
            const result = cropperHelper.calculateAspectRatioFit(crop.width, crop.height, maxCropSize, maxCropSize, false);

            return isHeight ? result.height : result.width;
        };


        /**
         * Generate a low-poly svg preview of the uploaded image asset
         * @param {} e 
         * @returns {} 
         */
        this.regenerate = e => {

            if (e) {
                e.preventDefault();
            }

            if (prop) {
                const url = prop.value.src || prop.value;
                const cfg = getConfig();

                Canvas.original(url, cfg).then(original => go(original, cfg));

                if (prop.value.src && prop.value.crops && prop.value.focalPoint) {
                    const crops = prop.value.crops.map(c => {
                        return {
                            alias: c.alias,
                            url: `${prop.value.src}?center=${prop.value.focalPoint.top},${prop.value.focalPoint.left}&mode=crop&width=${c.width}&height=${c.height}`
                        }
                    });

                    generateCrops(crops, cfg);
                }
            }

        }

        // on load, if a value exists, display the svg, otherwise create a new one
        if ($scope.model.value.src.length) {
            vector.innerHTML = $scope.model.value.src;
        } else {
            this.regenerate();
        }
    };

    // register controller 
    angular.module('umbraco').controller('primitivePlaceholderController', ['$scope', '$timeout', 'editorState', 'cropperHelper', 'primitiveHelperService', 'primitiveCanvasFactory', 'primitiveTriangleFactory', 'primitiveRectangleFactory', 'primitiveEllipseFactory', 'primitiveOptimizerFactory', primitivePlaceholderController]);
})();
