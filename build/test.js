/*
 *  Copyright 2011 Research In Motion Limited.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
module.exports = function (done, custom) {
    var jasmine = require('jasmine-node'),
        verbose = false,
        colored = false,
        specs = __dirname + "/../" + (custom ? custom : "test/unit"),
        key;    

    //HACK: this should be  taken out if our pull request in jasmine is accepted.
    jasmine.Matchers.prototype.toThrow = function (expected) {
        var result = false,
            exception,
            not = this.isNot ? "not " : "";

        if (typeof this.actual !== 'function') {
            throw new Error('Actual is not a function');
        }
        try {
            this.actual();
        } catch (e) {
            exception = e;
        }
        if (exception) {
            if (typeof expected === 'function') {
                result = expected(exception);
            }
            else {
                result = (expected === jasmine.undefined || this.env.equals_(exception.message || exception, expected.message || expected));
            }
        }

        this.message = function () {
            if (exception && (expected === jasmine.undefined || !this.env.equals_(exception.message || exception, expected.message || expected))) {
                return ["Expected function " + not + "to throw", expected ? expected.message || expected : "an exception", ", but it threw", exception.message || exception].join(' ');
            } else {
                return "Expected function to throw an exception.";
            }
        };

        return result;
    };

    for (key in jasmine) {
        if (Object.prototype.hasOwnProperty.call(jasmine, key)) {
            global[key] = jasmine[key];
        }
    }

    jasmine.executeSpecsInFolder(specs, function (runner, log) {
        var failed = runner.results().failedCount === 0 ? 0 : 1;
        setTimeout(function () {
            (typeof done !== "function" ? process.exit : done)(failed);
        }, 10);
    }, verbose, colored);
};
