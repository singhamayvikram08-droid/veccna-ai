import { marked } from 'marked';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * ==============================================================================
 * VECCNA AI — GEMINI-STYLE AI PLATFORM
 * Trained by: Amay, Anshuman, Ankit & Aaryan
 * ==============================================================================
 */

// Configure marked renderer with dark slate styling and copy button
const customMarkdownRenderer = new marked.Renderer();

customMarkdownRenderer.code = function({ text, lang }) {
  const language = (lang || 'code').trim();
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `
    <div class="code-block-wrapper">
      <div class="code-header">
        <span>${language}</span>
        <button class="copy-code-btn" onclick="copyCodeSnippet(this)">
          <i class="far fa-copy"></i> Copy
        </button>
      </div>
      <pre class="code-pre"><code class="language-${language}">${escaped}</code></pre>
    </div>
  `;
};

marked.setOptions({
  renderer: customMarkdownRenderer,
  gfm: true,
  breaks: true
});

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

const MODEL_MAPPING = {
  'Veccna 2.5 Pro (Thinking)': 'openrouter/free',
  'Veccna 2.5 Flash': 'openrouter/free',
  'Veccna Deep Research': 'openrouter/free'
};

const DEFAULT_OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

function getActiveApiKey() {
  const customKey = localStorage.getItem('veccna_openrouter_key');
  if (customKey && customKey.trim().startsWith('sk-or-v1-')) {
    return customKey.trim();
  }
  return DEFAULT_OPENROUTER_KEY;
}

const state = {
  user: initialUser,
  currentModel: 'Veccna 2.5 Pro (Thinking)',
  activeChatId: 'chat-1',
  openRouterKey: getActiveApiKey(),
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

// --- Markdown, LaTeX & Code Formatter ---
function formatMarkdown(text) {
  if (!text) return '';

  // Clean out any stray canned greeting snippets if generated
  let cleanText = text
    .replace(/💡\s*Quick Example[\s\S]*?```[a-z]*\s*def greet[\s\S]*?```/gi, '')
    .replace(/```[a-z]*\s*def greet\(name\):[\s\S]*?```/gi, '')
    .replace(/def greet\(name\):[\s\S]*?print\(greet\([^)]*\)\)/gi, '')
    .replace(/💡\s*Quick Example/gi, '');

  // Render LaTeX math formulas via KaTeX (supporting both \[ \] / $$ $$ for display, and \( \) / $ $ for inline)
  const katexRenderer = katex || (typeof window !== 'undefined' ? window.katex : null);
  if (katexRenderer) {
    // Display Math: \[ ... \]
    cleanText = cleanText.replace(/\\\[([\s\S]+?)\\\]/g, (match, formula) => {
      try {
        return katexRenderer.renderToString(formula.trim(), { displayMode: true, throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    // Display Math: $$ ... $$
    cleanText = cleanText.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
      try {
        return katexRenderer.renderToString(formula.trim(), { displayMode: true, throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    // Inline Math: \( ... \)
    cleanText = cleanText.replace(/\\\(([\s\S]+?)\\\)/g, (match, formula) => {
      try {
        return katexRenderer.renderToString(formula.trim(), { displayMode: false, throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    // Inline Math: $ ... $
    cleanText = cleanText.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
      try {
        return katexRenderer.renderToString(formula.trim(), { displayMode: false, throwOnError: false });
      } catch (e) {
        return match;
      }
    });
  }

  try {
    return marked.parse(cleanText);
  } catch (e) {
    console.error('Markdown parsing error:', e);
    return cleanText;
  }
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
    <div class="chat-history-item ${chat.id === state.activeChatId ? 'active' : ''}" onclick="selectChat('${chat.id}')" title="${chat.title}">
      <i class="far fa-message"></i>
      <span class="chat-title-text">${chat.title}</span>
      <div class="chat-item-actions">
        <button class="chat-item-btn" onclick="renameChatPrompt('${chat.id}', event)" title="Rename conversation">
          <i class="far fa-pen-to-square"></i>
        </button>
        <button class="chat-item-btn delete-btn" onclick="deleteChatPrompt('${chat.id}', event)" title="Delete conversation">
          <i class="far fa-trash-can"></i>
        </button>
      </div>
    </div>
  `).join('');
}

window.renameChatPrompt = function(chatId, e) {
  if (e) e.stopPropagation();
  playSound('click');
  const chat = state.chats.find(c => c.id === chatId);
  if (!chat) return;
  const newTitle = prompt('Rename conversation:', chat.title);
  if (newTitle && newTitle.trim()) {
    chat.title = newTitle.trim();
    renderChatHistory();
    showToast('Conversation renamed.', 'success');
  }
};

window.deleteChatPrompt = function(chatId, e) {
  if (e) e.stopPropagation();
  playSound('click');
  if (state.chats.length <= 1) {
    const chat = state.chats[0];
    chat.title = 'New conversation';
    chat.messages = [];
    renderChatHistory();
    renderActiveChat();
    showToast('Chat cleared.', 'info');
    return;
  }

  const idx = state.chats.findIndex(c => c.id === chatId);
  if (idx !== -1) {
    state.chats.splice(idx, 1);
    if (state.activeChatId === chatId) {
      state.activeChatId = state.chats[0].id;
    }
    renderChatHistory();
    renderActiveChat();
    showToast('Conversation deleted.', 'info');
  }
};

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
    chatScrollView.classList.add('no-scroll');
    chatScrollView.scrollTop = 0;
  } else {
    welcomeHero.style.display = 'none';
    messagesContainer.style.display = 'flex';
    messagesContainer.innerHTML = currentChat.messages.map(msg => renderMessageRow(msg)).join('');
    chatScrollView.classList.remove('no-scroll');
    scrollToBottom();
  }
}

function renderMessageRow(msg) {
  const msgId = msg.id || ('msg-' + Math.random().toString(36).substring(2, 9));
  msg.id = msgId;

  if (msg.role === 'user') {
    const attachmentsHtml = msg.attachments && msg.attachments.length > 0 ? `
      <div class="message-attachments-container">
        ${msg.attachments.map(a => a.isImage && a.dataUrl ? `
          <img src="${a.dataUrl}" class="msg-attachment-img" alt="${a.name}" onclick="window.open('${a.dataUrl}')">
        ` : `
          <div class="msg-attachment-file">
            <i class="far fa-file-lines"></i>
            <span>${a.name}</span>
          </div>
        `).join('')}
      </div>
    ` : '';

    return `
      <div class="message-row user-row" id="${msgId}">
        <div class="message-avatar user-avatar-icon">${state.user.initials || 'AV'}</div>
        <div class="message-body">
          ${attachmentsHtml}
          <div class="message-content">${formatMarkdown(msg.text)}</div>
          <div class="user-msg-actions">
            <button class="msg-act-btn" onclick="editUserPrompt('${msgId}')" title="Edit Prompt"><i class="far fa-pen-to-square"></i></button>
            <button class="msg-act-btn" onclick="copyMessageText(this)" title="Copy Prompt"><i class="far fa-copy"></i></button>
          </div>
        </div>
      </div>
    `;
  } else {
    const formattedHtml = msg.text ? formatMarkdown(msg.text) : (msg.isThinking ? `
      <div class="thinking-shimmer-bar">
        <div class="thinking-dots"><span></span><span></span><span></span></div>
        <span>Thinking...</span>
      </div>
    ` : '<span class="typing-cursor"></span>');

    return `
      <div class="message-row ai-row" id="${msgId}">
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
            <div class="thinking-accordion ${msg.isOpen ? 'open' : ''}" id="${msgId}-think">
              <div class="thinking-header ${msg.isThinking ? 'thinking-active' : ''}" onclick="toggleThinkingAccordion(this)">
                <span>
                  <i class="fas fa-brain ${msg.isThinking ? 'fa-pulse' : ''}"></i> 
                  <span class="think-label-text">${msg.isThinking ? 'Thinking...' : 'Thinking Process'}</span>
                </span>
                <i class="fas fa-chevron-down"></i>
              </div>
              <div class="thinking-content">
                ${msg.thinking}
              </div>
            </div>
          ` : ''}

          <div class="message-content" id="${msgId}-content">${formattedHtml}</div>

          <div class="message-actions">
            <button class="msg-act-btn" onclick="copyMessageText(this)" title="Copy Response"><i class="far fa-copy"></i></button>
            <button class="msg-act-btn" onclick="toggleFeedback(this, 'like')" title="Good Response"><i class="far fa-thumbs-up"></i></button>
            <button class="msg-act-btn" onclick="toggleFeedback(this, 'dislike')" title="Bad Response"><i class="far fa-thumbs-down"></i></button>
            <button class="msg-act-btn" onclick="regenerateLastResponse()" title="Regenerate Response"><i class="fas fa-rotate-right"></i></button>
            <button class="msg-act-btn" onclick="openShareModal()" title="Share / Export Chat"><i class="fas fa-share-nodes"></i></button>
          </div>
        </div>
      </div>
    `;
  }
}

window.toggleThinkingAccordion = function(header) {
  playSound('click');
  const accordion = header.closest('.thinking-accordion');
  if (accordion) {
    accordion.classList.toggle('open');
  }
};

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

let activeAbortController = null;
let localStreamInterval = null;

function setGeneratingUI(isGen) {
  state.isGenerating = isGen;
  if (isGen) {
    sendPromptBtn.innerHTML = '<i class="fas fa-stop"></i>';
    sendPromptBtn.classList.add('generating');
    sendPromptBtn.classList.add('ready');
    sendPromptBtn.title = 'Stop generating (Cancel)';
  } else {
    sendPromptBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    sendPromptBtn.classList.remove('generating');
    if (promptInput && promptInput.value.trim().length === 0 && (!state.pendingAttachments || state.pendingAttachments.length === 0)) {
      sendPromptBtn.classList.remove('ready');
    }
    sendPromptBtn.title = 'Send Prompt';
    activeAbortController = null;
    if (localStreamInterval) {
      clearInterval(localStreamInterval);
      localStreamInterval = null;
    }
  }
}

window.stopGenerating = function() {
  if (localStreamInterval) {
    clearInterval(localStreamInterval);
    localStreamInterval = null;
  }
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
  setGeneratingUI(false);
  showToast('Response generation stopped.', 'info');
};

function scrollToBottom() {
  setTimeout(() => {
    chatScrollView.scrollTop = chatScrollView.scrollHeight;
  }, 30);
}

function maybeAutoScroll() {
  const distFromBottom = chatScrollView.scrollHeight - chatScrollView.scrollTop - chatScrollView.clientHeight;
  if (distFromBottom < 160) {
    chatScrollView.scrollTop = chatScrollView.scrollHeight;
  }
}

// --- Prompt Submission & AI Simulation ---
function initPromptControls() {
  // Auto-expand textarea
  promptInput.addEventListener('input', () => {
    promptInput.style.height = 'auto';
    promptInput.style.height = Math.min(promptInput.scrollHeight, 180) + 'px';
    if (promptInput.value.trim().length > 0 || state.pendingAttachments.length > 0) {
      sendPromptBtn.classList.add('ready');
    } else if (!state.isGenerating) {
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
    if (state.isGenerating) {
      window.stopGenerating();
    } else {
      handleSendPrompt();
    }
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
        for (const file of e.target.files) {
          processUploadedFile(file);
        }
        fileInput.value = '';
      }
    });
  }

  initSpeechRecognition();
  initDragAndDrop();
  initScrollToBottom();
}

function processUploadedFile(file) {
  playSound('click');
  const isImage = file.type.startsWith('image/');
  const reader = new FileReader();

  if (isImage) {
    reader.onload = (e) => {
      state.pendingAttachments.push({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: e.target.result,
        isImage: true
      });
      renderAttachments();
      sendPromptBtn.classList.add('ready');
    };
    reader.readAsDataURL(file);
  } else {
    reader.onload = (e) => {
      state.pendingAttachments.push({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: null,
        textContent: typeof e.target.result === 'string' ? e.target.result : '',
        isImage: false
      });
      renderAttachments();
      sendPromptBtn.classList.add('ready');
    };
    reader.readAsText(file);
  }
}

window.removeAttachment = function(index) {
  state.pendingAttachments.splice(index, 1);
  renderAttachments();
  if (state.pendingAttachments.length === 0 && (!promptInput.value || promptInput.value.trim().length === 0)) {
    sendPromptBtn.classList.remove('ready');
  }
};

function renderAttachments() {
  if (state.pendingAttachments.length === 0) {
    attachmentPreview.innerHTML = '';
    return;
  }
  attachmentPreview.innerHTML = state.pendingAttachments.map((f, i) => `
    <div class="attachment-chip">
      ${f.isImage && f.dataUrl ? `<img src="${f.dataUrl}" style="width: 20px; height: 20px; border-radius: 4px; object-fit: cover;">` : '<i class="far fa-file-lines"></i>'}
      <span>${f.name}</span>
      <i class="fas fa-times remove-chip" onclick="removeAttachment(${i})"></i>
    </div>
  `).join('');
}

// --- Voice Recognition (Web Speech API) ---
let speechRecognition = null;
let isListening = false;
function initSpeechRecognition() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const voiceBtn = document.getElementById('voiceInputBtn');
  if (!voiceBtn) return;

  if (!SpeechRec) {
    voiceBtn.addEventListener('click', () => {
      showToast('Speech recognition is not supported in this browser.', 'error');
    });
    return;
  }

  speechRecognition = new SpeechRec();
  speechRecognition.continuous = false;
  speechRecognition.interimResults = true;
  speechRecognition.lang = 'en-US';

  speechRecognition.onstart = () => {
    isListening = true;
    voiceBtn.classList.add('listening');
    voiceBtn.title = 'Listening... Speak your prompt';
    playSound('send');
    showToast('Voice mode active: listening...', 'info');
  };

  speechRecognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    if (transcript.trim()) {
      promptInput.value = transcript;
      promptInput.dispatchEvent(new Event('input'));
    }
  };

  speechRecognition.onerror = (e) => {
    isListening = false;
    voiceBtn.classList.remove('listening');
    voiceBtn.title = 'Voice Input (Speech-to-Text)';
    if (e.error !== 'no-speech') {
      showToast(`Microphone issue: ${e.error}`, 'error');
    }
  };

  speechRecognition.onend = () => {
    isListening = false;
    voiceBtn.classList.remove('listening');
    voiceBtn.title = 'Voice Input (Speech-to-Text)';
  };

  voiceBtn.addEventListener('click', () => {
    if (isListening) {
      speechRecognition.stop();
    } else {
      try {
        speechRecognition.start();
      } catch (err) {
        console.warn('Speech rec start error:', err);
      }
    }
  });
}

// --- Drag & Drop Files ---
function initDragAndDrop() {
  const overlay = document.getElementById('dragDropOverlay');
  let dragCounter = 0;

  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    if (overlay) overlay.classList.add('active');
  });

  window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0 && overlay) {
      dragCounter = 0;
      overlay.classList.remove('active');
    }
  });

  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    if (overlay) overlay.classList.remove('active');
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (const file of e.dataTransfer.files) {
        processUploadedFile(file);
      }
    }
  });
}

// --- Floating Scroll to Bottom ---
function initScrollToBottom() {
  const btn = document.getElementById('scrollBottomBtn');
  if (!btn || !chatScrollView) return;

  chatScrollView.addEventListener('scroll', () => {
    const distFromBottom = chatScrollView.scrollHeight - chatScrollView.scrollTop - chatScrollView.clientHeight;
    if (distFromBottom > 160) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });

  btn.addEventListener('click', () => {
    playSound('click');
    chatScrollView.scrollTo({
      top: chatScrollView.scrollHeight,
      behavior: 'smooth'
    });
  });
}

// --- Edit User Prompt ---
window.editUserPrompt = function(msgId) {
  playSound('click');
  const chat = state.chats.find(c => c.id === state.activeChatId);
  if (!chat) return;
  const msg = chat.messages.find(m => m.id === msgId);
  if (msg && promptInput) {
    promptInput.value = msg.text || '';
    promptInput.dispatchEvent(new Event('input'));
    promptInput.focus();
    showToast('Prompt loaded into editor.', 'info');
  }
};

// --- Feedback (Thumbs Up / Down) ---
window.toggleFeedback = function(btn, type) {
  playSound('click');
  const isLike = type === 'like';
  const actions = btn.closest('.message-actions');
  const likeBtn = actions ? actions.querySelector('.fa-thumbs-up')?.closest('.msg-act-btn') : null;
  const dislikeBtn = actions ? actions.querySelector('.fa-thumbs-down')?.closest('.msg-act-btn') : null;

  if (isLike) {
    if (btn.classList.contains('active-like')) {
      btn.classList.remove('active-like');
    } else {
      btn.classList.add('active-like');
      if (dislikeBtn) dislikeBtn.classList.remove('active-dislike');
      showToast('Thank you for your feedback!', 'success');
    }
  } else {
    if (btn.classList.contains('active-dislike')) {
      btn.classList.remove('active-dislike');
    } else {
      btn.classList.add('active-dislike');
      if (likeBtn) likeBtn.classList.remove('active-like');
      showToast('Feedback recorded. We will refine our model.', 'info');
    }
  }
};

// --- Regenerate Last Response ---
window.regenerateLastResponse = function() {
  if (state.isGenerating) return;
  const chat = state.chats.find(c => c.id === state.activeChatId);
  if (!chat || chat.messages.length < 2) return;

  // Find last user message
  let lastUserMsgIndex = -1;
  for (let i = chat.messages.length - 1; i >= 0; i--) {
    if (chat.messages[i].role === 'user') {
      lastUserMsgIndex = i;
      break;
    }
  }
  if (lastUserMsgIndex === -1) return;

  const lastUserMsg = chat.messages[lastUserMsgIndex];
  // Remove following messages
  chat.messages = chat.messages.slice(0, lastUserMsgIndex + 1);

  // New placeholder
  const msgId = `msg-${Date.now()}`;
  const aiMessagePlaceholder = {
    id: msgId,
    role: 'model',
    thinking: state.deepThinkingEnabled ? 'Re-evaluating context & synthesizing alternative perspective...' : null,
    isThinking: state.deepThinkingEnabled,
    isOpen: false,
    text: ''
  };
  chat.messages.push(aiMessagePlaceholder);
  renderActiveChat();

  setGeneratingUI(true);
  generateAiResponse(lastUserMsg.text, aiMessagePlaceholder, chat);
};

// --- Share & Export Modals ---
window.openShareModal = function() {
  playSound('click');
  const modal = document.getElementById('shareModal');
  const input = document.getElementById('shareUrlInput');
  if (input) input.value = `${window.location.origin}/#share-${state.activeChatId}`;
  if (modal) modal.classList.add('open');
};

window.closeShareModal = function() {
  playSound('click');
  const modal = document.getElementById('shareModal');
  if (modal) modal.classList.remove('open');
};

window.copyShareLink = function() {
  const input = document.getElementById('shareUrlInput');
  if (input) {
    navigator.clipboard.writeText(input.value).then(() => {
      showToast('Share link copied to clipboard!', 'success');
      playSound('click');
    });
  }
};

window.exportChatMarkdown = function() {
  const chat = state.chats.find(c => c.id === state.activeChatId);
  if (!chat || chat.messages.length === 0) {
    showToast('No messages to export.', 'info');
    return;
  }
  let md = `# ${chat.title}\n*Exported from Veccna AI*\n\n---\n\n`;
  for (const m of chat.messages) {
    const author = m.role === 'user' ? state.user.name : 'Veccna AI';
    md += `### ${author}\n\n${m.text || ''}\n\n`;
  }
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${chat.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported conversation as Markdown (.md)', 'success');
  closeShareModal();
};

window.exportChatJson = function() {
  const chat = state.chats.find(c => c.id === state.activeChatId);
  if (!chat) return;
  const jsonStr = JSON.stringify(chat, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${chat.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported conversation as JSON (.json)', 'success');
  closeShareModal();
};

function handleSendPrompt() {
  const query = promptInput.value.trim();
  const hasAttachments = state.pendingAttachments && state.pendingAttachments.length > 0;
  if ((!query && !hasAttachments) || state.isGenerating) return;

  playSound('send');
  setGeneratingUI(true);

  // Retrieve or create chat
  let chat = state.chats.find(c => c.id === state.activeChatId);
  if (!chat) {
    createNewChat();
    chat = state.chats[0];
  }

  // Update chat title if first message
  if (chat.messages.length === 0) {
    const titleText = query || (state.pendingAttachments[0]?.name || 'New conversation');
    chat.title = titleText.length > 32 ? titleText.substring(0, 32) + '...' : titleText;
    renderChatHistory();
  }

  // Add User Message with cloned pending attachments
  const userMsgId = `msg-user-${Date.now()}`;
  chat.messages.push({
    id: userMsgId,
    role: 'user',
    text: query,
    attachments: [...state.pendingAttachments]
  });

  // Clear inputs
  promptInput.value = '';
  promptInput.style.height = 'auto';
  state.pendingAttachments = [];
  renderAttachments();

  // Create Streaming AI Placeholder
  const msgId = `msg-${Date.now()}`;
  const aiMessagePlaceholder = {
    id: msgId,
    role: 'model',
    thinking: state.deepThinkingEnabled ? 'Analyzing query, evaluating cognitive context...' : null,
    isThinking: state.deepThinkingEnabled,
    isOpen: false, // Unexpanded by default
    text: ''
  };
  chat.messages.push(aiMessagePlaceholder);
  renderActiveChat();

  // Generate intelligent response via live OpenRouter API
  generateAiResponse(query, aiMessagePlaceholder, chat);
}

function isAskingAboutBotCreators(query) {
  const q = (query || '').toLowerCase().trim();
  return (
    /\b(who\s+(created|made|built|developed|trained|engineered)\s+(you|veccna))\b/i.test(q) ||
    /\b(who\s+are\s+(your|the)\s+(creators|developers|founders|engineers|authors))\b/i.test(q) ||
    /\b(your\s+(creators|founders|engineering team|developers))\b/i.test(q) ||
    /\b(who\s+is\s+your\s+(creator|developer|author|maker))\b/i.test(q) ||
    /\b(tell\s+me\s+about\s+(the\s+)?(creators|founders|team)\s+(of\s+veccna|behind\s+veccna))\b/i.test(q) ||
    /\b(who\s+trained\s+veccna)\b/i.test(q)
  );
}

async function generateAiResponse(query, placeholder, chat) {
  // Dual-Layer Attribution: Disclose training credits ONLY if explicitly asked about Veccna creators
  if (isAskingAboutBotCreators(query)) {
    placeholder.thinking = state.deepThinkingEnabled ? 'Retrieving neural model lineage & engineering provenance records...' : null;
    const fullResponse = `**Veccna AI** was trained and engineered by the founding team:\n\n### 👥 Core Engineering Team:\n* **Amay Vikram Singh:** Founding Research & Neural Architecture Lead\n* **Anshuman:** Lead Distributed Systems & High-Velocity Telemetry Pipeline\n* **Ankit:** Lead Behavioral AI & Knowledge Graph Specialist\n* **Aaryan:** Lead Adversary Emulation & Autonomous Response Engine\n\n### ⚡ Foundation Specifications:\n* **Model Engine:** Veccna Synapse-X Transformer (17.4 Billion Parameters).\n* **Architecture:** Multi-Stage Attention with Low-Rank Adaptation & Direct Preference Optimization (DPO).\n* **Design Language:** Ergonomic Dark Slate (\`#09090B\`, \`#0F172A\`) to prevent ocular fatigue.`;
    streamLocalText(fullResponse, placeholder);
    return;
  }

  let apiKey = state.openRouterKey || DEFAULT_OPENROUTER_KEY;
  const requestedModel = MODEL_MAPPING[state.currentModel] || 'openrouter/free';

  const systemPrompt = `You are Veccna AI, an intelligent, helpful, and highly articulate generative AI assistant modeled after Google Gemini and ChatGPT.
You provide clear, comprehensive, well-structured, and insightful answers with markdown formatting (bullet points, bold text, code blocks with syntax highlighting and inline explanations, headers, comparison tables, and LaTeX math formatting like $a^2 + b^2 = c^2$ or display math $$...$$) whenever appropriate.
When greeted with simple conversational greetings (e.g., "hi", "hello", "hey"), reply warmly, naturally, and concisely without dumping capability lists or canned code snippets like "def greet()".
For educational, conceptual, coding, architecture, and analytical queries, provide thorough, high-quality, step-by-step explanations, code examples with inline comments, and time/space complexity when relevant.
Attribution Rule: If and ONLY if the user explicitly asks who created, built, trained, or engineered you, state that you were trained and developed by Amay Vikram Singh, Anshuman, Ankit, and Aaryan. Otherwise, do NOT mention the training team unprompted.`;

  const messagesPayload = [
    { role: 'system', content: systemPrompt }
  ];

  // Include recent conversation context (last 6 messages)
  const history = chat.messages.slice(0, -2);
  for (const m of history.slice(-6)) {
    if (m.text) {
      messagesPayload.push({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.text
      });
    }
  }

  // Handle current user query and any attachments
  const userMsg = chat.messages[chat.messages.length - 2];
  let promptText = query;
  if (userMsg && userMsg.attachments && userMsg.attachments.length > 0) {
    const textAttachments = userMsg.attachments.filter(a => !a.isImage && a.textContent);
    if (textAttachments.length > 0) {
      const docsContext = textAttachments.map(a => `[Attached Document: ${a.name}]\n${a.textContent}`).join('\n\n');
      promptText = `${docsContext}\n\n${query || 'Please analyze the attached document(s).'}`;
    }
  }

  if (userMsg && userMsg.attachments && userMsg.attachments.some(a => a.dataUrl && a.type && a.type.startsWith('image/'))) {
    const contentParts = [{ type: 'text', text: promptText || 'Please analyze this image.' }];
    for (const a of userMsg.attachments) {
      if (a.dataUrl && a.type && a.type.startsWith('image/')) {
        contentParts.push({
          type: 'image_url',
          image_url: { url: a.dataUrl }
        });
      }
    }
    messagesPayload.push({ role: 'user', content: contentParts });
  } else {
    messagesPayload.push({ role: 'user', content: promptText || 'Hello' });
  }

  const msgId = placeholder.id;
  function getMsgElements() {
    return {
      thinkAcc: document.getElementById(`${msgId}-think`),
      thinkContent: document.querySelector(`#${msgId}-think .thinking-content`),
      thinkLabel: document.querySelector(`#${msgId}-think .think-label-text`),
      thinkHeader: document.querySelector(`#${msgId}-think .thinking-header`),
      thinkIcon: document.querySelector(`#${msgId}-think .fa-brain`),
      contentElem: document.getElementById(`${msgId}-content`)
    };
  }

  // Multi-tier candidate models for zero downtime
  const modelsToAttempt = Array.from(new Set([
    requestedModel,
    'openrouter/free',
    'nvidia/nemotron-3.5-lightning:free',
    'liquid/lfm-3-1.7b:free'
  ]));

  let response = null;
  activeAbortController = new AbortController();

  for (const m of modelsToAttempt) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin || 'http://localhost:3002',
          'X-Title': 'Veccna AI'
        },
        body: JSON.stringify({
          model: m,
          messages: messagesPayload,
          stream: true
        }),
        signal: activeAbortController.signal
      });

      if (res.ok) {
        response = res;
        break;
      } else if (res.status === 401 && apiKey !== DEFAULT_OPENROUTER_KEY && DEFAULT_OPENROUTER_KEY) {
        console.warn('Custom API key unauthorized (401), falling back to default key...');
        apiKey = DEFAULT_OPENROUTER_KEY;
        state.openRouterKey = DEFAULT_OPENROUTER_KEY;
        const retryRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin || 'http://localhost:3002',
            'X-Title': 'Veccna AI'
          },
          body: JSON.stringify({
            model: m,
            messages: messagesPayload,
            stream: true
          }),
          signal: activeAbortController.signal
        });
        if (retryRes.ok) {
          response = retryRes;
          break;
        }
      } else {
        console.warn(`Model ${m} returned status ${res.status}, trying fallback model...`);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Stream request aborted by user');
        setGeneratingUI(false);
        placeholder.isThinking = false;
        return;
      }
      console.warn(`Model ${m} network error:`, err);
    }
  }

  if (!response || !response.ok) {
    console.warn('All live API model attempts failed or offline, using intelligent synthesis.');
    fallbackSimulate(query, placeholder, chat);
    return;
  }

  try {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedText = '';
    let accumulatedThinking = '';
    let animFramePending = false;

    function applyTargetedUpdate() {
      let el = getMsgElements();

      if (accumulatedThinking) {
        placeholder.thinking = accumulatedThinking;
        let thinkAcc = el.thinkAcc;
        if (!thinkAcc && el.contentElem) {
          const accDiv = document.createElement('div');
          accDiv.className = 'thinking-accordion';
          accDiv.id = `${msgId}-think`;
          accDiv.innerHTML = `
            <div class="thinking-header thinking-active" onclick="toggleThinkingAccordion(this)">
              <span>
                <i class="fas fa-brain fa-pulse"></i> 
                <span class="think-label-text">Thinking...</span>
              </span>
              <i class="fas fa-chevron-down"></i>
            </div>
            <div class="thinking-content"></div>
          `;
          el.contentElem.parentNode.insertBefore(accDiv, el.contentElem);
          thinkAcc = accDiv;
          el = getMsgElements();
        }
        if (thinkAcc && state.deepThinkingEnabled) {
          thinkAcc.style.display = 'block';
        }
        if (el.thinkContent) {
          el.thinkContent.innerText = accumulatedThinking;
        }
        if (placeholder.isThinking && el.thinkLabel) {
          el.thinkLabel.innerText = 'Thinking...';
        }
      }

      if (accumulatedText) {
        if (placeholder.isThinking) {
          placeholder.isThinking = false;
          if (el.thinkLabel) el.thinkLabel.innerText = 'Thinking Process';
          if (el.thinkHeader) el.thinkHeader.classList.remove('thinking-active');
          if (el.thinkIcon) el.thinkIcon.classList.remove('fa-pulse');
        }
        // If no reasoning tokens were generated at all, hide empty thinking box
        if (!accumulatedThinking && el.thinkAcc) {
          el.thinkAcc.style.display = 'none';
        }
        placeholder.text = accumulatedText;
        if (el.contentElem) {
          el.contentElem.innerHTML = formatMarkdown(accumulatedText);
        }
      }

      scrollToBottom();
      animFramePending = false;
    }

    function requestTargetedUpdate() {
      if (!animFramePending) {
        animFramePending = true;
        requestAnimationFrame(applyTargetedUpdate);
      }
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.reasoning) {
              accumulatedThinking += delta.reasoning;
              requestTargetedUpdate();
            }
            if (delta?.content) {
              accumulatedText += delta.content;
              requestTargetedUpdate();
            }
          } catch (e) {}
        }
      }
    }

    // Final paint ensure
    applyTargetedUpdate();

    // If content was empty but reasoning had text, promote reasoning to final content
    if (!accumulatedText.trim()) {
      if (accumulatedThinking.trim()) {
        accumulatedText = accumulatedThinking;
        placeholder.text = accumulatedText;
        placeholder.thinking = null;
        const el = getMsgElements();
        if (el.thinkAcc) el.thinkAcc.style.display = 'none';
        if (el.contentElem) el.contentElem.innerHTML = formatMarkdown(accumulatedText);
      } else {
        fallbackSimulate(query, placeholder, chat);
        return;
      }
    }

    placeholder.isThinking = false;
    const finalEl = getMsgElements();
    if (finalEl.thinkHeader) finalEl.thinkHeader.classList.remove('thinking-active');
    if (finalEl.thinkIcon) finalEl.thinkIcon.classList.remove('fa-pulse');
    if (finalEl.thinkLabel) finalEl.thinkLabel.innerText = 'Thinking Process';
    if (!accumulatedThinking && finalEl.thinkAcc) finalEl.thinkAcc.style.display = 'none';

    setGeneratingUI(false);
    playSound('receive');
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Stream cancelled by user');
      setGeneratingUI(false);
      placeholder.isThinking = false;
      return;
    }
    console.warn('Live API request failed, falling back:', err);
    fallbackSimulate(query, placeholder, chat);
  }
}

function streamLocalText(fullResponse, placeholder) {
  const msgId = placeholder.id;
  let charIndex = 0;
  placeholder.isThinking = false;

  const thinkHeader = document.querySelector(`#${msgId}-think .thinking-header`);
  if (thinkHeader) {
    thinkHeader.classList.remove('thinking-active');
    const label = thinkHeader.querySelector('.think-label-text');
    if (label) label.innerText = 'Thinking Process';
    const icon = thinkHeader.querySelector('.fa-brain');
    if (icon) icon.classList.remove('fa-pulse');
  }

  const contentElem = document.getElementById(`${msgId}-content`);

  if (localStreamInterval) clearInterval(localStreamInterval);
  localStreamInterval = setInterval(() => {
    charIndex += Math.min(22, fullResponse.length - charIndex);
    const slice = fullResponse.substring(0, charIndex);
    placeholder.text = slice;

    if (contentElem) {
      contentElem.innerHTML = formatMarkdown(slice);
      scrollToBottom();
    }

    if (charIndex >= fullResponse.length) {
      clearInterval(localStreamInterval);
      localStreamInterval = null;
      setGeneratingUI(false);
      playSound('receive');
    }
  }, 25);
}

function fallbackSimulate(query, placeholder, chat) {
  const lower = (query || '').toLowerCase();
  let fullResponse = '';

  if (lower.includes('code') || lower.includes('python') || lower.includes('javascript') || lower.includes('react') || lower.includes('function') || lower.includes('algorithm')) {
    fullResponse = `Here is a clean, production-grade implementation with complete explanations:\n\n\`\`\`python
def solution(data):
    """
    Processes and validates data with linear time complexity O(n).
    """
    if not data:
        return None
    return [item.strip() for item in data if item]

# Example demonstration
if __name__ == "__main__":
    test_input = ["  Veccna AI  ", "  Distributed Swarm ", ""]
    output = solution(test_input)
    print("Processed:", output)
\`\`\`\n\n### Complexity & Key Details:\n* **Time Complexity:** O(n) single-pass iteration.\n* **Space Complexity:** O(n) auxiliary allocation.\n* **Design Pattern:** Functional filtering with defensive sanitization.`;
  } else if (lower.includes('compare') || lower.includes('difference') || lower.includes('vs')) {
    fullResponse = `Here is a detailed comparison breakdown:\n\n| Dimension | Option A | Option B |\n| :--- | :--- | :--- |\n| **Performance** | High-throughput, low latency | Moderate throughput, higher memory overhead |\n| **Scalability** | Distributed horizontal scaling | Vertical scaling with hardware bounds |\n| **Best Use Case** | Real-time interactive systems | Batch processing and cold storage |\n\nBoth approaches offer distinct tradeoffs depending on whether low latency or resource isolation is the core requirement.`;
  } else if (lower.includes('pythagor') || lower.includes('math') || lower.includes('equation') || lower.includes('formula') || lower.includes('theorem')) {
    fullResponse = `### The Pythagorean Theorem\n\nThe **Pythagorean theorem** is a fundamental principle in Euclidean geometry stating that in a right-angled triangle, the square of the length of the hypotenuse is equal to the sum of the squares of the lengths of the other two sides.\n\n#### Mathematical Expression:\n$$a^2 + b^2 = c^2$$\n\nWhere:\n* $a$ and $b$ are the perpendicular sides (legs).\n* $c$ is the hypotenuse ($c = \\sqrt{a^2 + b^2}$).\n\n#### Geometric Application:\nIn coordinate geometry, the Euclidean distance between two points $(x_1, y_1)$ and $(x_2, y_2)$ derives directly from this relation:\n$$d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$\n\nThis theorem underpins vector norms, linear algebra transformations, and high-dimensional embeddings across modern artificial intelligence models.`;
  } else {
    fullResponse = `### In-Depth Analysis: ${query}\n\n1. **Core Concept:** Addressing this requires examining key architectural principles, system constraints, and expected outcomes.\n2. **Practical Strategy:** Implement an iterative approach, validating each component with test cases and telemetry monitoring.\n3. **Recommendation:** For optimal results, ensure modular separation of concerns and robust error-handling boundaries.`;
  }

  streamLocalText(fullResponse, placeholder);
}

// --- Chat Input Dock Tools (Model, Deep Think, and Search Popovers) ---
function setModel(name) {
  state.currentModel = name;
  let shortName = 'Veccna 2.5 Pro';
  if (name.includes('Flash')) shortName = 'Veccna 2.5 Flash';
  else if (name.includes('Research')) shortName = 'Deep Research';

  if (selectedModelName) selectedModelName.innerText = name;
  const chatPillLabel = document.getElementById('chatModelPillLabel');
  if (chatPillLabel) chatPillLabel.innerText = shortName;

  document.querySelectorAll('.model-option').forEach(o => {
    o.classList.toggle('active-model', o.getAttribute('data-model') === name);
  });

  document.querySelectorAll('#chatModelPopoverMenu .chat-popover-opt').forEach(o => {
    o.classList.toggle('active', o.getAttribute('data-model') === name);
  });
}

function setThinkingMode(mode) {
  state.thinkingMode = mode;
  state.deepThinkingEnabled = mode !== 'off';

  const pillBtn = document.getElementById('chatThinkPillBtn');
  const pillLabel = document.getElementById('chatThinkPillLabel');
  const thinkToggle = document.getElementById('settingThinkToggle');

  if (pillBtn) {
    pillBtn.classList.toggle('active', state.deepThinkingEnabled);
  }

  if (pillLabel) {
    if (mode === 'extended') pillLabel.innerText = 'Deep Think';
    else if (mode === 'standard') pillLabel.innerText = 'Standard Think';
    else pillLabel.innerText = 'Think Off';
  }

  if (thinkToggle) {
    thinkToggle.checked = state.deepThinkingEnabled;
  }

  document.querySelectorAll('#chatThinkPopoverMenu .chat-popover-opt').forEach(o => {
    o.classList.toggle('active', o.getAttribute('data-think-mode') === mode);
  });
}

function setSearchMode(mode) {
  state.searchMode = mode;
  state.webSearchEnabled = mode !== 'off';

  const pillBtn = document.getElementById('chatSearchPillBtn');
  const pillLabel = document.getElementById('chatSearchPillLabel');
  const searchToggle = document.getElementById('settingSearchToggle');

  if (pillBtn) {
    pillBtn.classList.toggle('active', state.webSearchEnabled);
  }

  if (pillLabel) {
    if (mode === 'auto') pillLabel.innerText = 'Live Search';
    else if (mode === 'deep') pillLabel.innerText = 'Deep Search';
    else pillLabel.innerText = 'Search Off';
  }

  if (searchToggle) {
    searchToggle.checked = state.webSearchEnabled;
  }

  document.querySelectorAll('#chatSearchPopoverMenu .chat-popover-opt').forEach(o => {
    o.classList.toggle('active', o.getAttribute('data-search-mode') === mode);
  });
}

function initChatDockTools() {
  const chatModelPillBtn = document.getElementById('chatModelPillBtn');
  const chatModelPopoverMenu = document.getElementById('chatModelPopoverMenu');

  const chatThinkPillBtn = document.getElementById('chatThinkPillBtn');
  const chatThinkPopoverMenu = document.getElementById('chatThinkPopoverMenu');

  const chatSearchPillBtn = document.getElementById('chatSearchPillBtn');
  const chatSearchPopoverMenu = document.getElementById('chatSearchPopoverMenu');

  function closeAllMenus() {
    if (modelDropdown) modelDropdown.classList.remove('open');
    if (chatModelPopoverMenu) chatModelPopoverMenu.classList.remove('open');
    if (chatThinkPopoverMenu) chatThinkPopoverMenu.classList.remove('open');
    if (chatSearchPopoverMenu) chatSearchPopoverMenu.classList.remove('open');
  }

  // Top Header Model Selector
  if (modelSelector && modelDropdown) {
    modelSelector.addEventListener('click', (e) => {
      e.stopPropagation();
      playSound('click');
      const isOpen = modelDropdown.classList.contains('open');
      closeAllMenus();
      if (!isOpen) modelDropdown.classList.add('open');
    });

    document.querySelectorAll('.model-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        playSound('click');
        const name = opt.getAttribute('data-model');
        setModel(name);
        closeAllMenus();
      });
    });
  }

  // 1. Chat Model Popover
  if (chatModelPillBtn && chatModelPopoverMenu) {
    chatModelPillBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playSound('click');
      const isOpen = chatModelPopoverMenu.classList.contains('open');
      closeAllMenus();
      if (!isOpen) chatModelPopoverMenu.classList.add('open');
    });

    document.querySelectorAll('#chatModelPopoverMenu .chat-popover-opt').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        playSound('click');
        const name = opt.getAttribute('data-model');
        setModel(name);
        closeAllMenus();
      });
    });
  }

  // 2. Chat Deep Think Popover
  if (chatThinkPillBtn && chatThinkPopoverMenu) {
    chatThinkPillBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playSound('click');
      const isOpen = chatThinkPopoverMenu.classList.contains('open');
      closeAllMenus();
      if (!isOpen) chatThinkPopoverMenu.classList.add('open');
    });

    document.querySelectorAll('#chatThinkPopoverMenu .chat-popover-opt').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        playSound('click');
        const mode = opt.getAttribute('data-think-mode');
        setThinkingMode(mode);
        closeAllMenus();
      });
    });
  }

  // 3. Chat Search Popover
  if (chatSearchPillBtn && chatSearchPopoverMenu) {
    chatSearchPillBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playSound('click');
      const isOpen = chatSearchPopoverMenu.classList.contains('open');
      closeAllMenus();
      if (!isOpen) chatSearchPopoverMenu.classList.add('open');
    });

    document.querySelectorAll('#chatSearchPopoverMenu .chat-popover-opt').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        playSound('click');
        const mode = opt.getAttribute('data-search-mode');
        setSearchMode(mode);
        closeAllMenus();
      });
    });
  }

  // Global Outside Click
  document.addEventListener('click', () => {
    closeAllMenus();
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
  if (modal) {
    const keyInput = document.getElementById('openRouterApiKeyInput');
    if (keyInput) {
      keyInput.value = state.openRouterKey || DEFAULT_OPENROUTER_KEY;
    }
    modal.classList.add('open');
  }
};

window.saveApiKeyFromSettings = function() {
  const input = document.getElementById('openRouterApiKeyInput');
  if (input) {
    const val = input.value.trim();
    if (val) {
      state.openRouterKey = val;
      localStorage.setItem('veccna_openrouter_key', state.openRouterKey);
      showToast('OpenRouter API Key saved successfully!', 'success');
    } else {
      state.openRouterKey = DEFAULT_OPENROUTER_KEY;
      localStorage.removeItem('veccna_openrouter_key');
      showToast('Restored default OpenRouter key.', 'info');
    }
    playSound('click');
  }
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
      4. Veccna AI analyzes the contents with high-throughput multimodal intelligence.
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
  setThinkingMode(enabled ? 'extended' : 'off');
  showToast(`Deep thinking ${enabled ? 'enabled' : 'disabled'} by default`, 'info');
};

window.toggleSearchSetting = function(enabled) {
  setSearchMode(enabled ? 'auto' : 'off');
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
  initChatDockTools();
  initAuth();
  renderActiveChat();
});
