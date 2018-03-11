(function () {
    'use strict';

    function primitiveOptimizerFactory(Shape, Step, State, Canvas) {

        function Optimizer(original, cfg) {
            this.cfg = cfg;
            this.state = new State(original, Canvas.empty(cfg));
            this._steps = 0;
            this.onStep = () => { };
            this.onComplete = () => { };
        }

        Optimizer.prototype = {
            start: function() {
                this._ts = Date.now();
                this._addShape();
            },

            _addShape: function() {
                this._findBestStep().then(step => this._optimizeStep(step)).then(step => {
                    this._steps++;
                    if (step.distance < this.state.distance) { /* better than current state, epic */
                        this.state = step.apply(this.state);
                        this.onStep(step);
                    } else { /* worse than current state, discard */
                        this.onStep(null);
                    }
                    this._continue();
                });
            },

            _continue: function() {
                if (this._steps < this.cfg.steps) {
                    setTimeout(() => this._addShape(), 10);
                } else {
                    this.onComplete(null);
                }
            },

            _findBestStep: function() {
                const limit = this.cfg.shapes;

                let bestStep = null;
                const promises = [];

                for (let i = 0; i < limit; i++) {
                    const shape = Shape.create(this.cfg);

                    const promise = new Step(shape, this.cfg).compute(this.state).then(step => {
                        if (!bestStep || step.distance < bestStep.distance) {
                            bestStep = step;
                        }
                    });
                    promises.push(promise);
                }

                return Promise.all(promises).then(() => bestStep);
            },

            _optimizeStep: function(step) {
                const limit = this.cfg.mutations;

                let totalAttempts = 0;
                let successAttempts = 0;
                let failedAttempts = 0;
                let resolve = null;
                let bestStep = step;
                const promise = new Promise(r => resolve = r);

                const tryMutation = () => {
                    if (failedAttempts >= limit) {
                        return resolve(bestStep);
                    }

                    totalAttempts++;
                    bestStep.mutate().compute(this.state).then(mutatedStep => {
                        if (mutatedStep.distance < bestStep.distance) { /* success */
                            successAttempts++;
                            failedAttempts = 0;
                            bestStep = mutatedStep;
                        } else { /* failure */
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
}());

