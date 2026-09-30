// Runs JpegEncoder off the main thread so the page stays responsive while a
// large photo is encoded. Protocol (each message is acked with {type:'ack'}):
//   {type:'init', width, height, quality, segments}
//   {type:'rows', rgba, rows}
//   {type:'finish'}  -> {type:'done', parts}
import { JpegEncoder } from './jpeg-encoder.js';

let encoder = null;

self.onmessage = ({ data }) => {
  try {
    if (data.type === 'init') {
      encoder = new JpegEncoder(data.width, data.height, { quality: data.quality, segments: data.segments });
      self.postMessage({ type: 'ack' });
    } else if (data.type === 'rows') {
      encoder.addRows(data.rgba, data.rows);
      self.postMessage({ type: 'ack' });
    } else if (data.type === 'finish') {
      const parts = encoder.finish();
      encoder = null;
      self.postMessage({ type: 'done', parts }, parts.map((p) => p.buffer));
    }
  } catch (err) {
    encoder = null;
    self.postMessage({ type: 'error', message: String(err && err.message || err) });
  }
};
