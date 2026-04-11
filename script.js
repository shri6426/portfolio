/* ═══════════════════════════════════════════════════
   CURSOR — smooth custom cursor
   ═══════════════════════════════════════════════════ */
const dot = document.getElementById('dot');
const ring = document.getElementById('ring');
let mx = 0, my = 0, rx = 0, ry = 0;
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  dot.style.transform = `translate(${mx}px,${my}px)`;
});
(function loop() {
  rx += (mx - rx) * 0.13;
  ry += (my - ry) * 0.13;
  ring.style.transform = `translate(${rx}px,${ry}px)`;
  requestAnimationFrame(loop);
})();

/* Cursor grow on hover over interactive elements */
document.querySelectorAll('a, .btn, .wcard, .pcard, .scard, .chip, .atag, .stickman-canvas').forEach(el => {
  el.addEventListener('mouseenter', () => {
    ring.style.width = '56px';
    ring.style.height = '56px';
    ring.style.margin = '-28px 0 0 -28px';
    ring.style.borderColor = 'rgba(224,64,251,.6)';
  });
  el.addEventListener('mouseleave', () => {
    ring.style.width = '36px';
    ring.style.height = '36px';
    ring.style.margin = '-18px 0 0 -18px';
    ring.style.borderColor = 'rgba(255,255,255,.4)';
  });
});

/* ═══════════════════════════════════════════════════
   SPARKLES — floating dots in hero
   ═══════════════════════════════════════════════════ */
const sc = document.getElementById('sparks');
for (let i = 0; i < 50; i++) {
  const s = document.createElement('div');
  s.className = 'sp';
  const z = 2 + Math.random() * 3;
  s.style.cssText = `width:${z}px;height:${z}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;--d:${2 + Math.random() * 4}s;--dl:${Math.random() * 6}s`;
  sc.appendChild(s);
}

/* ═══════════════════════════════════════════════════
   AURORA — animated background blobs
   ═══════════════════════════════════════════════════ */
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
let W, H;
function resize() { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; }
resize(); window.addEventListener('resize', resize);
const B = [
  { x: .25, y: .4, r: 380, c: [255, 100, 20], sx: -.34, sy: -.14, sp: .025 },
  { x: .75, y: .35, r: 430, c: [200, 40, 245], sx: .28, sy: -.22, sp: .018 },
  { x: .5, y: .65, r: 340, c: [20, 140, 255], sx: .1, sy: .24, sp: .022 },
  { x: .18, y: .7, r: 280, c: [240, 200, 0], sx: -.22, sy: .2, sp: .03 },
  { x: .85, y: .7, r: 300, c: [60, 230, 170], sx: .26, sy: .28, sp: .02 },
];
B.forEach(b => { b.cx = b.x * window.innerWidth; b.cy = b.y * window.innerHeight; });
let ax = W / 2, ay = H / 2;
window.addEventListener('mousemove', e => { ax = e.clientX; ay = e.clientY; });
(function frame(t = 0) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  B.forEach(b => {
    const tx = W * .5 + ax * .16 * b.sx + Math.sin(t * .0004 + b.sx * 9) * 55;
    const ty = H * .5 + ay * .16 * b.sy + Math.cos(t * .0003 + b.sy * 9) * 48;
    b.cx += (tx - b.cx) * b.sp;
    b.cy += (ty - b.cy) * b.sp;
    const g = ctx.createRadialGradient(b.cx, b.cy, 0, b.cx, b.cy, b.r);
    const [r, gr, bl] = b.c;
    g.addColorStop(0, `rgba(${r},${gr},${bl},.26)`);
    g.addColorStop(.45, `rgba(${r},${gr},${bl},.1)`);
    g.addColorStop(1, `rgba(${r},${gr},${bl},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.cx, b.cy, b.r, 0, Math.PI * 2); ctx.fill();
  });
  requestAnimationFrame(frame);
})();

/* ═══════════════════════════════════════════════════
   INTERACTIVE STICKMAN PLAYGROUND
   ═══════════════════════════════════════════════════ */
class StickmanPlayground {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = 0; this.H = 0;
    this.mouseX = 0; this.mouseY = 0;
    this.isHovering = false;
    this.clicked = false;
    this.time = 0;

    // Stickmen array
    this.stickmen = [];
    this.particles = [];

    this.resize();
    window.addEventListener('resize', () => this.resize());

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      this.isHovering = true;
    });
    canvas.addEventListener('mouseleave', () => { this.isHovering = false; });
    canvas.addEventListener('click', e => {
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      this.clicked = true;
      setTimeout(() => this.clicked = false, 500);
      // Spawn burst particles on click
      this.spawnBurst(cx, cy);
      // Make nearby stickmen jump
      this.stickmen.forEach(s => {
        const d = Math.hypot(s.x - cx, s.y - cy);
        if (d < 200) {
          s.vy = -8 - Math.random() * 4;
          s.emotion = 'excited';
          s.emotionTimer = 120;
        }
      });
    });

    this.initStickmen();
    this.animate();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.W = this.canvas.width = rect.width;
    this.H = this.canvas.height = 450;
    this.canvas.style.width = this.W + 'px';
    this.canvas.style.height = '450px';
    // Reposition stickmen on resize
    this.stickmen.forEach(s => {
      s.groundY = this.H - 30;
      if (s.y > s.groundY) s.y = s.groundY;
    });
  }

  initStickmen() {
    const colors = ['#e040fb', '#00e5ff', '#ffda00', '#b2ff59', '#ff6a1a', '#7c5cfc'];
    const count = 6;
    for (let i = 0; i < count; i++) {
      this.stickmen.push({
        x: (this.W / (count + 1)) * (i + 1),
        y: this.H - 30,
        vx: 0,
        vy: 0,
        groundY: this.H - 30,
        color: colors[i % colors.length],
        scale: 0.8 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        walkSpeed: 0.5 + Math.random() * 1.0,
        direction: Math.random() > 0.5 ? 1 : -1,
        state: 'idle', // idle, walking, waving, jumping, dancing, pushup
        stateTimer: 60 + Math.random() * 120,
        emotion: 'normal',
        emotionTimer: 0,
        armAngle: 0,
        legAngle: 0,
        headBob: 0,
        personalitySpeed: 0.7 + Math.random() * 0.6,
        // For rope/tug interactions
        holding: false,
        // Speech bubble
        speech: '',
        speechTimer: 0,
      });
    }
  }

  spawnBurst(x, y) {
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 / 20) * i + Math.random() * 0.3;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        decay: 0.015 + Math.random() * 0.02,
        size: 2 + Math.random() * 4,
        color: ['#e040fb', '#00e5ff', '#ffda00', '#b2ff59', '#ff6a1a'][Math.floor(Math.random() * 5)],
      });
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12; // gravity
      p.life -= p.decay;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  drawParticles() {
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }

  updateStickman(s) {
    const t = this.time * s.personalitySpeed;

    // State machine
    s.stateTimer--;
    if (s.stateTimer <= 0) {
      const states = ['idle', 'walking', 'waving', 'dancing', 'pushup'];
      s.state = states[Math.floor(Math.random() * states.length)];
      s.stateTimer = 80 + Math.random() * 200;
      if (s.state === 'walking') {
        s.direction = Math.random() > 0.5 ? 1 : -1;
      }
      // Random speech bubbles
      if (Math.random() < 0.3) {
        const speeches = ['Hey!', '😎', 'Click me!', '🎨', 'Hire Shri!', '✨', 'Cool huh?', '🚀', 'Yo!', '💜'];
        s.speech = speeches[Math.floor(Math.random() * speeches.length)];
        s.speechTimer = 90;
      }
    }

    // Mouse influence — stickmen look toward cursor
    if (this.isHovering) {
      const dx = this.mouseX - s.x;
      const dy = this.mouseY - s.y;
      const dist = Math.hypot(dx, dy);

      // If mouse is very close, they react
      if (dist < 80) {
        s.emotion = 'scared';
        s.emotionTimer = 30;
        // Run away
        s.vx += (dx > 0 ? -2 : 2) * 0.3;
      } else if (dist < 180) {
        s.emotion = 'curious';
        s.emotionTimer = 30;
      }
    }

    // Physics
    s.vy += 0.5; // gravity
    s.x += s.vx;
    s.y += s.vy;

    // Friction
    s.vx *= 0.92;

    // Ground collision
    if (s.y >= s.groundY) {
      s.y = s.groundY;
      s.vy = 0;
    }

    // Wall boundaries
    if (s.x < 40) { s.x = 40; s.vx *= -0.5; s.direction = 1; }
    if (s.x > this.W - 40) { s.x = this.W - 40; s.vx *= -0.5; s.direction = -1; }

    // Movement based on state
    switch (s.state) {
      case 'walking':
        s.vx += s.direction * 0.15 * s.walkSpeed;
        s.legAngle = Math.sin(t * 0.08) * 0.5;
        s.armAngle = Math.sin(t * 0.08 + Math.PI) * 0.3;
        break;
      case 'waving':
        s.armAngle = Math.sin(t * 0.15) * 0.8 + 0.5;
        s.legAngle = 0;
        break;
      case 'dancing':
        s.armAngle = Math.sin(t * 0.12) * 1.0;
        s.legAngle = Math.sin(t * 0.12 + Math.PI / 2) * 0.6;
        s.headBob = Math.sin(t * 0.12) * 3;
        break;
      case 'fighting':
        s.armAngle = Math.sin(t * 0.2) * 1.2;
        s.legAngle = Math.sin(t * 0.15) * 0.4;
        s.headBob = Math.sin(t * 0.1) * 2;
        // Punch forward occasionally
        if (Math.sin(t * 0.2) > 0.8) {
          s.vx += s.direction * 0.8;
        }
        break;
      case 'pushup':
        const pushPhase = Math.sin(t * 0.06);
        s.headBob = pushPhase * 8;
        s.armAngle = pushPhase * 0.3;
        s.legAngle = 0;
        break;
      default: // idle
        s.armAngle = Math.sin(t * 0.03) * 0.1;
        s.legAngle = 0;
        s.headBob = Math.sin(t * 0.04) * 1.5;
        break;
    }

    // Emotion timer
    if (s.emotionTimer > 0) {
      s.emotionTimer--;
      if (s.emotionTimer <= 0) s.emotion = 'normal';
    }

    // Speech timer
    if (s.speechTimer > 0) s.speechTimer--;
  }

  drawStickman(s) {
    const ctx = this.ctx;
    const sc = s.scale;
    const cx = s.x;
    const cy = s.y;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sc, sc);

    // Determine facing direction
    const facingMouse = this.isHovering && this.mouseX > cx ? 1 : -1;
    const facing = s.state === 'walking' ? s.direction : (this.isHovering ? facingMouse : s.direction);

    ctx.strokeStyle = s.color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Shadow/glow
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 12;

    // Head
    const headY = -55 + s.headBob;
    ctx.beginPath();
    ctx.arc(0, headY, 12, 0, Math.PI * 2);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = s.color;
    const eyeOffX = facing * 3;
    const eyeSize = s.emotion === 'scared' ? 3.5 : s.emotion === 'excited' ? 3 : 2;

    if (s.emotion === 'scared') {
      // Wide open eyes
      ctx.beginPath();
      ctx.arc(eyeOffX - 4, headY - 2, eyeSize, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(eyeOffX + 4, headY - 2, eyeSize, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(eyeOffX - 4, headY - 2, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(eyeOffX + 4, headY - 2, eyeSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mouth
    ctx.beginPath();
    if (s.emotion === 'excited' || s.emotion === 'curious') {
      ctx.arc(eyeOffX, headY + 5, 4, 0, Math.PI); // smile
    } else if (s.emotion === 'scared') {
      ctx.arc(eyeOffX, headY + 7, 3, 0, Math.PI * 2); // O shape
    } else {
      ctx.moveTo(eyeOffX - 3, headY + 5);
      ctx.lineTo(eyeOffX + 3, headY + 5); // neutral
    }
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Body
    ctx.beginPath();
    ctx.moveTo(0, headY + 12);
    ctx.lineTo(0, -10);
    ctx.stroke();

    // Arms
    const armY = -35;
    // Left arm
    ctx.save();
    ctx.translate(0, armY);
    ctx.rotate(-s.armAngle - 0.3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-20, 15);
    ctx.lineTo(-25, 25);
    ctx.stroke();
    ctx.restore();

    // Right arm
    ctx.save();
    ctx.translate(0, armY);
    if (s.state === 'waving') {
      // Wave animation
      const waveAngle = Math.sin(this.time * 0.15 * s.personalitySpeed) * 0.6;
      ctx.rotate(waveAngle + 0.3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(20, -12);
      ctx.lineTo(28, -20);
      ctx.stroke();
      // Hand wave
      ctx.beginPath();
      ctx.arc(28, -22, 3, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.rotate(s.armAngle + 0.3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(20, 15);
      ctx.lineTo(25, 25);
      ctx.stroke();
    }
    ctx.restore();

    // Legs
    const legY = -10;
    // Left leg
    ctx.save();
    ctx.translate(0, legY);
    ctx.rotate(-s.legAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-12, 25);
    ctx.lineTo(-15, 30);
    ctx.stroke();
    ctx.restore();

    // Right leg
    ctx.save();
    ctx.translate(0, legY);
    ctx.rotate(s.legAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(12, 25);
    ctx.lineTo(15, 30);
    ctx.stroke();
    ctx.restore();

    // Pushup pose override
    if (s.state === 'pushup') {
      // Override with horizontal body
      ctx.clearRect(-40, headY - 15, 80, 80);
      // Redraw in pushup
      const py = Math.sin(this.time * 0.06 * s.personalitySpeed) * 5;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 3;
      // Body horizontal
      ctx.beginPath();
      ctx.moveTo(-20, -15 + py);
      ctx.lineTo(15, -15 + py);
      ctx.stroke();
      // Head
      ctx.beginPath();
      ctx.arc(-25, -17 + py, 8, 0, Math.PI * 2);
      ctx.stroke();
      // Arms pushing
      ctx.beginPath();
      ctx.moveTo(-10, -15 + py);
      ctx.lineTo(-10, -5 + py * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, -15 + py);
      ctx.lineTo(8, -5 + py * 0.5);
      ctx.stroke();
      // Legs
      ctx.beginPath();
      ctx.moveTo(15, -15 + py);
      ctx.lineTo(28, -12 + py);
      ctx.stroke();
    }

    // Speech bubble
    if (s.speechTimer > 0 && s.speech) {
      const alpha = Math.min(1, s.speechTimer / 20);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.5;

      // Bubble
      const bx = 18;
      const by = headY - 28;
      const bw = ctx.measureText(s.speech).width + 20 || 50;
      const bh = 24;

      ctx.beginPath();
      ctx.roundRect(bx - 5, by - bh / 2, bw, bh, 8);
      ctx.fill();
      ctx.stroke();

      // Tail
      ctx.beginPath();
      ctx.moveTo(bx + 2, by + bh / 2 - 2);
      ctx.lineTo(bx - 5, by + bh / 2 + 6);
      ctx.lineTo(bx + 10, by + bh / 2 - 2);
      ctx.fill();

      // Text
      ctx.fillStyle = '#fff';
      ctx.font = '12px Syne, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.speech, bx + 5, by);

      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  drawGround() {
    const ctx = this.ctx;
    const y = this.H - 20;

    // Ground line
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(this.W, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Tiny grass tufts
    ctx.strokeStyle = 'rgba(178,255,89,0.15)';
    ctx.lineWidth = 1.5;
    for (let x = 20; x < this.W; x += 35 + Math.sin(x * 0.1) * 15) {
      const h = 5 + Math.sin(x * 0.3 + this.time * 0.02) * 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 3, y - h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 3, y - h - 1);
      ctx.stroke();
    }
  }

  drawInstructions() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '13px Kalam, cursive';
    ctx.textAlign = 'center';
    ctx.fillText('🖱️ Move cursor over stickmen • Click to make them jump!', this.W / 2, 25);
    ctx.restore();
  }

  animate() {
    this.time++;
    this.ctx.clearRect(0, 0, this.W, this.H);

    this.drawGround();
    this.drawInstructions();

    this.stickmen.forEach(s => this.updateStickman(s));
    this.stickmen.forEach(s => this.drawStickman(s));

    this.updateParticles();
    this.drawParticles();

    requestAnimationFrame(() => this.animate());
  }
}

// Initialize stickman playground if canvas exists
const stickmanCanvas = document.getElementById('stickman-playground');
let playgroundInstance = null;
if (stickmanCanvas) {
  playgroundInstance = new StickmanPlayground(stickmanCanvas);

  // Double-click fireworks
  stickmanCanvas.addEventListener('dblclick', e => {
    const rect = stickmanCanvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    for (let i = 0; i < 5; i++) {
      setTimeout(() => playgroundInstance.spawnBurst(
        cx + (Math.random() - 0.5) * 80,
        cy + (Math.random() - 0.5) * 60
      ), i * 100);
    }
    playgroundInstance.stickmen.forEach(s => {
      s.vy = -10 - Math.random() * 5;
      s.emotion = 'excited';
      s.emotionTimer = 180;
      s.speech = ['WOW!', '🎆', 'BOOM!', '🔥', 'EPIC!'][Math.floor(Math.random() * 5)];
      s.speechTimer = 120;
    });
  });

  // Control buttons
  document.getElementById('btn-spawn')?.addEventListener('click', () => {
    const p = playgroundInstance;
    const colors = ['#e040fb', '#00e5ff', '#ffda00', '#b2ff59', '#ff6a1a', '#7c5cfc', '#ff4081', '#69f0ae'];
    const s = {
      x: 60 + Math.random() * (p.W - 120), y: 0, vx: 0, vy: 0,
      groundY: p.H - 30, color: colors[Math.floor(Math.random() * colors.length)],
      scale: 0.7 + Math.random() * 0.5, phase: Math.random() * Math.PI * 2,
      walkSpeed: 0.5 + Math.random(), direction: Math.random() > 0.5 ? 1 : -1,
      state: 'idle', stateTimer: 60 + Math.random() * 120, emotion: 'excited', emotionTimer: 90,
      armAngle: 0, legAngle: 0, headBob: 0, personalitySpeed: 0.7 + Math.random() * 0.6,
      holding: false, speech: 'Hello!', speechTimer: 90, fighting: false, fightTarget: null
    };
    p.stickmen.push(s);
    p.spawnBurst(s.x, p.H - 60);
  });

  document.getElementById('btn-dance')?.addEventListener('click', () => {
    playgroundInstance.stickmen.forEach(s => {
      s.state = 'dancing'; s.stateTimer = 300;
      s.emotion = 'excited'; s.emotionTimer = 200;
      s.speech = ['💃', '🕺', '🎵', '🎶', 'PARTY!'][Math.floor(Math.random() * 5)];
      s.speechTimer = 120;
    });
  });

  document.getElementById('btn-wave')?.addEventListener('click', () => {
    playgroundInstance.stickmen.forEach((s, i) => {
      setTimeout(() => {
        s.state = 'waving'; s.stateTimer = 200;
        s.speech = ['👋', 'Hey!', 'Hi!', 'Yo!'][Math.floor(Math.random() * 4)];
        s.speechTimer = 100;
      }, i * 150);
    });
  });

  document.getElementById('btn-fight')?.addEventListener('click', () => {
    const sm = playgroundInstance.stickmen;
    sm.forEach(s => {
      s.state = 'fighting'; s.stateTimer = 250;
      s.emotion = 'excited'; s.emotionTimer = 250;
      s.speech = ['🥊', 'POW!', '💥', 'HAH!', '👊'][Math.floor(Math.random() * 5)];
      s.speechTimer = 80;
      // Move toward center
      const target = playgroundInstance.W / 2;
      s.vx += (target - s.x) * 0.05;
    });
  });

  document.getElementById('btn-reset')?.addEventListener('click', () => {
    playgroundInstance.stickmen = [];
    playgroundInstance.particles = [];
    playgroundInstance.initStickmen();
  });
}


/* ═══════════════════════════════════════════════════
   INTERACTIVE FLOATING STICKMAN (Hero area)
   ═══════════════════════════════════════════════════ */
class HeroStickman {
  constructor(svgEl) {
    this.svg = svgEl;
    this.angle = 0;
    this.bobY = 0;
    this.targetRotate = 0;
    this.currentRotate = 0;
    this.mouseNear = false;
    this.waving = false;
    this.waveAngle = 0;

    document.addEventListener('mousemove', e => {
      const rect = this.svg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);

      this.targetRotate = Math.max(-15, Math.min(15, dx * 0.03));
      this.mouseNear = dist < 300;
    });

    this.animate();
  }

  animate() {
    this.angle += 0.03;
    this.bobY = Math.sin(this.angle) * 14;
    this.currentRotate += (this.targetRotate - this.currentRotate) * 0.05;

    if (this.mouseNear) {
      this.waveAngle += 0.15;
    }

    this.svg.style.transform = `translateY(${this.bobY}px) rotate(${this.currentRotate}deg)`;

    // Animate the right arm for waving when mouse is near
    const rightArm = this.svg.querySelector('.stickman-wave-arm');
    if (rightArm && this.mouseNear) {
      const wave = Math.sin(this.waveAngle) * 20;
      rightArm.setAttribute('d', `M180 264 C205 ${234 + wave} 224 ${204 + wave} 210 175 C200 160 185 165 190 180`);
    }

    requestAnimationFrame(() => this.animate());
  }
}

// Init hero stickman
const doodleChar = document.querySelector('.doodle-char');
if (doodleChar) {
  // Add class to the waving arm path
  const paths = doodleChar.querySelectorAll('path');
  if (paths[1]) paths[1].classList.add('stickman-wave-arm');
  new HeroStickman(doodleChar);
}


/* ═══════════════════════════════════════════════════
   SCROLL REVEAL ANIMATIONS (IntersectionObserver)
   ═══════════════════════════════════════════════════ */
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

revealElements.forEach(el => revealObserver.observe(el));


/* ═══════════════════════════════════════════════════
   MAGNETIC BUTTONS
   ═══════════════════════════════════════════════════ */
document.querySelectorAll('.btn, .warr').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
    btn.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
    setTimeout(() => btn.style.transition = '', 400);
  });
});


/* ═══════════════════════════════════════════════════
   TILT EFFECT ON WORK CARDS
   ═══════════════════════════════════════════════════ */
document.querySelectorAll('.wcard').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (y - 0.5) * -10;
    const rotateY = (x - 0.5) * 10;
    card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-7px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
    setTimeout(() => card.style.transition = 'transform .3s, border-color .3s, box-shadow .3s', 500);
  });
});


/* ═══════════════════════════════════════════════════
   PROJECTS
   ═══════════════════════════════════════════════════ */
const projs = [
  {
    ico: '<svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="#ff6a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="10" r="5"/><path d="M11 10 L7 26 L16 22 L25 26 L21 10"/><line x1="13" y1="17" x2="19" y2="17"/></svg>',
    t: 'Smoke Detector',
    d: 'IoT-based smart smoke detection system with real-time sensor alerts, live dashboards, and emergency notifications to your phone.',
    tags: ['IoT', 'Arduino', 'Firebase']
  },
  {
    ico: '<svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="#ffda00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="10" width="6" height="16" rx="1"/><rect x="13" y="6" width="6" height="20" rx="1"/><rect x="23" y="14" width="6" height="12" rx="1"/><circle cx="6" cy="6" r="2.5"/><circle cx="16" cy="3" r="2.5"/><circle cx="26" cy="10" r="2.5"/></svg>',
    t: 'Smart Parking System',
    d: 'Computer vision-powered parking manager that detects open slots in real time and guides drivers via a live interactive map.',
    tags: ['Python', 'OpenCV', 'Raspberry Pi']
  },
  {
    ico: '<svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="#e040fb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="24" height="16" rx="3"/><circle cx="24" cy="20" r="5" fill="rgba(224,64,251,.15)" stroke="#e040fb"/><path d="M22.5 20 L23.5 21 L25.5 19"/><path d="M9 13 L14 13"/><path d="M9 17 L17 17"/></svg>',
    t: 'AI Gym Chatbot',
    d: 'GPT-powered chatbot for gym enquiries — handles memberships, class schedules, trainer bookings, and FAQs 24/7 automatically.',
    tags: ['OpenAI', 'Node.js', 'React']
  },
  {
    ico: '<svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="#00e5ff" stroke-width="2" stroke-linecap="round"><circle cx="16" cy="16" r="12"/><path d="M16 4 C10 10 10 22 16 28"/><path d="M16 4 C22 10 22 22 16 28"/><line x1="4" y1="16" x2="28" y2="16"/></svg>',
    t: 'Parallax Web Engine',
    d: 'Lightweight scroll-based animation engine with GPU-accelerated parallax layers and custom easing curves.',
    tags: ['Three.js', 'WebGL', 'TS']
  },
  {
    ico: '<svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="#b2ff59" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 26 L16 6 L26 26"/><path d="M9 20 L23 20"/><circle cx="16" cy="26" r="2" fill="#b2ff59"/></svg>',
    t: 'Shader Playground',
    d: 'Browser-based GLSL editor with real-time preview, a preset shader library, and one-click PNG export.',
    tags: ['WebGL', 'GLSL', 'Vite']
  },
  {
    ico: '<svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="#ff6a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="24" height="16" rx="3"/><path d="M10 14 L10 20"/><path d="M14 12 L14 20"/><path d="M18 16 L18 20"/><path d="M22 14 L22 20"/></svg>',
    t: 'Motion Charts',
    d: 'Physics-based animated data visualisation library — bars, lines, and radials that actually feel alive.',
    tags: ['D3.js', 'GSAP', 'Canvas']
  },
];
const pg = document.getElementById('pgrid');
projs.forEach((p, idx) => {
  const c = document.createElement('div');
  c.className = 'pcard reveal';
  c.style.transitionDelay = `${idx * 0.08}s`;
  c.innerHTML = `<div class="pico">${p.ico}</div><div class="ptitle">${p.t}</div><div class="pdesc">${p.d}</div><div class="ptags">${p.tags.map(t => `<span class="ptag">${t}</span>`).join('')}</div><a href="#" class="plnk">View project ↗</a>`;
  c.addEventListener('mousemove', e => {
    const r = c.getBoundingClientRect();
    c.style.transform = `translateY(-5px) rotateX(${((e.clientY - r.top) / r.height - .5) * -8}deg) rotateY(${((e.clientX - r.left) / r.width - .5) * 8}deg)`;
    // Glow effect
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    c.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(0,229,255,0.08) 0%, rgba(255,255,255,0.02) 60%)`;
  });
  c.addEventListener('mouseleave', () => {
    c.style.transform = '';
    c.style.background = '';
  });
  pg.appendChild(c);
  revealObserver.observe(c);
});


/* ═══════════════════════════════════════════════════
   PHOTOS - horizontal drag-to-scroll gallery
   ═══════════════════════════════════════════════════ */
const photos = [
  { img: 'photos1/20260308_090333.jpg', l: 'Misty Mornings', h: 420 },
  { img: 'photos1/20250621_140649.jpg', l: 'Summer Solstice', h: 400 },
  { img: 'photos1/20241222_173241.jpg', l: 'Golden Hour', h: 380 },
  { img: 'photos1/20251217_173001.jpg', l: 'Dusk Horizons', h: 400 },
  { img: 'photos1/IMG_1896.JPG', l: 'Candid Moments', h: 360 },
  { img: 'photos1/20250823_210929.jpg', l: 'Midnight Trails', h: 380 },
  { img: 'photos1/20250716_180729.jpg', l: 'Rainy Day Refl', h: 340 },
  { img: 'photos1/20250310_164525.jpg', l: 'Serene Nature', h: 400 },
];
const track = document.getElementById('photo-track');
photos.forEach((p, i) => {
  const item = document.createElement('div');
  item.className = 'mitem';

  if (p.img) {
    item.innerHTML = `
      <img src="${p.img}" alt="${p.l}" style="height:${p.h}px; object-fit: cover;">
      <div style="position:absolute; bottom:12px; left:0; width:100%; text-align:center; z-index:5;">
        <span style="font-family:'Kalam', cursive; font-size:13px; color:rgba(255,255,255,0.8); background:rgba(0,0,0,0.4); padding:2px 10px; border-radius:100px; backdrop-filter:blur(4px);">${p.l}</span>
      </div>
    `;
  } else {
    item.innerHTML = `<svg viewBox="0 0 300 ${p.h}" xmlns="http://www.w3.org/2000/svg" style="height:${p.h}px">
      <defs><radialGradient id="pg${i}" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stop-color="${p.c[1]}" stop-opacity=".9"/>
        <stop offset="100%" stop-color="${p.c[2]}"/>
      </radialGradient></defs>
      <rect width="300" height="${p.h}" fill="${p.c[2]}"/>
      <rect width="300" height="${p.h}" fill="url(#pg${i})"/>
      ${Array.from({ length: 4 }, (_, j) =>
      '<circle cx="' + (40 + j * 65) + '" cy="' + (p.h * .3 + Math.sin(j + i) * p.h * .2) + '" r="' + (18 + j * 12) + '" fill="' + p.c[0] + '" opacity="' + (0.07 + j * 0.025) + '"/>').join('')}
      <text x="150" y="${p.h - 15}" text-anchor="middle" font-family="Kalam, cursive" font-size="14" fill="rgba(255,255,255,0.35)">${p.l}</text>
    </svg>`;
  }
  track.appendChild(item);
});
// Duplicate for seamless loop
const clones = Array.from(track.children).map(el => el.cloneNode(true));
clones.forEach(cl => track.appendChild(cl));

let isDown = false, startX, scrollLeft;
track.addEventListener('mousedown', e => {
  isDown = true; track.classList.add('dragging');
  startX = e.pageX - track.offsetLeft; scrollLeft = track.scrollLeft;
});
track.addEventListener('mouseleave', () => { isDown = false; track.classList.remove('dragging'); });
track.addEventListener('mouseup', () => { isDown = false; track.classList.remove('dragging'); });
track.addEventListener('mousemove', e => {
  if (!isDown) return; e.preventDefault();
  const x = e.pageX - track.offsetLeft;
  track.scrollLeft = scrollLeft - (x - startX) * 1.4;
});


/* ═══════════════════════════════════════════════════
   SMOOTH SECTION COUNTING / STATS ANIMATION
   ═══════════════════════════════════════════════════ */
function animateCount(el, target, duration = 2000) {
  let start = 0;
  const increment = target / (duration / 16);
  function step() {
    start += increment;
    if (start >= target) {
      el.textContent = target + '+';
      return;
    }
    el.textContent = Math.floor(start) + '+';
    requestAnimationFrame(step);
  }
  step();
}

const counters = document.querySelectorAll('.stat-number');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const target = parseInt(entry.target.dataset.count);
      animateCount(entry.target, target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
counters.forEach(c => counterObserver.observe(c));


/* ═══════════════════════════════════════════════════
   PARALLAX on scroll
   ═══════════════════════════════════════════════════ */
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;

  // Hero parallax
  const heroInner = document.querySelector('.hero-inner');
  if (heroInner) {
    heroInner.style.transform = `translateY(${scrollY * 0.3}px)`;
    heroInner.style.opacity = 1 - scrollY / 800;
  }

  // Blobs move slightly on scroll
  document.querySelectorAll('.blob').forEach((blob, i) => {
    blob.style.transform = `translateY(${scrollY * 0.05 * (i % 2 === 0 ? 1 : -1)}px)`;
  });
});


/* ═══════════════════════════════════════════════════
   NAV — active section highlighting
   ═══════════════════════════════════════════════════ */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.remove('nav-active');
        if (link.getAttribute('href') === '#' + entry.target.id) {
          link.classList.add('nav-active');
        }
      });
    }
  });
}, { threshold: 0.35 });

sections.forEach(s => navObserver.observe(s));


/* ═══════════════════════════════════════════════════
   TYPED TEXT animation for hero subtitle
   ═══════════════════════════════════════════════════ */
const subtitles = [
  'Designer Who Thinks in Pixels',
  'Crafting Brands & Digital Experiences',
  'Design · Photography · Code',
  'Turning Ideas into Visual Stories ✨',
  'Designing with Intention & Purpose',
];
let currentSubIdx = 0;
let charIdx = 0;
let isDeleting = false;
const typedEl = document.getElementById('typed-text');

function typeEffect() {
  if (!typedEl) return;
  const current = subtitles[currentSubIdx];

  if (!isDeleting) {
    typedEl.textContent = current.substring(0, charIdx + 1);
    charIdx++;
    if (charIdx === current.length) {
      setTimeout(() => { isDeleting = true; typeEffect(); }, 2500);
      return;
    }
  } else {
    typedEl.textContent = current.substring(0, charIdx - 1);
    charIdx--;
    if (charIdx === 0) {
      isDeleting = false;
      currentSubIdx = (currentSubIdx + 1) % subtitles.length;
    }
  }
  setTimeout(typeEffect, isDeleting ? 40 : 80);
}
typeEffect();


/* ═══════════════════════════════════════════════════
   INTERACTIVE PARTICLE TRAIL (follows cursor globally)
   ═══════════════════════════════════════════════════ */
const trailCanvas = document.getElementById('trail-canvas');
if (trailCanvas) {
  const tctx = trailCanvas.getContext('2d');
  let tW, tH;
  function resizeTrail() {
    tW = trailCanvas.width = window.innerWidth;
    tH = trailCanvas.height = window.innerHeight;
  }
  resizeTrail();
  window.addEventListener('resize', resizeTrail);

  const trailParticles = [];
  let lastTrailX = 0, lastTrailY = 0;

  document.addEventListener('mousemove', e => {
    const dx = e.clientX - lastTrailX;
    const dy = e.clientY - lastTrailY;
    const speed = Math.hypot(dx, dy);
    lastTrailX = e.clientX;
    lastTrailY = e.clientY;

    if (speed > 3) {
      const count = Math.min(3, Math.floor(speed / 10));
      for (let i = 0; i < count; i++) {
        trailParticles.push({
          x: e.clientX + (Math.random() - 0.5) * 8,
          y: e.clientY + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2 - 1,
          life: 1,
          size: 1.5 + Math.random() * 3,
          color: ['#e040fb', '#00e5ff', '#ffda00', '#b2ff59'][Math.floor(Math.random() * 4)],
        });
      }
    }
  });

  function animateTrail() {
    tctx.clearRect(0, 0, tW, tH);
    for (let i = trailParticles.length - 1; i >= 0; i--) {
      const p = trailParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.03;
      p.life -= 0.02;
      if (p.life <= 0) { trailParticles.splice(i, 1); continue; }

      tctx.save();
      tctx.globalAlpha = p.life * 0.6;
      tctx.fillStyle = p.color;
      tctx.beginPath();
      tctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      tctx.fill();
      tctx.restore();
    }
    requestAnimationFrame(animateTrail);
  }
  animateTrail();
}


/* ═══════════════════════════════════════════════════
   SMOOTH SCROLL for nav links
   ═══════════════════════════════════════════════════ */
document.querySelectorAll('nav a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
