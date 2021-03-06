/*
 * Copyright 2011-2012 Research In Motion Limited.
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

var _ID = "blackberry.invoke",
    _extDir = __dirname + "./../../../../ext",
    _apiDir = _extDir + "/" + _ID,
    client,
    mockedWebworks = {
        execAsync: jasmine.createSpy("webworks.execAsync"),
        execSync: jasmine.createSpy(),
        defineReadOnlyField: jasmine.createSpy(),
        event: {
            isOn: jasmine.createSpy("webworks.event.isOn")
        }
    };

describe("blackberry.invoke client", function () {
    beforeEach(function () {
        GLOBAL.window = GLOBAL;
        GLOBAL.window.btoa = jasmine.createSpy("window.btoa").andReturn("base64 string");
        mockedWebworks.event.once = jasmine.createSpy("webworks.event.once");
        GLOBAL.window.webworks = mockedWebworks;
        client = require(_apiDir + "/client");
    });

    afterEach(function () {
        delete GLOBAL.window;
        client = null;
    });

    describe("invoke", function () {

        it("should call error callback if request is not valid", function () {
            var onError = jasmine.createSpy("client onError");

            client.invoke(null, null, onError);
            expect(onError).toHaveBeenCalled();
        });

        it("should call once and execAsync", function () {
            var request = {
                    target: "abc.xyz"
                },
                callback = jasmine.createSpy("client callback");

            client.invoke(request, callback);

            expect(mockedWebworks.event.once).toHaveBeenCalledWith(_ID, "blackberry.invoke.invokeEventId", jasmine.any(Function));
            expect(mockedWebworks.execAsync).toHaveBeenCalledWith(_ID, "invoke", {"request": request});
        });

        it("should encode data to base64 string", function () {
            var request = {
                    target: "abc.xyz",
                    data: "my string"
                },
                callback = jasmine.createSpy("client callback");

            client.invoke(request, callback);

            expect(window.btoa).toHaveBeenCalledWith("my string");
            expect(mockedWebworks.execAsync).toHaveBeenCalledWith(_ID, "invoke", {
                "request": {
                    target: request.target,
                    data: "base64 string"
                }
            });
        });

        it("should call onError if failed to encode data to base64", function () {
            var request = {
                    target: "abc.xyz",
                    data: "my string"
                },
                onError = jasmine.createSpy("client onError");

            GLOBAL.window.btoa = jasmine.createSpy("window.btoa").andThrow("bad string");
            client.invoke(request, null, onError);
            expect(onError).toHaveBeenCalledWith("bad string");
        });

        it("should call onSuccess if invocation is successful", function () {
            var request = {
                    target: "abc.xyz"
                },
                onSuccess = jasmine.createSpy("client onSuccess"),
                onError = jasmine.createSpy("client onError");

            client.invoke(request, onSuccess);
            mockedWebworks.event.once.argsForCall[0][2]("");
            expect(onSuccess).toHaveBeenCalled();
            expect(onError).not.toHaveBeenCalled();
        });

        it("should call onError if invocation failed", function () {
            var request = {
                    target: "abc.xyz"
                },
                onSuccess = jasmine.createSpy("client onSuccess"),
                onError = jasmine.createSpy("client onError");

            client.invoke(request, null, onError);
            mockedWebworks.event.once.argsForCall[0][2]("There is an error");
            expect(onSuccess).not.toHaveBeenCalled();
            expect(onError).toHaveBeenCalled();
        });
    });

    describe("query", function () {

        beforeEach(function () {
            mockedWebworks.event.once.andCallFake(function (id, eventId, func) {
                mockedWebworks.event.handler = [];
                mockedWebworks.event.handler[eventId] = func;
            });

            mockedWebworks.execAsync.andCallFake(function (id, action, args) {

                if (id && id === "blackberry.invoke" && action && action === "query") {
                    var _queryEventId = "blackberry.invoke.queryEventId";

                    //Valid the args
                    if (args && args.request && (args.request["type"] || args.request["uri"]) &&
                            args.request["target_type"]) {
                        mockedWebworks.event.handler[_queryEventId]({"error": "", "response": {}});
                    } else {
                        mockedWebworks.event.handler[_queryEventId]({"error": "invalid_argument", "response": null});
                    }

                    delete mockedWebworks.event.handler[_queryEventId];
                }
            });
        });

        afterEach(function () {
            if (mockedWebworks.event.handler) {
                delete mockedWebworks.event.handler;
            }
        });

        it("should register an event callback to be triggered by the server side", function () {
            var request = {
                    "action": "bb.action.OPEN",
                    "type": "image/*",
                    "target_type": "ALL"
                },
                onSuccess = jasmine.createSpy("client onSuccess"),
                onError = jasmine.createSpy("client onError");

            client.query(request, onSuccess, onError);
            expect(mockedWebworks.event.once).toHaveBeenCalledWith("blackberry.invoke", "blackberry.invoke.queryEventId", jasmine.any(Function));
            expect(mockedWebworks.execAsync).toHaveBeenCalledWith("blackberry.invoke", "query", {"request": request });
        });

        it("should call success callback if the invocation is successfull", function () {
            var request = {
                    "action": "bb.action.OPEN",
                    "type": "image/*",
                    "target_type": "ALL"
                },
                onSuccess = jasmine.createSpy("client onSuccess"),
                onError = jasmine.createSpy("client onError");

            client.query(request, onSuccess, onError);
            expect(window.webworks.execAsync).toHaveBeenCalledWith("blackberry.invoke", "query", {"request": request});
            expect(onSuccess).toHaveBeenCalledWith(jasmine.any(Object));
            expect(onError).not.toHaveBeenCalled();
        });

        it("should trigger error callback if the invocation is unsuccessfull", function () {
            var request = {
                    "action": "bb.action.OPEN",
                    "target_type": "ALL"
                },
                onSuccess = jasmine.createSpy("client onSuccess"),
                onError = jasmine.createSpy("client onError");

            client.query(request, onSuccess, onError);
            expect(onSuccess).not.toHaveBeenCalled();
            expect(onError).toHaveBeenCalledWith(jasmine.any(String));
        });
    });
});
