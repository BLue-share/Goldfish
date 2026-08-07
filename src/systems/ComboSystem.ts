export interface ComboState {
  count: number;
  multiplier: number;
  label: string;
  lastHitTime: number;
  isBurst: boolean;
  burstTimer: number;
  /** 今回のヒットで到達したマイルストーンボーナス（なければ 0） */
  milestoneBonus: number;
  /** 今回ラベルが切り替わったか */
  labelJustReached: boolean;
}

const COMBO_DECAY_DELAY = 1500;
const BURST_THRESHOLD = 20;
const BURST_DURATION = 5000;

/** 連続数 → 加算ボーナス（到達時のみ） */
const MILESTONE_BONUSES: Record<number, number> = {
  5: 50,
  10: 150,
  15: 300,
  20: 500,
  30: 1000,
  50: 3000,
};

export class ComboSystem {
  private state: ComboState = {
    count: 0,
    multiplier: 1,
    label: '',
    lastHitTime: 0,
    isBurst: false,
    burstTimer: 0,
    milestoneBonus: 0,
    labelJustReached: false,
  };

  hit(time: number): ComboState {
    const prevLabel = this.state.label;
    this.state.count++;
    this.state.lastHitTime = time;
    this.updateMultiplier();

    this.state.milestoneBonus = MILESTONE_BONUSES[this.state.count] ?? 0;
    this.state.labelJustReached = this.state.label !== '' && this.state.label !== prevLabel;

    if (this.state.count >= BURST_THRESHOLD && !this.state.isBurst) {
      this.state.isBurst = true;
      this.state.burstTimer = BURST_DURATION;
    }

    return { ...this.state };
  }

  update(time: number, delta: number): ComboState {
    this.state.milestoneBonus = 0;
    this.state.labelJustReached = false;

    if (this.state.isBurst) {
      this.state.burstTimer -= delta;
      if (this.state.burstTimer <= 0) {
        this.state.isBurst = false;
      }
    }

    if (this.state.count > 0 && time - this.state.lastHitTime > COMBO_DECAY_DELAY) {
      this.reset();
    }

    return { ...this.state };
  }

  private updateMultiplier(): void {
    const c = this.state.count;
    if (c >= 50) {
      this.state.multiplier = 16;
      this.state.label = '神業！';
    } else if (c >= 20) {
      this.state.multiplier = 8;
      this.state.label = '名人！';
    } else if (c >= 10) {
      this.state.multiplier = 4;
      this.state.label = '上手い！';
    } else if (c >= 5) {
      this.state.multiplier = 2;
      this.state.label = 'うまい！';
    } else {
      this.state.multiplier = 1;
      this.state.label = '';
    }
  }

  reset(): void {
    this.state.count = 0;
    this.state.multiplier = 1;
    this.state.label = '';
    this.state.isBurst = false;
    this.state.burstTimer = 0;
    this.state.milestoneBonus = 0;
    this.state.labelJustReached = false;
  }

  getState(): ComboState {
    return { ...this.state };
  }
}
