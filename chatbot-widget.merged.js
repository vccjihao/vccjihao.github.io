(() => {
  // --- Configuration -------------------------------------------------------
  const cfg = Object.assign(
    {
      endpoint: "https://vccjihao.app.n8n.cloud/webhook/course-bot", // your endpoint
      title: "TA/RA",
      storageKey: "chatbot_widget_state_v1",
      greeting: "👋 Hi! Feel free to ask me about my courses and research.",
      theme: "auto",
      position: { bottom: 20, right: 20 },
      maxHeight: 520,
      maxWidth: 380,
      userId: "anonymous"
    },
    window.ChatbotWidget || {}
  );

  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(cfg.storageKey) || "{}");
  } catch (_) {}
  const state = { open: saved.open ?? false };

  // --- Mount root ----------------------------------------------------------
  const host = document.createElement("div");
  host.setAttribute("data-chatbot-widget", "");
  host.style.position = "fixed";
  host.style.zIndex = 2147483647;
  host.style.bottom = (saved.bottom ?? cfg.position.bottom) + "px";
  host.style.right = (saved.right ?? cfg.position.right) + "px";
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: "open" });

  // --- Styles --------------------------------------------------------------
  const style = document.createElement("style");
  style.textContent = `
    :host, * { box-sizing: border-box; }
    :host { --bg: #fff; --text: #0f172a; --border: #e2e8f0; --accent: #2563eb;
      --bot: #f1f5f9; --user: #dbeafe; --muted: #64748b; }
    :host([data-theme="dark"]) { --bg: #0b1020; --text: #e5e7eb; --border: #1f2937;
      --accent: #60a5fa; --bot: #1e293b; --user: #334155; --muted: #94a3b8; }

    .fab {
      all: unset; position: relative; display: grid; place-items: center;
      width: 56px; height: 56px; border-radius: 50%;
      background: var(--accent); color: #fff; cursor: pointer;
      box-shadow: 0 10px 30px rgba(0,0,0,.18);
      transition: transform .15s ease;
    }
    .fab:hover { transform: translateY(-1px); }

    .panel {
      position: absolute; bottom: 70px; right: 0;
      width: ${cfg.maxWidth}px; max-height: ${cfg.maxHeight}px;
      background: var(--bg); color: var(--text);
      border: 1px solid var(--border);
      border-radius: 18px; box-shadow: 0 20px 60px rgba(0,0,0,.25);
      overflow: hidden; display: none;
      grid-template-rows: auto 1fr auto;
    }
    .panel.open { display: grid; }

    .header { display: flex; align-items: center; gap: 8px; padding: 12px 14px;
      border-bottom: 1px solid var(--border); background: var(--bg); }
    .title { font: 600 14px/1.2 system-ui, sans-serif; }
    .spacer { flex: 1; }
    .iconbtn {
      all: unset; width: 28px; height: 28px; display: grid; place-items: center;
      border-radius: 8px; cursor: pointer; color: var(--muted);
    }
    .iconbtn:hover { background: rgba(100,116,139,.12); color: var(--text); }

    .messages {
      padding: 14px; overflow: auto; display: flex;
      flex-direction: column; gap: 10px;
      background: linear-gradient(180deg, rgba(2,6,23,.02), transparent 22%);
    }
    .bubble {
      max-width: 85%; padding: 10px 12px; border-radius: 14px;
      font: 14px/1.4 system-ui, sans-serif;
      white-space: pre-wrap; word-wrap: break-word;
    }
    .bot { background: var(--bot); color: var(--text);
      border: 1px solid var(--border); }
    .user { background: var(--user); color: var(--text);
      border: 1px solid var(--border); align-self: flex-end; }

    .inputbar {
      display: grid; grid-template-columns: 1fr auto; gap: 8px;
      padding: 12px; border-top: 1px solid var(--border); background: var(--bg);
    }
    textarea {
      resize: none; height: 42px; padding: 10px 12px;
      border: 1px solid var(--border); border-radius: 12px;
      background: transparent; color: var(--text); outline: none;
      font: 14px/1.3 system-ui, sans-serif;
    }
    textarea::placeholder { color: var(--muted); }
    .send {
      all: unset; height: 42px; padding: 0 14px; border-radius: 12px;
      background: var(--accent); color: #fff; display: grid; place-items: center;
      cursor: pointer; font: 600 14px/1 system-ui, sans-serif;
    }
    .send[disabled] { opacity: .6; cursor: not-allowed; }

    .typing { display: inline-grid; grid-auto-flow: column;
      gap: 4px; align-items: center; }
    .dot {
      width: 6px; height: 6px; border-radius: 999px; background: var(--muted);
      opacity: .7; animation: blink 1s infinite ease-in-out;
    }
    .dot:nth-child(2){ animation-delay: .15s; }
    .dot:nth-child(3){ animation-delay: .3s; }
    @keyframes blink { 0%, 80%, 100% { opacity: .3 } 40% { opacity: 1 } }
  `;
  root.appendChild(style);

  // --- Theme ---------------------------------------------------------------
  const setTheme = () => {
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme =
      cfg.theme === "auto" ? (prefersDark ? "dark" : "light") : cfg.theme;
    root.host.setAttribute("data-theme", theme);
  };
  setTheme();
  if (cfg.theme === "auto" && window.matchMedia) {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", setTheme);
  }

  // --- Elements ------------------------------------------------------------
  const fab = document.createElement("button");
  fab.className = "fab";
  //fab.innerHTML = "💬";
  fab.innerHTML = `
  <div style="
    position: relative;
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
  ">
    <span style="
      font-size: 30px;
      position: relative;
      top: -5px; /* moves 💬 up a bit for better balance */
    ">💬</span>
    <span style="
      position: absolute;
      bottom: 6px;
      right: 9px;
      background: #154734;   /* CPP Green */
      color: #ffb81c;        /* CPP Gold */
      font-weight: 700;
      font-size: 10px;
      line-height: 1;
      padding: 2px 4px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,.25);
    ">TA/RA</span>
  </div>
`;
  const panel = document.createElement("section");
  panel.className = "panel";
  const header = document.createElement("div");
  header.className = "header";
  header.innerHTML = `<div class="title">${cfg.title}</div><div class="spacer"></div>`;
  const closeBtn = document.createElement("button");
  closeBtn.className = "iconbtn";
  closeBtn.textContent = "✕";
  header.appendChild(closeBtn);
  const messages = document.createElement("div");
  messages.className = "messages";
  const inputbar = document.createElement("div");
  inputbar.className = "inputbar";
  const textarea = document.createElement("textarea");
  textarea.placeholder = "Type a message…";
  const send = document.createElement("button");
  send.className = "send";
  send.textContent = "Send";
  inputbar.append(textarea, send);
  panel.append(header, messages, inputbar);
  root.append(fab, panel);

  // --- Functions -----------------------------------------------------------
  function toggle(open) {
    state.open = open;
    panel.classList.toggle("open", open);
    fab.style.display = open ? "none" : "grid";
    persist({ open });
    if (open) setTimeout(() => textarea.focus(), 0);
  }

  function bubble(text, cls) {
    const div = document.createElement("div");
    div.className = `bubble ${cls}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }
  function appendUser(t) { bubble(t, "user"); }
  function appendBot(t) { bubble(t, "bot"); }

  function showTyping() {
    const div = document.createElement("div");
    div.className = "bubble bot";
    div.innerHTML =
      '<span class="typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return () => div.remove();
  }

  function persist(obj) {
    const next = Object.assign({}, saved, obj, {
      bottom: parseInt(host.style.bottom, 10),
      right: parseInt(host.style.right, 10),
    });
    localStorage.setItem(cfg.storageKey, JSON.stringify(next));
    saved = next;
  }

  async function sendMessage(userText) {
    // More robust fetch: explicit CORS, JSON body, and graceful fallbacks
    const resp = await fetch(cfg.endpoint, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ userId: cfg.userId, message: userText })
    });

    // Try JSON; fallback to text
    let raw = "";
    let data = null;
    try {
      data = await resp.clone().json();
    } catch (_) {
      raw = await resp.text();
    }

    if (!resp.ok) {
      const reason = data?.error || raw || resp.statusText;
      throw new Error(`HTTP ${resp.status}: ${reason}`);
    }

    return (
      data?.answer ||
      data?.reply ||
      data?.message ||
      data?.text ||
      raw ||
      "(No reply)"
    );
  }

  // --- Events --------------------------------------------------------------
  fab.onclick = () => toggle(true);
  closeBtn.onclick = () => toggle(false);

  const fit = () => {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };
  textarea.oninput = fit;

  send.onclick = async () => {
    const text = textarea.value.trim();
    if (!text) return;
    textarea.value = "";
    fit();
    send.disabled = true;
    appendUser(text);
    const stopTyping = showTyping();
    try {
      const reply = await sendMessage(text);
      stopTyping();
      appendBot(reply);
    } catch (err) {
      stopTyping();
      appendBot("Sorry—request failed. Please try again.");
      console.error("[chatbot-widget] request failed:", err);
    } finally {
      send.disabled = false;
    }
  };

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send.click();
    } else if (e.key === "Escape") {
      toggle(false);
    }
  });

  // --- Greeting ------------------------------------------------------------
  if (!saved.greeted) {
    appendBot(cfg.greeting);
    persist({ greeted: true });
  }
  toggle(state.open);
})();
