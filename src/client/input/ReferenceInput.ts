import type { InputCommand, Point } from '../../core/reference';

export class ReferenceInput {
  private keys = new Set<string>();
  private fire = false;
  private dash = false;
  private sequence = 0;
  private active = false;
  private controller = new AbortController();
  constructor(canvas: HTMLCanvasElement, onPause: () => void, onBlur: () => void) {
    const signal = this.controller.signal;
    window.addEventListener('keydown', event => {
      const key = event.key.toLowerCase();
      if ((event.target as HTMLElement)?.matches('input')) return;
      if (!event.repeat && ['p', 'escape'].includes(key)) { onPause(); return; }
      if ((event.target as HTMLElement)?.matches('button,a')) return;
      if ([' ', 'shift', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) event.preventDefault();
      if (!this.active) return;
      this.keys.add(key);
      if (!event.repeat && (key === ' ' || key === 'shift')) this.dash = true;
    }, { signal });
    window.addEventListener('keyup', event => this.keys.delete(event.key.toLowerCase()), { signal });
    canvas.addEventListener('pointerdown', event => {
      canvas.focus();
      if (this.active && event.button === 0) this.fire = true;
    }, { signal });
    window.addEventListener('pointerup', () => { this.fire = false; }, { signal });
    const blur = () => { this.reset(); onBlur(); };
    window.addEventListener('blur', blur, { signal });
    document.addEventListener('visibilitychange', () => { if (document.hidden) blur(); }, { signal });
  }
  enable(value: boolean) { this.active = value; this.reset(); }
  reset() { this.keys.clear(); this.fire = false; this.dash = false; }
  sample(aim: Point): InputCommand {
    const pressed = (...keys: string[]) => keys.some(key => this.keys.has(key)) ? 1 : 0;
    const command = { sequence: ++this.sequence,
      moveX: pressed('d', 'arrowright') - pressed('a', 'arrowleft'),
      moveY: pressed('s', 'arrowdown') - pressed('w', 'arrowup'), aim,
      fire: this.fire, dash: this.dash };
    this.dash = false;
    return command;
  }
  destroy() { this.controller.abort(); }
}
