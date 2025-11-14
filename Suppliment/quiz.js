import { $, icons } from "./utils.js";
import { QUIZ_QUESTIONS, QUIZ_RECO } from "./data.js";
import { setView } from "./state.js";

const QUIZ_STORAGE_KEY = 'supplement_quiz_answers_v1';

function saveAnswers() {
  try { localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(quizAnswers)); } catch(e) { /* ignore */ }
}

function loadAnswers() {
  try { const raw = localStorage.getItem(QUIZ_STORAGE_KEY); if (!raw) return {}; return JSON.parse(raw) || {}; } catch(e){ return {}; }
}

function estimateBMI(heightKey, weightKey) {
  if (!heightKey || !weightKey) return null;
  const hMap = { 'h-<150':145, 'h-150-170':160, 'h-170-185':177.5, 'h-185+':190 };
  const wMap = { 'w-<55':52, 'w-55-75':65, 'w-75-95':85, 'w-95+':100 };
  const cm = hMap[heightKey]; const kg = wMap[weightKey];
  if (!cm || !kg) return null;
  const m = cm/100; const bmi = kg / (m*m);
  return Number(bmi.toFixed(1));
}

function bmiCategory(bmi) {
  if (bmi == null) return 'Unknown';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

function refineRecommendations(answers) {
  const base = QUIZ_RECO[answers.goal] || QUIZ_RECO['general-health'];
  let products = Array.isArray(base.products) ? [...base.products] : [];

  // Allergy substitutions (simple heuristics)
  if (answers.allergies === 'dairy') {
    products = products.map(p => {
      if (/whey|casein|milk/i.test(p)) return 'Vegan Protein';
      return p;
    });
  }

  // Sleep issues => suggest magnesium or melatonin support
  if (answers.sleep === 'poor') {
    if (!products.includes('Magnesium')) products.push('Magnesium Complex');
  }

  // High BMI => ensure fat-loss support included for weight-loss goal
  const bmi = estimateBMI(answers.height, answers.weight);
  if ((bmi || 0) >= 30 && answers.goal === 'weight-loss') {
    if (!products.includes('Fat Burner Pro')) products.unshift('Fat Burner Pro');
  }

  // Activity level adjustments
  if (answers.activity === 'sedentary') {
    if (!products.includes('Multivitamin Elite')) products.push('Multivitamin Elite');
  }

  // Age-specific suggestion
  if (answers.age === '51-plus') {
    if (!products.includes('Omega-3 Complex')) products.push('Omega-3 Complex');
  }

  return { products, reason: `Refined from goal (${answers.goal || 'general-health'}) and user profile` };
}

const quizAnswers = {};

export function viewQuizWrapper() {
  return `<section class="py-20 bg-gray-800/50">
    <div class="container mx-auto px-4"><div class="max-w-4xl mx-auto" id="quiz" data-step="0"></div></div>
  </section>`;
}

function renderStep(container) {
  const step = parseInt(container.dataset.step,10);
  const q = QUIZ_QUESTIONS[step];
  const progress = Math.round(((step+1)/QUIZ_QUESTIONS.length)*100);
  container.innerHTML = `
    <div class="text-center mb-12">
      <div class="flex items-center justify-center space-x-2 mb-6">
        <i data-lucide="target" class="w-8 h-8 text-cyan-400"></i>
        <h2 class="text-4xl font-bold text-white">Supplement Quiz</h2>
      </div>
      <p class="text-xl text-gray-300">Find the perfect supplements tailored to your fitness goals</p>
      <div class="mt-8 max-w-md mx-auto">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm text-gray-400">Question ${step+1} of ${QUIZ_QUESTIONS.length}</span>
          <span class="text-sm text-cyan-400">${progress}%</span>
        </div>
        <div class="w-full bg-gray-700 rounded-full h-2"><div class="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-500" style="width:${progress}%"></div></div>
      </div>
    </div>
    <div class="bg-gray-800/50 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-8 mb-8">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <i data-lucide="zap" class="w-8 h-8 text-white"></i>
        </div>
        <h3 class="text-2xl md:text-3xl font-bold text-white mb-4">${q.label}</h3>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${q.options.map(([val,label,desc])=>{
              const selected = (quizAnswers[q.id] === val);
              const base = `group p-6 rounded-2xl border-2 text-left transition-all duration-200 transform hover:scale-[1.02] bg-gray-700/30`;
              const selClasses = selected ? 'border-cyan-400 bg-gradient-to-r from-cyan-800/30 to-blue-800/30 scale-[1.02] ring-1 ring-cyan-400/30' : 'border-gray-600 hover:border-gray-500';
              return `
              <button class="${base} ${selClasses}" data-action="choose" data-qid="${q.id}" data-value="${val}">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-lg font-semibold text-white ${selected ? 'text-cyan-300' : 'group-hover:text-cyan-400'} transition-colors duration-200">${label}</h4>
                  <div class="flex items-center space-x-2">
                    ${selected?`<i data-lucide="check-circle" class="w-5 h-5 text-cyan-300"></i>`:'<div class="w-4 h-4 rounded-full border-2 border-gray-500"></div>'}
                  </div>
                </div>
                <p class="text-gray-400 text-sm">${desc}</p>
              </button>
            `}).join("")}
          </div>
      <div class="text-center mt-8">
        <button data-action="next" data-role="next" class="hidden group inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-cyan-500 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg">
          <span>${step===QUIZ_QUESTIONS.length-1?"Get My Results":"Next Question"}</span>
          <i data-lucide="chevron-right" class="w-5 h-5"></i>
        </button>
      </div>
    </div>
  `;
  icons();
}

function renderResult(container) {
  const goal = quizAnswers["goal"] || "general-health";
  const r = QUIZ_RECO[goal];
  // compute BMI and category
  const bmi = estimateBMI(quizAnswers.height, quizAnswers.weight);
  const bmiCat = bmi ? bmiCategory(bmi) : null;

  // refine product suggestions
  const refined = refineRecommendations(quizAnswers);

  container.innerHTML = `
    <div class="text-center mb-12">
      <div class="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
        <i data-lucide="trophy" class="w-10 h-10 text-white"></i>
      </div>
      <h2 class="text-4xl font-bold text-white mb-4">Your Personalized Recommendation</h2>
      <p class="text-xl text-gray-300">Based on your answers, we've created the most suitable supplement stack for you</p>
    </div>
    <div class="bg-gray-800/50 backdrop-blur-sm rounded-3xl border border-gray-700/50 overflow-hidden mb-8 p-8">
      <div class="inline-block bg-gradient-to-r ${r.color} text-white px-6 py-2 rounded-full text-sm font-semibold mb-6">Recommended for You</div>
      <h3 class="text-3xl font-bold text-white mb-4">${r.title}</h3>
      <p class="text-gray-300 text-lg mb-8">${r.desc}</p>
      <div class="mb-6 p-4 bg-gray-900/40 rounded-lg">
        <h4 class="text-white font-semibold mb-2">Why this recommendation</h4>
        <p class="text-gray-300 text-sm">${refined.reason}.</p>
      </div>
      <div class="mb-6 p-4 bg-gray-900/30 rounded-lg">
        <h4 class="text-white font-semibold mb-2">Your profile summary</h4>
        <div class="grid grid-cols-2 gap-2 text-sm text-gray-300">
          <div><strong>Goal:</strong> ${quizAnswers.goal || '-'}</div>
          <div><strong>Activity:</strong> ${quizAnswers.activity || '-'}</div>
          <div><strong>Age:</strong> ${quizAnswers.age || '-'}</div>
          <div><strong>Allergies:</strong> ${quizAnswers.allergies || 'None'}</div>
          <div><strong>Height:</strong> ${quizAnswers.height || '-'}</div>
          <div><strong>Weight:</strong> ${quizAnswers.weight || '-'}</div>
          <div><strong>BMI:</strong> ${bmi ? bmi + ' ('+bmiCat+')' : 'N/A'}</div>
          <div><strong>Sleep:</strong> ${quizAnswers.sleep || '-'}</div>
        </div>
      </div>
      <div class="mb-8">
        <h4 class="text-xl font-semibold text-white mb-4">Recommended Products:</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${refined.products.map(p=>`<div class="bg-gray-700/50 rounded-xl p-4 text-center"><span class="text-cyan-400 font-medium">${p}</span></div>`).join("")}
        </div>
      </div>
      <div class="flex flex-col sm:flex-row gap-4">
        <button class="flex-1 bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-cyan-500 hover:to-blue-600 transition-all duration-200" data-action="go-catalog">
          Shop Recommended Products
        </button>
        <button data-action="retake" class="flex-1 border-2 border-gray-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-700 transition-all duration-200">Retake Quiz</button>
      </div>
    </div>
  `;
  icons();
}

export function mountQuiz(root = document) {
  const container = $("#quiz", root);
  if (!container) return;
  renderStep(container);

  container.addEventListener("click", (e)=>{
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const act = el.getAttribute("data-action");
    if (act==="choose") {
      const qid = el.getAttribute("data-qid");
      const val = el.getAttribute("data-value");
      // store answer
      quizAnswers[qid] = val;
      saveAnswers();
      // visually mark selected: remove from siblings then add to clicked
      const siblings = container.querySelectorAll(`button[data-qid="${qid}"]`);
      siblings.forEach(b=>{
        b.classList.remove('border-cyan-400','bg-gradient-to-r','from-cyan-800/30','to-blue-800/30','scale-[1.02]','ring-1','ring-cyan-400/30');
        b.classList.add('border-gray-600');
        const icon = b.querySelector('[data-lucide="check-circle"]');
        if (icon) icon.remove();
        b.querySelector('h4')?.classList.remove('text-cyan-300');
      });
      // apply selected styles to clicked element
      el.classList.remove('border-gray-600');
      el.classList.add('border-cyan-400','bg-gradient-to-r','from-cyan-800/30','to-blue-800/30','scale-[1.02]','ring-1','ring-cyan-400/30');
      el.querySelector('h4')?.classList.add('text-cyan-300');
      // add check icon
      const span = document.createElement('span'); span.innerHTML = '<i data-lucide="check-circle" class="w-5 h-5 text-cyan-300"></i>';
      const right = el.querySelector('.flex.items-center.space-x-2');
      if (right) {
        // insert icon element
        const temp = document.createElement('div'); temp.innerHTML = span.innerHTML; right.appendChild(temp.firstChild);
      }
      // create a quick ring pulse
      el.classList.add('animate-pulse'); setTimeout(()=>el.classList.remove('animate-pulse'),300);
      const nextBtn = $('[data-role="next"]', container);
      if (nextBtn) nextBtn.classList.remove("hidden");
    } else if (act==="next") {
      const step = parseInt(container.dataset.step,10);
      if (step < QUIZ_QUESTIONS.length - 1) {
        container.dataset.step = String(step+1);
        renderStep(container);
      } else {
        renderResult(container);
      }
    } else if (act==="retake") {
      Object.keys(quizAnswers).forEach(k=>delete quizAnswers[k]);
      try { localStorage.removeItem(QUIZ_STORAGE_KEY); } catch(e){}
      container.dataset.step = "0";
      renderStep(container);
    } else if (act==="go-catalog") {
      setView("catalog");
    }
  });
}

// initialize answers from storage so users can resume
const loaded = loadAnswers();
Object.assign(quizAnswers, loaded);
