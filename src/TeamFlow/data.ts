export type ProjectStatus = "on-track" | "at-risk" | "blocked" | "complete" | "archived";
export type Priority = "high" | "medium" | "low" | "urgent";
export type TaskStatus = "backlog" | "todo" | "in-progress" | "in-review" | "done";
export interface Member { id: string; initials: string; name: string; email?: string; color: string; role: string; }
export interface Project { id: string; name: string; shortName: string; color: string; status: ProjectStatus; progress: number; description: string; members: Member[]; openTasks: number; overdueTasks: number; updatedAt: string; startDate: string; dueDate: string; }
export interface Task { id: number; sourceId: string; title: string; projectId: string; project: string; projectColor: string; assignee: string; assigneeId?: string; assigneeName?: string; assigneeColor: string; dueDate: string; dueAt?: string; priority: Priority; status: TaskStatus; overdue?: boolean; }
export interface CalendarEvent { id: number; startsAt?: string; endsAt?: string; title: string; time: string; hour: number; duration: number; day: number; project: string; projectColor: string; attendees: string[]; hasVideo: boolean; description?: string; }
export interface Update { id: number; actor: string; initials: string; color: string; action: string; target: string; to?: string; project: string; projectId: string; projectColor: string; time: string; type: "status" | "comment" | "created" | "date" | "completed" | "mention" | "assigned"; comment?: string; unread: boolean; }

// Collections are filled only from the authenticated Atlas workspace response.
export const MEMBERS: Record<string, Member> = {};
export const PROJECTS: Project[] = [];
export const TASKS: Task[] = [];
export const EVENTS: CalendarEvent[] = [];
export const UPDATES: Update[] = [];
export const CURRENT_USER = { id: "", name: "", initials: "TF", role: "Member" };
export const CALENDAR = { label: "", monthShort: "" };
export const CALENDAR_DAYS: { day: number; label: string }[] = [];

const PALETTE = ["#7C5CFC", "#F59E0B", "#10B981", "#EF4444", "#6366F1"];
const initials = (user: any) => `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "TF";
const displayName = (user: any) => [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Team member";
const timeAgo = (date?: string) => { const minutes = Math.max(1, Math.floor((Date.now() - new Date(date || Date.now()).getTime()) / 60000)); return minutes < 60 ? `${minutes} min ago` : minutes < 1440 ? `${Math.floor(minutes / 60)} hr ago` : `${Math.floor(minutes / 1440)}d ago`; };
const formatDue = (date?: string) => date ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(date)) : "No due date";

export function replaceWorkspace(workspace: any) {
  const rawProjects = workspace?.projects || [], rawTasks = workspace?.tasks || [], rawEvents = workspace?.events || [], rawActivity = workspace?.activity || [];
  const memberById: Record<string, Member> = {};
  const memberFor = (user: any): Member => {
    const key = user?._id || user?.id || displayName(user);
    if (!memberById[key]) { const member = { id: String(key), initials: initials(user), name: displayName(user), email: user?.email, color: PALETTE[Object.keys(memberById).length % PALETTE.length], role: user?.role || "Member" }; memberById[key] = member; MEMBERS[member.initials] = member; }
    return memberById[key];
  };
  if (workspace?.currentUser) Object.assign(CURRENT_USER, { id: String(workspace.currentUser._id || workspace.currentUser.id || ""), name: displayName(workspace.currentUser), initials: initials(workspace.currentUser), role: workspace.currentUser.role || "Member" });
  (workspace?.members || []).forEach((member: any) => memberFor(member));
  rawTasks.forEach((task: any) => task.assignee && memberFor(task.assignee));
  rawActivity.forEach((item: any) => item.actor && memberFor(item.actor));
  const projectStatus = (value: string): ProjectStatus => ({ ON_TRACK: "on-track", AT_RISK: "at-risk", BLOCKED: "blocked", COMPLETE: "complete", ARCHIVED: "archived" } as Record<string, ProjectStatus>)[value] || "on-track";
  const taskStatus = (value: string): TaskStatus => ({ BACKLOG: "backlog", IN_PROGRESS: "in-progress", IN_REVIEW: "in-review", DONE: "done" } as Record<string, TaskStatus>)[value] || "todo";
  PROJECTS.splice(0, PROJECTS.length, ...rawProjects.map((project: any, index: number) => {
    const projectTasks = rawTasks.filter((task: any) => (task.project?._id || task.project) === project._id);
    const members = projectTasks.map((task: any) => task.assignee && memberFor(task.assignee)).filter(Boolean).filter((m: Member, i: number, all: Member[]) => all.findIndex((v) => v.initials === m.initials) === i);
    const completed = projectTasks.filter((task: any) => task.status === "DONE").length;
    return { id: project._id, name: project.name, shortName: (project.slug || project.name).slice(0, 3).toUpperCase(), color: project.color || PALETTE[index % PALETTE.length], status: projectStatus(project.status), progress: projectTasks.length ? Math.round(completed / projectTasks.length * 100) : 0, description: project.description || "No project description yet.", members, openTasks: projectTasks.filter((task: any) => task.status !== "DONE").length, overdueTasks: projectTasks.filter((task: any) => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE").length, updatedAt: timeAgo(project.updatedAt), startDate: formatDue(project.createdAt), dueDate: formatDue(project.dueDate) };
  }));
  TASKS.splice(0, TASKS.length, ...rawTasks.map((task: any, index: number) => { const project = task.project || {}, assignee = task.assignee ? memberFor(task.assignee) : { initials: "—", color: "#9CA3AF" }; return { id: index + 1, sourceId: task._id, title: task.title, projectId: project._id || task.project, project: project.name || "Project", projectColor: project.color || "#7C5CFC", assignee: assignee.initials, assigneeId: task.assignee?._id, assigneeName: task.assignee ? displayName(task.assignee) : "Unassigned", assigneeColor: assignee.color, dueDate: formatDue(task.dueDate), dueAt: task.dueDate, priority: (task.priority || "MEDIUM").toLowerCase() as Priority, status: taskStatus(task.status), overdue: Boolean(task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE") }; }));
  EVENTS.splice(0, EVENTS.length, ...rawEvents.map((event: any, index: number) => { const start = new Date(event.startsAt), end = event.endsAt ? new Date(event.endsAt) : start; return { id: index + 1, title: event.title, startsAt: event.startsAt, endsAt: event.endsAt, time: new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(start), hour: start.getHours() + start.getMinutes() / 60, duration: Math.max(30, (end.getTime() - start.getTime()) / 60000), day: start.getDate(), project: event.project?.name || "Workspace", projectColor: event.project?.color || "#7C5CFC", attendees: (event.attendees || []).map((attendee: any) => memberFor(attendee).initials), hasVideo: Boolean(event.meetingUrl) }; }));
  const now = new Date(); const nextEvent = rawEvents.find((event: any) => new Date(event.startsAt) >= now);
  const anchor = nextEvent?.startsAt ? new Date(nextEvent.startsAt) : new Date();
  Object.assign(CALENDAR, { label: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(anchor), monthShort: new Intl.DateTimeFormat("en-US", { month: "short" }).format(anchor) });
  const firstWeekday = (anchor.getDay() + 6) % 7;
  const monday = new Date(anchor); monday.setDate(anchor.getDate() - firstWeekday);
  CALENDAR_DAYS.splice(0, CALENDAR_DAYS.length, ...Array.from({ length: 5 }, (_, index) => { const date = new Date(monday); date.setDate(monday.getDate() + index); return { day: date.getDate(), label: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date) }; }));
  UPDATES.splice(0, UPDATES.length, ...rawActivity.map((item: any, index: number) => { const actor = item.actor ? memberFor(item.actor) : { initials: "TF", name: "TeamFlow", color: "#7C5CFC" }, project = item.project || {}; return { id: index + 1, actor: actor.name, initials: actor.initials, color: actor.color, action: item.type || "updated", target: item.task?.title || item.message || "the workspace", project: project.name || "Workspace", projectId: project._id || "workspace", projectColor: project.color || "#7C5CFC", time: timeAgo(item.createdAt), type: "status", unread: index < 2 }; }));
}
