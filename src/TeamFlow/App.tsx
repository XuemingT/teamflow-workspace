import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ProjectsPage from "./pages/ProjectsPage";
import CalendarPage from "./pages/CalendarPage";
import UpdatesPage from "./pages/UpdatesPage";
import TasksPage from "./pages/TasksPage";
import PeoplePage from "./pages/PeoplePage";
import Chat from "./Chat";
import CreateModal from "./CreateModal";
import OnboardingTour from "./OnboardingTour";
import PageOnboarding from "./PageOnboarding";
import AccountSettings from "./AccountSettings";
import { createEvent, createInvitation, createProject, createTask, getNotifications, getWorkspace, markAllNotificationsRead, markNotificationRead, respondToMeetingInvitation, signout, updateTaskStatus } from "../Kanbas/teamflowClient";
import { CURRENT_USER, MEMBERS, PROJECTS, TASKS, replaceWorkspace } from "./data";

export type Page = "home" | "projects" | "tasks" | "calendar" | "people" | "chat" | "updates";
export type CreationMode = "task" | "project" | "event" | "groupChat";

function TeamFlowLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0" aria-label="TeamFlow">
      <g transform="translate(0 -3)">
      <line x1="16" y1="27" x2="16" y2="35" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 35 Q14.5 34 12.5 35 Q13.5 36.5 16 36 Q18 36 19.5 35 Q17.5 34 16 35 Z" fill="#EA580C" />
      <path d="M20 27 Q24 26 26.5 22" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M26.5 22 Q28.5 20 30 21.5 Q28.5 23.5 27 23.5 Q26 23.5 26.5 22 Z" fill="#EA580C" />
      <ellipse cx="16.5" cy="24" rx="10" ry="6.5" fill="#FCD34D" />
      <path d="M10 22.5 Q14.5 19.5 21 21.5 Q17.5 24.5 10 23.5 Z" fill="#F59E0B" fillOpacity="0.5" />
      <path d="M22 19 Q26 19.5 26.5 22.5 Q23.5 23 20.5 21.5 Z" fill="#FCD34D" />
      <circle cx="25.5" cy="14.5" r="5.8" fill="#FDE047" />
      <circle cx="27.5" cy="13" r="1.4" fill="#1C1917" />
      <circle cx="27.95" cy="12.5" r="0.5" fill="white" />
      <path d="M30.2 14.5 L34 13.2 L34 15.8 Z" fill="#F97316" />
      <line x1="30.2" y1="14.5" x2="34" y2="14.5" stroke="#C2410C" strokeWidth="0.6" />
      <path d="M6.8 21.5 Q4.5 18.5 6.5 16 Q9 19.5 9.5 22 Z" fill="#F59E0B" />
      </g>
    </svg>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IcHome() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      <path d="M2 7.2L8.5 2 15 7.2V15a.6.6 0 01-.6.6H11V11H6v4.6H2.6A.6.6 0 012 15V7.2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function IcGrid() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      <rect x="2" y="2" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <rect x="10" y="2" width="5" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <rect x="2" y="10" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="10" width="6" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function IcCal() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      <rect x="2" y="3.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 7.5h13" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6 2v3M11 2v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IcActivity() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      <path d="M2 9h3l2-6 3 10 2-7 1.5 3H15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcSettings() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 4.7a2.3 2.3 0 100 4.6 2.3 2.3 0 000-4.6zM11.8 7a4.9 4.9 0 00-.08-.86l1.03-.8-.98-1.7-1.24.5a4.8 4.8 0 00-1.48-.86L8.85 2H6.9l-.18 1.28a4.8 4.8 0 00-1.48.86L4 3.64l-.98 1.7 1.03.8A4.9 4.9 0 004 7c0 .3.03.58.08.86l-1.03.8.98 1.7 1.24-.5c.44.36.94.65 1.48.86L6.9 12h1.95l.18-1.28c.54-.21 1.04-.5 1.48-.86l1.24.5.98-1.7-1.03-.8c.05-.28.08-.57.08-.86z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

function IcPeople() {
  return <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle cx="6.2" cy="5.5" r="2.7" stroke="currentColor" strokeWidth="1.3" /><circle cx="12.3" cy="6.7" r="2" stroke="currentColor" strokeWidth="1.3" /><path d="M1.8 14c.3-3.1 2-4.8 4.4-4.8s4.1 1.7 4.4 4.8M10.6 10c2.5.1 3.8 1.5 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>;
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const NAV = [
  { id: "home" as Page, label: "Home", Icon: IcHome },
  { id: "projects" as Page, label: "Projects", Icon: IcGrid },
  { id: "tasks" as Page, label: "Tasks", Icon: IcActivity },
  { id: "calendar" as Page, label: "Calendar", Icon: IcCal },
  { id: "people" as Page, label: "People", Icon: IcPeople },
  { id: "chat" as Page, label: "Chat", Icon: IcActivity },
];

function SidebarInner({
  active,
  onNav,
  onClose,
  onAccount,
}: {
  active: Page;
  onNav: (p: Page) => void;
  onClose: () => void;
  onAccount: () => void;
}) {
  return (
    <div className="flex flex-col h-full" style={{ background: "#1A1D2E" }}>
      {/* Logo */}
      <div className="flex items-center gap-[5px] px-3 py-5 flex-shrink-0">
        <TeamFlowLogo />
        <div>
          <p className="text-white text-[14px] font-bold leading-tight tracking-tight">TeamFlow</p>
          <p className="text-[11px] leading-tight whitespace-nowrap" style={{ color: "#6B7280" }}>Workspace Platform</p>
        </div>
      </div>

      <div className="px-3 mt-3 mb-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-widest px-2" style={{ color: "#3D4157" }}>
          Menu
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {NAV.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              id={id === "tasks" ? "teamflow-nav-tasks" : undefined}
              onClick={() => { onNav(id); onClose(); }}
              className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all"
              style={{
                background: isActive ? "rgba(124,92,252,0.18)" : "transparent",
                color: isActive ? "#FFFFFF" : "#8B909E",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                if (!isActive) e.currentTarget.style.color = "#C5CAD6";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
                if (!isActive) e.currentTarget.style.color = "#8B909E";
              }}
            >
              <span style={{ color: isActive ? "#A78BFA" : "inherit", flexShrink: 0 }}>
                <Icon />
              </span>
              <span className="flex-1 text-left">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 flex-shrink-0">
        <button
          type="button"
          onClick={onAccount}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.09]"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ background: "#7C5CFC", fontSize: 11 }}
          >
            {CURRENT_USER.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[12.5px] font-semibold truncate leading-tight">{CURRENT_USER.name || "Workspace member"}</p>
            <p className="text-[11px] leading-tight" style={{ color: "#6B7280" }}>{CURRENT_USER.role}</p>
          </div>
          <span className="p-1 rounded-lg flex-shrink-0" style={{ color: "#8B909E" }} title="Account settings"><IcSettings /></span>
        </button>
      </div>
    </div>
  );
}

function Sidebar({
  active, onNav, mobileOpen, onClose, onAccount,
}: {
  active: Page; onNav: (p: Page) => void; mobileOpen: boolean; onClose: () => void; onAccount: () => void;
}) {
  return (
    <>
      <aside className="hidden lg:flex flex-col flex-shrink-0 h-full" style={{ width: 228, background: "#1A1D2E" }}>
        <SidebarInner active={active} onNav={onNav} onClose={() => {}} onAccount={onAccount} />
      </aside>
      {mobileOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 flex flex-col lg:hidden" style={{ width: 228, background: "#1A1D2E" }}>
          <SidebarInner active={active} onNav={onNav} onClose={onClose} onAccount={onAccount} />
        </aside>
      )}
    </>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

type SearchResult = { kind: "Project" | "Task" | "Member"; label: string; detail: string; page: Page };
type Notification = { _id: string; title: string; body: string; read: boolean; link?: string; meetingInvitation?: { _id: string; status: string } };

function TopBar({ onMobileMenu, query, onQuery, results, onResult, notifications, onNotification, onReadAll, onAccount }: { onMobileMenu: () => void; query: string; onQuery: (value: string) => void; results: SearchResult[]; onResult: (result: SearchResult) => void; notifications: Notification[]; onNotification: (notification: Notification) => void; onReadAll: () => void; onAccount: () => void }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const notificationsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, []);
  return (
    <header className="flex items-center h-[60px] bg-white border-b px-6 gap-4 flex-shrink-0 z-10" style={{ borderColor: "#EAECF0" }}>
      <button
        className="lg:hidden p-1.5 rounded-lg text-[#6B7280] transition-colors"
        onClick={onMobileMenu}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F6FA")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
      <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2" style={{ background: "#F5F6FA", border: "1px solid #EAECF0" }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#9CA3AF", flexShrink: 0 }}>
          <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.3" />
          <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          onKeyDown={(event) => event.key === "Escape" && onQuery("")}
          placeholder="Search projects, tasks, and people..."
          className="bg-transparent text-[13px] placeholder-[#9CA3AF] flex-1 outline-none"
          style={{ color: "#374151" }}
        />
        <kbd className="text-[10px] font-mono border rounded px-1.5 py-px hidden sm:block flex-shrink-0" style={{ color: "#9CA3AF", background: "#FFFFFF", borderColor: "#E5E7EB" }}>⌘K</kbd>
      </div>
      {query.trim() && (
        <div className="absolute top-[46px] left-0 right-0 bg-white rounded-xl overflow-hidden z-30 shadow-lg" style={{ border: "1px solid #EAECF0" }}>
          {results.length ? results.map((result, index) => <button key={`${result.kind}-${result.label}-${index}`} onClick={() => onResult(result)} className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-[#F5F6FA]" style={{ borderBottom: index === results.length - 1 ? "none" : "1px solid #F3F4F6" }}><span className="text-[10px] font-semibold uppercase w-12" style={{ color: "#7C5CFC" }}>{result.kind}</span><span className="min-w-0"><span className="block text-[13px] font-medium text-[#111827] truncate">{result.label}</span><span className="block text-[11px] truncate" style={{ color: "#9CA3AF" }}>{result.detail}</span></span></button>) : <p className="px-3.5 py-4 text-[13px]" style={{ color: "#6B7280" }}>No workspace results.</p>}
        </div>
      )}
      </div>

      <div className="flex items-center gap-2.5 ml-auto">
        <div ref={notificationsRef} className="relative"><button id="teamflow-notifications" onClick={() => setNotificationsOpen((open) => !open)}
          className="relative p-2 rounded-xl text-[#6B7280] transition-colors"
          onMouseEnter={(e) => { e.currentTarget.style.background = "#F5F6FA"; e.currentTarget.style.color = "#374151"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}
        >
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
            <path d="M8.5 1.5A4.5 4.5 0 004 6v2.5L2.5 10.5h12L13 8.5V6A4.5 4.5 0 008.5 1.5zM7 12.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
          </svg>
          {unreadCount > 0 && <span className="absolute top-[7px] right-[7px] min-w-[14px] h-[14px] rounded-full border-2 border-white text-[8px] text-white flex items-center justify-center" style={{ background: "#7C5CFC" }}>{unreadCount}</span>}
        </button>{notificationsOpen && <div className="absolute right-0 top-11 z-40 w-80 bg-white rounded-2xl overflow-hidden shadow-xl" style={{ border: "1px solid #EAECF0" }}><div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #F3F4F6" }}><p className="text-[13px] font-semibold text-[#111827]">Notifications</p><button onClick={onReadAll} className="text-[11px] font-medium" style={{ color: "#7C5CFC" }}>Mark all read</button></div>{notifications.length ? notifications.map((notification) => <button key={notification._id} onClick={() => { onNotification(notification); setNotificationsOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-[#F5F6FA]" style={{ borderBottom: "1px solid #F3F4F6", background: notification.read ? "white" : "#FAF9FF" }}><p className="text-[12.5px] font-semibold text-[#111827]">{notification.title}</p><p className="text-[11.5px] mt-0.5 leading-snug" style={{ color: "#6B7280" }}>{notification.body}</p></button>) : <p className="px-4 py-5 text-[12px]" style={{ color: "#9CA3AF" }}>You’re all caught up.</p>}</div>}</div>

        <button
          type="button"
          onClick={onAccount}
          title="Account settings"
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-white flex-shrink-0"
          style={{ background: "#7C5CFC", fontSize: 11 }}
        >
          {CURRENT_USER.initials}
        </button>
      </div>
    </header>
  );
}

function LegacyCreateModal({ mode, onClose, onSaved }: { mode: Exclude<CreationMode, "groupChat"> | "invite"; onClose: () => void; onSaved: () => Promise<void> }) {
  const [title, setTitle] = useState(""); const [description, setDescription] = useState(""); const [projectId, setProjectId] = useState(""); const [assigneeId, setAssigneeId] = useState(""); const [priority, setPriority] = useState("MEDIUM"); const [status, setStatus] = useState("BACKLOG"); const [date, setDate] = useState(""); const [endAt, setEndAt] = useState(""); const [email, setEmail] = useState(""); const [role, setRole] = useState("MEMBER"); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const members = Object.values(MEMBERS); const config = { task: "Create task", project: "Start a new project", event: "Create event", invite: "Invite a teammate" }[mode];
  useEffect(() => { if (!projectId && PROJECTS[0]) setProjectId(PROJECTS[0].id); if (!assigneeId && members[0]) setAssigneeId(members[0].id); }, [projectId, assigneeId, members.length]);
  const field = "w-full rounded-xl px-3 py-2.5 text-[13px] outline-none";
  const label = "block text-[11px] font-semibold uppercase tracking-wide mb-1.5";
  const save = async () => { try { setSaving(true); setError(""); if (mode !== "invite" && !title.trim()) throw new Error("A title is required"); if ((mode === "task" || mode === "event") && !projectId) throw new Error("Select a project after workspace data loads"); if (mode === "task") await createTask({ title, description, projectId, assigneeId, priority, status, dueDate: date || undefined }); if (mode === "project") await createProject({ name: title, description, dueDate: date || undefined }); if (mode === "event") await createEvent({ title, description, projectId, startsAt: date, endsAt: endAt || undefined }); if (mode === "invite") await createInvitation({ email, role }); await onSaved(); if (mode === "invite") window.alert(`Invitation for ${email} was saved as Pending.`); onClose(); } catch (err: any) { setError(err?.response?.data?.message || err.message || "Could not save this change."); } finally { setSaving(false); } };
  return <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}><div className="absolute inset-0 bg-black/35" /><form onSubmit={(event) => { event.preventDefault(); save(); }} className="relative w-full max-w-md bg-white rounded-2xl p-6 max-h-[90vh] overflow-auto" style={{ border: "1px solid #EAECF0", boxShadow: "0 20px 45px rgba(17,24,39,.2)" }} onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between mb-5"><div><h2 className="text-[18px] font-bold text-[#111827]">{config}</h2><p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>Saved to your TeamFlow workspace.</p></div><button type="button" onClick={onClose} className="text-[#9CA3AF] text-xl leading-none">×</button></div>{mode === "invite" ? <div className="space-y-3"><div><label className={label} style={{ color: "#6B7280" }}>Teammate — search a colleague or enter an email</label><input autoFocus required list="teamflow-colleagues" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Search name or type teammate@company.com" className={field} style={{ border: "1px solid #EAECF0" }} /><datalist id="teamflow-colleagues">{members.filter((member) => member.email).map((member) => <option key={member.id} value={member.email} label={`${member.name} · ${member.role}`} />)}</datalist></div><div><label className={label} style={{ color: "#6B7280" }}>Workspace role</label><select value={role} onChange={(e) => setRole(e.target.value)} className={field} style={{ border: "1px solid #EAECF0" }}><option value="MEMBER">Member</option><option value="LEAD">Lead</option></select></div></div> : <div className="space-y-3"><p className="text-[11px] font-medium" style={{ color: "#6B7280" }}>{mode === "task" ? "Task title · Description · Project · Assignee (person responsible) · Status · Priority · Due date" : mode === "event" ? "Event title · Description · Project · Start time · End time" : "Project name · Description · Due date"}</p><input autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={mode === "project" ? "Project name" : mode === "event" ? "Event title" : "Task title"} className={field} style={{ border: "1px solid #EAECF0" }} /><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={3} className={field} style={{ border: "1px solid #EAECF0" }} />{mode !== "project" && <select required value={projectId} onChange={(e) => setProjectId(e.target.value)} aria-label="Project" className={field} style={{ border: "1px solid #EAECF0" }}><option value="" disabled>{PROJECTS.length ? "Project" : "Loading projects…"}</option>{PROJECTS.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>}{mode === "task" && <><select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} aria-label="Assignee — person responsible" className={field} style={{ border: "1px solid #EAECF0" }}>{members.map((member) => <option key={member.id} value={member.id}>Assignee: {member.name}</option>)}</select><div className="grid grid-cols-2 gap-3"><select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" className={field} style={{ border: "1px solid #EAECF0" }}><option value="BACKLOG">Status: Backlog</option><option value="IN_PROGRESS">Status: In progress</option><option value="IN_REVIEW">Status: In review</option><option value="DONE">Status: Done</option></select><select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority" className={field} style={{ border: "1px solid #EAECF0" }}><option value="LOW">Priority: Low</option><option value="MEDIUM">Priority: Medium</option><option value="HIGH">Priority: High</option><option value="URGENT">Priority: Urgent</option></select></div></>}<input required={mode === "event"} type={mode === "event" ? "datetime-local" : "date"} value={date} onChange={(e) => setDate(e.target.value)} aria-label={mode === "event" ? "Start time" : "Due date"} className={field} style={{ border: "1px solid #EAECF0" }} />{mode === "event" && <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} aria-label="End time" className={field} style={{ border: "1px solid #EAECF0" }} />}</div>}{error && <p className="text-[12px] mt-3 text-red-600">{error}</p>}<button disabled={saving} className="w-full mt-5 rounded-xl py-2.5 text-white text-[13px] font-semibold disabled:opacity-60" style={{ background: "#7C5CFC" }}>{saving ? "Saving…" : config}</button></form></div>;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const page: Page = location.pathname.endsWith("/Projects") ? "projects" : location.pathname.endsWith("/Tasks") ? "tasks" : location.pathname.endsWith("/Calendar") ? "calendar" : location.pathname.endsWith("/People") ? "people" : location.pathname.endsWith("/Chat") ? "chat" : location.pathname.endsWith("/Inbox") ? "updates" : "home";
  const [revision, setRevision] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creationMode, setCreationMode] = useState<CreationMode | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chatChannelId, setChatChannelId] = useState<string>();
  const [accountOpen, setAccountOpen] = useState(false);
  const setPage = (next: Page) => navigate({ home: "/Kanbas/Dashboard", projects: "/Kanbas/Projects", tasks: "/Kanbas/Tasks", calendar: "/Kanbas/Calendar", people: "/Kanbas/People", chat: "/Kanbas/Chat", updates: "/Kanbas/Inbox" }[next]);

  const refreshWorkspace = async () => { const [workspace, nextNotifications] = await Promise.all([getWorkspace(), getNotifications()]); replaceWorkspace(workspace); setNotifications(nextNotifications); setRevision((value) => value + 1); };
  useEffect(() => { refreshWorkspace().catch((error) => console.error("Could not load TeamFlow workspace", error)); }, []);
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return [
      ...PROJECTS.filter((project) => `${project.name} ${project.description}`.toLowerCase().includes(term)).map((project) => ({ kind: "Project" as const, label: project.name, detail: project.description, page: "projects" as Page })),
      ...TASKS.filter((task) => `${task.title} ${task.project}`.toLowerCase().includes(term)).map((task) => ({ kind: "Task" as const, label: task.title, detail: task.project, page: "projects" as Page })),
      ...Object.values(MEMBERS).filter((member) => `${member.name} ${member.role}`.toLowerCase().includes(term)).map((member) => ({ kind: "Member" as const, label: member.name, detail: member.role, page: "people" as Page })),
    ].slice(0, 8);
  }, [query, revision]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F5F6FA" }}>
      <Sidebar active={page} onNav={setPage} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} onAccount={() => setAccountOpen(true)} />
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar onMobileMenu={() => setMobileOpen(true)} query={query} onQuery={setQuery} results={results} onResult={(result) => { setQuery(""); setPage(result.page); }} notifications={notifications} onNotification={async (notification) => { if (notification.meetingInvitation?.status === "PENDING") { const accepted = window.confirm("Accept this meeting invitation? Choose Cancel to decline."); await respondToMeetingInvitation(notification.meetingInvitation._id, accepted ? "ACCEPTED" : "DECLINED"); await refreshWorkspace(); return; } if (!notification.read) { await markNotificationRead(notification._id); setNotifications((items) => items.map((item) => item._id === notification._id ? { ...item, read: true } : item)); } if (notification.link) navigate(notification.link); }} onReadAll={async () => { await markAllNotificationsRead(); setNotifications((items) => items.map((item) => ({ ...item, read: true }))); }} onAccount={() => setAccountOpen(true)} />
        <main className="flex-1 overflow-auto scrollbar-thin" style={{ background: "#F5F6FA" }}>
          {page === "home" && <HomePage onRefresh={refreshWorkspace} onNavigate={setPage} onCreate={setCreationMode} />}
          {page === "projects" && <ProjectsPage onCreate={setCreationMode} onRefresh={refreshWorkspace} />}
          {page === "tasks" && <TasksPage onRefresh={refreshWorkspace} onToggle={async (task) => { await updateTaskStatus(task.sourceId, task.status === "done" ? "BACKLOG" : "DONE"); await refreshWorkspace(); }} />}
          {page === "calendar" && <CalendarPage key={`calendar-${revision}`} onCreate={setCreationMode} />}
          {page === "people" && <PeoplePage onChat={(channelId) => { setChatChannelId(channelId); setPage("chat"); }} />}
          {page === "chat" && <Chat initialChannelId={chatChannelId} />}
          {page === "updates" && <UpdatesPage key={`updates-${revision}`} />}
        </main>
      </div>
      {creationMode && <CreateModal mode={creationMode} onClose={() => setCreationMode(null)} onSaved={refreshWorkspace} />}
      {accountOpen && <AccountSettings onClose={() => setAccountOpen(false)} onSaved={refreshWorkspace} onSignOut={async () => { await signout(); navigate("/Kanbas/Account/Signin"); }} />}
      {page === "home" && CURRENT_USER.id && <OnboardingTour userId={CURRENT_USER.id} />}
      {CURRENT_USER.id && (page === "projects" || page === "tasks" || page === "calendar" || page === "people" || page === "chat") && <PageOnboarding userId={CURRENT_USER.id} page={page} />}
    </div>
  );
}
