// script.js
/**
 * MONOCLONAL LAB 3D - Educational Biology Game Engine
 * Developed by: Monoclonal Lab Team (Metta, Dhiro, Felicia, Michelle)
 */

// --- GAME STATE MANAGEMENT ---
const DEFAULT_STATE = {
  xp: 0,
  level: 1,
  unlockedMissions: [1],
  completedMissions: [],
  settings: {
    sound: true,
    animation: true,
    reducedMotion: false
  }
};

let gameState = JSON.parse(localStorage.getItem('monoclonal_lab_save')) || { ...DEFAULT_STATE };
let currentMissionId = 1;

// --- AUDIO SYNTHESIZER (WEB AUDIO API) ---
const AudioEngine = {
  ctx: null,
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  playClick() {
    if (!gameState.settings.sound) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  },
  playSuccess() {
    if (!gameState.settings.sound) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(554.37, now + 0.1);
    osc.frequency.setValueAtTime(659.25, now + 0.2);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.35);
  }
};

// --- DATA STRUCTURE: MISSIONS ---
const MISSIONS_DATA = [
  {
    id: 1,
    title: "Selamat Datang di Laboratorium",
    xp: 100,
    objective: "Aktifkan terminal analisis molekuler untuk mendeteksi struktur protein imun pertama Anda.",
    render: (stage) => {
      stage.innerHTML = `
        <div style="text-align:center;">
          <div id="terminal-screen" style="width:260px; height:180px; border:2px solid #00f2ff; margin:0 auto 20px; border-radius:10px; display:flex; justify-content:center; align-items:center; background:#040a15; box-shadow:0 0 20px rgba(0,242,255,0.2);">
            <span id="term-status" style="color:#00f2ff; font-weight:bold;">[ TERMINAL NONAKTIF ]</span>
          </div>
          <button id="btn-activate-term" class="btn-primary">AKTIFKAN TERMINAL MOLEKULER</button>
        </div>
      `;
      document.getElementById('btn-activate-term').onclick = () => {
        AudioEngine.playSuccess();
        document.getElementById('term-status').innerHTML = "🧬 ANTIBODI TERDETEKSI<br><small>Struktur Imunoglobulin Y</small>";
        document.getElementById('term-status').style.color = "#00ff88";
        updateFeedback(true, "Berhasil! Anda telah mengaktifkan terminal dan mendeteksi molekul antibodi pertama. Antibodi adalah protein glikoprotein yang mengikat target spesifik (antigen).");
        unlockNextMissionBtn();
      };
    }
  },
  {
    id: 2,
    title: "Anatomi Antibodi",
    xp: 150,
    objective: "Identifikasi bagian Y-shaped antibody yang bertanggung jawab langsung untuk mengikat antigen.",
    render: (stage) => {
      stage.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; gap:15px; width:100%;">
          <svg width="240" height="200" viewBox="0 0 240 200" style="background:rgba(0,0,0,0.3); border-radius:8px;">
            <!-- Heavy Chain -->
            <path d="M 90,40 L 90,120 L 120,160 L 150,120 L 150,40" stroke="#00f2ff" stroke-width="12" fill="none"/>
            <!-- Light Chain -->
            <path d="M 65,40 L 65,100" stroke="#8a2be2" stroke-width="10" fill="none"/>
            <path d="M 175,40 L 175,100" stroke="#8a2be2" stroke-width="10" fill="none"/>
            <!-- Variable Binding Region (Target) -->
            <circle id="ab-part-variable" cx="77" cy="40" r="18" fill="rgba(255,0,127,0.4)" stroke="#ff007f" stroke-width="2" style="cursor:pointer;"/>
            <circle id="ab-part-constant" cx="120" cy="150" r="18" fill="rgba(0,242,255,0.2)" stroke="#00f2ff" stroke-width="2" style="cursor:pointer;"/>
          </svg>
          <div class="puzzle-options">
            <button class="btn-secondary" onclick="checkM2('constant')">Daerah Konstan (Fc)</button>
            <button class="btn-secondary" onclick="checkM2('variable')">Daerah Variabel / Fab (Binding Site)</button>
          </div>
        </div>
      `;
    }
  },
  {
    id: 3,
    title: "Pengenalan Antigen",
    xp: 150,
    objective: "Uji kecocokan spasial antara antibodi dan 3 kandidat antigen berikut.",
    render: (stage) => {
      stage.innerHTML = `
        <div style="width:100%; text-align:center;">
          <p style="margin-bottom:15px;">Pilih antigen yang memiliki bentuk epitop pas dengan paratop antibodi:</p>
          <div class="puzzle-options">
            <div class="opt-card" onclick="checkM3(1)">
              <div style="font-size:2rem;">📐</div>
              <p>Antigen A (Segitiga Tajam)</p>
            </div>
            <div class="opt-card" onclick="checkM3(2)">
              <div style="font-size:2rem;">🟢</div>
              <p>Antigen B (Bulat Komplementer)</p>
            </div>
            <div class="opt-card" onclick="checkM3(3)">
              <div style="font-size:2rem;">🔲</div>
              <p>Antigen C (Kotak Besar)</p>
            </div>
          </div>
        </div>
      `;
    }
  },
  {
    id: 4,
    title: "Tantangan Spesifisitas",
    xp: 200,
    objective: "Temukan antigen spesifik dengan tingkat spesifisitas tinggi tanpa memicu reaksi silang berlebih.",
    render: (stage) => {
      stage.innerHTML = `
        <div style="text-align:center;">
          <p style="margin-bottom:15px;">Target spesifik: Molekul Penanda Sel Kanker (CD20 Target)</p>
          <div class="puzzle-options">
            <button class="btn-secondary" onclick="checkM4(false)">Target A (Sel Sehat Normal)</button>
            <button class="btn-secondary" onclick="checkM4(true)">Target B (Epitop Spesifik Kanker CD20)</button>
            <button class="btn-secondary" onclick="checkM4(false)">Target C (Protein Darah Umum)</button>
          </div>
        </div>
      `;
    }
  },
  {
    id: 5,
    title: "Monoklonal vs Poliklonal",
    xp: 200,
    objective: "Kelompokkan karakteristik ke kategori Antibodi Monoklonal yang tepat.",
    render: (stage) => {
      stage.innerHTML = `
        <div style="text-align:center; width:100%;">
          <p style="margin-bottom:15px;">Mana pernyataan yang benar mengenai Antibodi Monoklonal?</p>
          <div class="puzzle-options">
            <div class="opt-card" onclick="checkM5(false)">Dihasilkan dari banyak klon sel B berbeda (campuran epitop).</div>
            <div class="opt-card" onclick="checkM5(true)">Dihasilkan dari satu klon sel B hibrid tunggal, mengikat 1 epitop spesifik.</div>
          </div>
        </div>
      `;
    }
  },
  {
    id: 6,
    title: "Pabrik Hibridoma",
    xp: 250,
    objective: "Urutkan 6 tahapan utama pembuatan antibodi monoklonal dengan metode Hibridoma.",
    render: (stage) => {
      stage.innerHTML = `
        <div style="text-align:center; width:100%;">
          <p style="margin-bottom:15px;">Komponen kunci pembuatan Hibridoma adalah peleburan dua jenis sel:</p>
          <div class="puzzle-options">
            <button class="btn-secondary" onclick="checkM6(false)">Sel Darah Merah + Sel Bakteri</button>
            <button class="btn-secondary" onclick="checkM6(true)">Sel B Penghasil Antibodi + Sel Mieloma (Kanker)</button>
          </div>
        </div>
      `;
    }
  },
  {
    id: 7,
    title: "Pusat Aksi Antibodi",
    xp: 200,
    objective: "Simulasikan mekanisme Netralisasi toksin oleh antibodi monoklonal.",
    render: (stage) => {
      stage.innerHTML = `
        <div style="text-align:center;">
          <button id="btn-sim-neut" class="btn-primary">Luncurkan Antibodi Netralisasi</button>
          <div id="neut-viz" style="margin-top:20px; font-size:1.5rem;">🦠 (Toksin bebas bergerak)</div>
        </div>
      `;
      document.getElementById('btn-sim-neut').onclick = () => {
        AudioEngine.playSuccess();
        document.getElementById('neut-viz').innerHTML = "🛡️🔒🦠 (Toksin berhasil diikat & dinetralkan!)";
        updateFeedback(true, "Netralisasi berhasil! Antibodi mengikat bagian aktif toksin/virus sehingga tidak dapat berikatan dengan reseptor sel inang.");
        unlockNextMissionBtn();
      };
    }
  },
  {
    id: 8,
    title: "Aplikasi Medis",
    xp: 200,
    objective: "Pelajari salah satu pemanfaatan antibodi monoklonal dalam terapi kanker targeted.",
    render: (stage) => {
      stage.innerHTML = `
        <div style="text-align:center;">
          <p style="margin-bottom:15px;">Pilih teknologi terapi berbasis Antibodi Terkonjugasi Obat (ADC):</p>
          <button class="btn-secondary" onclick="checkM8()">Jelajahi Antibodi-Drug Conjugates (ADC)</button>
        </div>
      `;
    }
  },
  {
    id: 9,
    title: "Troubleshooting Insiden Lab",
    xp: 250,
    objective: "Pecahkan skenario insiden: Mengapa timbul hasil reaksi silang (cross-reactivity) yang tidak diharapkan?",
    render: (stage) => {
      stage.innerHTML = `
        <div style="text-align:center; width:100%;">
          <p style="margin-bottom:15px;">Skenario: Antibodi A mengikat sedikit sel non-target. Apa penyebab utamanya?</p>
          <div class="puzzle-options">
            <button class="btn-secondary" onclick="checkM9(true)">Sel non-target memiliki bentuk epitop yang mirip (Reaksi Silang).</button>
            <button class="btn-secondary" onclick="checkM9(false)">Antibodi berubah menjadi molekul DNA.</button>
          </div>
        </div>
      `;
    }
  },
  {
    id: 10,
    title: "Tantangan Pengetahuan Akhir",
    xp: 300,
    objective: "Uji seluruh pemahaman Anda tentang antibodi monoklonal dari Misi 1 hingga 9.",
    render: (stage) => {
      stage.innerHTML = `
        <div style="text-align:center;">
          <h3>Evaluasi Komprehensif Biologi Molekuler</h3>
          <p style="margin:15px 0;">Selesaikan kuis akhir untuk mendapatkan Sertifikat Kelulusan Lab.</p>
          <button class="btn-primary" onclick="checkM10()">SELESAIKAN EVALUASI AKHIR</button>
        </div>
      `;
    }
  }
];

// --- ENCYCLOPEDIA DATA ---
const ENCYCLOPEDIA_DATA = [
  { term: "Antibodi", def: "Protein glikoprotein (imunoglobulin) yang dihasilkan oleh sel plasma B untuk mengikat antigen secara spesifik." },
  { term: "Antigen", def: "Zubstansi/molekul yang dianggap asing oleh sistem imun dan memicu pembentukan antibodi." },
  { term: "Epitop", def: "Bagian spesifik pada molekul antigen yang dikenali dan diikat oleh paratop antibodi." },
  { term: "Hibridoma", def: "Sel buatan hasil peleburan (fusi) antara sel B limfosit dan sel mieloma untuk produksi antibodi monoklonal berkelanjutan." },
  { term: "Antibodi Monoklonal", def: "Antibodi homogen yang berasal dari satu klon sel hibridoma yang sama, mengenali satu epitop spesifik." }
];

// --- GAME LOGIC HELPER FUNCTIONS ---
function updateFeedback(isCorrect, text) {
  const statusEl = document.getElementById('feedback-status');
  const textEl = document.getElementById('feedback-message');
  statusEl.className = 'status-indicator ' + (isCorrect ? 'correct' : 'incorrect');
  textEl.innerText = text;
}

function unlockNextMissionBtn() {
  document.getElementById('btn-next-mission').disabled = false;
  if (!gameState.completedMissions.includes(currentMissionId)) {
    gameState.completedMissions.push(currentMissionId);
    gameState.xp += MISSIONS_DATA[currentMissionId - 1].xp;
    if (currentMissionId < 10 && !gameState.unlockedMissions.includes(currentMissionId + 1)) {
      gameState.unlockedMissions.push(currentMissionId + 1);
    }
    checkLevelUp();
    saveProgress();
    updateHUD();
  }
}

function checkLevelUp() {
  gameState.level = Math.floor(gameState.xp / 200) + 1;
}

function saveProgress() {
  localStorage.setItem('monoclonal_lab_save', JSON.stringify(gameState));
}

function updateHUD() {
  document.getElementById('player-level').innerText = gameState.level;
  const currentLevelXp = gameState.xp % 200;
  document.getElementById('xp-fill').style.width = (currentLevelXp / 200 * 100) + '%';
  document.getElementById('xp-text').innerText = `${gameState.xp} XP`;
  document.getElementById('btn-continue-game').disabled = gameState.completedMissions.length === 0;
}

// --- MISSION CHECK HANDLERS ---
window.checkM2 = function(part) {
  if (part === 'variable') {
    AudioEngine.playSuccess();
    updateFeedback(true, "Tepat! Daerah Variabel (Fab / Antigen-binding site) memiliki urutan asam amino spesifik untuk mengenali epitop antigen.");
    unlockNextMissionBtn();
  } else {
    updateFeedback(false, "Kurang tepat. Daerah konstan (Fc) menentukan fungsi efektor imun, bukan pengenalan spesifik antigen.");
  }
};

window.checkM3 = function(antigenId) {
  if (antigenId === 2) {
    AudioEngine.playSuccess();
    updateFeedback(true, "Benar! Antigen B memiliki kontur molekuler yang komplementer dengan situs pengikatan antibodi.");
    unlockNextMissionBtn();
  } else {
    updateFeedback(false, "Uji spasial gagal. Bentuk epitop tidak cocok dengan paratop antibodi.");
  }
};

window.checkM4 = function(isCorrect) {
  if (isCorrect) {
    AudioEngine.playSuccess();
    updateFeedback(true, "Sangat tepat! Antibodi monoklonal didesain presisi untuk mengikat CD20 pada sel kanker tanpa merusak sel normal.");
    unlockNextMissionBtn();
  } else {
    updateFeedback(false, "Pilihan salah. Mengikat sel normal dapat memicu efek samping off-target.");
  }
};

window.checkM5 = function(isCorrect) {
  if (isCorrect) {
    AudioEngine.playSuccess();
    updateFeedback(true, "Tepat! Antibodi monoklonal bersifat spesifik monovalen terhadap satu jenis epitop.");
    unlockNextMissionBtn();
  } else {
    updateFeedback(false, "Salah. Itu adalah definisi antibodi poliklonal.");
  }
};

window.checkM6 = function(isCorrect) {
  if (isCorrect) {
    AudioEngine.playSuccess();
    updateFeedback(true, "Benar! Sel B memberikan kemampuan menghasilkan antibodi spesifik, sementara sel mieloma memberikan sifat pembelahan abadi (immortal).");
    unlockNextMissionBtn();
  } else {
    updateFeedback(false, "Peleburan ini tidak akan menghasilkan hibridoma penghasil antibodi.");
  }
};

window.checkM8 = function() {
  AudioEngine.playSuccess();
  updateFeedback(true, "ADC menggabungkan kemampuan presisi antibodi monoklonal dengan daya hancur racun kemoterapi untuk membunuh sel kanker secara targeted.");
  unlockNextMissionBtn();
};

window.checkM9 = function(isCorrect) {
  if (isCorrect) {
    AudioEngine.playSuccess();
    updateFeedback(true, "Analisis benar! Reaksi silang terjadi saat epitop pada molekul yang berbeda memiliki kemiripan struktur kimiawi.");
    unlockNextMissionBtn();
  } else {
    updateFeedback(false, "Penjelasan tidak masuk akal secara biologi molekuler.");
  }
};

window.checkM10 = function() {
  AudioEngine.playSuccess();
  updateFeedback(true, "Selamat! Anda telah menyelesaikan seluruh Misi Evaluasi Monoclonal Lab 3D dan menguasai konsep antibodi monoklonal!");
  unlockNextMissionBtn();
};

// --- NAVIGATION & UI INTERACTIVITY ---
function switchView(viewId) {
  AudioEngine.playClick();
  document.querySelectorAll('.view-screen').forEach(el => el.classList.remove('active'));
  document.getElementById(viewId).classList.add('active');
}

function renderMissionGrid() {
  const grid = document.getElementById('mission-grid');
  grid.innerHTML = '';
  MISSIONS_DATA.forEach(m => {
    const isUnlocked = gameState.unlockedMissions.includes(m.id);
    const isCompleted = gameState.completedMissions.includes(m.id);
    const card = document.createElement('div');
    card.className = `mission-card ${isUnlocked ? '' : 'locked'}`;
    card.innerHTML = `
      <div class="mission-status-icon">${isCompleted ? '✅' : (isUnlocked ? '🔓' : '🔒')}</div>
      <div>
        <span class="mission-num">MISI ${m.id}</span>
        <h4 class="mission-title">${m.title}</h4>
      </div>
      <span class="mission-xp">+${m.xp} XP</span>
    `;
    if (isUnlocked) {
      card.onclick = () => loadMission(m.id);
    }
    grid.appendChild(card);
  });
}

function loadMission(id) {
  currentMissionId = id;
  const mData = MISSIONS_DATA.find(m => m.id === id);
  document.getElementById('hud-mission-title').innerText = `Misi ${mData.id}: ${mData.title}`;
  document.getElementById('mission-objective-text').innerText = mData.objective;
  document.getElementById('btn-next-mission').disabled = !gameState.completedMissions.includes(id);
  
  const stage = document.getElementById('interactive-stage');
  stage.innerHTML = '';
  updateFeedback(false, "Lakukan interaksi untuk menyelesaikan misi.");
  mData.render(stage);
  
  switchView('view-gameplay');
}

function renderEncyclopedia() {
  const listEl = document.getElementById('enc-list');
  listEl.innerHTML = '';
  ENCYCLOPEDIA_DATA.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'enc-item';
    div.innerText = item.term;
    div.onclick = () => {
      document.querySelectorAll('.enc-item').forEach(e => e.classList.remove('active'));
      div.classList.add('active');
      document.getElementById('enc-detail-panel').innerHTML = `
        <h3 style="color:#00f2ff; margin-bottom:10px;">${item.term}</h3>
        <p style="line-height:1.6;">${item.def}</p>
      `;
    };
    listEl.appendChild(div);
  });
}

// --- INIT APP ---
document.addEventListener('DOMContentLoaded', () => {
  updateHUD();

  // Button Listeners
  document.getElementById('btn-start-game').onclick = () => { loadMission(1); };
  document.getElementById('btn-continue-game').onclick = () => {
    const lastUnlocked = Math.max(...gameState.unlockedMissions);
    loadMission(lastUnlocked);
  };
  document.getElementById('btn-select-mission').onclick = () => { renderMissionGrid(); switchView('view-mission-select'); };
  document.getElementById('btn-encyclopedia').onclick = () => { renderEncyclopedia(); switchView('view-encyclopedia'); };
  document.getElementById('btn-enc-top').onclick = () => { renderEncyclopedia(); switchView('view-encyclopedia'); };
  document.getElementById('btn-team').onclick = () => { switchView('view-team'); };
  document.getElementById('btn-settings').onclick = () => { switchView('view-settings'); };
  document.getElementById('btn-menu-top').onclick = () => { switchView('view-menu'); };

  document.querySelectorAll('.btn-back').forEach(btn => {
    btn.onclick = () => switchView(btn.getAttribute('data-target'));
  });

  document.getElementById('btn-prev-mission').onclick = () => {
    if (currentMissionId > 1) loadMission(currentMissionId - 1);
  };
  document.getElementById('btn-next-mission').onclick = () => {
    if (currentMissionId < 10) loadMission(currentMissionId + 1);
  };
  document.getElementById('btn-reset-mission').onclick = () => { loadMission(currentMissionId); };
  
  document.getElementById('btn-reset-data').onclick = () => {
    if (confirm("Apakah Anda yakin ingin menghapus seluruh data progres game?")) {
      localStorage.removeItem('monoclonal_lab_save');
      gameState = { ...DEFAULT_STATE };
      saveProgress();
      updateHUD();
      alert("Progres berhasil di-reset.");
      switchView('view-menu');
    }
  };

  // Sound setting toggle
  document.getElementById('setting-sound').onchange = (e) => {
    gameState.settings.sound = e.target.checked;
    saveProgress();
  };

  // Background animation canvas for main menu
  const bgCanvas = document.getElementById('menu-bg-canvas');
  if (bgCanvas) {
    const ctx = bgCanvas.getContext('2d');
    function resizeCanvas() {
      bgCanvas.width = bgCanvas.parentElement.clientWidth;
      bgCanvas.height = bgCanvas.parentElement.clientHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let particles = Array.from({ length: 25 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 3 + 1,
      dx: (Math.random() - 0.5) * 0.8,
      dy: (Math.random() - 0.5) * 0.8
    }));

    function drawParticles() {
      ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      ctx.fillStyle = 'rgba(0, 242, 255, 0.4)';
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > bgCanvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > bgCanvas.height) p.dy *= -1;
      });
      requestAnimationFrame(drawParticles);
    }
    drawParticles();
  }
});
