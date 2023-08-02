// @ts-nocheck

import { generateImage } from "./generateImage";

const work = self as unknown as Worker;

work.onmessage = async function (msg) {
  const { id, payload } = msg.data;
  if (id == null) return;

  const { data, opts } = payload;

  try {
    const result = await generateImage(data, opts);
    work.postMessage({ id, payload: result });
  } catch (err: any) {
    work.postMessage({ id, err: String(err) });
  }
};
