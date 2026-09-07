window.__ModuleLoader__.load({
	id: "dsh-rich-context",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		//#region lib/locale.js
		const NS = "rich-context";
		const en = {
			"entry.label": "Context",
			"entry.tooltip": "Manage AGENTS.md — the instruction files your agents read",
			"panel.title": "Agent context",
			"tab.global": "Global",
			"tab.workspace": "Workspace",
			"tab.global.hint": "~/.dsh/AGENTS.md — applies to every session",
			"tab.workspace.hint": "<workspace>/AGENTS.md — applies to that workspace",
			"workspace.placeholder": "Select a workspace…",
			"editor.placeholder": "This file is empty — write your rules here.",
			"editor.empty": "No file yet — saving creates it.",
			"action.save": "Save",
			"action.saved": "saved",
			"action.dirty": "unsaved changes",
			"action.close": "Close",
			"error.generic": "failed",
			"effect.global": "Applies to new sessions immediately.",
			"effect.workspace": "Workspace sessions pick this up through file-activity sync.",
			"effect.custom": "Custom path — the harness reads this if configured.",
			"sources.title": "AGENTS.md sources",
			"sources.hint": "All detected instruction files across tool directories",
			"sources.set_default": "Set as default",
			"sources.current": "current default (symlink)",
			"sources.reset": "Reset to plain file",
			"sources.not_found": "not found",
			"sources.lines": "lines",
			"tab.prompts": "Prompts",
			"tab.prompts.hint": "Native user skills (~/.dsh/skills) — @name inserts, agents discover them as skills",
			"prompts.new": "New prompt",
			"prompts.name": "Name (lowercase-with-dashes)",
			"prompts.description": "One-line description (agents see it when the prompt surfaces as a skill)",
			"prompts.body": "Prompt text",
			"prompts.save": "Save",
			"prompts.delete": "Delete",
			"prompts.empty": "No prompts yet — create one; it becomes @name in the composer.",
			"prompts.confirmDelete": "Delete this prompt?",
			"prompts.updated": "updated",
			"prompts.dockHint": "Type @name in the composer to insert a prompt",
			"prompts.copy": "Copy",
			"prompts.copied": "copied",
		};
		const zh = {
			"entry.label": "上下文",
			"entry.tooltip": "管理 AGENTS.md——agent 实际读取的指令文件",
			"panel.title": "Agent 上下文",
			"tab.global": "全局",
			"tab.workspace": "工作区",
			"tab.global.hint": "~/.dsh/AGENTS.md——作用于所有会话",
			"tab.workspace.hint": "<工作区>/AGENTS.md——只作用于该工作区",
			"workspace.placeholder": "选择工作区…",
			"editor.placeholder": "文件为空——直接写你的规则。",
			"editor.empty": "尚无文件——保存即创建。",
			"action.save": "保存",
			"action.saved": "已保存",
			"action.dirty": "有未保存修改",
			"action.close": "关闭",
			"error.generic": "失败",
			"effect.global": "对新会话立即生效。",
			"effect.workspace": "工作区会话通过文件活动同步感知变更。",
			"effect.custom": "自定义路径——如已配置则 harness 会读取。",
			"sources.title": "AGENTS.md 来源",
			"sources.hint": "工具目录中检测到的所有指令文件",
			"sources.set_default": "设为默认",
			"sources.current": "当前默认（符号链接）",
			"sources.reset": "重置为普通文件",
			"sources.not_found": "未找到",
			"sources.lines": "行",
			"tab.prompts": "提示词",
			"tab.prompts.hint": "原生用户技能（~/.dsh/skills）—@name 插入，agent 会作为技能发现",
			"prompts.new": "新建提示词",
			"prompts.name": "名字（小写加短横）",
			"prompts.description": "一句话描述（作为技能呈现给 agent 时可见）",
			"prompts.body": "提示词正文",
			"prompts.save": "保存",
			"prompts.delete": "删除",
			"prompts.empty": "还没有提示词—创建一个，之后在输入框用 @name 插入。",
			"prompts.confirmDelete": "删除这个提示词？",
			"prompts.dockHint": "在输入框输入 @name 即可插入提示词",
			"prompts.copy": "复制",
			"prompts.copied": "已复制",
		};
		const lang = (typeof navigator !== "undefined" && /^(zh)/i.test(navigator.language ?? "")) ? "zh" : "en";
		const dict = { en, zh };
		const t = (key) => dict[lang][key] ?? dict.en[key] ?? key;
		//#endregion
		//#region lib/styles.js
		const css = `.rcx-entry{appearance:none;box-sizing:border-box;display:flex;align-items:center;gap:8px;width:calc(100% - 16px);height:34px;padding:0 10px;margin:2px 8px;font:inherit;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:8px;cursor:pointer;text-align:left}
.rcx-entry:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.rcx-entry[data-active="true"]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.rcx-entryRail{justify-content:center;width:36px;height:36px;margin:2px auto;padding:0}
.rcx-entryIcon{display:inline-flex;justify-content:center;align-items:center;width:24px;height:24px;flex:none;color:var(--dsw-alias-label-tertiary)}
.rcx-entryLabel{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rcx-scrim{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;padding:24px}
.rcx-card{width:100%;max-width:960px;max-height:min(92vh,1200px);border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-specific-tip);border-radius:12px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.3)}
.rcx-card,.rcx-card *{box-sizing:border-box}
.rcx-head{display:flex;align-items:baseline;gap:10px;padding:14px 0 10px}
.rcx-titleRow{display:flex;align-items:center;gap:10px;padding:0 16px;width:100%}
.rcx-title{font-size:14px;font-weight:500;line-height:20px;color:var(--dsw-alias-label-primary);flex:none}
.rcx-path{min-width:0;flex:1;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:16px;font-family:ui-monospace,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;text-decoration:underline dotted}
.rcx-pathInput{min-width:0;flex:1;border:1px solid var(--dsw-alias-state-business-primary);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:12px;line-height:16px;font-family:ui-monospace,monospace;padding:2px 6px;border-radius:6px;outline:none}
.rcx-closeBtn{flex:none;width:28px;height:28px;display:grid;place-items:center;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;border-radius:999px;font-size:16px}
.rcx-closeBtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.rcx-tabs{display:flex;border-top:1px solid var(--dsw-alias-border-l1);border-bottom:1px solid var(--dsw-alias-border-l1)}
.rcx-tab{appearance:none;background:0 0;border:none;border-right:1px solid var(--dsw-alias-border-l1);padding:8px 16px;font:inherit;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary);cursor:pointer}
.rcx-tabOn{color:var(--dsw-alias-state-business-primary);font-weight:500}
.rcx-tab:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.rcx-tabHint{flex:1;align-self:center;padding:0 12px;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rcx-picker{padding:8px 16px 0}
.rcx-select{width:100%;height:30px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);border-radius:8px;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;padding:0 8px}
.rcx-editorWrap{flex:1;min-height:0;display:flex;flex-direction:column;padding:8px 0 0;overflow:hidden}
.rcx-editor{flex:1;min-height:300px;height:100%;width:100%;resize:none;border:none;outline:none;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-family:ui-monospace,monospace;font-size:12.5px;line-height:19px;padding:10px 16px;scrollbar-width:none}
.rcx-editor::-webkit-scrollbar{display:none}
.rcx-empty{padding:2px 16px;color:var(--dsw-alias-label-caption);font-size:11px;line-height:14px}
.rcx-sources{border-top:1px solid var(--dsw-alias-border-l1);padding:8px 16px}
.rcx-sourcesHead{display:flex;align-items:baseline;gap:8px;margin-bottom:4px}
.rcx-sourcesTitle{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:14px;text-transform:uppercase;letter-spacing:.05em}
.rcx-sourcesHint{flex:1;color:var(--dsw-alias-label-caption);font-size:11px;line-height:14px}
.rcx-sourceList{display:flex;flex-direction:column;gap:2px;max-height:120px;overflow-y:auto;scrollbar-width:none}
.rcx-sourceList::-webkit-scrollbar{display:none}
.rcx-sourceRow{display:flex;align-items:center;gap:8px;padding:3px 8px;border-radius:6px;cursor:pointer}
.rcx-sourceRow:hover{background:var(--dsw-alias-interactive-bg-hover)}
.rcx-sourceOn{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 8%, transparent)}
.rcx-sourceLabel{flex:1;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rcx-sourceMeta{color:var(--dsw-alias-label-caption);font-size:11px;line-height:14px;flex:none}
.rcx-sourceBtn{flex:none;background:0 0;border:1px solid var(--dsw-alias-border-l2);border-radius:4px;padding:1px 8px;font:inherit;font-size:11px;line-height:14px;color:var(--dsw-alias-label-secondary);cursor:pointer}
.rcx-sourceBtn:hover{border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-state-business-primary)}
.rcx-footer{display:flex;align-items:stretch;border-top:1px solid var(--dsw-alias-border-l1)}
.rcx-status{flex:1;align-self:center;min-width:0;padding:0 12px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rcx-statusErr{color:var(--dsw-alias-state-error-primary)}
.rcx-statusOk{color:var(--dsw-alias-state-success-primary)}
.rcx-saveBtn{appearance:none;background:0 0;border:none;border-left:1px solid var(--dsw-alias-border-l1);padding:9px 20px;font:inherit;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary);cursor:pointer}
.rcx-saveBtn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.rcx-saveBtn:disabled{opacity:.45;cursor:default}
.rcx-saveDirty{color:var(--dsw-alias-state-business-primary);font-weight:500}
.rcx-prompts{display:flex;flex-direction:column;min-height:0;flex:1}
.rcx-promptList{max-height:180px;overflow:auto;border-bottom:1px solid var(--dsw-alias-border-l1)}
.rcx-promptRow{display:flex;align-items:center;gap:10px;padding:6px 14px;cursor:pointer}
.rcx-promptRow:hover{background:var(--dsw-alias-interactive-bg-hover)}
.rcx-promptForm{display:flex;flex-direction:column;gap:8px;padding:10px 14px;flex:1;min-height:0}
.rcx-promptNameInput{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:16px;font-family:ui-monospace,monospace;padding:4px 8px;border-radius:6px;outline:none}
.rcx-promptNameInput:focus{border-color:var(--dsw-alias-state-business-primary)}
.rcx-promptBody{flex:1;min-height:120px;resize:vertical;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px;font-family:ui-monospace,monospace;padding:8px 10px;border-radius:6px;outline:none}
.rcx-promptBody:focus{border-color:var(--dsw-alias-state-business-primary)}
.rcx-promptActions{display:flex;align-items:center;gap:8px}
.rcx-promptScrim{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;padding:24px}
.rcx-promptCard{width:min(560px,calc(100vw - 48px));max-height:min(70vh,640px);display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-specific-tip);border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.3)}
.rcx-promptCardHead{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.rcx-promptCardTitle{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:500;color:var(--dsw-alias-label-primary)}
.rcx-promptCardBody{flex:1;overflow:auto;padding:12px 14px;font-size:12px;line-height:18px;font-family:ui-monospace,monospace;white-space:pre-wrap;color:var(--dsw-alias-label-secondary)}
.rcx-promptCardFoot{display:flex;align-items:center;gap:8px;padding:8px 12px;border-top:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:14px}
.rcx-promptCopy{margin-left:auto}`;
		const tagId = "dsh-rich-context/panel.css";
		if (typeof document !== "undefined" && document.querySelector(`style[data-plugin-css="${tagId}"]`) === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-rich-context";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region lib/api.js
		const API = "/api/rich-context";
		async function fetchState() {
			const res = await fetch(`${API}/state`, { cache: "no-store" });
			return res.json();
		}
		async function fetchFile(scope, workspace, customPath) {
			const params = new URLSearchParams({ scope });
			if (scope === "workspace") params.set("workspace", workspace ?? "");
			if (scope === "custom") params.set("path", customPath ?? "");
			const res = await fetch(`${API}/file?${params}`, { cache: "no-store" });
			return res.json();
		}
		async function saveFile(body) {
			const res = await fetch(`${API}/file`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
			return res.json();
		}
		async function fetchPrompts() {
			const res = await fetch(`${API}/prompts`, { cache: "no-store" });
			return res.json();
		}
		async function mutatePrompt(payload) {
			const res = await fetch(`${API}/prompts`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
			return res.json();
		}
		// Shared prompt cache: the dock row, the @ trigger source, and the
		// panel all read one copy; 30s TTL keeps composer typing cheap.
		const promptCache = { at: 0, list: [] };
		async function getPrompts(force) {
			if (force !== true && Date.now() - promptCache.at < 30_000) return promptCache.list;
			const body = await fetchPrompts();
			if (body.ok === true) { promptCache.at = Date.now(); promptCache.list = body.prompts; }
			return promptCache.list;
		}
		function invalidatePrompts() { promptCache.at = 0; }
	// Fuzzy subsequence match: every query char appears in order (gaps
	// allowed), so "dp" finds "deploy-pipeline" and multi-word fragments
	// match across slug, name, and body without exact substrings.
	function subsequenceHit(query, haystack) {
		let at = 0;
		for (const ch of query) {
			at = haystack.indexOf(ch, at);
			if (at < 0) return false;
			at += 1;
		}
		return true;
	}
		//#endregion
		//#region lib/sidebar.js
// (v0.8) The sidebar entry rides the sanctioned sidebar.footer.action slot —
// the v0.7 MutationObserver/logoRow graft is retired (see lib/index.js).
const ICON = `<svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 2.5h7.5L13 5v8.5H3z"/><path d="M5.5 7h5M5.5 9.5h5M5.5 12h3"/></svg>`;
//#region lib/panel.js
		/**
		 * The overlay panel — pure DOM, no React. Two tabs (Global / Workspace)
		 * + custom path routing, monospace editor, save.
		 */
		function createPanel(onClose) {
			// --- State ---
			let tab = "global";
			let workspace = "";
			let customPath = null;
			let content = "";
			let saved = null;
			let busy = false;
			let state = null;
			let statusEl, pathEl, editorEl, saveBtnEl, tabHintEl, pickerEl, selectEl;

			// --- Helpers ---
			const setStatus = (kind, text) => {
				statusEl.textContent = text ?? "";
				statusEl.className = kind === "error" ? "rcx-status rcx-statusErr" : kind === "ok" ? "rcx-status rcx-statusOk" : "rcx-status";
			};
			const updateDirty = () => {
				const dirty = content !== (saved ?? "");
				saveBtnEl.disabled = busy || !dirty || (tab === "workspace" && workspace === "" && customPath === null);
				saveBtnEl.className = dirty ? "rcx-saveBtn rcx-saveDirty" : "rcx-saveBtn";
				if (!dirty && statusEl.className.indexOf("Err") === -1) statusEl.textContent = "";
				else if (dirty && statusEl.textContent === "") statusEl.textContent = t("action.dirty");
			};
			const updatePath = () => {
				const p = customPath !== null ? customPath : tab === "global" ? (state?.globalPath ?? "~/.dsh/AGENTS.md") : workspace !== "" ? `${workspace}/AGENTS.md` : "";
				pathEl.textContent = p;
			};
			const loadFile = () => {
				const scope = customPath !== null ? "custom" : tab;
				fetchFile(scope, workspace, customPath).then((body) => {
					if (body.ok !== true) throw new Error(body.error);
					content = body.content ?? "";
					saved = content;
					editorEl.value = content;
					updateDirty();
					updatePath();
				}).catch((cause) => setStatus("error", `${t("error.generic")}: ${cause.message}`));
			};

			// --- Build DOM ---
			const scrim = document.createElement("div");
			scrim.className = "rcx-scrim";
			scrim.addEventListener("click", (event) => { if (event.target === scrim) onClose(); });

			const card = document.createElement("div");
			card.className = "rcx-card";
			card.setAttribute("aria-label", t("panel.title"));

			// Header
			const head = document.createElement("div");
			head.className = "rcx-head";
			const titleRow = document.createElement("div");
			titleRow.className = "rcx-titleRow";
			const title = document.createElement("span");
			title.className = "rcx-title";
			title.textContent = t("panel.title");
			pathEl = document.createElement("span");
			pathEl.className = "rcx-path";
			pathEl.title = t("entry.tooltip");
			pathEl.addEventListener("click", () => {
				const input = document.createElement("input");
				input.type = "text";
				input.className = "rcx-pathInput";
				input.value = pathEl.textContent;
				input.spellcheck = false;
				pathEl.replaceWith(input);
				input.focus();
				input.select();
				const commit = () => {
					const trimmed = input.value.trim();
					const absoluteish = trimmed.startsWith("/") || /^[A-Za-z]:[\\/]/.test(trimmed);
					if (absoluteish && trimmed !== pathEl.textContent) {
						customPath = trimmed;
					} else if (!absoluteish) {
						customPath = null;
					}
					input.replaceWith(pathEl);
					updatePath();
					if (customPath !== null) loadFile();
				};
				input.addEventListener("blur", commit);
				input.addEventListener("keydown", (event) => {
					event.stopPropagation();
					if (event.key === "Enter") { event.preventDefault(); commit(); }
					if (event.key === "Escape") { event.stopPropagation(); input.replaceWith(pathEl); updatePath(); }
				});
			});
			const closeBtn = document.createElement("button");
			closeBtn.type = "button";
			closeBtn.className = "rcx-closeBtn";
			closeBtn.setAttribute("aria-label", t("action.close"));
			closeBtn.textContent = "\u00d7";
			closeBtn.addEventListener("click", onClose);
			titleRow.append(title, pathEl, closeBtn);
			head.append(titleRow);
			card.append(head);

			// Tabs
			const tabs = document.createElement("div");
			tabs.className = "rcx-tabs";
			const tabGlobal = document.createElement("button");
			tabGlobal.type = "button";
			tabGlobal.className = "rcx-tab rcx-tabOn";
			tabGlobal.textContent = t("tab.global");
			const tabWorkspace = document.createElement("button");
			tabWorkspace.type = "button";
			tabWorkspace.className = "rcx-tab";
			tabWorkspace.textContent = t("tab.workspace");
			const tabPrompts = document.createElement("button");
			tabPrompts.type = "button";
			tabPrompts.className = "rcx-tab";
			tabPrompts.textContent = t("tab.prompts");
			tabHintEl = document.createElement("span");
			tabHintEl.className = "rcx-tabHint";
			const setTab = (next) => {
				tab = next;
				customPath = null;
				tabGlobal.className = next === "global" ? "rcx-tab rcx-tabOn" : "rcx-tab";
				tabWorkspace.className = next === "workspace" ? "rcx-tab rcx-tabOn" : "rcx-tab";
				tabPrompts.className = next === "prompts" ? "rcx-tab rcx-tabOn" : "rcx-tab";
				tabHintEl.textContent = next === "global" ? t("tab.global.hint") : next === "prompts" ? t("tab.prompts.hint") : t("tab.workspace.hint");
				pickerEl.style.display = next === "workspace" ? "" : "none";
				sourcesEl.style.display = next === "global" ? "" : "none";
				editorWrap.style.display = next === "prompts" ? "none" : "";
				promptsEl.style.display = next === "prompts" ? "" : "none";
				if (next === "prompts") loadPrompts();
				else loadFile();
			};
			tabGlobal.addEventListener("click", () => setTab("global"));
			tabWorkspace.addEventListener("click", () => setTab("workspace"));
			tabPrompts.addEventListener("click", () => setTab("prompts"));
			tabs.append(tabGlobal, tabWorkspace, tabPrompts, tabHintEl);
			card.append(tabs);

			// Sources section (Global tab only) — scan + switch AGENTS.md default
			const sourcesEl = document.createElement("div");
			sourcesEl.className = "rcx-sources";
			sourcesEl.style.display = "none"; // hidden by default, shown on Global tab
			const sourcesHead = document.createElement("div");
			sourcesHead.className = "rcx-sourcesHead";
			const sourcesTitle = document.createElement("span");
			sourcesTitle.className = "rcx-sourcesTitle";
			sourcesTitle.textContent = t("sources.title");
			const sourcesHint = document.createElement("span");
			sourcesHint.className = "rcx-sourcesHint";
			sourcesHint.textContent = t("sources.hint");
			sourcesHead.append(sourcesTitle, sourcesHint);
			const sourceList = document.createElement("div");
			sourceList.className = "rcx-sourceList";
			sourcesEl.append(sourcesHead, sourceList);
			card.append(sourcesEl);

			const loadSources = () => {
				fetch(`${API}/sources`).then((res) => res.json()).then((body) => {
					if (body.ok !== true) return;
					sourceList.innerHTML = "";
					for (const source of body.sources) {
						if (!source.exists) continue;
						const row = document.createElement("div");
						row.className = body.currentDefault === source.path ? "rcx-sourceRow rcx-sourceOn" : "rcx-sourceRow";
						row.title = source.path;
						const label = document.createElement("span");
						label.className = "rcx-sourceLabel";
						label.textContent = source.label;
						const meta = document.createElement("span");
						meta.className = "rcx-sourceMeta";
						meta.textContent = `${source.lines} ${t("sources.lines")}`;
						row.append(label, meta);
						if (body.currentDefault === source.path) {
							const badge = document.createElement("span");
							badge.className = "rcx-sourceMeta";
							badge.style.color = "var(--dsw-alias-state-business-primary)";
							badge.textContent = "\u2713 " + t("sources.current");
							row.append(badge);
						} else if (!source.path.includes("/.dsh/")) {
							const btn = document.createElement("button");
							btn.type = "button";
							btn.className = "rcx-sourceBtn";
							btn.textContent = t("sources.set_default");
							btn.addEventListener("click", (event) => {
								event.stopPropagation();
								fetch(`${API}/default`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ target: source.path }) })
									.then((res) => res.json())
									.then(() => { loadSources(); loadFile(); });
							});
							row.append(btn);
						}
						sourceList.append(row);
					}
					// Reset button if a symlink is active
					if (body.currentDefault !== null) {
						const resetRow = document.createElement("div");
						resetRow.className = "rcx-sourceRow";
						const resetBtn = document.createElement("button");
						resetBtn.type = "button";
						resetBtn.className = "rcx-sourceBtn";
						resetBtn.textContent = t("sources.reset");
						resetBtn.addEventListener("click", () => {
							fetch(`${API}/default`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ target: "", reset: true }) })
								.then((res) => res.json())
								.then(() => { loadSources(); loadFile(); });
						});
						resetRow.append(resetBtn);
						sourceList.append(resetRow);
					}
				}).catch(() => {});
			};
			loadSources();

			// Prompts tab section: list + inline editor, one markdown file per
			// prompt on the host. The chat-side surfaces (@ trigger, dock row)
			// read the same cache this editor invalidates.
			let promptsEl = document.createElement("div");
			promptsEl.className = "rcx-prompts";
			promptsEl.style.display = "none";
			const promptsHead = document.createElement("div");
			promptsHead.className = "rcx-sourcesHead";
			const promptsTitle = document.createElement("span");
			promptsTitle.className = "rcx-sourcesTitle";
			promptsTitle.textContent = t("tab.prompts");
			const promptsNew = document.createElement("button");
			promptsNew.type = "button";
			promptsNew.className = "rcx-sourceBtn";
			promptsNew.textContent = t("prompts.new");
			promptsHead.append(promptsTitle, promptsNew);
			const promptList = document.createElement("div");
			promptList.className = "rcx-promptList";
			const promptForm = document.createElement("div");
			promptForm.className = "rcx-promptForm";
			const promptName = document.createElement("input");
			promptName.className = "rcx-promptNameInput";
			promptName.placeholder = t("prompts.name");
			promptName.spellcheck = false;
			const promptDesc = document.createElement("input");
			promptDesc.className = "rcx-promptNameInput";
			promptDesc.placeholder = t("prompts.description");
			promptDesc.spellcheck = false;
			const promptBody = document.createElement("textarea");
			promptBody.className = "rcx-promptBody";
			promptBody.placeholder = t("prompts.body");
			promptBody.spellcheck = false;
			const promptActions = document.createElement("div");
			promptActions.className = "rcx-promptActions";
			const promptSave = document.createElement("button");
			promptSave.type = "button";
			promptSave.className = "rcx-sourceBtn";
			promptSave.textContent = t("prompts.save");
			const promptDelete = document.createElement("button");
			promptDelete.type = "button";
			promptDelete.className = "rcx-sourceBtn";
			promptDelete.textContent = t("prompts.delete");
			const promptStatus = document.createElement("span");
			promptStatus.className = "rcx-sourceMeta";
			promptActions.append(promptDelete, promptSave, promptStatus);
			promptForm.append(promptName, promptDesc, promptBody, promptActions);
			promptsEl.append(promptsHead, promptList, promptForm);
			card.append(promptsEl);

			let selectedSlug = null;
			const setPromptStatus = (text, isError) => {
				promptStatus.textContent = text ?? "";
				promptStatus.style.color = isError === true ? "var(--dsw-alias-state-error-primary)" : "";
			};
			const clearPromptForm = () => {
				selectedSlug = null;
				promptName.value = "";
				promptDesc.value = "";
				promptBody.value = "";
				promptDelete.style.display = "none";
				setPromptStatus("");
			};
			const loadPrompts = () => {
				getPrompts(true).then((list) => {
					promptList.innerHTML = "";
					if (list.length === 0) {
						const emptyRow = document.createElement("div");
						emptyRow.className = "rcx-sourceLabel";
						emptyRow.style.padding = "10px 14px";
						emptyRow.textContent = t("prompts.empty");
						promptList.append(emptyRow);
					}
					for (const prompt of list) {
						const row = document.createElement("div");
						row.className = "rcx-promptRow" + (prompt.slug === selectedSlug ? " rcx-sourceOn" : "");
						row.title = prompt.description || prompt.body.replace(/\s+/g, " ").slice(0, 120);
						const label = document.createElement("span");
						label.className = "rcx-sourceLabel";
						label.textContent = prompt.name;
						const meta = document.createElement("span");
						meta.className = "rcx-sourceMeta";
						meta.textContent = `@${prompt.slug}`;
						row.append(label, meta);
						row.addEventListener("click", () => {
							selectedSlug = prompt.slug;
							promptName.value = prompt.slug;
							promptDesc.value = prompt.description ?? "";
							promptBody.value = prompt.body;
							promptDelete.style.display = "";
							setPromptStatus("");
							for (const other of promptList.children) other.classList.remove("rcx-sourceOn");
							row.classList.add("rcx-sourceOn");
						});
						promptList.append(row);
					}
				}).catch(() => {});
			};
			promptsNew.addEventListener("click", () => { clearPromptForm(); promptName.focus(); });
			promptDelete.addEventListener("click", () => {
				if (selectedSlug === null || !window.confirm(t("prompts.confirmDelete"))) return;
				mutatePrompt({ op: "delete", slug: selectedSlug }).then((body) => {
					invalidatePrompts();
					if (body.ok !== true) { setPromptStatus(body.error ?? t("error.generic"), true); return; }
					clearPromptForm();
					loadPrompts();
				});
			});
			promptSave.addEventListener("click", () => {
				const slug = promptName.value.trim().toLowerCase().replaceAll(" ", "-");
				if (slug === "" || promptBody.value.trim() === "") { setPromptStatus(t("error.generic"), true); return; }
				mutatePrompt({ op: "save", slug, description: promptDesc.value, body: promptBody.value }).then((body) => {
					invalidatePrompts();
					if (body.ok !== true) { setPromptStatus(body.error ?? t("error.generic"), true); return; }
					selectedSlug = slug;
					promptName.value = slug;
					promptDelete.style.display = "";
					setPromptStatus(t("prompts.updated"));
					loadPrompts();
				});
			});

			// Workspace picker
			pickerEl = document.createElement("div");
			pickerEl.className = "rcx-picker";
			pickerEl.style.display = "none";
			selectEl = document.createElement("select");
			selectEl.className = "rcx-select";
			selectEl.addEventListener("change", () => { workspace = selectEl.value; loadFile(); });
			pickerEl.append(selectEl);
			card.append(pickerEl);

			// Editor
			const editorWrap = document.createElement("div");
			editorWrap.className = "rcx-editorWrap";
			editorEl = document.createElement("textarea");
			editorEl.className = "rcx-editor";
			editorEl.spellcheck = false;
			editorEl.placeholder = t("editor.placeholder");
			editorEl.addEventListener("input", () => { content = editorEl.value; updateDirty(); });
			editorEl.addEventListener("keydown", (event) => {
				if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") { event.preventDefault(); saveBtnEl.click(); }
				if (event.key === "Escape") { event.stopPropagation(); onClose(); }
			});
			editorWrap.append(editorEl);
			card.append(editorWrap);

			// Footer
			const footer = document.createElement("div");
			footer.className = "rcx-footer";
			statusEl = document.createElement("span");
			statusEl.className = "rcx-status";
			saveBtnEl = document.createElement("button");
			saveBtnEl.type = "button";
			saveBtnEl.className = "rcx-saveBtn";
			saveBtnEl.textContent = t("action.save");
			saveBtnEl.disabled = true;
			saveBtnEl.addEventListener("click", () => {
				busy = true;
				saveBtnEl.disabled = true;
				const body = customPath !== null ? { scope: "custom", path: customPath, content } : { scope: tab, workspace, content };
				saveFile(body).then((result) => {
					if (result.ok !== true) throw new Error(result.error);
					saved = content;
					setStatus("ok", `${t("action.saved")} — ${customPath !== null ? result.path : tab === "global" ? t("effect.global") : t("effect.workspace")}`);
				}).catch((cause) => {
					setStatus("error", `${t("error.generic")}: ${cause.message}`);
				}).finally(() => {
					busy = false;
					updateDirty();
				});
			});
			footer.append(statusEl, saveBtnEl);
			card.append(footer);

			scrim.append(card);

			// --- Init ---
			fetchState().then((body) => {
				if (body.ok !== true) return;
				state = body;
				for (const slug of body.workspaces ?? []) {
					const option = document.createElement("option");
					option.value = slug;
					option.textContent = slug;
					selectEl.append(option);
				}
				loadFile();
			}).catch(() => {});
			setTab("global");

			return scrim;
		}
		//#endregion
		//#region lib/index.js
		const inject = ["locale", "slots", "inputTriggers"];
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { en, zh }), "rich-context: dictionaries");

			// Chat access, surface 1: the native composer trigger pipeline.
			// Typing @<query> offers the stored prompts; a pick inserts the
			// full prompt body at the trigger span (PickOutcome {text}).
			ctx.inject(["inputTriggers"], (scope) => {
				ctx.effect(() => scope.inputTriggers.registerSource({
					trigger: "@",
					name: "prompts",
					order: 20,
					async candidates(_session, req) {
						const query = String(req?.query ?? "").trim().toLowerCase();
						const list = await getPrompts();
						if (list.length === 0) return [];
						const scored = [];
						for (const prompt of list) {
							const hay = `${prompt.slug} ${prompt.name} ${prompt.body}`.toLowerCase();
							if (query !== "" && subsequenceHit(query, hay) === false) continue;
							scored.push(prompt);
						}
						return scored.slice(0, 8).map((prompt) => ({
								name: prompt.name,
								description: prompt.description !== "" && prompt.description !== undefined
									? prompt.description.slice(0, 80)
									: prompt.body.replace(/\s+/g, " ").slice(0, 80),
								hint: "@" + prompt.slug,
								value: prompt.slug,
							}));
					},
					onPick(pick) {
						const slug = pick?.candidate?.value;
						const prompt = promptCache.list.find((entry) => entry.slug === slug);
						if (prompt === undefined) return undefined;
							return { text: prompt.body + String.fromCharCode(10) };
						},
				}), "rich-context: @prompts trigger source");
			});

			// (v0.8) The composer dock row is retired (2026-09-07 declutter): prompts
			// stay reachable through the @ trigger and the panel's Prompts tab.

			let open = false;
			let listeners = new Set();
			let panel = null;
			let onKey = null;
			const isOpen = () => open;
			const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
			const setOpen = (value) => {
				if (open === value) return;
				open = value;
				for (const listener of [...listeners]) listener();
			};
			const teardown = () => {
				if (onKey !== null) { document.removeEventListener("keydown", onKey, true); onKey = null; }
				setOpen(false);
				if (panel !== null) { panel.remove(); panel = null; }
			};
			const openPanel = () => {
				if (open) return;
				panel = createPanel(() => teardown());
				document.body.appendChild(panel);
				onKey = (event) => { if (event.key === "Escape") { event.stopPropagation(); teardown(); } };
				document.addEventListener("keydown", onKey, true);
				setOpen(true);
			};

			// The sanctioned seat: an action beside Settings in the sidebar
			// foot (wide row / rail icon), replacing the v0.7 DOM graft.
			ctx.slots.inject("sidebar.footer.action", () => {
				const react = require("react");
				const jsxRuntime = require("react/jsx-runtime");
				const useState = react.useState;
				function ContextFooterAction(props) {
					const wide = props.wide !== false;
					const [on, setOn] = useState(false);
					react.useEffect(() => {
						const dispose = subscribe(() => setOn(isOpen()));
						setOn(isOpen());
						return dispose;
					}, []);
					return jsxRuntime.jsxs("button", {
						type: "button",
						className: "rcx-entry" + (wide === false ? " rcx-entryRail" : ""),
						"aria-label": t("entry.tooltip"),
						"aria-pressed": on,
						title: t("entry.tooltip"),
						onClick: () => { if (open) teardown(); else openPanel(); },
						children: [
							jsxRuntime.jsx("span", { className: "rcx-entryIcon", dangerouslySetInnerHTML: { __html: ICON } }),
							wide === true ? jsxRuntime.jsx("span", { className: "rcx-entryLabel", children: t("entry.label") }) : null,
						],
					});
				}
				ctx.slots.register({
					name: "sidebar.footer.action",
					id: "rich-context",
					order: 20,
					locale: NS,
				}, ContextFooterAction);
			});

			return () => { teardown(); };
		}
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
