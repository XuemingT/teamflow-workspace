import CreateModal from "../CreateModal";
import TaskDetail from "../TaskDetail";
import { useState } from "react";
import { PROJECTS, TASKS, UPDATES, type Project, type Task } from "../data";
import type { CreationMode } from "../App";
import { updateTaskStatus, updateProjectStatus } from "../../Kanbas/teamflowClient";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Avatar({ initials, color, size = 28 }: { initials: string; color: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
      style={{ background: color, width: size, height: size, minWidth: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}

function AvatarStack({ people, size = 22 }: { people: { initials: string; color: string }[]; size?: number }) {
  return (
    <div className="flex items-center">
      {people.slice(0, 4).map((p, i) => (
        <div key={i} style={{ marginLeft: i > 0 ? -6 : 0 }} className="ring-2 ring-white rounded-full">
          <Avatar initials={p.initials} color={p.color} size={size} />
        </div>
      ))}
    </div>
  );
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  "on-track": { label: "On track", color: "#059669", bg: "#ECFDF5" },
  "at-risk":  { label: "At risk",  color: "#D97706", bg: "#FFFBEB" },
  blocked:    { label: "Blocked",  color: "#DC2626", bg: "#FEF2F2" },
  complete:   { label: "Completed", color: "#2563EB", bg: "#EFF6FF" },
  archived:   { label: "Archived", color: "#6B7280", bg: "#F3F4F6" },
};

const TASK_STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  backlog:      { label: "Backlog",      color: "#6B7280", bg: "#F9FAFB" },
  todo:         { label: "To do",        color: "#6366F1", bg: "#EEF2FF" },
  "in-progress":{ label: "In progress",  color: "#D97706", bg: "#FFFBEB" },
  "in-review":  { label: "In review",    color: "#7C5CFC", bg: "#EDE9FE" },
  done:         { label: "Done",         color: "#059669", bg: "#ECFDF5" },
};

function SectionCard({ icon, title, subtitle, children, action }: {
  icon: React.ReactNode; title: string; subtitle?: string;
  children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #EAECF0" }}>
      <div className="flex items-start justify-between px-5 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 text-[#374151]">{icon}</span>
          <div>
            <p className="text-[14px] font-semibold text-[#111827]">{title}</p>
            {subtitle && <p className="text-[12px] mt-0.5" style={{ color: "#9CA3AF" }}>{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ─── Kanban ───────────────────────────────────────────────────────────────────

const KANBAN_COLS: { id: Task["status"]; label: string }[] = [
  { id: "backlog",     label: "Backlog" },
  { id: "in-progress", label: "In progress" },
  { id: "in-review",   label: "In review" },
  { id: "done",        label: "Done" },
];

function KanbanCard({ task, onOpen, disabled }: { task: Task; onOpen: (task: Task) => void; disabled: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      disabled={disabled}
      draggable={!disabled}
      onDragStart={(event) => { event.dataTransfer.setData("application/x-teamflow-task", task.sourceId); event.dataTransfer.effectAllowed = "move"; }}
      onClick={() => onOpen(task)}
      className="w-full text-left bg-white rounded-xl p-3.5 cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[#7C5CFC]"
      style={{ border: `1px solid ${hov ? "#C4B5FD" : "#EAECF0"}`, boxShadow: hov ? "0 2px 8px rgba(124,92,252,0.1)" : "none" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <p className="text-[12.5px] font-medium text-[#111827] leading-snug mb-3">{task.title}</p>
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[10.5px] font-semibold rounded-lg px-2 py-0.5"
          style={{ color: TASK_STATUS_CFG[task.status].color, background: TASK_STATUS_CFG[task.status].bg }}
        >
          {task.priority}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10.5px]" style={{ color: "#9CA3AF" }}>{task.dueDate}</span>
          <Avatar initials={task.assignee} color={task.assigneeColor} size={20} />
        </div>
      </div>
    </button>
  );
}

function KanbanBoard({ projectId, onOpen, onRefresh, onAdd }: { projectId: string; onOpen: (task: Task) => void; onRefresh: () => Promise<void>; onAdd: (status: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [target, setTarget] = useState("");
  const move = async (id: string, status: Task["status"]) => {
    const task = TASKS.find((item) => item.sourceId === id && item.projectId === projectId);
    if (!task || task.status === status || busy) return;
    setBusy(true); setError(""); setFeedback("");
    try { await updateTaskStatus(id, status.toUpperCase().replace(/-/g, "_")); setFeedback(`Moved task to ${status.replace(/-/g, " ")}.`); await onRefresh(); }
    catch { setError("Could not move or refresh this task. Reload to check its status, then try again."); }
    finally { setBusy(false); setTarget(""); }
  };
  const tasks = TASKS.filter((t) => t.projectId === projectId);
  return (
    <div>{error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}{(busy || feedback) && <p role="status" className="mb-3 text-sm text-[#7C5CFC]">{busy ? "Moving task…" : feedback}</p>}<p className="mb-4 text-xs text-gray-500">Drag a task to another column, or open it to change its status.</p><div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
      {KANBAN_COLS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        const cfg = TASK_STATUS_CFG[col.id];
        return (
          <div key={col.id} onDragOver={(event) => { if (!busy && event.dataTransfer.types.includes("application/x-teamflow-task")) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setTarget(col.id); } }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setTarget(""); }} onDrop={(event) => { event.preventDefault(); setTarget(""); void move(event.dataTransfer.getData("application/x-teamflow-task"), col.id); }} className={`flex-shrink-0 w-[220px] rounded-xl p-2 min-h-[180px] ${target === col.id ? "bg-[#EDE9FE] ring-2 ring-[#C4B5FD]" : "bg-[#F8F9FB]"}`}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
              <span className="text-[12px] font-semibold" style={{ color: "#374151" }}>{col.label}</span>
              <span className="text-[10.5px] font-bold rounded-full px-1.5 py-px ml-auto" style={{ background: cfg.bg, color: cfg.color }}>
                {colTasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {colTasks.map((t) => <KanbanCard key={t.sourceId} task={t} onOpen={onOpen} disabled={busy} />)}
              <button disabled={busy} onClick={() => onAdd(col.id.toUpperCase().replace(/-/g, "_"))} className="w-full text-[12px] py-2 px-3 rounded-xl text-left transition-colors" style={{ color: "#9CA3AF" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#F5F6FA"; e.currentTarget.style.color = "#7C5CFC"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9CA3AF"; }}
              >
                + Add task
              </button>
            </div>
          </div>
        );
      })}
    </div></div>
  );
}

// ─── Project Detail ───────────────────────────────────────────────────────────

const TABS = ["Overview", "Tasks", "Activity", "Team"] as const;
type Tab = typeof TABS[number];

function ProjectDetail({ project, onBack, onStatusChange, onRefresh }: { project: Project; onBack: () => void; onStatusChange: (status: string) => Promise<void>; onRefresh: () => Promise<void> }) {
  const [creationStatus, setCreationStatus] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");
  const status = STATUS_CFG[project.status];
  const projectUpdates = UPDATES.filter((u) => u.projectId === project.id);
  const projectTasks = TASKS.filter((t) => t.projectId === project.id);

  return (
    <div>
      {creationStatus && <CreateModal mode="task" initialProjectId={project.id} initialStatus={creationStatus} onClose={() => setCreationStatus(null)} onSaved={onRefresh} />}
      {selectedTask && <TaskDetail key={selectedTask.sourceId} task={selectedTask} onClose={() => setSelectedTask(null)} onRefresh={onRefresh} />}
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10" style={{ borderColor: "#EAECF0" }}>
        <div className="px-7 pt-4 pb-0" style={{ maxWidth: 1160, margin: "0 auto" }}>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[12.5px] mb-3 transition-colors"
            style={{ color: "#9CA3AF" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#374151")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Projects
          </button>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[13px] font-bold" style={{ background: project.color }}>
                {project.shortName[0]}
              </div>
              <div>
                <h1 className="text-[18px] font-bold text-[#111827] tracking-tight">{project.name}</h1>
                <p className="text-[12.5px]" style={{ color: "#9CA3AF" }}>{project.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11.5px] font-semibold rounded-full px-3 py-1" style={{ color: status.color, background: status.bg }}>{status.label}</span>
              <AvatarStack people={project.members} size={26} />
              <select aria-label="Project status" value={project.status} onChange={(event) => onStatusChange(event.target.value)} className="rounded-xl border bg-white px-2.5 py-1.5 text-[12px] font-medium outline-none focus:border-[#7C5CFC]" style={{ borderColor: "#EAECF0", color: "#374151" }}>
                <option value="on-track">On track</option><option value="at-risk">At risk</option><option value="blocked">Blocked</option><option value="complete">Completed</option><option value="archived">Archived</option>
              </select>
              <button className="text-[12.5px] font-medium border rounded-xl px-3 py-1.5 transition-colors" style={{ borderColor: "#EAECF0", color: "#374151" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F6FA")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >Share</button>
            </div>
          </div>
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className="text-[13px] font-medium px-4 py-2.5 border-b-2 transition-colors"
                style={{ borderColor: tab === t ? "#7C5CFC" : "transparent", color: tab === t ? "#7C5CFC" : "#6B7280" }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-7 py-6" style={{ maxWidth: 1160, margin: "0 auto" }}>
        {tab === "Overview" && (
          <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 280px" }}>
            <div className="space-y-5">
              {/* Progress card */}
              <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #EAECF0" }}>
                <p className="text-[13px] font-semibold text-[#111827] mb-4">Progress</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                    <div className="h-full rounded-full" style={{ width: `${project.progress}%`, background: project.color }} />
                  </div>
                  <span className="text-[22px] font-bold" style={{ color: "#111827" }}>{project.progress}%</span>
                </div>
                <div className="flex gap-5 mt-4 text-[12.5px]" style={{ color: "#9CA3AF" }}>
                  <span>{project.openTasks} open tasks</span>
                  {project.overdueTasks > 0 && <span style={{ color: "#EF4444" }} className="font-medium">{project.overdueTasks} overdue</span>}
                  <span>Due {project.dueDate}</span>
                </div>
              </div>

              {/* At-risk notice */}
              {project.status === "at-risk" && (
                <div className="rounded-2xl p-5" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1L13 12H1L7 1z" stroke="#D97706" strokeWidth="1.3" strokeLinejoin="round" />
                      <path d="M7 5v3M7 10v.5" stroke="#D97706" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    <p className="text-[13px] font-semibold" style={{ color: "#92400E" }}>Risks & blockers</p>
                  </div>
                  <ul className="space-y-1.5">
                    {["5 tasks are overdue and blocking the launch timeline.", "Go-to-market copy hasn't been reviewed by legal."].map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12.5px]" style={{ color: "#78350F" }}>
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#D97706" }} />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recent activity */}
              <SectionCard
                icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" /><path d="M7 4.5V7.5l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>}
                title="Recent Activity"
              >
                {projectUpdates.length === 0
                  ? <p className="text-[12.5px] text-center py-8" style={{ color: "#9CA3AF" }}>No recent activity.</p>
                  : projectUpdates.map((u) => (
                    <div key={u.id} className="flex items-start gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <Avatar initials={u.initials} color={u.color} size={28} />
                      <div>
                        <p className="text-[12.5px] text-[#374151]">
                          <span className="font-semibold text-[#111827]">{u.actor}</span> {u.action}{" "}
                          <span className="font-medium text-[#111827]">{u.target}</span>
                          {u.to && <> → <span style={{ color: "#7C5CFC" }} className="font-medium">{u.to}</span></>}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>{u.time}</p>
                      </div>
                    </div>
                  ))
                }
              </SectionCard>
            </div>

            {/* Sidebar info */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 space-y-4" style={{ border: "1px solid #EAECF0" }}>
                {[
                  { label: "Status", value: <span style={{ color: status.color }} className="font-semibold text-[12.5px]">{status.label}</span> },
                  { label: "Start date", value: project.startDate },
                  { label: "Due date", value: project.dueDate },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10.5px] font-semibold uppercase tracking-wide mb-1" style={{ color: "#9CA3AF" }}>{label}</p>
                    <div className="text-[12.5px] text-[#374151]">{value}</div>
                  </div>
                ))}
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#9CA3AF" }}>Members</p>
                  <div className="space-y-2">
                    {project.members.map((m) => (
                      <div key={m.initials} className="flex items-center gap-2">
                        <Avatar initials={m.initials} color={m.color} size={26} />
                        <div>
                          <p className="text-[12px] font-medium text-[#374151]">{m.name}</p>
                          <p className="text-[10.5px]" style={{ color: "#9CA3AF" }}>{m.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "Tasks" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-[13px]" style={{ color: "#6B7280" }}>{projectTasks.length} tasks across {KANBAN_COLS.length} stages</p>
              <button onClick={() => setCreationStatus("BACKLOG")} className="flex items-center gap-1.5 text-white text-[13px] font-semibold rounded-xl px-4 py-2 hover:opacity-90 transition-opacity" style={{ background: "#7C5CFC" }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>
                Add task
              </button>
            </div>
            <KanbanBoard projectId={project.id} onOpen={setSelectedTask} onRefresh={onRefresh} onAdd={setCreationStatus} />
          </div>
        )}

        {tab === "Activity" && (
          <div className="max-w-xl space-y-4">
            {projectUpdates.length === 0
              ? <div className="text-center py-16" style={{ color: "#9CA3AF" }}>No activity yet.</div>
              : projectUpdates.map((u) => (
                <div key={u.id} className="bg-white rounded-2xl p-4 flex items-start gap-3" style={{ border: "1px solid #EAECF0" }}>
                  <Avatar initials={u.initials} color={u.color} size={32} />
                  <div className="flex-1">
                    <p className="text-[13px] text-[#374151]">
                      <span className="font-semibold text-[#111827]">{u.actor}</span> {u.action}{" "}
                      <span className="font-medium text-[#111827]">{u.target}</span>
                      {u.to && <> → <span style={{ color: "#7C5CFC" }} className="font-medium">{u.to}</span></>}
                    </p>
                    {u.comment && (
                      <p className="text-[12.5px] mt-2 rounded-xl px-3 py-2 leading-relaxed" style={{ color: "#6B7280", background: "#F5F6FA", border: "1px solid #F3F4F6" }}>
                        "{u.comment}"
                      </p>
                    )}
                    <p className="text-[11.5px] mt-1" style={{ color: "#9CA3AF" }}>{u.time}</p>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {tab === "Team" && (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {project.members.map((m) => {
              const tasks = projectTasks.filter((t) => t.assignee === m.initials);
              return (
                <div key={m.initials} className="bg-white rounded-2xl p-5" style={{ border: "1px solid #EAECF0" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar initials={m.initials} color={m.color} size={40} />
                    <div>
                      <p className="text-[13.5px] font-semibold text-[#111827]">{m.name}</p>
                      <p className="text-[12px]" style={{ color: "#9CA3AF" }}>{m.role}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[["Tasks", tasks.length], ["Done", tasks.filter((t) => t.status === "done").length], ["Overdue", tasks.filter((t) => t.overdue).length]].map(([l, v]) => (
                      <div key={l as string} className="rounded-xl py-2" style={{ background: "#F5F6FA" }}>
                        <p className="text-[16px] font-bold text-[#111827]">{v}</p>
                        <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ProjectsPage ─────────────────────────────────────────────────────────────

type Filter = "All" | "Active" | "Completed" | "Archived";
const FILTERS: Filter[] = ["All", "Active", "Completed", "Archived"];

export default function ProjectsPage({ onCreate, onRefresh }: { onCreate: (mode: CreationMode) => void; onRefresh: () => Promise<void> }) {
  const [selected, setSelected] = useState<Project | null>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");

  if (selected) return <ProjectDetail onRefresh={onRefresh} project={PROJECTS.find((project) => project.id === selected.id) || selected} onBack={() => setSelected(null)} onStatusChange={async (status) => { await updateProjectStatus(selected.id, status.toUpperCase().replace("-", "_")); await onRefresh(); }} />;

  const filtered = PROJECTS.filter((p) => {
    const m = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    if (filter === "Active") return m && ["on-track", "at-risk", "blocked"].includes(p.status);
    if (filter === "Completed") return m && p.status === "complete";
    if (filter === "Archived") return m && p.status === "archived";
    return m;
  });

  return (
    <div className="px-7 py-7" style={{ maxWidth: 1160, margin: "0 auto" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#111827] tracking-tight">Projects</h1>
          <p className="text-[13px] mt-0.5" style={{ color: "#9CA3AF" }}>Browse and manage your project channels</p>
        </div>
        <button onClick={() => onCreate("project")} className="flex items-center gap-2 text-white text-[13px] font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity" style={{ background: "#7C5CFC" }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          New project
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 border bg-white flex-1 max-w-xs" style={{ borderColor: "#EAECF0" }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ color: "#9CA3AF", flexShrink: 0 }}>
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.25" />
            <path d="M8.5 8.5L11 11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          </svg>
          <input type="text" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="text-[13px] placeholder-[#9CA3AF] flex-1 outline-none bg-transparent" style={{ color: "#374151" }} />
        </div>
        <div className="flex items-center gap-0.5 bg-white rounded-xl p-1" style={{ border: "1px solid #EAECF0" }}>
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="text-[12px] font-medium rounded-lg px-3 py-1.5 transition-all"
              style={{ background: filter === f ? "#7C5CFC" : "transparent", color: filter === f ? "#FFFFFF" : "#6B7280" }}
            >{f}</button>
          ))}
        </div>
      </div>

      {/* Project cards */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #EAECF0" }}>
        {/* Table header */}
        <div className="flex items-center gap-4 px-5 py-3 border-b" style={{ background: "#F9FAFB", borderColor: "#F3F4F6" }}>
          <div className="w-8 flex-shrink-0" />
          <span className="flex-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Project</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide w-24 flex-shrink-0" style={{ color: "#9CA3AF" }}>Status</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide w-28 flex-shrink-0 hidden md:block" style={{ color: "#9CA3AF" }}>Progress</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide w-20 flex-shrink-0 hidden lg:block" style={{ color: "#9CA3AF" }}>Team</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide w-16 flex-shrink-0 hidden sm:block" style={{ color: "#9CA3AF" }}>Updated</span>
          <div className="w-5 flex-shrink-0" />
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "#F5F6FA" }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z" stroke="#9CA3AF" strokeWidth="1.3" strokeLinejoin="round" /></svg>
            </div>
            <p className="text-[13px] font-medium text-[#374151]">No projects found</p>
            <p className="text-[12px] mt-0.5" style={{ color: "#9CA3AF" }}>Try adjusting your search or filters.</p>
          </div>
        ) : (
          filtered.map((p) => {
            const status = STATUS_CFG[p.status];
            return (
              <button key={p.id} onClick={() => setSelected(p)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors group border-b last:border-0"
                style={{ borderColor: "#F3F4F6" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ background: p.color }}>
                  {p.shortName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold text-[#111827] truncate group-hover:text-[#7C5CFC] transition-colors">{p.name}</p>
                  <p className="text-[12px] truncate" style={{ color: "#9CA3AF" }}>{p.description}</p>
                </div>
                <span className="text-[11px] font-semibold rounded-full px-2.5 py-0.5 flex-shrink-0 w-24 text-center" style={{ color: status.color, background: status.bg }}>{status.label}</span>
                <div className="hidden md:flex items-center gap-2 flex-shrink-0 w-28">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                    <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: p.color }} />
                  </div>
                  <span className="text-[11.5px] font-medium w-7 text-right" style={{ color: "#374151" }}>{p.progress}%</span>
                </div>
                <div className="hidden lg:block flex-shrink-0 w-20"><AvatarStack people={p.members} size={22} /></div>
                <span className="text-[11.5px] flex-shrink-0 hidden sm:block w-16 text-right" style={{ color: "#9CA3AF" }}>{p.updatedAt}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#9CA3AF" }}>
                  <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
