window.__ModuleLoader__.load({
	id: "dsh-rich-context",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		const { jsx, jsxs } = react_jsx_runtime;
		const { useState, useEffect, useRef } = react;
		//#region lib/locale.js
		const NS = "rich-context";
		const en = {
			"entry.label": "Context",
			"entry.tooltip": "Manage AGENTS.md — the instruction files your agents read",
			"panel.title": "Agent context",
			"panel.pageTitle": "Agent context",
			"panel.pageIntro": "Edit the AGENTS.md instruction files the harness actually reads — user-global and per-workspace.",
			"tabs.label": "Agent context sections",
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
			"prompts.preview": "Preview",
		};
		const zh = {
			"entry.label": "上下文",
			"entry.tooltip": "管理 AGENTS.md——agent 实际读取的指令文件",
			"panel.title": "Agent 上下文",
			"panel.pageTitle": "Agent 上下文",
			"panel.pageIntro": "编辑 harness 实际读取的 AGENTS.md 指令文件——用户全局与各工作区。",
			"tabs.label": "Agent 上下文分区",
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
			"prompts.updated": "已更新",
			"prompts.dockHint": "在输入框输入 @name 即可插入提示词",
			"prompts.copy": "复制",
			"prompts.copied": "已复制",
			"prompts.preview": "预览",
		};
		const lang = (typeof navigator !== "undefined" && /^(zh)/i.test(navigator.language ?? "")) ? "zh" : "en";
		const dict = { en, zh };
		const t = (key) => dict[lang][key] ?? dict.en[key] ?? key;
		//#endregion
		//#region lib/styles.js
		// Wave-2 stylesheet: layout glue only (page column, pageHead anatomy,
		// group structure, 32px section rhythm — .docs/native-page-template.md).
		// Every control is a dsh-client-ui-primitives component (Button, Input,
		// SegmentedTabs, Tag, PathLabel, Modal); the plain <textarea>/<select>
		// below are the rule-4 elements with no native equivalent, styled on
		// --dsw-alias-* tokens.
		const css = `.rcx-main{height:100%;overflow:auto;box-sizing:border-box;padding:0 clamp(24px,4vw,48px) 48px;display:flex;justify-content:center;align-items:flex-start}
.rcx-column{width:100%;max-width:960px;display:flex;flex-direction:column;gap:32px}
.rcx-pageHead{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding-top:28px}
[data-platform=darwin] .rcx-pageHead{padding-top:calc(28px + var(--dsh-frame-top-clearance,0px))}
.rcx-titleCol{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start}
.rcx-title{margin:0;font-size:20px;font-weight:500;line-height:28px;color:var(--dsw-alias-label-primary)}
.rcx-intro{margin:4px 0 0;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary)}
.rcx-headBar{flex:0 1 auto;min-width:220px;max-width:60%;display:flex;justify-content:flex-end;align-items:center;gap:12px}
.rcx-pathLabel{cursor:pointer;min-width:0}
.rcx-pathInput{flex:1;min-width:180px}
.rcx-tabsRow{display:flex;align-items:center;gap:16px}
.rcx-tabs{flex:0 1 420px;min-width:280px}
.rcx-tabHint{flex:1;min-width:0;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rcx-tabPanel{display:flex;flex-direction:column;gap:16px}
.rcx-group{display:flex;flex-direction:column;gap:8px}
.rcx-groupHead{display:flex;align-items:baseline;gap:8px}
.rcx-groupTitle{margin:0;font-size:14px;font-weight:500;line-height:22px;color:var(--dsw-alias-label-primary)}
.rcx-groupHint{flex:1;min-width:0;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rcx-list{display:flex;flex-direction:column;gap:2px}
.rcx-promptList{max-height:200px;overflow-y:auto}
.rcx-row{display:flex;align-items:center;gap:8px;padding:4px 8px;margin:0 -8px;border-radius:var(--dsw-radius-md)}
.rcx-row:hover{background:var(--dsw-alias-interactive-bg-hover)}
.rcx-rowClick{cursor:pointer}
.rcx-rowLabel{flex:1;min-width:0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rcx-rowMeta{flex:none;color:var(--dsw-alias-label-caption);font-size:12px;line-height:16px;font-variant-numeric:tabular-nums}
.rcx-emptyHint{padding:8px;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}
.rcx-select{width:100%;max-width:480px;height:32px;border:0.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-1);border-radius:var(--dsw-radius-md);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;line-height:22px;padding:0 8px}
.rcx-select:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.rcx-editorCard{display:flex;min-height:360px;border:0.5px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-xl);background:var(--dsw-alias-bg-layer-1)}
.rcx-editorCard:focus-within{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.rcx-editor{flex:1;min-height:0;width:100%;resize:none;border:none;outline:none;background:transparent;color:var(--dsw-alias-label-primary);font-family:ui-monospace,monospace;font-size:12.5px;line-height:19px;padding:10px 16px}
.rcx-footer{display:flex;align-items:center;gap:12px}
.rcx-status{flex:1;min-width:0;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rcx-statusOk{color:var(--dsw-alias-state-success-primary)}
.rcx-statusErr{color:var(--dsw-alias-state-error-primary)}
.rcx-promptForm{display:flex;flex-direction:column;gap:8px}
.rcx-promptBody{min-height:140px;resize:vertical;border:0.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-1);border-radius:var(--dsw-radius-md);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;font-family:ui-monospace,monospace;padding:8px 10px}
.rcx-promptBody:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.rcx-formActions{display:flex;align-items:center;gap:8px}
.rcx-formStatus{flex:1;min-width:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rcx-previewModal{width:min(560px,100%)}
.rcx-previewBody{max-height:min(48vh,420px);overflow:auto;font-family:ui-monospace,monospace;font-size:12px;line-height:18px;white-space:pre-wrap;color:var(--dsw-alias-label-secondary)}
.rcx-previewHint{margin-right:auto;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}`;
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
		//#region lib/panel-slot.js
		// Sanctioned surface (0.1.6+): a sidebar.panellist row plus a keyed main
		// panel — the same pair the built-in Plugins entry registers. The shell
		// owns the row chrome (icon button, hover, 500ms tooltip, active state);
		// the page itself is a React island built from the app's own primitives
		// (.docs/native-components.md), mounted by the shell through the main slot.
		const PANEL_ID = "rich-context";
		const ICON_PATHS = '<path d="M3 2.5h7.5L13 5v8.5H3z"/><path d="M5.5 7h5M5.5 9.5h5M5.5 12h3"/>';
		function PanelIcon({ size }) {
			return jsx("svg", {
				viewBox: "0 0 16 16", width: size ?? 18, height: size ?? 18,
				fill: "none", stroke: "currentColor", strokeWidth: 1.3,
				strokeLinecap: "round", strokeLinejoin: "round",
				"aria-hidden": true,
				dangerouslySetInnerHTML: { __html: ICON_PATHS },
			});
		}
		function MainPanel() {
			return jsx(ContextPage, null);
		}
		//#endregion
		//#region lib/panel.js
		/**
		 * The hosted page — a React tree of the app's primitives: SegmentedTabs
		 * for Global/Workspace/Prompts, PathLabel + Input for the click-to-edit
		 * target path, Button for every action, Tag for the accent markers, and
		 * Modal for the prompt preview. The editor and the workspace picker are
		 * the rule-4 plain elements (textarea/select). All fetch/state logic is
		 * the pre-rewrite behavior, ported as-is.
		 */
		function ContextPage() {
			const [tab, setTab] = useState("global");
			const [workspace, setWorkspace] = useState("");
			const [customPath, setCustomPath] = useState(null);
			const [content, setContent] = useState("");
			const [saved, setSaved] = useState(null);
			const [busy, setBusy] = useState(false);
			const [state, setState] = useState(null);
			const [status, setStatus] = useState(null);
			const [pathEditing, setPathEditing] = useState(false);
			const [pathDraft, setPathDraft] = useState("");
			const [sources, setSources] = useState(null);
			const [reloadKey, setReloadKey] = useState(0);
			const pathInputRef = useRef(null);

			const scope = customPath !== null ? "custom" : tab;
			const path = customPath !== null ? customPath
				: tab === "global" ? (state?.globalPath ?? "~/.dsh/AGENTS.md")
				: workspace !== "" ? `${workspace}/AGENTS.md` : "";
			const dirty = content !== (saved ?? "");
			const canSave = !busy && dirty && !(tab === "workspace" && workspace === "" && customPath === null);
			const statusView = status ?? (dirty ? { kind: "dirty", text: t("action.dirty") } : { kind: null, text: "" });

			// Panel bootstrap: workspace list + global path from the same /state
			// route the pure-DOM builder read once at build time.
			useEffect(() => {
				let cancelled = false;
				fetchState().then((body) => {
					if (cancelled || body.ok !== true) return;
					setState(body);
				}).catch(() => {});
				return () => { cancelled = true; };
			}, []);

			// File loading follows the active target exactly like the old
			// loadFile(): tab switches, workspace picks, custom-path commits, and
			// default-source switches each refetch. A workspace tab with no pick
			// shows an empty editor instead of a guaranteed-failing fetch.
			useEffect(() => {
				if (tab === "prompts") return;
				let cancelled = false;
				if (scope === "workspace" && workspace === "") {
					setContent("");
					setSaved("");
					setStatus(null);
					return;
				}
				setStatus(null);
				fetchFile(scope, workspace, customPath).then((body) => {
					if (cancelled) return;
					if (body.ok !== true) throw new Error(body.error);
					setContent(body.content ?? "");
					setSaved(body.content ?? "");
				}).catch((cause) => {
					if (!cancelled) setStatus({ kind: "error", text: `${t("error.generic")}: ${cause.message}` });
				});
				return () => { cancelled = true; };
			}, [scope, tab, workspace, customPath, reloadKey]);

			// Source scan for the Global tab (same /sources route as before).
			const loadSources = () => {
				fetch(`${API}/sources`).then((res) => res.json()).then((body) => {
					if (body.ok === true) setSources(body);
				}).catch(() => {});
			};
			useEffect(() => { loadSources(); }, []);
			const setDefaultSource = (target, reset) => {
				fetch(`${API}/default`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(reset === true ? { target: "", reset: true } : { target }) })
					.then((res) => res.json())
					.then(() => { loadSources(); setReloadKey((key) => key + 1); });
			};

			const save = () => {
				if (!canSave) return;
				setBusy(true);
				const body = customPath !== null ? { scope: "custom", path: customPath, content } : { scope: tab, workspace, content };
				saveFile(body).then((result) => {
					if (result.ok !== true) throw new Error(result.error);
					setSaved(content);
					setStatus({ kind: "ok", text: `${t("action.saved")} — ${customPath !== null ? result.path : tab === "global" ? t("effect.global") : t("effect.workspace")}` });
				}).catch((cause) => {
					setStatus({ kind: "error", text: `${t("error.generic")}: ${cause.message}` });
				}).finally(() => setBusy(false));
			};

			// Click-to-edit path: PathLabel swaps to a native Input; Enter (or
			// blur) commits, Escape cancels — the pre-rewrite contract. An
			// absolute-looking path becomes the custom target; anything else
			// drops back to the tab default.
			const commitPathEdit = () => {
				if (pathEditing === false) return;
				const trimmed = pathDraft.trim();
				const absoluteish = trimmed.startsWith("/") || /^[A-Za-z]:[\\/]/.test(trimmed);
				if (absoluteish && trimmed !== path) setCustomPath(trimmed);
				else if (!absoluteish) setCustomPath(null);
				setPathEditing(false);
			};
			useEffect(() => {
				if (pathEditing === false || pathInputRef.current === null) return;
				pathInputRef.current.focus();
				pathInputRef.current.select();
			}, [pathEditing]);

			const tabItems = [
				{ id: "rcx-tab-global", value: "global", label: t("tab.global"), panelId: "rcx-panel-global" },
				{ id: "rcx-tab-workspace", value: "workspace", label: t("tab.workspace"), panelId: "rcx-panel-workspace" },
				{ id: "rcx-tab-prompts", value: "prompts", label: t("tab.prompts"), panelId: "rcx-panel-prompts" },
			];
			const tabHint = tab === "global" ? t("tab.global.hint") : tab === "prompts" ? t("tab.prompts.hint") : t("tab.workspace.hint");

			return jsx("div", {
				className: "rcx-main",
				children: jsxs("div", {
					className: "rcx-column",
					children: [
						// Native pageHead anatomy: title + intro column left, path
						// action right, 28px top clearance (+darwin rule).
						jsxs("header", { className: "rcx-pageHead", children: [
							jsxs("div", { className: "rcx-titleCol", children: [
								jsx("h1", { className: "rcx-title", children: t("panel.pageTitle") }),
								jsx("p", { className: "rcx-intro", children: t("panel.pageIntro") }),
							] }),
							jsxs("div", { className: "rcx-headBar", children: [
								pathEditing
									? jsx(_deepseek_ai_dsh_client_ui_primitives.Input, {
										ref: pathInputRef,
										className: "rcx-pathInput",
										value: pathDraft,
										spellCheck: false,
										onChange: (event) => setPathDraft(event.currentTarget.value),
										onKeyDown: (event) => {
											event.stopPropagation();
											if (event.key === "Enter") { event.preventDefault(); commitPathEdit(); }
											if (event.key === "Escape") { event.preventDefault(); setPathEditing(false); }
										},
										onBlur: commitPathEdit,
									})
									: jsx(_deepseek_ai_dsh_client_ui_primitives.PathLabel, {
										path,
										className: "rcx-pathLabel",
										role: "button",
										tabIndex: 0,
										onClick: () => { setPathDraft(path); setPathEditing(true); },
										onKeyDown: (event) => {
											if (event.key === "Enter" || event.key === " ") {
												event.preventDefault();
												setPathDraft(path);
												setPathEditing(true);
											}
										},
									}),
							] }),
						] }),
						jsxs("div", { className: "rcx-tabsRow", children: [
							jsx(_deepseek_ai_dsh_client_ui_primitives.SegmentedTabs, {
								className: "rcx-tabs",
								items: tabItems,
								value: tab,
								label: t("tabs.label"),
								onChange: (next) => { setTab(next); setCustomPath(null); setPathEditing(false); },
							}),
							jsx("span", { className: "rcx-tabHint", children: tabHint }),
						] }),
						tab === "prompts"
							? jsx("div", { id: "rcx-panel-prompts", className: "rcx-tabPanel", children: jsx(PromptsSection, null) })
							: jsxs("div", { id: `rcx-panel-${tab}`, className: "rcx-tabPanel", children: [
								tab === "global" ? jsx(SourcesSection, { sources, onSetDefault: setDefaultSource }) : null,
								tab === "workspace" ? jsx("select", {
									className: "rcx-select",
									value: workspace,
									onChange: (event) => setWorkspace(event.currentTarget.value),
									children: [
										jsx("option", { value: "", disabled: true, children: t("workspace.placeholder") }),
										...(state?.workspaces ?? []).map((slug) => jsx("option", { value: slug, children: slug }, slug)),
									],
								}) : null,
								jsxs("div", { className: "rcx-editorCard", children: [
									jsx("textarea", {
										className: "rcx-editor",
										spellCheck: false,
										placeholder: t("editor.placeholder"),
										value: content,
										onChange: (event) => { setContent(event.currentTarget.value); if (status !== null) setStatus(null); },
										onKeyDown: (event) => {
											if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") { event.preventDefault(); save(); }
											if (event.key === "Escape") event.stopPropagation();
										},
									}),
								] }),
								jsxs("div", { className: "rcx-footer", children: [
									jsx("span", {
										className: "rcx-status" + (statusView.kind === "ok" ? " rcx-statusOk" : statusView.kind === "error" ? " rcx-statusErr" : ""),
										role: "status",
										children: statusView.text,
									}),
									jsx(_deepseek_ai_dsh_client_ui_primitives.Button, { variant: "primary", disabled: !canSave, onClick: save, children: t("action.save") }),
								] }),
							] }),
					],
				}),
			});
		}

		/** AGENTS.md source list (Global tab): native list rows with hover, the
		 *  current default marked by an accent Tag, switch/reset through Buttons. */
		function SourcesSection({ sources, onSetDefault }) {
			const current = sources?.currentDefault ?? null;
			const rows = (sources?.sources ?? []).filter((source) => source.exists === true);
			return jsxs("section", { className: "rcx-group", children: [
				jsxs("div", { className: "rcx-groupHead", children: [
					jsx("h2", { className: "rcx-groupTitle", children: t("sources.title") }),
					jsx("span", { className: "rcx-groupHint", children: t("sources.hint") }),
				] }),
				jsxs("div", { className: "rcx-list", children: [
					...rows.map((source) => jsxs("div", { className: "rcx-row", title: source.path, children: [
						jsx("span", { className: "rcx-rowLabel", children: source.label }),
						jsx("span", { className: "rcx-rowMeta", children: `${source.lines} ${t("sources.lines")}` }),
						current === source.path
							? jsx(_deepseek_ai_dsh_client_ui_primitives.Tag, { tone: "info", children: t("sources.current") })
							: source.path.includes("/.dsh/")
								? null
								: jsx(_deepseek_ai_dsh_client_ui_primitives.Button, { size: "sm", onClick: () => onSetDefault(source.path), children: t("sources.set_default") }),
					] }, source.path)),
					current !== null ? jsx("div", { className: "rcx-row", children: jsx(_deepseek_ai_dsh_client_ui_primitives.Button, { size: "sm", onClick: () => onSetDefault(null, true), children: t("sources.reset") }) }, "rcx-sources-reset") : null,
				] }),
			] });
		}

		/** Prompts tab: list + inline editor, one markdown file per prompt on the
		 *  host. Selection carries the accent through a Tag; the preview dialog is
		 *  the native Modal. The chat-side surfaces (@ trigger) read the same
		 *  cache this editor invalidates. */
		function PromptsSection() {
			const [list, setList] = useState([]);
			const [selectedSlug, setSelectedSlug] = useState(null);
			const [name, setName] = useState("");
			const [description, setDescription] = useState("");
			const [body, setBody] = useState("");
			const [formStatus, setFormStatus] = useState(null);
			const [version, setVersion] = useState(0);
			const [previewSlug, setPreviewSlug] = useState(null);
			const [copied, setCopied] = useState(false);
			const nameRef = useRef(null);

			useEffect(() => {
				let cancelled = false;
				getPrompts(true).then((prompts) => { if (!cancelled) setList(prompts); }).catch(() => {});
				return () => { cancelled = true; };
			}, [version]);

			const clearForm = () => {
				setSelectedSlug(null);
				setName("");
				setDescription("");
				setBody("");
				setFormStatus(null);
			};
			const selectPrompt = (prompt) => {
				setSelectedSlug(prompt.slug);
				setName(prompt.slug);
				setDescription(prompt.description ?? "");
				setBody(prompt.body);
				setFormStatus(null);
			};
			const savePrompt = () => {
				const slug = name.trim().toLowerCase().replaceAll(" ", "-");
				if (slug === "" || body.trim() === "") { setFormStatus({ text: t("error.generic"), isError: true }); return; }
				mutatePrompt({ op: "save", slug, description, body }).then((result) => {
					invalidatePrompts();
					if (result.ok !== true) { setFormStatus({ text: result.error ?? t("error.generic"), isError: true }); return; }
					setSelectedSlug(slug);
					setName(slug);
					setFormStatus({ text: t("prompts.updated"), isError: false });
					setVersion((key) => key + 1);
				});
			};
			const deletePrompt = () => {
				if (selectedSlug === null || !window.confirm(t("prompts.confirmDelete"))) return;
				mutatePrompt({ op: "delete", slug: selectedSlug }).then((result) => {
					invalidatePrompts();
					if (result.ok !== true) { setFormStatus({ text: result.error ?? t("error.generic"), isError: true }); return; }
					clearForm();
					setVersion((key) => key + 1);
				});
			};

			const preview = previewSlug === null ? null : list.find((prompt) => prompt.slug === previewSlug) ?? null;
			useEffect(() => { setCopied(false); }, [previewSlug]);
			const copyPreview = () => {
				if (preview === null) return;
				_deepseek_ai_dsh_client_ui_primitives.writeClipboard(preview.body).then((ok) => { if (ok) setCopied(true); });
			};

			return jsxs("section", { className: "rcx-group", children: [
				jsxs("div", { className: "rcx-groupHead", children: [
					jsx("h2", { className: "rcx-groupTitle", children: t("tab.prompts") }),
					jsx(_deepseek_ai_dsh_client_ui_primitives.Button, {
						size: "sm",
						icon: jsx(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutlineRegular, { size: 14 }),
						onClick: () => { clearForm(); if (nameRef.current !== null) nameRef.current.focus(); },
						children: t("prompts.new"),
					}),
				] }),
				jsxs("div", { className: "rcx-list rcx-promptList", children: list.length === 0
					? [jsx("div", { className: "rcx-emptyHint", children: t("prompts.empty") }, "rcx-prompts-empty")]
					: list.map((prompt) => jsxs("div", {
						className: "rcx-row rcx-rowClick",
						title: prompt.description || prompt.body.replace(/\s+/g, " ").slice(0, 120),
						onClick: () => selectPrompt(prompt),
						children: [
							jsx("span", { className: "rcx-rowLabel", children: prompt.name }),
							prompt.slug === selectedSlug
								? jsx(_deepseek_ai_dsh_client_ui_primitives.Tag, { tone: "info", children: `@${prompt.slug}` })
								: jsx("span", { className: "rcx-rowMeta", children: `@${prompt.slug}` }),
							jsx(_deepseek_ai_dsh_client_ui_primitives.Button, {
								size: "sm",
								onClick: (event) => { event.stopPropagation(); setPreviewSlug(prompt.slug); },
								children: t("prompts.preview"),
							}),
						],
					}, prompt.slug)) }),
				jsxs("div", { className: "rcx-promptForm", children: [
					jsx(_deepseek_ai_dsh_client_ui_primitives.Input, {
						ref: nameRef,
						placeholder: t("prompts.name"),
						spellCheck: false,
						value: name,
						onChange: (event) => setName(event.currentTarget.value),
					}),
					jsx(_deepseek_ai_dsh_client_ui_primitives.Input, {
						placeholder: t("prompts.description"),
						spellCheck: false,
						value: description,
						onChange: (event) => setDescription(event.currentTarget.value),
					}),
					jsx("textarea", {
						className: "rcx-promptBody",
						placeholder: t("prompts.body"),
						spellCheck: false,
						value: body,
						onChange: (event) => setBody(event.currentTarget.value),
					}),
					jsxs("div", { className: "rcx-formActions", children: [
						selectedSlug !== null ? jsx(_deepseek_ai_dsh_client_ui_primitives.Button, { size: "sm", onClick: deletePrompt, children: t("prompts.delete") }) : null,
						jsx(_deepseek_ai_dsh_client_ui_primitives.Button, { variant: "primary", size: "sm", onClick: savePrompt, children: t("prompts.save") }),
						formStatus !== null ? jsx("span", {
							className: "rcx-formStatus" + (formStatus.isError === true ? " rcx-statusErr" : ""),
							role: "status",
							children: formStatus.text,
						}) : null,
					] }),
				] }),
				jsx(_deepseek_ai_dsh_client_ui_primitives.Modal, {
					open: preview !== null,
					onClose: () => setPreviewSlug(null),
					title: preview?.name ?? "",
					closeLabel: t("action.close"),
					description: preview?.description || undefined,
					className: "rcx-previewModal",
					footer: jsxs(react.Fragment, { children: [
						jsx("span", { className: "rcx-previewHint", children: t("prompts.dockHint") }),
						jsx(_deepseek_ai_dsh_client_ui_primitives.Button, {
							size: "sm",
							icon: jsx(_deepseek_ai_dsh_client_ui_primitives.IconCopyOutlineRegular, { size: 14 }),
							onClick: copyPreview,
							children: copied ? t("prompts.copied") : t("prompts.copy"),
						}),
					] }),
					children: jsx("div", { className: "rcx-previewBody", children: preview?.body ?? "" }),
				}),
			] });
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

			// Sidebar + panel ride the sanctioned slots (see lib/panel-slot.js):
			// the shell owns the row chrome and panel selection; closing means
			// selecting another panel or the conversation, as with Plugins.
			ctx.slots.inject("main", () => ctx.slots.register({
				name: "main",
				key: PANEL_ID,
				locale: NS,
			}, MainPanel));
			ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
				name: "sidebar.panellist",
				id: PANEL_ID,
				order: 20,
				label: () => t("entry.label"),
				locale: NS,
			}, PanelIcon));

			return () => {};
		}
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
