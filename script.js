// ===== data =====
const QUOTES = {
  easy: [
    "The sun is shining bright today.",
    "Type everyday to get better.",
    "Keep calm and code on."
  ],
  medium: [
    "Typing quickly and accurately takes time and practice. The more you practice, the faster you will get.",
    "Javascript enables interactive and dynamic web experiences that delight users and power modern applications.",
    "Frontend development blends creativity with logic to craft responsive, beautiful interfaces."
  ],
  hard: [
    "Consistency is the key to mastering typing speed. Practicing deliberately and tracking progress helps you improve steadily over weeks.",
    "Software engineering requires clear thinking, collaboration, and a focus on maintainable, well-tested code that solves user problems.",
    "Modern applications often employ complex state management and performance optimizations to provide seamless user experiences."
  ]
};

// ===== UI refs =====
const quoteEl = document.getElementById('quote');
const inputEl = document.getElementById('input');
const timerEl = document.getElementById('timer');
const wpmEl = document.getElementById('wpm');
const accEl = document.getElementById('accuracy');
const bestEl = document.getElementById('best');
const restartBtn = document.getElementById('restart');
const nextBtn = document.getElementById('next');
const difficultySel = document.getElementById('difficulty');
const themeToggle = document.getElementById('themeToggle');
const progressBar = document.getElementById('progressBar');

const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose') || document.getElementById('modalClose');
const modalNext = document.getElementById('modalNext') || document.getElementById('modalNext');
const finalTime = document.getElementById('finalTime');
const finalWpm = document.getElementById('finalWpm');
const finalAcc = document.getElementById('finalAcc');

let timer = 0;
let interval = null;
let isRunning = false;
let current = '';
let difficulty = localStorage.getItem('typist.difficulty') || 'medium';
let bestScores = JSON.parse(localStorage.getItem('typist.best')) || {easy:0, medium:0, hard:0};

// initialize UI
difficultySel.value = difficulty;
updateBestUI();
loadNewQuote();

// ===== functions =====
function loadNewQuote(){
  // pick random based on difficulty
  const pool = QUOTES[difficulty] || QUOTES.medium;
  current = pool[Math.floor(Math.random() * pool.length)];
  renderQuote(current);
  reset();
  updateBestUI();
}

function renderQuote(text){
  // wrap each char in span for per-char highlight
  quoteEl.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (const ch of text){
    const span = document.createElement('span');
    span.textContent = ch;
    frag.appendChild(span);
  }
  quoteEl.appendChild(frag);
}

function reset(){
  clearInterval(interval);
  timer = 0;
  isRunning = false;
  timerEl.textContent = '0 s';
  wpmEl.textContent = '0 WPM';
  accEl.textContent = '0%';
  inputEl.value = '';
  progressBar.style.width = '0%';
}

function startTimer(){
  if (interval) return;
  interval = setInterval(()=>{
    timer++;
    timerEl.textContent = `${timer} s`;
  }, 1000);
}

function stopTimer(){
  clearInterval(interval);
  interval = null;
}

function computeStats(typed){
  const spans = quoteEl.querySelectorAll('span');
  let correct = 0;
  for (let i=0;i<spans.length;i++){
    const ch = typed[i];
    if (ch == null){
      spans[i].classList.remove('correct','incorrect');
    } else if (ch === spans[i].textContent){
      spans[i].classList.add('correct');
      spans[i].classList.remove('incorrect');
      correct++;
    } else {
      spans[i].classList.add('incorrect');
      spans[i].classList.remove('correct');
    }
  }

  const accuracy = typed.length === 0 ? 0 : Math.round((correct / typed.length) * 100);
  accEl.textContent = `${accuracy}%`;

  // words typed: count whitespace-separated words
  const wordsTyped = typed.trim().length === 0 ? 0 : typed.trim().split(/\s+/).length;
  const wpm = (timer === 0) ? 0 : Math.round((wordsTyped / timer) * 60);
  wpmEl.textContent = `${wpm} WPM`;

  // progress
  const pct = Math.min(100, Math.round((typed.length / current.length) * 100));
  progressBar.style.width = pct + '%';

  return {accuracy, wpm};
}

function finishTest(stats){
  stopTimer();
  showModal(stats.wpm, stats.accuracy);
  // update best if necessary
  if (stats.wpm > (bestScores[difficulty] || 0)){
    bestScores[difficulty] = stats.wpm;
    localStorage.setItem('typist.best', JSON.stringify(bestScores));
    updateBestUI();
    // gentle celebration (small in-page animation)
    bounceCard();
  }
}

function showModal(wpm, acc){
  finalTime.textContent = `${timer} s`;
  finalWpm.textContent = `${wpm} WPM`;
  finalAcc.textContent = `${acc}%`;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
}

function closeModal(){
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden','true');
}

function updateBestUI(){
  bestEl.textContent = `${bestScores[difficulty] || 0} WPM`;
}

function bounceCard(){
  const card = document.querySelector('.card');
  card.animate([
    { transform: 'translateY(0)' },
    { transform: 'translateY(-8px)' },
    { transform: 'translateY(0)' }
  ], { duration: 450, easing: 'cubic-bezier(.25,.9,.3,1)' });
}

// ===== listeners =====
inputEl.addEventListener('input', (e)=>{
  const typed = e.target.value;
  if (!isRunning){
    isRunning = true;
    startTimer();
  }
  const stats = computeStats(typed);

  // finish condition exact match
  if (typed === current){
    finishTest(stats);
  }
});

// pressing Enter in input should not submit anything but keep flow
inputEl.addEventListener('keydown', (e)=>{
  // optional: prevent Enter from adding a new line if you want single-line test
  // if (e.key === 'Enter') e.preventDefault();
});

// restart & next
restartBtn.addEventListener('click', () => {
  loadNewQuote();
  inputEl.focus();
});
nextBtn.addEventListener('click', () => {
  loadNewQuote();
  inputEl.focus();
});

// difficulty change
difficultySel.addEventListener('change', (e)=>{
  difficulty = e.target.value;
  localStorage.setItem('typist.difficulty', difficulty);
  loadNewQuote();
});

// modal actions
modal.addEventListener('click', (ev)=>{
  // close when clicking outside modal-card
  if (ev.target === modal) closeModal();
});
document.getElementById('modalClose')?.addEventListener('click', closeModal);
document.getElementById('modalNext')?.addEventListener('click', ()=>{
  closeModal();
  loadNewQuote();
  inputEl.focus();
});

// theme toggle
themeToggle.addEventListener('click', ()=>{
  document.body.classList.toggle('dark');
  const dark = document.body.classList.contains('dark');
  themeToggle.textContent = dark ? '☀️' : '🌙';
});

// keyboard focus improvement: focus textarea on load
window.addEventListener('load', ()=> inputEl.focus());
