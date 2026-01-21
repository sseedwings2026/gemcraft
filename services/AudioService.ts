
class AudioService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playMergeSound(level: number, isTriple: boolean, combo: number) {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // 콤보에 따라 피치 상승 (세미톤 단위)
    const pitchShift = Math.pow(1.059, level + combo);
    const baseFreq = 440 * pitchShift;
    
    // 볼륨 설정: 트리플은 +30% (약 1.3배)
    const volumeMultiplier = isTriple ? 1.3 : 1.0;

    if (!isTriple) {
      // 2개 합성: crystal_click 스타일
      this.createTone(baseFreq * 1.2, 'sine', 0.15 * volumeMultiplier, 0.15, 0.005);
      this.createTone(baseFreq * 2.5, 'sine', 0.05 * volumeMultiplier, 0.1, 0.002);
    } else {
      // 3개 합성: crystal_burst 스타일 (더 웅장하고 레이어드됨)
      this.createTone(baseFreq * 0.5, 'sine', 0.3 * volumeMultiplier, 0.5, 0.02); // 베이스
      this.createTone(baseFreq, 'triangle', 0.2 * volumeMultiplier, 0.4, 0.01);  // 메인
      this.createTone(baseFreq * 1.5, 'sine', 0.1 * volumeMultiplier, 0.3, 0.005); // 하모닉스
      this.createTone(baseFreq * 3, 'sine', 0.05 * volumeMultiplier, 0.6, 0.002);  // 반짝임
      
      // 타격감 노이즈
      this.createNoise(0.1 * volumeMultiplier, 0.05);
    }
  }

  private createTone(freq: number, type: OscillatorType, volume: number, duration: number, attack: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  private createNoise(volume: number, duration: number) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    noise.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }
}

export const audioService = new AudioService();
