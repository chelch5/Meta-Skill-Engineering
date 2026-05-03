import { invoke } from '@tauri-apps/api/core';
import {
  Activity,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Gauge,
  Library,
  Play,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  createIcons,
} from 'lucide';
import './styles.css';

type ViewId = 'overview' | 'skills' | 'evaluation' | 'library' | 'runs' | 'settings';

interface StudioActionResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  exit_code: number;
}

interface State {
  activeView: ViewId;
  busy: string | null;
  message: string;
  actions: unknown[];
  skills: unknown[];
  runs: unknown[];
  validation: unknown | null;
}

const app = document.querySelector<HTMLDivElement>('#app');
const state: State = {
  activeView: 'overview',
  busy: null,
  message: 'Studio ready.',
  actions: [],
  skills: [],
  runs: [],
  validation: null,
};

void refreshAll();

async function refreshAll(): Promise<void> {
  state.busy = 'refresh';
  render();
  try {
    const [actions, skills, runs] = await Promise.all([
      studioJson('list-actions'),
      studioJson('list-skills'),
      studioJson('list-runs'),
    ]);
    state.actions = toArray(actions);
    state.skills = toArray(skills);
    state.runs = toArray(runs);
    state.message = 'Studio contract loaded.';
  } catch (error) {
    state.message = error instanceof Error ? error.message : String(error);
  } finally {
    state.busy = null;
    render();
  }
}

async function runValidation(): Promise<void> {
  state.busy = 'validate';
  render();
  try {
    state.validation = await studioJson('validate-skills');
    state.message = 'Skill validation finished.';
  } catch (error) {
    state.message = error instanceof Error ? error.message : String(error);
  } finally {
    state.busy = null;
    render();
  }
}

async function studioJson(action: string): Promise<unknown> {
  const result = await invoke<StudioActionResult>('run_studio_action', {
    action,
    args: ['--format', 'json'],
  });
  if (!result.ok) {
    throw new Error(result.stderr || result.stdout || `${action} failed with ${result.exit_code}`);
  }
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}

function render(): void {
  if (!app) {
    return;
  }

  app.innerHTML = `
    <main class="shell">
      <aside class="rail">
        <div class="brand">
          <div class="mark">MS</div>
          <div>
            <strong>Meta Skill Studio</strong>
            <span>OpenCode runtime</span>
          </div>
        </div>
        <nav>
          ${nav('overview', 'gauge', 'Overview')}
          ${nav('skills', 'brain-circuit', 'Skills')}
          ${nav('evaluation', 'clipboard-list', 'Evaluation')}
          ${nav('library', 'library', 'Library')}
          ${nav('runs', 'activity', 'Runs')}
          ${nav('settings', 'settings', 'Settings')}
        </nav>
      </aside>
      <section class="workspace">
        <header>
          <div>
            <h1>${title(state.activeView)}</h1>
            <p>${escapeText(state.message)}</p>
          </div>
          <div class="actions">
            <button class="icon" data-action="refresh" title="Refresh" ${state.busy ? 'disabled' : ''}><i data-lucide="refresh-cw"></i></button>
            <button class="primary" data-action="validate" ${state.busy ? 'disabled' : ''}><i data-lucide="shield-check"></i><span>Validate</span></button>
          </div>
        </header>
        ${state.activeView === 'overview' ? overview() : ''}
        ${state.activeView === 'skills' ? skillsView() : ''}
        ${state.activeView === 'evaluation' ? evaluationView() : ''}
        ${state.activeView === 'library' ? libraryView() : ''}
        ${state.activeView === 'runs' ? runsView() : ''}
        ${state.activeView === 'settings' ? settingsView() : ''}
      </section>
    </main>
  `;

  bind();
  createIcons({
    icons: {
      Activity,
      Boxes,
      BrainCircuit,
      CheckCircle2,
      ClipboardList,
      Gauge,
      Library,
      Play,
      RefreshCw,
      Search,
      Settings,
      ShieldCheck,
      Sparkles,
    },
  });
}

function overview(): string {
  return `
    <section class="metrics">
      ${metric('Actions', state.actions.length, 'sparkles')}
      ${metric('Root Skills', state.skills.length, 'brain-circuit')}
      ${metric('Runs', state.runs.length, 'activity')}
      ${metric('Validation', state.validation ? 'loaded' : 'idle', 'shield-check')}
    </section>
    <section class="band">
      <h2>Pipeline</h2>
      <div class="pipeline">
        <span>Harvest</span><span>Evaluate</span><span>Improve</span><span>Package</span><span>Install</span>
      </div>
    </section>
  `;
}

function skillsView(): string {
  const rows = state.skills.map((skill) => {
    const row = asRecord(skill);
    return `<tr><td>${field(row, 'name', 'folder')}</td><td>${field(row, 'description', 'purpose')}</td><td>${field(row, 'status', 'tier')}</td></tr>`;
  }).join('');
  return table(['Skill', 'Description', 'State'], rows);
}

function evaluationView(): string {
  return `
    <section class="panel">
      <div class="panel-head">
        <h2>Validation Result</h2>
        <button class="primary" data-action="validate" ${state.busy ? 'disabled' : ''}><i data-lucide="play"></i><span>Run</span></button>
      </div>
      <pre>${escapeText(state.validation ? JSON.stringify(state.validation, null, 2) : 'No validation result loaded.')}</pre>
    </section>
  `;
}

function libraryView(): string {
  const rows = [
    ['Library', 'verified'],
    ['LibraryWorkbench', 'under evaluation'],
    ['LibraryUnverified', 'unverified intake'],
  ].map(([name, status]) => `<tr><td>${name}</td><td>${status}</td><td>repo-local</td></tr>`).join('');
  return table(['Tier', 'State', 'Boundary'], rows);
}

function runsView(): string {
  const rows = state.runs.map((run) => {
    const row = asRecord(run);
    return `<tr><td>${field(row, 'run_id', 'id')}</td><td>${field(row, 'action')}</td><td>${field(row, 'created_at', 'timestamp')}</td></tr>`;
  }).join('');
  return table(['Run', 'Action', 'Created'], rows);
}

function settingsView(): string {
  return `
    <section class="panel">
      <div class="panel-head"><h2>Runtime Contract</h2><span>OpenCode SDK</span></div>
      ${table(['Field', 'Value'], `
        <tr><td>Headless surface</td><td>scripts/meta-skill-studio.py --mode cli</td></tr>
        <tr><td>SDK bridge</td><td>scripts/meta_skill_studio/opencode_sdk_bridge.mjs</td></tr>
        <tr><td>Default model</td><td>minimax-coding-plan/MiniMax-M2.7</td></tr>
      `)}
    </section>
  `;
}

function metric(label: string, value: number | string, icon: string): string {
  return `<div class="metric"><i data-lucide="${icon}"></i><span>${label}</span><strong>${value}</strong></div>`;
}

function table(headings: string[], rows: string): string {
  return `<div class="table-wrap"><table><thead><tr>${headings.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${headings.length}" class="empty">No rows.</td></tr>`}</tbody></table></div>`;
}

function nav(view: ViewId, icon: string, label: string): string {
  return `<button class="${state.activeView === view ? 'active' : ''}" data-view="${view}"><i data-lucide="${icon}"></i><span>${label}</span></button>`;
}

function bind(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeView = button.dataset.view as ViewId;
      render();
    });
  });
  document.querySelectorAll<HTMLButtonElement>('[data-action="refresh"]').forEach((button) => {
    button.addEventListener('click', () => void refreshAll());
  });
  document.querySelectorAll<HTMLButtonElement>('[data-action="validate"]').forEach((button) => {
    button.addEventListener('click', () => void runValidation());
  });
}

function title(view: ViewId): string {
  return {
    overview: 'Studio Overview',
    skills: 'Root Skills',
    evaluation: 'Evaluation',
    library: 'Library Tiers',
    runs: 'Run History',
    settings: 'Settings',
  }[view];
}

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['actions', 'skills', 'runs', 'items']) {
      if (Array.isArray(record[key])) {
        return record[key] as unknown[];
      }
    }
  }
  return [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function field(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).length > 0) {
      return escapeText(value);
    }
  }
  return '-';
}

function escapeText(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char] ?? char);
}
