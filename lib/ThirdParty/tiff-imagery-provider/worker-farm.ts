// @ts-nocheck
// import GenerateImageWorker from "web-worker:./worker";
import { GenerateImageOptions } from "./generateImage";
import { TypedArray } from "./plotty/typing";

const GenerateImageWorker = require("worker-loader!./worker");
const resolves = {};
const rejects = {};
let globalMsgId = 0; // Activate calculation in the worker, returning a promise

async function sendMessage(
  worker: Worker,
  payload: { data: TypedArray[]; opts: GenerateImageOptions }
) {
  const msgId = globalMsgId++;
  const msg = {
    id: msgId,
    payload
  };
  return new Promise<ImageData>(function (resolve, reject) {
    // save callbacks for later
    resolves[msgId] = resolve;
    rejects[msgId] = reject;
    worker.postMessage(msg);
  });
} // Handle incoming calculation result

function handleMessage(msg: any) {
  const { id, err, payload } = msg.data;
  if (payload) {
    const resolve = resolves[id];
    if (resolve) {
      resolve(payload);
    }
  } else {
    // error condition
    const reject = rejects[id];
    if (reject) {
      if (err) {
        reject(err);
      } else {
        reject("Got nothing");
      }
    }
  }

  // purge used callbacks
  delete resolves[id];
  delete rejects[id];
}

class WorkerFarm {
  worker: Worker;
  constructor() {
    this.worker = new GenerateImageWorker();
    this.worker.onmessage = handleMessage;
  }

  async scheduleTask(data: TypedArray[], opts: GenerateImageOptions) {
    return await sendMessage(this.worker, { data, opts });
  }

  destory() {
    this.worker?.terminate();
    this.worker = undefined;
  }
}

export default WorkerFarm;
