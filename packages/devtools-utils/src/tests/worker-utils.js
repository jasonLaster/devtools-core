/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { WorkerDispatcher, streamingWorkerHandler } = require("../worker-utils");

describe("worker utils", () => {
  it("starts a worker", () => {
    const dispatcher = new WorkerDispatcher();
    global.Worker = jest.fn();
    dispatcher.start("foo");
    expect(dispatcher.worker).toEqual(global.Worker.mock.instances[0]);
  });

  it("stops a worker", () => {
    const dispatcher = new WorkerDispatcher();
    const terminateMock = jest.fn();

    global.Worker = jest.fn(() => {
      return {
        terminate: terminateMock
      };
    });

    dispatcher.start();
    dispatcher.stop();

    expect(dispatcher.worker).toEqual(null);
    expect(terminateMock.mock.calls.length).toEqual(1);
  });

  it("dispatches a task", () => {
    const dispatcher = new WorkerDispatcher();
    const postMessageMock = jest.fn();
    const addEventListenerMock = jest.fn();

    global.Worker = jest.fn(() => {
      return {
        postMessage: postMessageMock,
        addEventListener: addEventListenerMock
      };
    });

    dispatcher.start();
    const task = dispatcher.task("foo");
    task("bar");

    const postMessageMockCall = postMessageMock.mock.calls[0][0];

    expect(postMessageMockCall).toEqual({
      args: ["bar"],
      id: 1,
      method: "foo"
    });

    expect(addEventListenerMock.mock.calls.length).toEqual(1);
  });

  fit("streams a task", async () => {
    const postMessageMock = jest.fn();
    jest.useFakeTimers();

    let mocks = [];
    for (let i = 0; i < 10; i++) {
      const fn = jest.fn();
      mocks.push(fn);
      // fn();
    }

    function makeTasks() {
      console.log("YO");
      return [
        {
          callback: () => new Promise(resolve => setTimeout(() => resolve(2), 50))
        },
        {
          callback: () => new Promise(resolve => setTimeout(() => resolve(1), 50))
        }
      ];
    }

    const worker = {
      postMessage: postMessageMock
    };

    const workerHandler = streamingWorkerHandler(worker, { makeTasks });
    const task = workerHandler({ data: { id: 2, method: "makeTasks", args: [] } });

    // jest.runTimersToTime(320);;
    await task;

    console.log(postMessageMock.mock.calls.map(cal => JSON.stringify(cal)));
    console.log(mocks.map(mock => mock.mock.calls));
  });
});
