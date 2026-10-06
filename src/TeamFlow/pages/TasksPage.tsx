import { useState, type SelectHTMLAttributes } from "react";
import TaskDetail from "../TaskDetail";
import { PROJECTS, TASKS, type Task } from "../data";

function FilterSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <div className="relative min-w-0 max-w-full">
    <select {...props} className="block w-full max-w-full appearance-none rounded-xl border border-[#E5E7EB] bg-white pl-3 pr-9 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]" />
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </div>;
}

function TaskRow({ task, onToggle, onOpen }: { task: Task; onOpen: (task: Task) => void; onToggle: (task: Task) => void }) {
  const done = task.status === "done";
  return <div className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}><button onClick={() => onToggle(task)} aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`} className="w-5 h-5 rounded-md border flex items-center justify-center" style={{ borderColor: done ? "#7C5CFC" : "#D1D5DB", background: done ? "#7C5CFC" : "white" }}>{done && <span className="text-white text-[12px]">✓</span>}</button><span className="w-2 h-2 rounded-full" style={{ background: task.projectColor }} /><button onClick={() => onOpen(task)} className="flex-1 min-w-0 text-left rounded-lg hover:bg-[#F8F9FB] focus-visible:ring-2 focus-visible:ring-[#7C5CFC]"><p className={`text-[13px] font-semibold truncate ${done ? "line-through text-[#9CA3AF]" : "text-[#111827]"}`}>{task.title}</p><p className="text-[11.5px] text-[#9CA3AF] mt-0.5">{task.project} · Assigned to {task.assigneeName || task.assignee}</p></button>{task.overdue && !done && <span className="text-[10px] font-bold rounded-lg px-2 py-0.5 text-[#DC2626] bg-[#FEF2F2]">Overdue</span>}<span className="text-[11px] font-semibold rounded-full px-2.5 py-1 capitalize bg-[#F5F6FA] text-[#6B7280]">{task.status.replace("-", " ")}</span><span className="text-[11.5px] text-[#9CA3AF] whitespace-nowrap">{task.dueDate}</span></div>;
}

export default function TasksPage({ onToggle, onRefresh }: { onToggle: (task: Task) => void; onRefresh: () => Promise<void> }) {
  const [selected, setSelected] = useState<Task | null>(null);
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignee, setAssignee] = useState("");
  const [sort, setSort] = useState("due");
  const visible = TASKS.filter((task) => `${task.title} ${task.project}`.toLowerCase().includes(query.trim().toLowerCase()) && (!projectId || task.projectId === projectId) && (!status || task.status === status) && (!priority || task.priority === priority) && (!assignee || (task.assigneeId || "unassigned") === assignee)).sort((a, b) => sort === "priority" ? ["urgent", "high", "medium", "low"].indexOf(a.priority) - ["urgent", "high", "medium", "low"].indexOf(b.priority) : sort === "title" ? a.title.localeCompare(b.title) : (a.dueAt ? Date.parse(a.dueAt) : Infinity) - (b.dueAt ? Date.parse(b.dueAt) : Infinity));
  const reset = () => { setQuery(""); setProjectId(""); setStatus(""); setPriority(""); setAssignee(""); setSort("due"); };
  const selectClass = "rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-xs text-gray-700";
  const [error, setError] = useState("");
  const toggle = async (task: Task) => { try { setError(""); await onToggle(task); } catch { setError("Could not update this task. Please try again."); } };
  const overdue = visible.filter((task) => task.overdue && task.status !== "done");
  return <div className="px-7 py-7" style={{ maxWidth: 1160, margin: "0 auto" }}><div className="mb-6"><h1 className="text-[22px] font-bold text-[#111827]">Tasks</h1><p className="text-[13px] mt-1 text-[#9CA3AF]">Open a task to edit details or discuss it with your team.</p></div><div className="mb-5 flex flex-wrap gap-3">
    <input aria-label="Search tasks" placeholder="Search tasks or projects…" value={query} onChange={(e) => setQuery(e.target.value)} className={`${selectClass} flex-1 min-w-[200px]`} />
    <FilterSelect aria-label="Filter by project" value={projectId} onChange={(e) => setProjectId(e.target.value)} className={selectClass}><option value="">All projects</option>{PROJECTS.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</FilterSelect>
    <FilterSelect aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}><option value="">All statuses</option>{["backlog", "in-progress", "in-review", "done"].map((value) => <option key={value} value={value}>{value.replace(/-/g, " ")}</option>)}</FilterSelect>
    <FilterSelect aria-label="Filter by priority" value={priority} onChange={(e) => setPriority(e.target.value)} className={selectClass}><option value="">All priorities</option>{["urgent", "high", "medium", "low"].map((value) => <option key={value} value={value}>{value}</option>)}</FilterSelect>
    <FilterSelect aria-label="Filter by assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} className={selectClass}><option value="">All assignees</option><option value="unassigned">Unassigned</option>{Array.from(new Map(TASKS.filter((task) => task.assigneeId).map((task) => [task.assigneeId, { id: task.assigneeId!, name: task.assigneeName || task.assignee }])).values()).map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</FilterSelect>
    <FilterSelect aria-label="Sort tasks" value={sort} onChange={(e) => setSort(e.target.value)} className={selectClass}><option value="due">Due date</option><option value="priority">Priority</option><option value="title">Title</option></FilterSelect>
    <button onClick={reset} className="px-2 text-xs font-semibold text-[#7C5CFC]">Reset filters</button>
  </div>{error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}<section className="mb-5 overflow-hidden rounded-2xl bg-white border border-[#EAECF0]"><header className="flex items-center justify-between px-5 py-3.5 border-b border-[#F3F4F6]"><div><p className="text-[13px] font-semibold text-[#111827]">Overdue tasks</p><p className="text-[11.5px] text-[#9CA3AF]">Needs attention before other planned work.</p></div><span className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#DC2626] bg-[#FEF2F2]">{overdue.length}</span></header>{overdue.length ? overdue.map((task) => <TaskRow key={task.id} task={task} onToggle={toggle} onOpen={setSelected} />) : <div className="flex items-center gap-2 px-5 py-5 text-[12.5px] text-[#9CA3AF]"><span>No overdue tasks in this view.</span><span aria-label="On track" className="flex h-5 w-5 items-center justify-center rounded-full bg-[#DCFCE7] text-[12px] font-bold text-[#16A34A]">✓</span></div>}</section><section className="bg-white rounded-2xl overflow-hidden border border-[#EAECF0]"><header className="px-5 py-3.5 border-b border-[#F3F4F6]"><p className="text-[13px] font-semibold text-[#111827]">Tasks · {visible.length} of {TASKS.length}</p></header>{visible.map((task) => <TaskRow key={task.id} task={task} onToggle={toggle} onOpen={setSelected} />)}{!visible.length && <div className="px-5 py-8 text-center text-sm text-gray-500">{TASKS.length ? "No tasks match these filters." : "No tasks yet. Create your first task from the workspace home."}{TASKS.length > 0 && <button onClick={reset} className="block mx-auto mt-3 text-[#7C5CFC] font-semibold">Clear filters</button>}</div>}</section>{selected && <TaskDetail key={selected.sourceId} task={selected} onClose={() => setSelected(null)} onRefresh={onRefresh} />}</div>;
}
