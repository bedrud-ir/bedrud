import type { AudioProcessorOptions, TrackProcessor } from 'livekit-client'
import { Track } from 'livekit-client'
// Import the sync WASM module as raw text so we can embed it in an AudioWorklet blob.
// The sync version has the WASM binary inlined as base64 — no external file needed.
import rnnoiseSync from '@jitsi/rnnoise-wasm/dist/rnnoise-sync?raw'

const WORKLET_NAME = 'rnnoise-worklet-processor'
const FRAME_SIZE = 480

/**
 * Builds the AudioWorklet processor script as a string.
 *
 * We inject the rnnoise-sync module directly so the blob URL is self-contained.
 * `import.meta.url` is replaced with an empty string — the sync version has its
 * WASM inlined as base64 so it never needs to resolve external file paths.
 *
 * Scaling: Web Audio uses float32 in [-1, 1] but RNNoise operates in the int16
 * range [-32768, 32768], so samples are scaled on input and output.
 */
function buildWorkletScript(rnnoiseCode: string): string {
  const safeCode = rnnoiseCode.replace('var _scriptDir = import.meta.url;', 'var _scriptDir = "";')

  return `
${safeCode}

const FRAME_SIZE = ${FRAME_SIZE};
const SCALE = 32768;

class RNNoiseWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._inputBuf  = new Float32Array(FRAME_SIZE);
    this._outputBuf = new Float32Array(FRAME_SIZE);
    this._inputIdx  = 0;
    this._outputIdx = 0;
    this._module    = null;
    this._state     = null;
    this._heapIn    = 0;
    this._heapOut   = 0;
    this._setup();
  }

  _setup() {
    try {
      const mod = createRNNWasmModuleSync();
      if (typeof mod._rnnoise_create === 'function') {
        this._init(mod);
      } else {
        console.error('[RNNoise] WASM module loaded but _rnnoise_create not found — falling back to pass-through');
      }
    } catch (err) {
      console.error('[RNNoise] WASM init failed — falling back to pass-through:', err);
    }
  }

  _init(mod) {
    this._module  = mod;
    this._state   = mod._rnnoise_create(null);
    this._heapIn  = mod._malloc(FRAME_SIZE * 4);
    this._heapOut = mod._malloc(FRAME_SIZE * 4);
  }

  _processFrame() {
    const mod = this._module;
    // Scale from [-1,1] to RNNoise's expected [-32768, 32768]
    const scaled = new Float32Array(FRAME_SIZE);
    for (let i = 0; i < FRAME_SIZE; i++) scaled[i] = this._inputBuf[i] * SCALE;
    mod.HEAPF32.set(scaled, this._heapIn >> 2);
    mod._rnnoise_process_frame(this._state, this._heapOut, this._heapIn);
    const out = mod.HEAPF32.subarray(this._heapOut >> 2, (this._heapOut >> 2) + FRAME_SIZE);
    for (let i = 0; i < FRAME_SIZE; i++) this._outputBuf[i] = out[i] / SCALE;
  }

  process(inputs, outputs) {
    const inp = inputs[0]?.[0];
    const out = outputs[0]?.[0];
    if (!inp || !out) return true;

    for (let i = 0; i < inp.length; i++) {
      // Accumulate input
      this._inputBuf[this._inputIdx++] = inp[i];
      if (this._inputIdx >= FRAME_SIZE) {
        if (this._module) {
          this._processFrame();
        } else {
          // Pass-through until WASM is ready
          this._outputBuf.set(this._inputBuf);
        }
        this._inputIdx  = 0;
        this._outputIdx = 0;
      }
      // Emit output (10ms latency inherent to 480-sample framing)
      out[i] = this._outputIdx < FRAME_SIZE ? this._outputBuf[this._outputIdx++] : 0;
    }
    return true;
  }

  static get parameterDescriptors() { return []; }
}

registerProcessor('${WORKLET_NAME}', RNNoiseWorkletProcessor);
`
}

let workletUrl: string | null = null

function getWorkletUrl(): string {
  if (!workletUrl) {
    const script = buildWorkletScript(rnnoiseSync as string)
    const blob   = new Blob([script], { type: 'application/javascript' })
    workletUrl   = URL.createObjectURL(blob)
  }
  return workletUrl
}

export class RNNoiseProcessor implements TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> {
  readonly name = WORKLET_NAME

  processedTrack?: MediaStreamTrack

  private source?:      MediaStreamAudioSourceNode
  private workletNode?: AudioWorkletNode
  private destination?: MediaStreamAudioDestinationNode
  private audioContext?: AudioContext

  async init(opts: AudioProcessorOptions): Promise<void> {
    this.audioContext = opts.audioContext
    await this.audioContext.audioWorklet.addModule(getWorkletUrl())

    const stream = new MediaStream([opts.track])
    this.source      = this.audioContext.createMediaStreamSource(stream)
    this.workletNode = new AudioWorkletNode(this.audioContext, WORKLET_NAME)
    this.destination = this.audioContext.createMediaStreamDestination()

    this.source.connect(this.workletNode)
    this.workletNode.connect(this.destination)

    this.processedTrack = this.destination.stream.getAudioTracks()[0]
  }

  async restart(opts: AudioProcessorOptions): Promise<void> {
    await this.destroy()
    await this.init(opts)
  }

  async destroy(): Promise<void> {
    this.workletNode?.disconnect()
    this.source?.disconnect()
    this.destination?.disconnect()
    this.processedTrack?.stop()
    this.processedTrack = undefined
    this.workletNode    = undefined
    this.source         = undefined
    this.destination    = undefined
    // audioContext is owned by LiveKit — do not close it here
  }
}
