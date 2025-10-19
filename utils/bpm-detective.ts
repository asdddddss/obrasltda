// This is an ES Module adaptation of the 'bpm-detective' library by tornqvist.
// Original source: https://github.com/tornqvist/bpm-detective
// The library is used to detect the tempo (BPM) of an audio buffer.

export function detectBPM(buffer: AudioBuffer): Promise<number> {
  return new Promise((resolve, reject) => {
    try {
      const worker = new BpmWorker();
      worker.detect(buffer, (err: Error | null, bpm?: number) => {
        if (err) {
          return reject(err);
        }
        if (bpm) {
          resolve(bpm);
        } else {
          reject(new Error('BPM detection failed to return a value.'));
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}


class BpmWorker {
    private readonly validTempoRange = [90, 180];
    private readonly expiryTime = 10;
  
    public detect(buffer: AudioBuffer, callback: (err: Error | null, bpm?: number) => void) {
      this.getPeaks(buffer).then(peaks => {
        if (!peaks) {
            return callback(new Error("Could not get peaks"));
        }
        
        const intervals = this.getIntervals(peaks);
        const topCandidates = this.getTopCandidates(intervals);
        
        let bpm;
        let highestCount = 0;
  
        topCandidates.forEach((candidate) => {
          if (candidate.count > highestCount) {
            highestCount = candidate.count;
            bpm = candidate.tempo;
          }
        });
  
        callback(null, bpm);
      }).catch(err => {
        callback(err)
      });
    }
  
    private async getPeaks(buffer: AudioBuffer): Promise<number[]> {
      const source = this.createOfflineContext(buffer);
  
      const lowpass = source.context.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 150;
      lowpass.Q.value = 1;
  
      source.connect(lowpass);
  
      const highpass = source.context.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 100;
      highpass.Q.value = 1;
  
      lowpass.connect(highpass);
  
      highpass.connect(source.context.destination);
      
      source.start(0);

      const renderedBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
        const context = source.context as OfflineAudioContext;
        // Modern API
        if (typeof context.startRendering === 'function') {
            context.startRendering().then(resolve).catch(reject);
        } else {
            // Legacy API (older Safari)
            context.oncomplete = (event) => resolve(event.renderedBuffer);
        }
      });
      
      const data = renderedBuffer.getChannelData(0);
      const peaks = this.findPeaks(data, renderedBuffer.sampleRate);
      return peaks;
    }
  
    private createOfflineContext(buffer: AudioBuffer) {
      const OfflineContext = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
      const offlineContext = new OfflineContext(1, buffer.length, buffer.sampleRate);
      const source = offlineContext.createBufferSource();
      source.buffer = buffer;
      return source;
    }
  
    private findPeaks(data: Float32Array, sampleRate: number): number[] {
      const minPeakDistance = 0.2;
      const minPeakVolume = 0.1;
      const peaks: number[] = [];
  
      let lastPeakTime = 0;
      for (let i = 1; i < data.length - 1; i++) {
        const isPeak = data[i] > data[i-1] && data[i] > data[i+1];
        if (isPeak && data[i] > minPeakVolume) {
          const peakTime = i / sampleRate;
          if (peakTime - lastPeakTime > minPeakDistance) {
            peaks.push(peakTime);
            lastPeakTime = peakTime;
          }
        }
      }
      return peaks;
    }
  
    private getIntervals(peaks: number[]): number[] {
      const intervals: number[] = [];
      for (let i = 0; i < peaks.length - 1; i++) {
        for (let j = i + 1; j < peaks.length; j++) {
          const interval = peaks[j] - peaks[i];
          if (interval > this.expiryTime) {
            break;
          }
          intervals.push(interval);
        }
      }
      return intervals;
    }
  
    private getTopCandidates(intervals: number[]): { tempo: number, count: number }[] {
      const candidates: { tempo: number, count: number }[] = [];
      intervals.forEach((interval) => {
        if (interval > 0) {
          let tempo = 60 / interval;
          while (tempo < this.validTempoRange[0]) {
            tempo *= 2;
          }
          while (tempo > this.validTempoRange[1]) {
            tempo /= 2;
          }
          const roundedTempo = Math.round(tempo);
          let found = false;
          candidates.forEach((candidate) => {
            if (candidate.tempo === roundedTempo) {
              candidate.count++;
              found = true;
            }
          });
          if (!found) {
            candidates.push({ tempo: roundedTempo, count: 1 });
          }
        }
      });
      return candidates.sort((a, b) => b.count - a.count).slice(0, 5);
    }
}