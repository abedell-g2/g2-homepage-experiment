/* ============================================================
   G2 Homepage Experiment — JavaScript
   Handles: mobile nav, dropdown, hybrid search/AI input
   ============================================================ */

'use strict';

// ----------------------------------------------------------------
// Mobile menu toggle
// ----------------------------------------------------------------
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu    = document.getElementById('mobile-menu');
const iconOpen      = document.getElementById('menu-icon-open');
const iconClose     = document.getElementById('menu-icon-close');

mobileMenuBtn.addEventListener('click', () => {
  const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
  const nowOpen    = !isExpanded;

  mobileMenu.classList.toggle('hidden', !nowOpen);
  mobileMenu.setAttribute('aria-hidden', String(!nowOpen));
  mobileMenuBtn.setAttribute('aria-expanded', String(nowOpen));

  iconOpen.classList.toggle('hidden', nowOpen);
  iconClose.classList.toggle('hidden', !nowOpen);
});

// Close mobile menu on resize to desktop
window.addEventListener('resize', () => {
  if (window.innerWidth >= 1000) {
    mobileMenu.classList.add('hidden');
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    iconOpen.classList.remove('hidden');
    iconClose.classList.add('hidden');
  }
});

// ----------------------------------------------------------------
// For Business dropdown
// ----------------------------------------------------------------
const dropdownEl  = document.querySelector('[data-dropdown]');
const dropdownBtn = dropdownEl?.querySelector('button');
const dropdownMenu = dropdownEl?.querySelector('.dropdown-menu');

function openDropdown() {
  dropdownMenu.classList.remove('hidden');
  dropdownBtn.setAttribute('aria-expanded', 'true');
  dropdownBtn.querySelector('.dropdown-chevron').style.transform = 'rotate(180deg)';
}
function closeDropdown() {
  dropdownMenu.classList.add('hidden');
  dropdownBtn.setAttribute('aria-expanded', 'false');
  dropdownBtn.querySelector('.dropdown-chevron').style.transform = '';
}

dropdownBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  dropdownMenu.classList.contains('hidden') ? openDropdown() : closeDropdown();
});

document.addEventListener('click', () => {
  if (dropdownMenu && !dropdownMenu.classList.contains('hidden')) closeDropdown();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && dropdownMenu && !dropdownMenu.classList.contains('hidden')) {
    closeDropdown();
    dropdownBtn.focus();
  }
});

// ----------------------------------------------------------------
// Hybrid Search / AI input
// ----------------------------------------------------------------
const searchForm    = document.getElementById('search-form');
const searchField   = document.getElementById('search-field');
const searchInput   = document.getElementById('search-input');
const searchHint    = document.getElementById('search-hint');
const responsePanel = document.getElementById('response-panel');

// Patterns that suggest the user is asking a question (AI mode)
const AI_TRIGGERS = /\b(what|how|which|who|why|where|when|compare|best|vs\.?|versus|recommend|recommendation|difference|alternatives|similar|like|help|find|looking for|i need|top|review)\b|\?/i;

function detectMode(query) {
  return AI_TRIGGERS.test(query) ? 'ai' : 'search';
}

// ---- Mock product database ----
const PRODUCTS = {
  hubspot: {
    name: 'HubSpot CRM',
    category: 'CRM Software',
    rating: 4.4,
    reviews: 12480,
    description: 'HubSpot CRM is an all-in-one platform for sales, marketing, and service. Known for its intuitive UI and generous free tier — a top pick for growing teams.',
    badge: 'Leader — Spring 2025',
  },
  salesforce: {
    name: 'Salesforce Sales Cloud',
    category: 'CRM Software',
    rating: 4.3,
    reviews: 23640,
    description: 'Salesforce Sales Cloud is the world\'s most widely deployed CRM, offering deep customization, automation, and enterprise-grade scalability.',
    badge: 'Leader — Spring 2025',
  },
  slack: {
    name: 'Slack',
    category: 'Business Instant Messaging',
    rating: 4.5,
    reviews: 32810,
    description: 'Slack is the channel-based messaging platform teams rely on for real-time collaboration, file sharing, and integrations with 2,000+ tools.',
    badge: 'Leader — Spring 2025',
  },
  notion: {
    name: 'Notion',
    category: 'Project Management',
    rating: 4.6,
    reviews: 18740,
    description: 'Notion is an all-in-one workspace combining wikis, docs, databases, and project tracking — highly rated for flexibility and design.',
    badge: 'Leader — Spring 2025',
  },
  asana: {
    name: 'Asana',
    category: 'Project Management',
    rating: 4.4,
    reviews: 10340,
    description: 'Asana helps teams orchestrate work with timelines, boards, and automation — ranked consistently as a G2 Leader in project management.',
    badge: 'Leader — Spring 2025',
  },
  zoom: {
    name: 'Zoom',
    category: 'Video Conferencing',
    rating: 4.5,
    reviews: 54900,
    description: 'Zoom is the leading video conferencing platform, trusted for reliability, ease of use, and rich features like breakout rooms and webinars.',
    badge: 'Leader — Spring 2025',
  },
  figma: {
    name: 'Figma',
    category: 'UX/UI Design',
    rating: 4.7,
    reviews: 9120,
    description: 'Figma is a collaborative design tool for building interfaces, prototypes, and design systems — consistently rated as a G2 Leader.',
    badge: 'Leader — Spring 2025',
  },
};

// ---- Mock AI responses ----
const AI_RESPONSES = {
  crm: 'Based on **6M+ verified G2 reviews**, the top CRMs for startups are:\n\n1. **HubSpot CRM** — Free tier, 4.4★, 12K+ reviews. Best for marketing-led growth.\n2. **Pipedrive** — Sales-focused, intuitive pipeline view, 4.3★.\n3. **Salesforce Starter** — Enterprise-ready and scales as you grow.\n\nHubSpot is the most-recommended for early-stage teams thanks to its powerful free plan and ease of setup.',
  compare: 'Great comparison! G2 lets you run side-by-side comparisons across pricing, features, integrations, and real user sentiment. I can pull up a detailed breakdown — just tell me the two products you\'d like to compare.',
  best: 'Based on G2 ratings and review volume, I can help you find the best-fit software for your needs. To narrow it down: **What\'s your team size?** and **What problem are you solving?** That way I can surface the top-rated options specific to your situation.',
  alternatives: 'Looking for alternatives? G2\'s comparison pages surface the closest competitors by feature set and user satisfaction score. Share the tool you\'re comparing against and I\'ll identify the top-rated alternatives in that category.',
  reviews: 'G2 has **6 million+** verified reviews across 150,000+ software products. Reviews are validated through LinkedIn authentication and the G2 review process to ensure they\'re from real users. Want to browse reviews for a specific product?',
  default: 'Great question! G2 has **6M+ verified reviews** across 150,000+ products. I can help you find the right software, compare options, or explore top-rated categories. What would be most helpful right now?',
};

function getAIResponse(query) {
  const q = query.toLowerCase();
  if (/crm|customer relationship|sales team|startup crm/.test(q))         return AI_RESPONSES.crm;
  if (/compare|vs|versus|difference/.test(q))                              return AI_RESPONSES.compare;
  if (/best|top|recommended|leading/.test(q))                              return AI_RESPONSES.best;
  if (/alternative|similar|like|instead of/.test(q))                      return AI_RESPONSES.alternatives;
  if (/review|rating|rated/.test(q))                                       return AI_RESPONSES.reviews;
  return AI_RESPONSES.default;
}

function getProductMatch(query) {
  const q = query.toLowerCase();
  for (const [key, data] of Object.entries(PRODUCTS)) {
    if (q.includes(key)) return data;
  }
  // Generic fallback
  return {
    name: toTitleCase(query),
    category: 'Software',
    rating: 4.2,
    reviews: 1840,
    description: `Find verified user reviews, pricing, and alternatives for ${toTitleCase(query)} on G2.`,
    badge: null,
  };
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

// ---- Star rendering ----
function renderStars(rating) {
  const starPath = 'M8.5 0L10.986 5.18L16.584 5.91L12.542 9.82L13.472 15.09L8.5 12.18L3.528 15.09L4.458 9.82L.416 5.91L6.014 5.18L8.5 0Z';
  const full    = Math.floor(rating);
  const hasHalf = (rating % 1) >= 0.5;
  let html = '';

  const star = (fill) => `<svg width="13" height="13" viewBox="0 0 17 16" fill="${fill}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="${starPath}"/></svg>`;

  for (let i = 0; i < full; i++) html += star('#FF8F00');
  if (hasHalf) html += star('#FFC842');
  for (let i = full + (hasHalf ? 1 : 0); i < 5; i++) html += star('#E5E7EB');
  return html;
}

// ---- Search result card ----
function buildSearchCard(query) {
  const p = getProductMatch(query);
  return `
    <div class="response-card">
      <div class="flex items-start gap-4 flex-wrap justify-between">
        <div class="flex-1 min-w-0">
          <p class="text-xs font-semibold text-g2-muted uppercase tracking-wider mb-0.5">${p.category}</p>
          <h3 class="text-lg font-bold text-g2-dark">${escapeHTML(p.name)}</h3>
          <div class="flex items-center gap-2 mt-1 flex-wrap">
            <div class="flex items-center gap-0.5" role="img" aria-label="${p.rating} out of 5 stars">
              ${renderStars(p.rating)}
            </div>
            <span class="text-sm font-bold text-g2-dark">${p.rating}</span>
            <span class="text-sm text-g2-muted">${p.reviews.toLocaleString()} reviews</span>
          </div>
          ${p.badge ? `<p class="mt-2 text-xs font-semibold text-g2-purple">🏆 ${p.badge}</p>` : ''}
        </div>
        <a href="#"
           class="shrink-0 bg-[#c4321a] text-white font-semibold text-sm px-5 py-2 rounded-full hover:bg-[#aa2a14] focus-ring transition-colors"
           aria-label="View ${escapeHTML(p.name)} reviews on G2">
          View Reviews
        </a>
      </div>
      <p class="mt-3 text-sm text-g2-text leading-relaxed">${p.description}</p>
      <ul class="mt-4 flex items-center gap-4 flex-wrap list-none p-0" role="list">
        <li><a href="#" class="text-sm text-g2-purple font-semibold hover:underline focus-ring rounded">Compare alternatives →</a></li>
        <li><a href="#" class="text-sm text-g2-purple font-semibold hover:underline focus-ring rounded">See pricing →</a></li>
        <li><a href="#" class="text-sm text-g2-purple font-semibold hover:underline focus-ring rounded">Read top reviews →</a></li>
      </ul>
    </div>
  `;
}

// ---- AI response card (with typing animation) ----
function buildAICard() {
  return `
    <div class="response-card">
      <div class="flex items-center gap-2 mb-3">
        <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
             style="background: linear-gradient(135deg, #5746b2, #ff492c);"
             aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 20 20" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 2L11.7 7H17L12.7 10.2L14.4 15.2L10 12L5.6 15.2L7.3 10.2L3 7H8.3L10 2Z"/>
          </svg>
        </div>
        <span class="text-xs font-bold text-g2-purple uppercase tracking-wider">G2 AI</span>
      </div>

      <!-- Loading dots (shown briefly, then replaced by typed text) -->
      <div id="ai-loading" class="loading-dots py-1" aria-label="G2 AI is generating a response" role="status">
        <span></span><span></span><span></span>
      </div>

      <div id="ai-text"
           class="text-sm text-g2-text leading-relaxed hidden"
           aria-live="polite"></div>

      <div class="mt-4 pt-4 border-t border-g2-border-light flex items-center justify-between flex-wrap gap-2">
        <p class="text-xs text-g2-muted">Powered by 6M+ verified G2 reviews</p>
        <div class="flex gap-4">
          <button type="button"
                  class="text-xs text-g2-muted hover:text-g2-dark transition-colors focus-ring rounded"
                  aria-label="Mark this response as helpful">
            👍 Helpful
          </button>
          <button type="button"
                  class="text-xs text-g2-muted hover:text-g2-dark transition-colors focus-ring rounded"
                  aria-label="Mark this response as not helpful">
            👎 Not helpful
          </button>
        </div>
      </div>
    </div>
  `;
}

// Type text character-by-character (respects prefers-reduced-motion)
function typeText(elementId, rawText, speed = 16) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Convert **bold** and \n\n to HTML
  function formatMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/^\d+\.\s/gm, (m) => `<strong>${m}</strong>`);
  }

  if (prefersReduced) {
    el.innerHTML = formatMarkdown(rawText);
    return;
  }

  el.classList.add('typing-cursor');
  let i = 0;

  const interval = setInterval(() => {
    i++;
    el.textContent = rawText.slice(0, i);
    if (i >= rawText.length) {
      clearInterval(interval);
      el.classList.remove('typing-cursor');
      el.innerHTML = formatMarkdown(rawText);
    }
  }, speed);
}

// XSS safety
function escapeHTML(str) {
  const el = document.createElement('div');
  el.textContent = str;
  return el.innerHTML;
}

// ---- Form submission ----
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (!query) {
    searchInput.focus();
    return;
  }

  const mode = aiModeActive ? 'ai' : detectMode(query);
  responsePanel.classList.remove('hidden');

  if (mode === 'ai') {
    responsePanel.innerHTML = buildAICard();

    // Simulate brief "thinking" delay, then type response
    setTimeout(() => {
      const loading = document.getElementById('ai-loading');
      const textEl  = document.getElementById('ai-text');
      if (loading) loading.classList.add('hidden');
      if (textEl)  textEl.classList.remove('hidden');
      typeText('ai-text', getAIResponse(query));
    }, 900);

    if (!aiModeActive) searchHint.textContent = 'Ask a follow-up, or search for specific software';

  } else {
    responsePanel.innerHTML = buildSearchCard(query);
    searchHint.textContent = `Showing results for "${query}" · Ask a question for AI-powered help`;
  }

  // Smooth scroll to response
  responsePanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// ---- Live mode hint as user types ----
searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim();

  // In AI mode the hint is managed by the toggle — don't override it
  if (aiModeActive) return;

  if (query.length === 0) {
    responsePanel.classList.add('hidden');
    searchHint.innerHTML = 'Try <em>"HubSpot"</em> to search, or <em>"What\'s the best CRM for startups?"</em> for AI help';
    return;
  }

  const mode = detectMode(query);
  if (mode === 'ai') {
    searchHint.textContent = '✨ AI mode — press Enter to get an intelligent recommendation';
  } else {
    searchHint.textContent = '🔍 Search mode — press Enter to find software reviews';
  }
});

// Also submit on Enter key
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    searchForm.dispatchEvent(new Event('submit'));
  }
});

// ----------------------------------------------------------------
// AI Mode toggle
// ----------------------------------------------------------------
const aiModeToggle = document.getElementById('ai-mode-toggle');
const aiCanvas     = document.getElementById('ai-canvas');
let   aiModeActive = false;

function activateAIMode() {
  aiModeActive = true;
  aiModeToggle.setAttribute('aria-pressed', 'true');
  searchField.classList.add('ai-active');
  searchInput.placeholder = 'Ask me anything about software...';
  searchHint.textContent = '✨ AI Mode on — ask a question or choose a suggestion below';
  aiCanvas.classList.remove('hidden');
  aiCanvas.removeAttribute('aria-hidden');
  responsePanel.classList.add('hidden');
  searchInput.focus();
}

function deactivateAIMode() {
  aiModeActive = false;
  aiModeToggle.setAttribute('aria-pressed', 'false');
  searchField.classList.remove('ai-active');
  searchInput.placeholder = 'Discover what\'s new at G2...';
  searchHint.innerHTML = 'Try <em>"HubSpot"</em> to search, or <em>"What\'s the best CRM for startups?"</em> for AI help';
  aiCanvas.classList.add('hidden');
  aiCanvas.setAttribute('aria-hidden', 'true');
  responsePanel.classList.add('hidden');
}

aiModeToggle.addEventListener('click', () => {
  aiModeActive ? deactivateAIMode() : activateAIMode();
});

// Prompt chip clicks — fill input and submit
document.querySelectorAll('.prompt-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    searchInput.value = chip.textContent.trim();
    searchForm.dispatchEvent(new Event('submit'));
  });
});
