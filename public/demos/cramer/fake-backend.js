// Cramer portfolio demo: a client-side stand-in for the AAMP backend.
//
// The page (chat.html) and the React islands are the real ones. This file
// answers their fetch() and EventSource calls from fake-data.js and replays
// scripted streaming turns, so the demo runs as static files. Nothing here is
// the real backend, agent or prompts. Every name and number is invented.
(function () {
  "use strict";

  const DATA = window.CRAMER_DEMO_DATA;
  const USER = { authenticated: true, email: "demo@example.com", name: "Demo User", picture: "", user_id: "demo" };
  const realFetch = window.fetch.bind(window);
  const here = new URL(".", document.currentScript ? document.currentScript.src : location.href);

  // ---- Time: the captured fixtures are anchored to the day they were taken. ----
  // Shift them so the newest chat was updated twenty minutes ago.
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const newest = Math.max(...DATA.sessions.map((s) => new Date(s.updated_at).getTime()));
  const shiftMs = Date.now() - 20 * 60 * 1000 - newest;
  const shift = (iso) => (iso ? new Date(new Date(iso).getTime() + shiftMs).toISOString() : iso);

  const sessions = DATA.sessions.map((s) => ({ ...s, updated_at: shift(s.updated_at) }));
  const transcripts = {};
  for (const [id, h] of Object.entries(DATA.history)) {
    transcripts[id] = {
      messages: h.messages.map((m) => ({ ...m, timestamp: shift(m.timestamp) })),
      context_usage: h.context_usage,
    };
  }
  let schedules = DATA.schedules.schedules.map((s) => ({ ...s }));
  for (const dir of Object.values(DATA.files)) {
    for (const e of dir.entries) e.modified = shift(e.modified);
  }

  // A chat id left in storage by an earlier visit does not exist any more.
  try {
    const params = new URLSearchParams(location.search);
    const stored = localStorage.getItem("aamp_session_id");
    if (stored && !transcripts[stored]) localStorage.removeItem("aamp_session_id");
    if (params.get("session") && !transcripts[params.get("session")]) {
      window.history.replaceState({}, "", location.pathname);
    }
    // A fresh visit opens on an empty New chat; a link or reload with ?session= keeps its chat.
    if (!params.get("session")) localStorage.removeItem("aamp_session_id");
  } catch { /* storage blocked: the page falls back on its own */ }

  // ---- Files ----
  const FILE_ASSETS = {
    "downloads/conversions-by-week.png": "files/conversions-by-week.png",
    "downloads/gp-by-market.png": "files/gp-by-market.png",
    "downloads/gp-by-market.csv": "files/gp-by-market.csv",
    "uploads/2026/09/mock-chat-7/turn-1/creative-1.png": "files/chat-7-creative-1.png",
    "uploads/2026/09/mock-chat-8/turn-1/creative-1.png": "files/chat-8-creative-1.png",
    "uploads/2026/09/mock-chat-8/turn-1/creative-2.png": "files/chat-8-creative-2.png",
    "uploads/2026/09/mock-chat-8/turn-1/creative-3.png": "files/chat-8-creative-3.png",
  };
  const assetFor = (path) => FILE_ASSETS[path] || FILE_ASSETS["downloads/" + path];
  window.AAMP_DEMO = {
    fileUrl: (path) => new URL(assetFor(path) || "files/missing.png", here).href,
  };

  // ---- Helpers ----
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  const abortError = () => new DOMException("The user aborted a request.", "AbortError");
  const uid = () => Math.random().toString(36).slice(2, 10);
  const norm = (text) => text.replace(/\n{3,}/g, "\n\n").trim();
  const words = (text) => text.split(/(?<= )/);

  function sessionRow(id) { return sessions.find((s) => s.session_id === id); }
  function touch(id, title) {
    const now = new Date().toISOString();
    let row = sessionRow(id);
    if (!row) {
      row = { session_id: id, title, summary: title, first_prompt: title, last_modified: 0, updated_at: now, pinned: false };
      sessions.push(row);
    }
    row.updated_at = now;
  }

  // ---- Scripted turns ----
  const T = (name, raw, args, result, lead) => ({ name, raw, args, result, lead });
  const sql = (lead, query, result) => T("run_sql", "mcp__aamp__run_sql", { query }, result, lead);
  // A fenced block must start on its own line; word-sized embeds still join the sentence before them.
  const embed = (component, props) => "\n\n```adtraction-ui\n" + JSON.stringify({ component, props }) + "\n```\n\n";

  const ASK_QUESTIONS = [
    {
      question: "Which market should I look at?", header: "Market", multiSelect: false,
      options: [
        { label: "Sweden", description: "Your biggest market by revenue" },
        { label: "Denmark", description: "Launched in August" },
        { label: "All markets", description: "Combined, converted to SEK" },
      ],
    },
    {
      question: "Which numbers do you want?", header: "Metrics", multiSelect: true,
      options: [
        { label: "Revenue", description: "Order value from tracked conversions" },
        { label: "Conversions", description: "Approved and pending" },
        { label: "EPC", description: "Earnings per click" },
      ],
    },
  ];

  const TIP = "\n\n_This demo replays scripted answers. Ask for a **table**, ask me to **ask** you something, name a **brand**, ask for a **draft**, or ask me to **search the web** to see the other kinds._";

  const TURNS = {
    // A web search, then something worth remembering (Cramer's WebSearch steps and memory chips).
    web: {
      steps: [
        T("WebSearch", "WebSearch", { query: "Black Week 2026 affiliate campaigns home and garden Nordics" }, "Web search results for query: \"Black Week 2026 affiliate campaigns home and garden Nordics\"\n\nLinks: [{\"title\":\"Black Week 2026: what Nordic shoppers plan to buy\",\"url\":\"https://nordic-retail-weekly.example/black-week-2026-shoppers\"},{\"title\":\"Home and garden leads early Black Week deals\",\"url\":\"https://shopfloor-news.example/home-garden-black-week\"},{\"title\":\"Affiliate trends for Q4: longer campaigns, fewer codes\",\"url\":\"https://partner-marketing-digest.example/q4-affiliate-trends\"},{\"title\":\"Why Black Week now starts in early November\",\"url\":\"https://ecommerce-signals.example/black-week-starts-earlier\"}]\n\nRetailers are starting Black Week earlier and running it longer.", "I'll check what has been announced so far."),
        T("remember", "mcp__aamp__remember", { text: "Looks after the home and garden brands" }, "Saved to memory.", "You look after the home and garden brands, so I'll remember that for next time."),
      ],
      answer: "Black Week is starting earlier this year. Most home and garden retailers announced deals from **3 November**, two weeks before Black Friday.\n\n### What others are doing\n\n1. **Longer campaigns.** Two to three weeks instead of one, with a second push on Black Friday itself.\n2. **Fewer discount codes.** Retailers favour site-wide prices, so coupon partners get exclusive bundles instead.\n3. **Content first.** Gift guides and buying guides go live in October to build traffic before the deals.\n\n### For your brands\n\n- Book content partners for gift guides now, before their October slots fill up.\n- Offer coupon partners an exclusive bundle rather than a bigger code.",
    },
    table: {
      steps: [
        sql("I'll pull September's results per channel.", "SELECT channel, channel_type, count() AS conversions, sum(order_value) AS revenue, sum(commission) / sum(clicks) AS epc FROM demo_report WHERE month = '2026-09' GROUP BY channel, channel_type ORDER BY conversions DESC LIMIT 8", "8 rows"),
      ],
      answer:
        "Here are your top partners by conversions in September:\n\n" +
        "| Channel | Channel type | Markets | Conversions | Revenue (SEK) | EPC (SEK) | vs. August |\n" +
        "| --- | --- | --- | ---: | ---: | ---: | ---: |\n" +
        "| [CouponCove.example](adtraction:channel/9000001?type=coupon&markets=SE) | Coupon | SE | 1,284 | 642,300 | 4.12 | +12.4% |\n" +
        "| [Pantry Pages](adtraction:channel/9000002?type=content&markets=SE%2CNO) | Content | SE, NO | 911 | 503,870 | 6.48 | +6.1% |\n" +
        "| [Deal Owl](adtraction:channel/9000003?type=coupon&markets=SE) | Coupon | SE | 846 | 389,160 | 3.27 | -4.8% |\n" +
        "| [Fixit Journal](adtraction:channel/9000004?type=content&markets=SE) | Content | SE | 402 | 278,940 | 7.91 | +3.2% |\n" +
        "| [Cashback Fjord](adtraction:channel/9000005?type=cashback&markets=SE%2CDK%2CFI) | Cashback | SE, DK, FI | 377 | 151,550 | 2.05 | +21.0% |\n" +
        "| [Bargain Moose](adtraction:channel/9000006?type=coupon&markets=NO) | Coupon | NO | 344 | 132,900 | 2.71 | -11.6% |\n" +
        "| [Penny Lantern](adtraction:channel/9000007?type=coupon&markets=DK) | Coupon | DK | 298 | 121,400 | 3.02 | +8.9% |\n" +
        "| [Nest & Notes](adtraction:channel/9000010?type=content&markets=SE) | Content | SE | 211 | 164,800 | 8.36 | +34.5% |\n\n" +
        "Coupon partners drove most of the volume, while content partners earned the most per click.",
    },
    brand: {
      steps: [
        sql("Looking up where the brand's September sales came from.", "SELECT channel, partner, count() AS sales FROM demo_report WHERE brand_id = 9000101 AND month = '2026-09' GROUP BY channel, partner ORDER BY sales DESC", "6 rows"),
      ],
      answer:
        "[Snoozeberry Beds](adtraction:brand/9000101?country=GB&category=Home%20%26%20Garden&markets=GB) got most of its September sales from " +
        "[Linkfable Media](adtraction:channel/9000201?type=content&markets=GB%2CSE%2CDK&url=https%3A%2F%2Flinkfable.example&partner=Linkfable%20Media), " +
        "the channel run by partner [Linkfable Media](adtraction:partner/9000301?markets=GB%2CSE%2CDK). Their EPC dropped 12% after the coupon ended. " +
        embed("StatsBadge", { value: -12 }),
    },
    draft: {
      steps: [
        sql("Checking what changed for the brand last week before I write anything.", "SELECT date, sum(commission) / sum(clicks) AS epc FROM demo_report WHERE brand_id = 9000101 AND date >= today() - 14 GROUP BY date ORDER BY date", "14 rows"),
      ],
      answer:
        "Here's a draft for their account manager:\n\n" +
        "> Hi Robin,\n>\n> Snoozeberry's EPC fell 29% last week after their 15% coupon ended on 23 September. Linkfable Media took most of the hit. " +
        "Do you know if a new offer is planned before Black Friday? If not, we could offer Linkfable a temporary commission bump to hold the traffic.\n>\n> Thanks,\n> Sam\n\n" +
        "And a shorter one for chat:\n\n" +
        "> Quick one: Snoozeberry's coupon ended on the 23rd and EPC dropped 29%. Any new offer coming before Black Friday?",
    },
    error: { steps: [sql("Pulling sales by device for the last 12 months.", "SELECT device_type, sum(order_value) FROM demo_conversions WHERE date >= today() - INTERVAL 12 MONTH GROUP BY device_type", "4 rows")], error: "The AI service encountered an error. Please try again." },
    ask: {
      steps: [],
      ask: ASK_QUESTIONS,
      answered: (answers) => {
        const parts = Object.entries(answers || {}).map(([q, v]) => `**${Array.isArray(v) ? v.join(", ") : v}** for “${q}”`);
        return "Thanks. You picked " + (parts.join("; ") || "nothing") + ".\n\n" +
          "New brands are off to a steady start: **12 of 15** brands that went live this month converted in their first week, at an average EPC of **SEK 3.90**.\n\n" +
          embed("StatsBadge", { value: 6 });
      },
      dismissed: "No problem, I'll leave it there. Ask again whenever you're ready.",
    },
    default: {
      steps: [
        sql("I'll start with revenue and conversions for the last 30 days.", "SELECT market, sum(order_value) AS revenue, count() AS conversions FROM demo_report WHERE date >= today() - 30 GROUP BY market", "4 rows"),
        sql("Now the same days last month, to compare.", "SELECT market, sum(order_value) AS revenue FROM demo_report WHERE date BETWEEN today() - 60 AND today() - 31 GROUP BY market", "4 rows"),
      ],
      answer:
        "Revenue for the last 30 days came to **SEK 16.4M**, up on the month before. " + embed("StatsBadge", { value: 8 }) + "\n\n" +
        "| Market | Revenue (SEK) | vs. last month | Conversions |\n| --- | ---: | ---: | ---: |\n" +
        "| Sweden | 7,310,000 | +5.2% | 14,180 |\n| Norway | 4,020,000 | +11.8% | 7,460 |\n| Denmark | 3,240,000 | +14.0% | 6,120 |\n| Finland | 1,830,000 | -2.1% | 3,390 |\n\n" +
        embed("InfoBox", { title: "What stands out", tone: "sky", items: ["Denmark grew fastest, mostly from two new cashback partners", "Finland is the only market down", "Sweden is still 45% of revenue"] }) +
        TIP,
    },
  };

  function pickTurn(question) {
    const q = question.toLowerCase();
    if (/\berror\b/.test(q)) return TURNS.error;
    if (/\b(ask|question)/.test(q)) return TURNS.ask;
    if (/\btable\b/.test(q)) return TURNS.table;
    if (/\b(web|search|news|black week|competitors?)\b/.test(q)) return TURNS.web;
    if (/\b(draft|email|note|write)\b/.test(q)) return TURNS.draft;
    if (/\bbrand\b/.test(q)) return TURNS.brand;
    return TURNS.default;
  }

  // ---- Live turns ----
  const pendingAsks = new Map();     // question_id -> resolve({answers, dismiss})
  const liveTurns = new Map();       // session_id -> { cancel }
  let contextPct = {};

  function sseResponse(run, signal) {
    const enc = new TextEncoder();
    let ctrl;
    let closed = false;
    const body = new ReadableStream({ start(c) { ctrl = c; }, cancel() { closed = true; } });
    const emit = (obj) => { if (!closed) ctrl.enqueue(enc.encode("data: " + JSON.stringify(obj) + "\n\n")); };
    const sleep = (ms) => new Promise((resolve, reject) => {
      if (closed) return reject(abortError());
      // A hidden tab throttles timers to one a second or less; finish the turn
      // there without the typing delays instead.
      if (document.hidden) return void queueMicrotask(resolve);
      const t = setTimeout(resolve, ms);
      signal?.addEventListener("abort", () => { clearTimeout(t); reject(abortError()); }, { once: true });
    });
    signal?.addEventListener("abort", () => {
      if (closed) return;
      closed = true;
      try { ctrl.error(abortError()); } catch { /* already closed */ }
    }, { once: true });
    const finish = () => { if (!closed) { closed = true; ctrl.close(); } };
    Promise.resolve().then(() => run(emit, sleep, () => closed)).catch(() => {}).finally(finish);
    return new Response(body, { status: 200, headers: { "Content-Type": "text/event-stream" } });
  }

  async function streamText(emit, sleep, text, perWord = 22) {
    for (const w of words(text)) { emit({ type: "token", text: w }); await sleep(perWord + Math.random() * 18); }
  }

  function queryStream(payload, signal) {
    const sid = payload.session_id;
    const question = (payload.question || "").trim() || "(attachments only)";
    if (liveTurns.has(sid) || (sid === WAITING && !waiting.done)) return json({ detail: "A turn is already running" }, 409);
    const turn = pickTurn(question);
    const startedAt = Date.now();
    if (!transcripts[sid]) transcripts[sid] = { messages: [], context_usage: null };
    const h = transcripts[sid];
    const stamp = () => new Date().toISOString();
    h.messages.push({ role: "user", content: question, timestamp: stamp(), uuid: sid + "-" + uid() });
    touch(sid, question.length > 60 ? question.slice(0, 57) + "…" : question);

    const internal = new AbortController();
    liveTurns.set(sid, { cancel: () => internal.abort() });
    signal?.addEventListener("abort", () => internal.abort(), { once: true });

    return sseResponse(async (emit, sleep) => {
      try {
        await sleep(350);
        let toolCount = 0;
        for (const step of turn.steps) {
          const id = "toolu_demo_" + uid();
          if (step.lead) await streamText(emit, sleep, step.lead + "\n");
          emit({ type: "status", status: "tool_use", tool: step.name, raw_tool: step.raw, tool_use_id: id, args: step.args });
          await sleep(900 + Math.random() * 700);
          emit({ type: "status", status: "tool_result", tool: step.name, tool_use_id: id, result_length: step.result.length, result_preview: step.result, error: false });
          toolCount++;
          h.messages.push({ role: "assistant", content: [{ type: "text", text: step.lead || "" }, { type: "tool_use", id, name: step.raw, input: step.args }], timestamp: stamp(), uuid: sid + "-" + uid() });
          h.messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: id, content: step.result }], timestamp: stamp(), uuid: sid + "-" + uid() });
          await sleep(250);
        }
        if (turn.error) {
          emit({ type: "error", detail: turn.error });
          h.messages.push({ role: "assistant", content: [{ type: "text", text: turn.error }], timestamp: stamp(), uuid: sid + "-" + uid() });
          return;
        }
        let answer = turn.answer;
        if (turn.ask) {
          const qid = "demo-ask-" + uid();
          const toolId = "toolu_demo_" + uid();
          emit({ type: "ask", question_id: qid, questions: turn.ask });
          const reply = await new Promise((resolve, reject) => {
            pendingAsks.set(qid, resolve);
            internal.signal.addEventListener("abort", () => reject(abortError()), { once: true });
          }).finally(() => pendingAsks.delete(qid));
          h.messages.push({ role: "assistant", content: [{ type: "tool_use", id: toolId, name: "AskUserQuestion", input: { questions: turn.ask } }], timestamp: stamp(), uuid: sid + "-" + uid() });
          if (reply.dismiss) {
            h.messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: toolId, content: "The question was dismissed." }], timestamp: stamp(), uuid: sid + "-" + uid() });
            answer = turn.dismissed;
          } else {
            emit({ type: "ask_answered", question_id: qid, answers: reply.answers });
            const said = Object.entries(reply.answers || {}).map(([q, v]) => `"${q}"="${Array.isArray(v) ? v.join(",") : v}"`).join(", ");
            h.messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: toolId, content: `Your questions have been answered: ${said}. You can now continue with the user's answers in mind.` }], timestamp: stamp(), uuid: sid + "-" + uid() });
            answer = turn.answered(reply.answers);
          }
          await sleep(500);
        }
        answer = norm(answer);
        await streamText(emit, sleep, answer);
        const pct = Math.min(96, (contextPct[sid] || h.context_usage?.percentage || 8) + 6);
        contextPct[sid] = pct;
        const usage = { percentage: pct, total_tokens: pct * 2000, max_tokens: 200000 };
        h.context_usage = usage;
        h.messages.push({ role: "assistant", content: [{ type: "text", text: answer }], timestamp: stamp(), uuid: sid + "-" + uid() });
        touch(sid);
        emit({
          type: "done", answer, session_id: sid, claude_session_id: null, message_uuid: null,
          langfuse_trace_id: null, langfuse_observation_id: null, langfuse_trace_url: null,
          tool_count: toolCount, duration_ms: Date.now() - startedAt, context_usage: usage,
        });
      } finally {
        liveTurns.delete(sid);
      }
    }, internal.signal);
  }


  // ---- The chat that is waiting on you ----
  // "Check how our new brands are doing" opens mid-turn: Cramer has asked a
  // question and waits for the answer, the way a reload into a live turn looks.
  // Its events are buffered so every reconnect replays them from the start.
  const WAITING = "mock-chat-waiting";
  const waiting = { events: [], subs: new Set(), done: false, startedAt: Date.now() - 45 * 1000 };
  function hubEmit(ev) {
    waiting.events.push(ev);
    for (const fn of waiting.subs) fn(ev);
  }
  (function startWaiting() {
    const toolId = "toolu_demo_wait";
    const qid = "demo-ask-waiting";
    hubEmit({ type: "token", text: "I'll list the brands that went live this month first.\n" });
    hubEmit({ type: "status", status: "tool_use", tool: "run_sql", raw_tool: "mcp__aamp__run_sql", tool_use_id: toolId, args: { query: "SELECT brand_id, live_date FROM demo_brands WHERE live_date >= date_trunc('month', today())" } });
    hubEmit({ type: "status", status: "tool_result", tool: "run_sql", tool_use_id: toolId, result_length: 7, result_preview: "15 rows", error: false });
    hubEmit({ type: "ask", question_id: qid, questions: ASK_QUESTIONS });
    new Promise((resolve) => pendingAsks.set(qid, resolve)).then(async (reply) => {
      pendingAsks.delete(qid);
      const h = transcripts[WAITING];
      const stamp = () => new Date().toISOString();
      const askId = "toolu_demo_wait_ask";
      h.messages.push({ role: "assistant", content: [{ type: "text", text: "I'll list the brands that went live this month first." }, { type: "tool_use", id: toolId, name: "mcp__aamp__run_sql", input: {} }], timestamp: stamp(), uuid: "w1" });
      h.messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: toolId, content: "15 rows" }], timestamp: stamp(), uuid: "w2" });
      h.messages.push({ role: "assistant", content: [{ type: "tool_use", id: askId, name: "AskUserQuestion", input: { questions: ASK_QUESTIONS } }], timestamp: stamp(), uuid: "w3" });
      let answer;
      if (reply.dismiss) {
        h.messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: askId, content: "The question was dismissed." }], timestamp: stamp(), uuid: "w4" });
        answer = TURNS.ask.dismissed;
      } else {
        hubEmit({ type: "ask_answered", question_id: qid, answers: reply.answers });
        const said = Object.entries(reply.answers || {}).map(([q, v]) => `"${q}"="${Array.isArray(v) ? v.join(",") : v}"`).join(", ");
        h.messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: askId, content: `Your questions have been answered: ${said}. You can now continue with the user's answers in mind.` }], timestamp: stamp(), uuid: "w4" });
        answer = norm(TURNS.ask.answered(reply.answers));
      }
      for (const w of words(answer)) {
        hubEmit({ type: "token", text: w });
        await new Promise((r) => (document.hidden ? queueMicrotask(r) : setTimeout(r, 22 + Math.random() * 18)));
      }
      const usage = { percentage: 24, total_tokens: 48000, max_tokens: 200000 };
      h.messages.push({ role: "assistant", content: [{ type: "text", text: answer }], timestamp: stamp(), uuid: "w5" });
      h.context_usage = usage;
      touch(WAITING);
      waiting.done = true;
      hubEmit({ type: "done", answer, session_id: WAITING, tool_count: 1, duration_ms: Date.now() - waiting.startedAt, context_usage: usage });
    });
  })();

  function waitingEvents(signal) {
    return sseResponse(async (emit, sleep, isClosed) => {
      for (const ev of waiting.events) emit(ev);
      if (waiting.done) return;
      await new Promise((resolve, reject) => {
        const fn = (ev) => { emit(ev); if (ev.type === "done") { waiting.subs.delete(fn); resolve(); } };
        waiting.subs.add(fn);
        signal?.addEventListener("abort", () => { waiting.subs.delete(fn); reject(abortError()); }, { once: true });
      });
    }, signal);
  }

  // ---- Routes ----
  function sessionPayload(id) {
    const h = transcripts[id] || { messages: [], context_usage: null };
    return {
      session_id: id, user_id: USER.user_id, messages: h.messages, has_older: false, segments: 1,
      context_usage: h.context_usage || { total_tokens: 0, max_tokens: 200000, percentage: 0 },
    };
  }

  function searchSessions(q) {
    const needle = q.toLowerCase();
    const results = [];
    for (const s of sessions) {
      const inTitle = (s.title || "").toLowerCase().includes(needle);
      let snippet = "";
      let role = "";
      for (const m of transcripts[s.session_id]?.messages || []) {
        const text = typeof m.content === "string" ? m.content : m.content.filter((b) => b.type === "text").map((b) => b.text).join(" ");
        const at = text.toLowerCase().indexOf(needle);
        if (at !== -1) { snippet = text.slice(Math.max(0, at - 40), at + 80); role = m.role; break; }
      }
      if (inTitle || snippet) {
        results.push({ session_id: s.session_id, title: s.title, updated_at: s.updated_at, pinned: s.pinned, matches: 1, snippet, snippet_role: role, match_in: inTitle ? "title" : "content" });
      }
    }
    return { query: q, scope: "all", results };
  }

  function fileContent(path) {
    if (path.endsWith(".csv")) {
      const content = "market,gp_sek\nSE,62000\nNO,48000\nDK,35000\nFI,20000\n";
      return {
        path, name: path.split("/").pop(), size: content.length, mtime: today.getTime() / 1000, mode: "rendered", kind: "csv",
        binary: false, content, truncated: false,
        table: { columns: ["market", "gp_sek"], rows: [["SE", "62000"], ["NO", "48000"], ["DK", "35000"], ["FI", "20000"]], truncated: false, delimiter: "," },
        slides: null,
      };
    }
    return { path, name: path.split("/").pop(), size: 0, mtime: today.getTime() / 1000, mode: "rendered", kind: "image", binary: true, content: null, truncated: false, table: null, slides: null };
  }

  async function route(method, url, init) {
    const p = url.pathname;
    const body = () => { try { return JSON.parse(init?.body || "{}"); } catch { return {}; } };
    let m;
    if (p === "/auth/me") return json(USER);
    if (p === "/task/status") return json({ status: "running" });
    if (p.startsWith("/api/registry/")) return json({ selectable: false, active: "", bundle: "", error: "", enabled: false, channels: [], pinned: "" });
    if (p === "/api/skills") return json(DATA.skills);
    if (p === "/api/feedback") return json({ ok: true });
    if (p === "/api/user-files") return json(DATA.files[url.searchParams.get("path") || ""] || { path: url.searchParams.get("path"), parent: "", entries: [] });
    if (p === "/api/user-files/content") return json(fileContent(url.searchParams.get("path") || ""));
    if (p === "/query/stream" && method === "POST") return queryStream(body(), init?.signal);
    if (p === "/query/answer" && method === "POST") {
      const b = body();
      const resolve = pendingAsks.get(b.question_id);
      if (resolve) resolve({ answers: b.answers, dismiss: !!b.dismiss });
      return json(b.dismiss ? { dismissed: !!resolve, session_id: b.session_id } : { resolved: !!resolve, session_id: b.session_id });
    }
    if (p === "/query/cancel" && method === "POST") {
      liveTurns.get(body().session_id)?.cancel();
      return json({ cancelled: true });
    }
    if (p === "/query/active") {
      const live = [...liveTurns.keys()].map((id) => ({ session_id: id, active: true, done: false, event_count: 0, started_at_ms: Date.now() }));
      if (!waiting.done && transcripts[WAITING]) live.push({ session_id: WAITING, active: true, done: false, event_count: waiting.events.length, started_at_ms: waiting.startedAt });
      return json({ sessions: live });
    }
    if ((m = p.match(/^\/query\/active\/([^/]+)$/))) {
      if (m[1] === WAITING && !waiting.done && transcripts[WAITING]) return json({ active: true, done: false, session_id: WAITING, started_at_ms: waiting.startedAt });
      return json({ active: false, done: true, session_id: m[1] });
    }
    if ((m = p.match(/^\/query\/events\/([^/]+)$/))) {
      if (m[1] === WAITING && transcripts[WAITING]) return waitingEvents(init?.signal);
      return new Response("", { status: 404 });
    }

    if ((m = p.match(/^\/users\/[^/]+\/sessions\/?$/))) {
      if (method === "POST") return json({ session_id: "demo-" + uid() + uid(), user_id: USER.user_id });
      const list = [...sessions].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      return json({ sessions: list });
    }
    if (p.match(/^\/users\/[^/]+\/sessions\/search$/)) return json(searchSessions(url.searchParams.get("q") || ""));
    if ((m = p.match(/^\/users\/[^/]+\/sessions\/([^/]+)\/meta$/))) {
      const row = sessionRow(m[1]);
      if (row) Object.assign(row, body());
      return json({ session_id: m[1] });
    }
    if ((m = p.match(/^\/users\/[^/]+\/sessions\/([^/]+)$/))) {
      const id = decodeURIComponent(m[1]);
      if (method === "DELETE") {
        const i = sessions.findIndex((s) => s.session_id === id);
        if (i !== -1) sessions.splice(i, 1);
        delete transcripts[id];
        return json({ deleted: true, session_id: id });
      }
      if (method === "PATCH") {
        const b = body();
        let row = sessionRow(id);
        if (!row && b.title) { touch(id, b.title); row = sessionRow(id); transcripts[id] ||= { messages: [], context_usage: null }; }
        if (row && b.title) { row.title = b.title; row.summary = b.title; }
        return json({ session_id: id, title: b.title });
      }
      return json(sessionPayload(id));
    }
    if ((m = p.match(/^\/users\/[^/]+\/schedules\/?$/))) {
      if (method === "POST") {
        const b = body();
        const sched = { name: "demo-schedule-" + uid(), cron: b.cron, tz: b.tz, session_id: b.session_id, query: b.query };
        schedules.push(sched);
        return json({ success: true, schedule: sched, name: sched.name });
      }
      return json({ success: true, schedules });
    }
    if ((m = p.match(/^\/users\/[^/]+\/schedules\/([^/]+)$/))) {
      const name = decodeURIComponent(m[1]);
      if (method === "DELETE") { schedules = schedules.filter((s) => s.name !== name); return json({ success: true }); }
      if (method === "PATCH") {
        const s = schedules.find((x) => x.name === name);
        if (s) Object.assign(s, body());
        return json({ success: true, schedule: s });
      }
    }
    if ((m = p.match(/^\/users\/[^/]+\/routines\/([^/]+)\/meta$/))) {
      const s = schedules.find((x) => x.name === decodeURIComponent(m[1]));
      if (s) { const n = body().name; if (n) s.display_name = n; else delete s.display_name; }
      return json({ success: true });
    }
    return json({ detail: "Not available in the demo" }, 404);
  }

  const domReady = new Promise((resolve) => {
    if (document.readyState !== "loading") resolve();
    else document.addEventListener("DOMContentLoaded", () => setTimeout(resolve, 0), { once: true });
  });
  const API = /^\/(auth|api|users|query|task)(\/|$)/;
  window.fetch = function (input, init) {
    const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url, location.href);
    if (url.origin !== location.origin || !API.test(url.pathname)) return realFetch(input, init);
    const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
    if (init?.signal?.aborted) return Promise.reject(abortError());
    // A real request cannot answer before the page has parsed; answering in a microtask
    // let the chat restore ?session= before the phone layout read the URL, so phones
    // opened on the chat instead of the thread list.
    return domReady.then(() => route(method, url, init));
  };

  // ---- The notifications channel: open, quiet. ----
  const RealEventSource = window.EventSource;
  class DemoEventSource extends EventTarget {
    constructor(url) {
      super();
      this.url = String(url);
      this.readyState = 0;
      this.onopen = this.onmessage = this.onerror = null;
      setTimeout(() => {
        if (this.readyState === 2) return;
        this.readyState = 1;
        const e = new Event("open");
        this.dispatchEvent(e);
        this.onopen?.(e);
      }, 0);
    }
    close() { this.readyState = 2; }
  }
  window.EventSource = function (url, opts) {
    const u = new URL(url, location.href);
    if (u.origin === location.origin && u.pathname === "/notifications") return new DemoEventSource(url);
    return new RealEventSource(url, opts);
  };
})();
