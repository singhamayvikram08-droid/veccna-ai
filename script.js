/**
 * ==============================================================================
 * VECCNA AI — GEMINI-STYLE AI PLATFORM
 * Trained by: Amay, Anshuman, Ankit & Aaryan
 * ==============================================================================
 */

// --- Global Application State ---
const savedUser = localStorage.getItem('veccna_user');
let initialUser = {
  isLoggedIn: true,
  name: 'Amay Vikram Singh',
  email: 'singhamayvikram08@gmail.com',
  initials: 'AV',
  tier: 'Veccna Pro 2.5'
};
if (savedUser) {
  try {
    initialUser = JSON.parse(savedUser);
  } catch (e) {
    console.error('Error parsing stored user:', e);
  }
}

const state = {
  user: initialUser,
  currentModel: 'Veccna 2.5 Pro (Thinking)',
  activeChatId: 'chat-1',
  deepThinkingEnabled: true,
  webSearchEnabled: true,
  soundEnabled: true,
  isGenerating: false,
  pendingAttachments: [],
  chats: [
    {
      id: 'chat-1',
      title: 'Veccna Synapse-X Architecture',
      messages: []
    },
    {
      id: 'chat-2',
      title: 'Quantum Key Distribution in AI',
      messages: [
        {
          role: 'user',
          text: 'How does Quantum Key Distribution (QKD) protect AI agent swarms?'
        },
        {
          role: 'model',
          thinking: 'Analyzing quantum mechanics principles applied to cryptographic key exchange in distributed AI multi-agent topologies...',
          text: `**Quantum Key Distribution (QKD)** leverages the Heisenberg Uncertainty Principle and the No-Cloning Theorem to establish cryptographically secure shared keys between autonomous AI agents.\n\n### Key Mechanisms:\n1. **BB84 Protocol Integration:** Entangled photon states ensure that any eavesdropping alters the quantum state, alerting the agents instantly.\n2. **Information-Theoretic Security:** Unlike RSA or ECC which rely on computational hardness, QKD provides unconditional security against future quantum supercomputers.\n3. **Veccna Synapse Hardening:** Lattice-based cryptographic verification secures agent-to-agent neural weight synchronizations.`
        }
      ]
    },
    {
      id: 'chat-3',
      title: 'Distributed Transformer Pipeline',
      messages: [
        {
          role: 'user',
          text: 'Explain pipeline parallelism in large-scale LLM training.'
        },
        {
          role: 'model',
          thinking: 'Breaking down pipeline parallelism, 1F1B schedule, and GPipe activation partitioning...',
          text: `**Pipeline Parallelism (PP)** partitions the layers of a massive transformer model across multiple accelerator nodes in sequential stages.\n\n\`\`\`python
# 1F1B (One-Forward-One-Backward) Pipeline Schedule
class PipelineStage:
    def __init__(self, stage_id, num_layers):
        self.stage_id = stage_id
        self.layers = [TransformerBlock() for _ in range(num_layers)]
        
    def forward_microbatch(self, x):
        for layer in self.layers:
            x = layer(x)
        return x
\`\`\`\n\nThis architecture was optimized in **Veccna Synapse-X** to achieve **94.8% MFU (Model FLOPs Utilization)** across 4,096 GPUs.`
        }
      ]
    }
  ]
};

// --- Web Audio Synthesizer ---
let audioCtx = null;
function playSound(type) {
  if (!state.soundEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    if (type === 'send') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'receive') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1100, now + 0.06);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    }
  } catch (e) {
    console.debug('Audio context not ready:', e);
  }
}

// --- DOM References ---
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const newChatBtn = document.getElementById('newChatBtn');
const chatHistoryList = document.getElementById('chatHistoryList');
const promptInput = document.getElementById('promptInput');
const sendPromptBtn = document.getElementById('sendPromptBtn');
const welcomeHero = document.getElementById('welcomeHero');
const messagesContainer = document.getElementById('messagesContainer');
const chatScrollView = document.getElementById('chatScrollView');
const attachmentPreview = document.getElementById('attachmentPreview');
const fileInput = document.getElementById('fileInput');
const modelSelector = document.getElementById('modelSelector');
const modelDropdown = document.getElementById('modelDropdown');
const selectedModelName = document.getElementById('selectedModelName');
const thinkToggleBtn = document.getElementById('thinkToggleBtn');
const searchToggleBtn = document.getElementById('searchToggleBtn');
const modelModal = document.getElementById('modelModal');

// --- Markdown & Code Formatter ---
function formatMarkdown(text) {
  if (!text) return '';

  // Escape HTML entities to prevent raw injection
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code Blocks ```lang ... ```
  escaped = escaped.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const langDisplay = lang || 'code';
    return `
      <div class="code-block-wrapper">
        <div class="code-header">
          <span>${langDisplay}</span>
          <button class="copy-code-btn" onclick="copyCodeSnippet(this)">
            <i class="far fa-copy"></i> Copy
          </button>
        </div>
        <pre class="code-pre"><code>${code.trim()}</code></pre>
      </div>
    `;
  });

  // Inline Code `code`
  escaped = escaped.replace(/`([^`]+)`/g, '<code class="font-mono" style="background: rgba(148, 163, 184, 0.15); padding: 0.15rem 0.4rem; border-radius: 4px; color: #38bdf8;">$1</code>');

  // Bold **text**
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Headers ###
  escaped = escaped.replace(/^### (.*$)/gim, '<h3 style="font-size: 1.05rem; font-weight: 700; color: #ffffff; margin: 0.85rem 0 0.4rem;">$1</h3>');
  escaped = escaped.replace(/^## (.*$)/gim, '<h2 style="font-size: 1.25rem; font-weight: 800; color: #ffffff; margin: 1rem 0 0.5rem;">$1</h2>');
  escaped = escaped.replace(/^# (.*$)/gim, '<h1 style="font-size: 1.45rem; font-weight: 800; color: #ffffff; margin: 1.25rem 0 0.6rem;">$1</h1>');

  // Unordered list items
  escaped = escaped.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
  escaped = escaped.replace(/(<li>.*<\/li>)/s, '<ul style="padding-left: 1.25rem; margin: 0.5rem 0;">$1</ul>');

  // Numbered list items
  escaped = escaped.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<li>$2</li>');

  // Paragraph breaks
  const paragraphs = escaped.split(/\n\n+/);
  return paragraphs.map(p => {
    if (p.startsWith('<div class="code-block-wrapper') || p.startsWith('<h1') || p.startsWith('<h2') || p.startsWith('<h3') || p.startsWith('<ul') || p.startsWith('<ol')) {
      return p;
    }
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');
}

window.copyCodeSnippet = function(button) {
  const codeBlock = button.closest('.code-block-wrapper').querySelector('code');
  if (codeBlock) {
    navigator.clipboard.writeText(codeBlock.innerText).then(() => {
      button.innerHTML = '<i class="fas fa-check" style="color: var(--sky-bright)"></i> Copied!';
      playSound('click');
      setTimeout(() => {
        button.innerHTML = '<i class="far fa-copy"></i> Copy';
      }, 2000);
    });
  }
};

// --- Sidebar Management ---
function initSidebar() {
  sidebarToggle.addEventListener('click', () => {
    playSound('click');
    sidebar.classList.toggle('collapsed');
  });

  newChatBtn.addEventListener('click', () => {
    playSound('click');
    createNewChat();
  });

  renderChatHistory();
}

function renderChatHistory() {
  chatHistoryList.innerHTML = state.chats.map(chat => `
    <div class="chat-history-item ${chat.id === state.activeChatId ? 'active' : ''}" onclick="selectChat('${chat.id}')">
      <i class="far fa-message"></i>
      <span class="chat-title-text">${chat.title}</span>
    </div>
  `).join('');
}

window.selectChat = function(chatId) {
  playSound('click');
  state.activeChatId = chatId;
  renderChatHistory();
  renderActiveChat();
};

function createNewChat() {
  const newId = `chat-${Date.now()}`;
  const newChat = {
    id: newId,
    title: 'New conversation',
    messages: []
  };
  state.chats.unshift(newChat);
  state.activeChatId = newId;
  renderChatHistory();
  renderActiveChat();
  if (promptInput) promptInput.focus();
}

// --- Active Chat View Rendering ---
function renderActiveChat() {
  const currentChat = state.chats.find(c => c.id === state.activeChatId);
  if (!currentChat || currentChat.messages.length === 0) {
    welcomeHero.style.display = 'flex';
    messagesContainer.style.display = 'none';
    messagesContainer.innerHTML = '';
  } else {
    welcomeHero.style.display = 'none';
    messagesContainer.style.display = 'flex';
    messagesContainer.innerHTML = currentChat.messages.map(msg => renderMessageRow(msg)).join('');
    scrollToBottom();
  }
}

function renderMessageRow(msg) {
  if (msg.role === 'user') {
    return `
      <div class="message-row user-row">
        <div class="message-avatar user-avatar-icon">AV</div>
        <div class="message-body">
          <div class="message-content">${formatMarkdown(msg.text)}</div>
        </div>
      </div>
    `;
  } else {
    const formattedHtml = formatMarkdown(msg.text);
    return `
      <div class="message-row ai-row">
        <div class="message-avatar ai-avatar-icon">
          <svg viewBox="0 0 100 100" fill="none">
            <path d="M16 18 L50 86 L84 18 L68 18 L50 60 L32 18 Z" fill="url(#msgVeccnaGrad)" />
            <path d="M36 24 L50 56 L64 24 L56 24 L50 40 L44 24 Z" fill="url(#msgVeccnaInner)" />
            <polygon points="50,22 55,30 50,38 45,30" fill="#FFFFFF" />
            <circle cx="24" cy="18" r="3.5" fill="#38BDF8" />
            <circle cx="76" cy="18" r="3.5" fill="#EC4899" />
            <circle cx="50" cy="86" r="3" fill="#6366F1" />
            <defs>
              <linearGradient id="msgVeccnaGrad" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#38BDF8" />
                <stop offset="45%" stop-color="#6366F1" />
                <stop offset="100%" stop-color="#EC4899" />
              </linearGradient>
              <linearGradient id="msgVeccnaInner" x1="85" y1="15" x2="15" y2="85" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#06B6D4" />
                <stop offset="100%" stop-color="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="message-body">
          <div class="message-author">
            <span>Veccna AI</span>
            <span class="message-author-tag">${state.currentModel}</span>
          </div>

          ${msg.thinking ? `
            <div class="thinking-accordion open">
              <div class="thinking-header" onclick="this.parentElement.classList.toggle('open')">
                <span><i class="fas fa-brain"></i> Thinking Process</span>
                <i class="fas fa-chevron-down"></i>
              </div>
              <div class="thinking-content">
                ${msg.thinking}
              </div>
            </div>
          ` : ''}

          <div class="message-content">${formattedHtml}</div>

          <div class="message-actions">
            <button class="msg-act-btn" onclick="copyMessageText(this)" title="Copy Response"><i class="far fa-copy"></i></button>
            <button class="msg-act-btn" title="Good Response"><i class="far fa-thumbs-up"></i></button>
            <button class="msg-act-btn" title="Bad Response"><i class="far fa-thumbs-down"></i></button>
            <button class="msg-act-btn" title="Share"><i class="fas fa-share-nodes"></i></button>
          </div>
        </div>
      </div>
    `;
  }
}

window.copyMessageText = function(btn) {
  const content = btn.closest('.message-body').querySelector('.message-content');
  if (content) {
    navigator.clipboard.writeText(content.innerText).then(() => {
      btn.innerHTML = '<i class="fas fa-check" style="color: var(--sky-bright)"></i>';
      playSound('click');
      setTimeout(() => {
        btn.innerHTML = '<i class="far fa-copy"></i>';
      }, 2000);
    });
  }
};

function scrollToBottom() {
  setTimeout(() => {
    chatScrollView.scrollTop = chatScrollView.scrollHeight;
  }, 50);
}

// --- Prompt Submission & AI Simulation ---
function initPromptControls() {
  // Auto-expand textarea
  promptInput.addEventListener('input', () => {
    promptInput.style.height = 'auto';
    promptInput.style.height = Math.min(promptInput.scrollHeight, 180) + 'px';
    if (promptInput.value.trim().length > 0) {
      sendPromptBtn.classList.add('ready');
    } else {
      sendPromptBtn.classList.remove('ready');
    }
  });

  // Enter to send (Shift+Enter for newline)
  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  });

  sendPromptBtn.addEventListener('click', () => {
    handleSendPrompt();
  });

  // Suggestion Cards in Welcome Hero
  document.querySelectorAll('.suggestion-card').forEach(card => {
    card.addEventListener('click', () => {
      playSound('click');
      const text = card.getAttribute('data-prompt');
      promptInput.value = text;
      promptInput.dispatchEvent(new Event('input'));
      handleSendPrompt();
    });
  });

  // File / Image Attachment Simulation
  const attachBtn = document.getElementById('attachFileBtn');
  if (attachBtn && fileInput) {
    attachBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        playSound('click');
        const file = e.target.files[0];
        addAttachment(file.name);
      }
    });
  }

  // Thinking Toggle
  if (thinkToggleBtn) {
    thinkToggleBtn.addEventListener('click', () => {
      playSound('click');
      state.deepThinkingEnabled = !state.deepThinkingEnabled;
      thinkToggleBtn.classList.toggle('active', state.deepThinkingEnabled);
    });
  }

  // Search Toggle
  if (searchToggleBtn) {
    searchToggleBtn.addEventListener('click', () => {
      playSound('click');
      state.webSearchEnabled = !state.webSearchEnabled;
      searchToggleBtn.classList.toggle('active', state.webSearchEnabled);
    });
  }
}

function addAttachment(fileName) {
  state.pendingAttachments.push(fileName);
  renderAttachments();
}

window.removeAttachment = function(index) {
  state.pendingAttachments.splice(index, 1);
  renderAttachments();
};

function renderAttachments() {
  if (state.pendingAttachments.length === 0) {
    attachmentPreview.innerHTML = '';
    return;
  }
  attachmentPreview.innerHTML = state.pendingAttachments.map((f, i) => `
    <div class="attachment-chip">
      <i class="far fa-file-lines"></i>
      <span>${f}</span>
      <i class="fas fa-times remove-chip" onclick="removeAttachment(${i})"></i>
    </div>
  `).join('');
}

function handleSendPrompt() {
  const query = promptInput.value.trim();
  if (!query || state.isGenerating) return;

  playSound('send');
  state.isGenerating = true;

  // Retrieve or create chat
  let chat = state.chats.find(c => c.id === state.activeChatId);
  if (!chat) {
    createNewChat();
    chat = state.chats[0];
  }

  // Update chat title if first message
  if (chat.messages.length === 0) {
    chat.title = query.length > 32 ? query.substring(0, 32) + '...' : query;
    renderChatHistory();
  }

  // Add User Message
  chat.messages.push({
    role: 'user',
    text: query
  });

  // Clear inputs
  promptInput.value = '';
  promptInput.style.height = 'auto';
  sendPromptBtn.classList.remove('ready');
  state.pendingAttachments = [];
  renderAttachments();

  // Re-render UI
  renderActiveChat();

  // Create Streaming Placeholder
  const aiMessagePlaceholder = {
    role: 'model',
    thinking: state.deepThinkingEnabled ? `Analyzing query, evaluating context across 2M token window, synthesizing structured reasoning...` : null,
    text: ''
  };
  chat.messages.push(aiMessagePlaceholder);
  renderActiveChat();

  // Generate intelligent response based on query
  simulateAiResponse(query, aiMessagePlaceholder, chat);
}

function simulateAiResponse(query, placeholder, chat) {
  const lower = query.toLowerCase();
  let fullResponse = '';

  // Give training credits ONLY IF ASKED
  const isAskingAboutCreators = lower.includes('team') || 
                                lower.includes('trained') || 
                                lower.includes('who made') || 
                                lower.includes('who created') || 
                                lower.includes('who built') ||
                                lower.includes('who are your creators') ||
                                lower.includes('founders') || 
                                lower.includes('creator') || 
                                lower.includes('developer') || 
                                lower.includes('author') ||
                                lower.includes('amay') || 
                                lower.includes('anshuman') || 
                                lower.includes('ankit') || 
                                lower.includes('aaryan');

  if (isAskingAboutCreators) {
    fullResponse = `**Veccna AI** was trained and engineered by the founding team:\n\n### 👥 Core Engineering Team:\n* **Amay Vikram Singh:** Founding Research & Neural Architecture Lead\n* **Anshuman:** Lead Distributed Systems & High-Velocity Telemetry Pipeline\n* **Ankit:** Lead Behavioral AI & Knowledge Graph Specialist\n* **Aaryan:** Lead Adversary Emulation & Autonomous Response Engine\n\n### ⚡ Foundation Specifications:\n* **Model Engine:** Veccna Synapse-X Transformer (17.4 Billion Parameters).\n* **Context Window:** 2,000,000 Native Tokens.\n* **Design Language:** Ergonomic Dark Slate (\`#09090B\`, \`#0F172A\`) to prevent ocular fatigue.`;
  } else if (lower.includes('code') || lower.includes('python') || lower.includes('algorithm') || lower.includes('react') || lower.includes('function')) {
    fullResponse = `Here is an optimized, production-grade implementation of an asynchronous multi-agent coordination pipeline written in Python:\n\n\`\`\`python
import asyncio
from typing import List, Dict, Any

class VeccnaAgent:
    """Autonomous agent node in a distributed swarm."""
    def __init__(self, name: str, role: str):
        self.name = name
        self.role = role

    async def execute_task(self, prompt: str) -> Dict[str, Any]:
        await asyncio.sleep(0.3)  # Simulated async computation
        return {
            "agent": self.name,
            "status": "COMPLETED",
            "model": "Veccna 2.5 Pro",
            "output": f"Synthesized reasoning for: {prompt[:30]}..."
        }

async def main():
    agents = [
        VeccnaAgent("Architect", "Codebase Review"),
        VeccnaAgent("Sentinel", "Security & Zero-Day Guard"),
        VeccnaAgent("Optimizer", "Latency Reduction")
    ]
    results = await asyncio.gather(*(a.execute_task("Process multi-modal tensor") for a in agents))
    for r in results:
        print(f"[{r['agent']}] {r['status']}")

if __name__ == "__main__":
    asyncio.run(main())
\`\`\`\n\n### Key Architectural Features:\n1. **Zero-blocking concurrency** with Python's native \`asyncio\` event loop.\n2. **Typed interfaces** ensuring type safety and resilient inter-agent communication.\n3. **Scalable execution** supporting arbitrary swarm topologies.`;
  } else if (lower.includes('compare') || lower.includes('gemini') || lower.includes('gpt')) {
    fullResponse = `**Veccna AI** is built to deliver a seamless, high-speed generative experience just like Google Gemini, elevated by specialized domain intelligence:\n\n| Capability | Veccna AI Platform | Conventional AI Models |\n| :--- | :--- | :--- |\n| **Design Language** | Ergonomic Dark Slate (\`#09090B\`, \`#0F172A\`) | Harsh pure black (\`#000000\`) or generic light |\n| **Context Window** | **2,000,000 Tokens** (Native) | 128k – 1M Tokens |\n| **Deep Reasoning** | Dynamic Thinking Process Accordion | Hidden or static text |\n| **Multimodal Uploads** | Images, PDFs, Code repositories, Audio | Limited text inputs |\n\nHow else can I assist your workflow today?`;
  } else {
    fullResponse = `I've analyzed your prompt with **${state.currentModel}**.\n\n### Summary & Analysis:\n1. **Context Synthesis:** Your request touches upon foundational principles in modern distributed computing and AI orchestration.\n2. **High-Speed Execution:** Leveraging the Veccna Synapse-X foundation model, inferences are resolved with sub-100ms first-token latency.\n3. **Recommended Next Steps:** Would you like me to generate a concrete implementation, write unit tests, or explore edge-case failure modes?`;
  }

  // Simulate token streaming
  let charIndex = 0;
  const streamInterval = setInterval(() => {
    charIndex += Math.min(18, fullResponse.length - charIndex);
    placeholder.text = fullResponse.substring(0, charIndex);
    renderActiveChat();

    if (charIndex >= fullResponse.length) {
      clearInterval(streamInterval);
      state.isGenerating = false;
      playSound('receive');
    }
  }, 35);
}

// --- Model Selector Dropdown ---
function initModelSelector() {
  modelSelector.addEventListener('click', (e) => {
    e.stopPropagation();
    playSound('click');
    modelDropdown.classList.toggle('open');
  });

  document.addEventListener('click', () => {
    modelDropdown.classList.remove('open');
  });

  document.querySelectorAll('.model-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      playSound('click');
      document.querySelectorAll('.model-option').forEach(o => o.classList.remove('active-model'));
      opt.classList.add('active-model');
      const name = opt.getAttribute('data-model');
      state.currentModel = name;
      selectedModelName.innerText = name;
      modelDropdown.classList.remove('open');
    });
  });
}

// --- Model Training Provenance Modal ---
window.openModelModal = function() {
  playSound('click');
  modelModal.classList.add('open');
};

window.closeModelModal = function() {
  playSound('click');
  modelModal.classList.remove('open');
};

// --- Toast Notifications ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="${type === 'success' ? 'fas fa-check-circle' : 'fas fa-info-circle'}" style="color: ${type === 'success' ? '#10b981' : 'var(--sky-bright)'}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}
window.showToast = showToast;

// --- Authentication Engine (Login & Logout) ---
function initAuth() {
  const avatarBtn = document.getElementById('userAvatarBtn');
  const dropdown = document.getElementById('userProfileDropdown');

  if (avatarBtn && dropdown) {
    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playSound('click');
      dropdown.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !avatarBtn.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });
  }

  renderAuthState();
}

function renderAuthState() {
  const loginBtn = document.getElementById('headerLoginBtn');
  const profileWrapper = document.getElementById('userProfileWrapper');
  const avatarInitials = document.getElementById('userAvatarInitials');
  const dropAvatar = document.getElementById('dropdownAvatarInitials');
  const dropName = document.getElementById('dropdownUserName');
  const dropEmail = document.getElementById('dropdownUserEmail');
  const welcomeGreeting = document.querySelector('.welcome-greeting');

  if (state.user && state.user.isLoggedIn) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (profileWrapper) profileWrapper.style.display = 'block';

    const initials = state.user.initials || getInitials(state.user.name || 'User');
    if (avatarInitials) avatarInitials.innerText = initials;
    if (dropAvatar) dropAvatar.innerText = initials;
    if (dropName) dropName.innerText = state.user.name || 'User';
    if (dropEmail) dropEmail.innerText = state.user.email || '';

    if (welcomeGreeting) {
      const firstName = (state.user.name || 'Amay').split(' ')[0];
      welcomeGreeting.innerHTML = `Hello, ${firstName} <span class="gradient-text">How can Veccna help you today?</span>`;
    }
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-flex';
    if (profileWrapper) profileWrapper.style.display = 'none';

    if (welcomeGreeting) {
      welcomeGreeting.innerHTML = `Welcome to Veccna <span class="gradient-text">How can I help you today?</span>`;
    }
  }
}

function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

window.handleLogout = function() {
  playSound('click');
  const dropdown = document.getElementById('userProfileDropdown');
  if (dropdown) dropdown.classList.remove('open');

  state.user = { isLoggedIn: false };
  localStorage.setItem('veccna_user', JSON.stringify(state.user));
  renderAuthState();
  showToast('You have been signed out of Veccna AI', 'info');
};

window.openAuthModal = function() {
  playSound('click');
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('open');
};

window.closeAuthModal = function() {
  playSound('click');
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('open');
};

window.quickLogin = function(name, email) {
  playSound('receive');
  state.user = {
    isLoggedIn: true,
    name: name,
    email: email,
    initials: getInitials(name),
    tier: 'Veccna Pro 2.5'
  };
  localStorage.setItem('veccna_user', JSON.stringify(state.user));
  renderAuthState();
  closeAuthModal();
  showToast(`Welcome back, ${name}!`, 'success');
};

window.handleEmailAuth = function(event) {
  event.preventDefault();
  const emailInput = document.getElementById('authEmailInput');
  const email = emailInput ? emailInput.value.trim() : 'user@veccna.ai';
  let name = email.split('@')[0];
  name = name.charAt(0).toUpperCase() + name.slice(1);
  quickLogin(name, email);
};

// --- Settings, Activity & Help Modals ---
window.openSettingsModal = function() {
  playSound('click');
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.add('open');
};

window.closeSettingsModal = function() {
  playSound('click');
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.remove('open');
};

window.openActivityModal = function() {
  playSound('click');
  const modal = document.getElementById('activityModal');
  if (modal) {
    const totalCount = document.getElementById('totalPromptsNum');
    if (totalCount) totalCount.innerText = state.chats.length;
    modal.classList.add('open');
  }
};

window.closeActivityModal = function() {
  playSound('click');
  const modal = document.getElementById('activityModal');
  if (modal) modal.classList.remove('open');
};

window.openHelpModal = function() {
  playSound('click');
  const modal = document.getElementById('helpModal');
  if (modal) modal.classList.add('open');
};

window.closeHelpModal = function() {
  playSound('click');
  const modal = document.getElementById('helpModal');
  if (modal) modal.classList.remove('open');
};

// --- Interactive Help & Support Logic ---
window.askInteractiveHelp = function(topic) {
  playSound('click');
  const card = document.getElementById('helpResponseCard');
  const body = document.getElementById('helpResponseBody');
  const title = document.getElementById('helpResponseTitle');
  if (!card || !body) return;

  card.style.display = 'block';

  if (topic.includes('upload')) {
    title.innerHTML = '<i class="fas fa-file-arrow-up" style="color: var(--sky-bright);"></i> File & Code Upload Guide';
    body.innerHTML = `
      <strong>How to attach files:</strong><br>
      1. Click the <strong>[+ Upload]</strong> pill button in the bottom prompt bar.<br>
      2. Select any image, PDF, code file (<code>.py</code>, <code>.js</code>, <code>.json</code>), or text document.<br>
      3. Your file appears as a removable preview tag. Type your instruction and press Enter.<br>
      4. Veccna AI analyzes the contents across its 2M token context window.
    `;
  } else if (topic.includes('Thinking')) {
    title.innerHTML = '<i class="fas fa-brain" style="color: #a855f7;"></i> Deep Thinking Mode';
    body.innerHTML = `
      <strong>About Deep Thinking:</strong><br>
      • Deep Thinking gives Veccna AI dedicated computation time to evaluate multi-step reasoning before outputting answers.<br>
      • You can toggle it at any time using the <strong>[Deep Think]</strong> pill in the bottom bar.<br>
      • An expandable <em>"Thinking Process"</em> accordion will appear above the answer so you can inspect the step-by-step logic.
    `;
  } else if (topic.includes('models')) {
    title.innerHTML = '<i class="fas fa-sparkles" style="color: #38bdf8;"></i> Model Catalog';
    body.innerHTML = `
      <strong>Available Models in Selector:</strong><br>
      • <strong>Veccna 2.5 Pro (Thinking):</strong> Best for complex reasoning, system architecture, code, and math.<br>
      • <strong>Veccna 2.5 Flash:</strong> Ultra-fast response speeds for everyday general queries.<br>
      • <strong>Veccna Deep Research:</strong> Autonomous multi-step web queries and comprehensive reports.
    `;
  } else if (topic.includes('account') || topic.includes('session')) {
    title.innerHTML = '<i class="far fa-user" style="color: #10b981;"></i> Account & Profile';
    body.innerHTML = `
      <strong>Managing your account:</strong><br>
      • Click your avatar in the top-right corner to open your profile dropdown.<br>
      • View your active tier (<strong>Veccna Pro 2.5</strong>) and session email.<br>
      • Click <strong>[Sign out]</strong> to end your session, or use the <strong>[Sign in]</strong> modal to switch accounts anytime.
    `;
  }
};

window.submitUserFeedback = function() {
  const input = document.getElementById('interactiveHelpInput');
  const text = input ? input.value.trim() : '';
  if (!text) {
    showToast('Please type your feedback or question first.', 'info');
    return;
  }
  playSound('receive');
  showToast('Feedback delivered! Thank you for helping us improve Veccna AI.', 'success');
  input.value = '';
  const card = document.getElementById('helpResponseCard');
  if (card) {
    card.style.display = 'block';
    document.getElementById('helpResponseTitle').innerHTML = '<i class="fas fa-check-circle" style="color: #10b981;"></i> Feedback Acknowledged';
    document.getElementById('helpResponseBody').innerHTML = `
      <strong>Feedback received:</strong> <em>"${text}"</em><br><br>
      Our core engineering team continuously refines the Veccna platform based on direct user interactions.
    `;
  }
};

window.submitInteractiveQuestion = function() {
  const input = document.getElementById('interactiveHelpInput');
  const text = input ? input.value.trim() : '';
  if (!text) {
    showToast('Please enter a question to ask the assistant.', 'info');
    return;
  }
  closeHelpModal();
  if (promptInput) {
    promptInput.value = text;
    promptInput.dispatchEvent(new Event('input'));
    handleSendPrompt();
  }
};

window.toggleSoundSetting = function(enabled) {
  state.soundEnabled = enabled;
  if (enabled) playSound('click');
  showToast(`Interface sounds ${enabled ? 'enabled' : 'muted'}`, 'info');
};

window.toggleThinkingSetting = function(enabled) {
  state.deepThinkingEnabled = enabled;
  const btn = document.getElementById('thinkToggleBtn');
  if (btn) btn.classList.toggle('active', enabled);
  showToast(`Deep thinking ${enabled ? 'enabled' : 'disabled'} by default`, 'info');
};

window.toggleSearchSetting = function(enabled) {
  state.webSearchEnabled = enabled;
  const btn = document.getElementById('searchToggleBtn');
  if (btn) btn.classList.toggle('active', enabled);
  showToast(`Web grounding ${enabled ? 'enabled' : 'disabled'} by default`, 'info');
};

window.clearAllChats = function() {
  if (confirm('Are you sure you want to delete all conversations? This cannot be undone.')) {
    state.chats = [];
    createNewChat();
    closeSettingsModal();
    showToast('All chat history cleared', 'info');
  }
};

// Global Keyboard Shortcuts (Cmd/Ctrl + K, Cmd/Ctrl + B)
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    createNewChat();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
    e.preventDefault();
    if (sidebar) sidebar.classList.toggle('collapsed');
  }
});

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initPromptControls();
  initModelSelector();
  initAuth();
  renderActiveChat();
});
