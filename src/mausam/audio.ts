// Web Audio API ambient synthesizer for Mausam weather sounds

class WeatherAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private activeNodes: AudioNode[] = [];
  private masterGain: GainNode | null = null;
  private currentType: "rain" | "wind" | "storm" | "clear" = "rain";

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public toggleSound(type: "rain" | "wind" | "storm" | "clear" = "rain"): boolean {
    if (this.isPlaying && this.currentType === type) {
      this.stop();
      return false;
    }
    this.stop();
    this.start(type);
    return true;
  }

  public start(type: "rain" | "wind" | "storm" | "clear") {
    this.initCtx();
    if (!this.ctx) return;

    this.currentType = type;
    this.isPlaying = true;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    this.masterGain.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 1.2);
    this.masterGain.connect(this.ctx.destination);

    if (type === "rain" || type === "storm") {
      this.createRainSound();
    } else if (type === "wind") {
      this.createWindSound();
    } else {
      this.createNightSound();
    }
  }

  private createRainSound() {
    if (!this.ctx || !this.masterGain) return;

    // Pink/White noise buffer for rain drop patter
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to simulate soft rain drops
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.masterGain);
    whiteNoise.start();

    this.activeNodes.push(whiteNoise, filter);
  }

  private createWindSound() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
    }

    const brownNoise = this.ctx.createBufferSource();
    brownNoise.buffer = noiseBuffer;
    brownNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    brownNoise.connect(filter);
    filter.connect(this.masterGain);
    brownNoise.start();

    this.activeNodes.push(brownNoise, filter);
  }

  private createNightSound() {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.02, this.ctx.currentTime);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();

    this.activeNodes.push(osc, gain);
  }

  public stop() {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    }
    setTimeout(() => {
      this.activeNodes.forEach((node) => {
        if ("stop" in node && typeof node.stop === "function") {
          try {
            node.stop();
          } catch {
            // ignore
          }
        }
      });
      this.activeNodes = [];
      this.isPlaying = false;
    }, 500);
  }

  public getIsPlaying() {
    return this.isPlaying;
  }
}

export const weatherAudio = new WeatherAudioEngine();
