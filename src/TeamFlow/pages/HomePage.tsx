import TaskDetail from "../TaskDetail";
import { updateTaskStatus } from "../../Kanbas/teamflowClient";
import { useState } from "react";
import { TASKS, PROJECTS, EVENTS, UPDATES, CURRENT_USER, MEMBERS, type Task, type Project } from "../data";
import type { CreationMode, Page } from "../App";

// ─── Shared ───────────────────────────────────────────────────────────────────

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
      {people.slice(0, 3).map((p, i) => (
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
};

const PRIORITY_CFG: Record<string, { color: string; bg: string }> = {
  high:   { color: "#DC2626", bg: "#FEF2F2" },
  medium: { color: "#D97706", bg: "#FFFBEB" },
  low:    { color: "#6B7280", bg: "#F3F4F6" },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick}
      className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3.5 transition-shadow hover:shadow-md text-left w-full"
      style={{ border: "1px solid #EAECF0" }}
    >
      {/* Icon — dark rounded square, white stroke icon, like Slack active nav */}
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: accent,
          boxShadow: `0 4px 12px ${accent}55`,
        }}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[11.5px] font-medium tracking-wide uppercase" style={{ color: "#9CA3AF", letterSpacing: "0.04em" }}>
          {label}
        </p>
        <p className="text-[30px] font-bold leading-none tracking-tight mt-1" style={{ color: "#111827", fontVariantNumeric: "tabular-nums" }}>
          {value}
        </p>
        {sub && (
          <p className="text-[11.5px] mt-1.5 font-medium" style={{ color: "#9CA3AF" }}>{sub}</p>
        )}
      </div>
    </button>
  );
}

// ─── Section Card wrapper ─────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  subtitle,
  children,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #EAECF0" }}>
      <div className="flex items-start justify-between px-5 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5" style={{ color: "#374151" }}>{icon}</span>
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

// ─── Project row (like "Your Classes") ───────────────────────────────────────

function ProjectListItem({ project, onClick }: { project: Project; onClick: () => void }) {
  const status = STATUS_CFG[project.status];
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors group"
      style={{ borderBottom: "1px solid #F3F4F6" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5"
          style={{ background: project.color }}
        >
          {project.shortName[0]}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[13px] font-semibold text-[#111827] group-hover:text-[#7C5CFC] transition-colors">{project.name}</p>
            <span
              className="text-[10.5px] font-semibold rounded-full px-2 py-0.5 flex-shrink-0"
              style={{ color: status.color, background: status.bg }}
            >
              {status.label}
            </span>
          </div>
          <p className="text-[12px] mt-0.5 truncate" style={{ color: "#9CA3AF" }}>{project.description}</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-4">
        <p className="text-[11px] font-semibold" style={{ color: "#9CA3AF" }}>Due</p>
        <p className="text-[12px] font-semibold" style={{ color: "#374151" }}>{project.dueDate}</p>
        <AvatarStack people={project.members} size={18} />
      </div>
    </button>
  );
}

// ─── Quick action row ─────────────────────────────────────────────────────────

function QuickActionRow({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors"
      style={{ borderBottom: "1px solid #F3F4F6" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ color: "#6B7280" }}>{icon}</span>
      <span className="text-[13px] font-medium text-[#374151]">{label}</span>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ml-auto" style={{ color: "#D1D5DB" }}>
        <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// ─── Activity row ─────────────────────────────────────────────────────────────

function ActivityRow({ update }: { update: typeof UPDATES[0] }) {
  return (
    <div
      className="flex items-start gap-3 px-5 py-3.5 transition-colors"
      style={{ borderBottom: "1px solid #F3F4F6" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <Avatar initials={update.initials} color={update.color} size={32} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-[#374151] leading-snug">
          <span className="font-semibold text-[#111827]">{update.actor}</span>
          {" "}{update.action}{" "}
          <span className="font-medium text-[#111827]">{update.target}</span>
          {update.to && <> → <span style={{ color: "#7C5CFC" }} className="font-medium">{update.to}</span></>}
        </p>
        <p className="text-[11.5px] mt-0.5" style={{ color: "#9CA3AF" }}>
          {update.time} · {update.project}
        </p>
      </div>
      {update.unread && (
        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#7C5CFC" }} />
      )}
    </div>
  );
}

// ─── Pending task row ─────────────────────────────────────────────────────────

function PendingTaskRow({ task, onOpen, onToggle }: { task: Task; onOpen: (task: Task) => void; onToggle: (task: Task) => Promise<void> }) {
  const priority = PRIORITY_CFG[task.priority] || PRIORITY_CFG.high;
  const done = task.status === "done";
  const [saving, setSaving] = useState(false);
  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5 transition-colors"
      style={{ borderBottom: "1px solid #F3F4F6" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <button
        aria-label={`Complete ${task.title}`} disabled={saving}
        onClick={async () => { setSaving(true); try { await onToggle(task); } finally { setSaving(false); } }}
        className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors"
        style={{ background: done ? "#7C5CFC" : "transparent", borderColor: done ? "#7C5CFC" : "#D1D5DB" }}
      >
        {done && (
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <button onClick={() => onOpen(task)} className="flex-1 min-w-0 text-left focus-visible:ring-2 focus-visible:ring-[#7C5CFC]">
        <p className="text-[13px] font-medium truncate" style={{ color: done ? "#9CA3AF" : "#111827", textDecoration: done ? "line-through" : "none" }}>
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: task.projectColor }} />
          <p className="text-[11.5px]" style={{ color: "#9CA3AF" }}>Due: {task.dueDate}</p>
        </div>
      </button>
      <span
        className="text-[10.5px] font-bold rounded-lg px-2.5 py-1 flex-shrink-0"
        style={{ color: priority.color, background: priority.bg }}
      >
        {task.priority}
      </span>
    </div>
  );
}

// ─── Upcoming event row ───────────────────────────────────────────────────────

function UpcomingRow({ event }: { event: typeof EVENTS[0] }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const dayLabel = days[event.day - 15] ?? "";
  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5 group transition-colors"
      style={{ borderBottom: "1px solid #F3F4F6" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div
        className="w-9 h-9 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
        style={{ background: event.projectColor + "18" }}
      >
        <span className="text-[9px] font-bold uppercase" style={{ color: event.projectColor }}>{dayLabel}</span>
        <span className="text-[15px] font-bold leading-tight" style={{ color: event.projectColor }}>{event.day}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#111827] truncate">{event.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {event.hasVideo && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: "#9CA3AF" }}>
              <path d=".5 2.5h6v5h-6zM6.5 4l3-1.5v5L6.5 6" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
            </svg>
          )}
          <span className="text-[11.5px]" style={{ color: "#9CA3AF" }}>{event.time} · {event.project}</span>
        </div>
      </div>
      <button
        className="text-[11px] font-semibold rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        style={{ background: "#EDE9FE", color: "#7C5CFC" }}
      >
        Join
      </button>
    </div>
  );
}

// ─── HomePage ─────────────────────────────────────────────────────────────────

export default function HomePage({ onNavigate, onCreate, onRefresh }: { onNavigate: (p: Page) => void; onCreate: (mode: CreationMode) => void; onRefresh: () => Promise<void> }) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskError, setTaskError] = useState("");
  const [focus, setFocus] = useState("today");
  const now = new Date();
  const sameDay = (date?: string) => Boolean(date && new Date(date).toDateString() === now.toDateString());
  const mine = TASKS.filter((task) => task.assigneeId === CURRENT_USER.id && task.status !== "done");
  const personalTasks = mine.filter((task) => focus === "all" || (focus === "overdue" ? task.overdue : sameDay(task.dueAt))).sort((a, b) => (a.dueAt ? Date.parse(a.dueAt) : Infinity) - (b.dueAt ? Date.parse(b.dueAt) : Infinity));
  const todayMeetings = EVENTS.filter((event) => sameDay(event.startsAt));
  const toggleTask = async (task: Task) => { try { setTaskError(""); await updateTaskStatus(task.sourceId, "DONE"); await onRefresh(); } catch { setTaskError("Could not update this task. Please try again."); } };
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const highPriorityTasks = TASKS.filter((t) => (t.priority === "high" || t.priority === "urgent") && t.status !== "done").slice(0, 4);
  const recentUpdates = UPDATES.slice(0, 4);
  const upcomingEvents = EVENTS.filter((event) => event.startsAt && new Date(event.endsAt || event.startsAt).getTime() >= now.getTime()).slice(0, 3);

  const totalOpen = TASKS.filter((t) => t.status !== "done").length;
  const totalOverdue = TASKS.filter((t) => t.overdue).length;
  const onTrack = PROJECTS.filter((p) => p.status === "on-track").length;
  const updatedToday = PROJECTS.filter((p) => !p.updatedAt.includes("d ago")).length;
  const needsAttention = PROJECTS.filter((p) => p.status !== "on-track").length;

  return (
    <div className="px-7 py-7" style={{ maxWidth: 1200, margin: "0 auto" }}>
      {selectedTask && <TaskDetail key={selectedTask.sourceId} task={selectedTask} onClose={() => setSelectedTask(null)} onRefresh={onRefresh} />}
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#111827] tracking-tight">{greeting}, {CURRENT_USER.name.split(" ")[0] || "there"}! 👋</h1>
          <p className="text-[13.5px] mt-0.5" style={{ color: "#9CA3AF" }}>
            Here's your workspace overview and recent activities.
          </p>
        </div>
        <button onClick={() => onCreate("task")}
          className="flex items-center gap-2 text-white text-[13px] font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity"
          style={{ background: "#7C5CFC" }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Create task
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Active Projects"
          value={PROJECTS.length}
          sub={`${updatedToday} updated today`}
          accent="#2563EB"
          onClick={() => onNavigate("tasks")}
          icon={
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="2.5" y="2.5" width="7.5" height="7.5" rx="1.8" stroke="white" strokeWidth="1.6" />
              <rect x="12" y="2.5" width="7.5" height="7.5" rx="1.8" stroke="white" strokeWidth="1.6" />
              <rect x="2.5" y="12" width="7.5" height="7.5" rx="1.8" stroke="white" strokeWidth="1.6" />
              <rect x="12" y="12" width="7.5" height="7.5" rx="1.8" stroke="white" strokeWidth="1.6" />
            </svg>
          }
        />
        <StatCard
          label="Open Tasks"
          value={totalOpen}
          sub={`${totalOverdue} overdue`}
          accent="#059669"
          onClick={() => onNavigate("projects")}
          icon={
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="3" y="3" width="16" height="16" rx="3" stroke="white" strokeWidth="1.6" />
              <path d="M7.5 11l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <StatCard
          label="Team Members"
          value={Object.keys(MEMBERS).length}
          sub="Workspace members"
          accent="#7C5CFC"
          onClick={() => onNavigate("people")}
          icon={
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="8.5" cy="7" r="3.5" stroke="white" strokeWidth="1.6" />
              <path d="M2 18.5c0-3.59 2.91-6.5 6.5-6.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="16" cy="8" r="2.8" stroke="white" strokeWidth="1.5" />
              <path d="M13.5 18.5c0-2.49 1.12-4.7 2.88-6.18" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M10.5 18.5h9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          }
        />
        <StatCard
          label="On Track"
          value={`${onTrack} / ${PROJECTS.length}`}
          sub={`${needsAttention} needs attention`}
          accent="#D97706"
          onClick={() => onNavigate("projects")}
          icon={
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="8.5" stroke="white" strokeWidth="1.6" />
              <circle cx="11" cy="11" r="4.5" stroke="white" strokeWidth="1.4" />
              <circle cx="11" cy="11" r="1.8" fill="white" />
              <path d="M11 2.5V5M11 17v2.5M2.5 11H5M17 11h2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          }
        />
      </div>

      <section className="mb-5 rounded-2xl border border-[#EAECF0] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-bold text-[#111827]">Your day</h2><p className="mt-1 text-xs text-gray-500">{mine.length} open tasks assigned to you · {todayMeetings.length} meetings today</p></div><div className="flex flex-wrap gap-2">{[["today", "Due today"], ["overdue", "Overdue"], ["all", "All my tasks"]].map(([value, label]) => <button key={value} aria-pressed={focus === value} onClick={() => setFocus(value)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${focus === value ? "bg-[#EDE9FE] text-[#7C5CFC]" : "bg-gray-50 text-gray-600"}`}>{label}</button>)}</div></div>
        {taskError && <p role="alert" className="mt-3 text-sm text-red-700">{taskError}</p>}
        <div className="mt-4 grid gap-5 lg:grid-cols-[2fr_1fr]"><div>{personalTasks.length ? personalTasks.slice(0, 5).map((task) => <PendingTaskRow key={task.sourceId} task={task} onOpen={setSelectedTask} onToggle={toggleTask} />) : <p className="py-5 text-sm text-gray-500">{focus === "overdue" ? "No overdue tasks assigned to you." : focus === "today" ? "No tasks due today. Check All my tasks for your next priority." : "No open tasks assigned to you."}</p>}{personalTasks.length > 5 && <button onClick={() => onNavigate("tasks")} className="mt-3 text-xs font-semibold text-[#7C5CFC]">Browse all tasks →</button>}</div><div className="rounded-xl bg-[#F8F9FB] p-4"><h3 className="text-sm font-semibold">Today’s meetings</h3>{todayMeetings.length ? todayMeetings.map((event) => <button key={event.id} onClick={() => onNavigate("calendar")} className="mt-3 block w-full text-left"><span className="block text-sm font-medium text-gray-800">{event.title}</span><span className="text-xs text-gray-500">{event.time} · {event.project}</span></button>) : <p className="mt-3 text-xs text-gray-500">No meetings scheduled today.</p>}</div></div>
      </section>
      {/* Main 2-col grid */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left col */}
        <div className="space-y-5">
          {/* Active Projects */}
          <SectionCard
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
                <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
                <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
                <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            }
            title="Active Projects"
            subtitle="Projects you're currently working on"
            action={
              <button onClick={() => onNavigate("projects")} className="text-[12px] font-semibold hover:underline" style={{ color: "#7C5CFC" }}>
                View all →
              </button>
            }
          >
            {PROJECTS.map((p) => (
              <ProjectListItem key={p.id} project={p} onClick={() => onNavigate("projects")} />
            ))}
          </SectionCard>

          {/* Recent Activity */}
          <SectionCard
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
                <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="Recent Activities"
            subtitle="Your recent workspace activities"
            action={
              <button onClick={() => onNavigate("updates")} className="text-[12px] font-semibold hover:underline" style={{ color: "#7C5CFC" }}>
                View all →
              </button>
            }
          >
            {recentUpdates.map((u) => (
              <ActivityRow key={u.id} update={u} />
            ))}
          </SectionCard>
        </div>

        {/* Right col */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <div id="teamflow-quick-actions">
          <SectionCard
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            }
            title="Quick Actions"
            subtitle="Common tasks you can do quickly"
          >
            <QuickActionRow
              icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>}
              label="Create new task"
              onClick={() => onCreate("task")}
            />
            <QuickActionRow
              icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="8.5" y="1.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="1.5" y="8.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="8.5" y="8.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" /></svg>}
              label="Start a new project"
              onClick={() => onCreate("project")}
            />
            <QuickActionRow
              icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M1 6h12" stroke="currentColor" strokeWidth="1.3" /></svg>}
              label="Schedule a meeting"
              onClick={() => onCreate("event")}
            />
            <QuickActionRow
              icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" /><path d="M1.5 13c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>}
              label="Create group chat"
              onClick={() => onCreate("groupChat")}
            />
            <QuickActionRow
              icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 9h3l2-6 3 10 2-7 1.5 3H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              label="View team updates"
              onClick={() => onNavigate("updates")}
            />
          </SectionCard>
          </div>

          {/* Upcoming */}
          <SectionCard
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1.5" y="3" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M1.5 7h13" stroke="currentColor" strokeWidth="1.3" />
                <path d="M5 1.5V4M11 1.5V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            }
            title="Upcoming"
            subtitle="Your next scheduled events"
            action={
              <button onClick={() => onNavigate("calendar")} className="text-[12px] font-semibold hover:underline" style={{ color: "#7C5CFC" }}>
                Calendar →
              </button>
            }
          >
            {upcomingEvents.map((e) => (
              <UpcomingRow key={e.id} event={e} />
            ))}
          </SectionCard>

          {/* Pending Tasks */}
          <SectionCard
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
                <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <circle cx="8" cy="11" r="0.6" fill="currentColor" />
              </svg>
            }
            title="Pending Tasks"
            subtitle="Tasks that need your attention"
          >
            {highPriorityTasks.map((t) => (
              <PendingTaskRow key={t.sourceId} task={t} onOpen={setSelectedTask} onToggle={toggleTask} />
            ))}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
