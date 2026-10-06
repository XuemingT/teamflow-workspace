import { useEffect, useRef, useState } from "react";
import { addTaskComment, getTaskComments, getTaskDetail, updateTask } from "../Kanbas/teamflowClient";
import type { Task } from "./data";

type Comment = { _id: string; body: string; createdAt: string; author?: { firstName: string; lastName: string } };
type Member = { _id: string; firstName: string; lastName: string };
const control = "mt-1 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]";
const message = (error: any) => error?.response?.data?.message || "Could not complete this request. Please try again.";

export default function TaskDetail({ task, onClose, onRefresh }: { task: Task; onClose: () => void; onRefresh: () => Promise<void> }) {
  const [form, setForm] = useState({ title: "", description: "", status: "BACKLOG", priority: "MEDIUM", assigneeId: "", dueDate: "" });
  const [members, setMembers] = useState<Member[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [retry, setRetry] = useState(0);
  const panel = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const requestClose = () => { if (!busy && (!(dirty || body.trim()) || window.confirm("Discard your unsaved changes?"))) onClose(); };
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    close.current?.focus();
    return () => previous?.focus();
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    Promise.all([getTaskDetail(task.sourceId), getTaskComments(task.sourceId)]).then(([detail, items]) => {
      if (!active) return;
      const value = detail.task;
      setForm({ title: value.title, description: value.description || "", status: value.status, priority: value.priority, assigneeId: value.assignee || "", dueDate: value.dueDate ? (() => { const date = new Date(value.dueDate); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; })() : "" });
      setMembers(detail.members); setComments(items);
    }).catch((err) => { if (active) setError(message(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [task.sourceId, retry]);
  const change = (field: keyof typeof form, value: string) => { setForm((current) => ({ ...current, [field]: value })); setDirty(true); setFeedback(""); };
  const refresh = async () => { try { await onRefresh(); } catch { setError("Saved successfully, but the task list could not refresh. Reload the page to see the latest data."); } };
  return <div className="fixed inset-0 z-[70]">
    <div className="absolute inset-0 bg-[#111827]/35" onClick={requestClose} />
    <aside ref={panel} role="dialog" aria-modal="true" aria-labelledby="task-detail-title" onKeyDown={(event) => {
      if (event.key === "Escape") { event.stopPropagation(); requestClose(); }
      if (event.key === "Tab") {
        const elements = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)');
        if (!elements?.length) return;
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }} className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-5">
        <div><p className="text-xs text-[#6B7280]">{task.project}</p><h2 id="task-detail-title" className="mt-1 text-lg font-bold text-[#111827]">Task details</h2></div>
        <button ref={close} disabled={busy} onClick={requestClose} aria-label="Close task details" className="rounded-lg px-3 py-2 text-xl hover:bg-gray-100 disabled:opacity-40">×</button>
      </header>
      <div className="space-y-6 p-6">
        {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}{!form.title && !loading && <button onClick={() => setRetry((value) => value + 1)} className="ml-2 underline">Retry</button>}</div>}
        {feedback && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{feedback}</p>}
        {loading ? <p role="status" className="text-sm text-gray-500">Loading task…</p> : form.title !== "" || members.length > 0 ? <>
          <form onSubmit={async (event) => {
            event.preventDefault(); setBusy(true); setError(""); setFeedback("");
            try { await updateTask(task.sourceId, { ...form, dueDate: form.dueDate ? `${form.dueDate}T23:59:59` : null }); setDirty(false); setFeedback("Task saved."); await refresh(); }
            catch (err) { setError(message(err)); } finally { setBusy(false); }
          }}>
            <fieldset disabled={busy} className="space-y-4">
              <label className="block text-xs font-semibold text-gray-600">Title<input required maxLength={200} value={form.title} onChange={(e) => change("title", e.target.value)} className={control} /></label>
              <label className="block text-xs font-semibold text-gray-600">Description<textarea rows={4} maxLength={10000} value={form.description} onChange={(e) => change("description", e.target.value)} placeholder="What needs to be done?" className={control} /></label>
              <div className="grid grid-cols-2 gap-4">
                <label className="text-xs font-semibold text-gray-600">Status<select value={form.status} onChange={(e) => change("status", e.target.value)} className={control}>{[["BACKLOG", "Backlog"], ["IN_PROGRESS", "In progress"], ["IN_REVIEW", "In review"], ["DONE", "Done"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="text-xs font-semibold text-gray-600">Priority<select value={form.priority} onChange={(e) => change("priority", e.target.value)} className={control}>{["LOW", "MEDIUM", "HIGH", "URGENT"].map((value) => <option key={value} value={value}>{value[0] + value.slice(1).toLowerCase()}</option>)}</select></label>
                <label className="text-xs font-semibold text-gray-600">Assignee<select value={form.assigneeId} onChange={(e) => change("assigneeId", e.target.value)} className={control}><option value="">Unassigned</option>{members.map((member) => <option key={member._id} value={member._id}>{member.firstName} {member.lastName}</option>)}</select></label>
                <label className="text-xs font-semibold text-gray-600">Due date<input type="date" value={form.dueDate} onChange={(e) => change("dueDate", e.target.value)} className={control} /></label>
              </div>
              <button disabled={!dirty || busy || !form.title.trim()} className="rounded-xl bg-[#7C5CFC] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">{busy ? "Saving…" : "Save changes"}</button>
            </fieldset>
          </form>
          <section className="border-t pt-5"><h3 className="text-sm font-semibold">Comments · {comments.length}</h3>
            <div className="my-4 space-y-4">{comments.length ? comments.map((comment) => <article key={comment._id} className="rounded-xl bg-[#F8F9FB] p-4"><div className="flex flex-wrap justify-between gap-2 text-xs"><strong>{comment.author ? `${comment.author.firstName} ${comment.author.lastName}` : "Team member"}</strong><time dateTime={comment.createdAt} className="text-gray-500">{new Date(comment.createdAt).toLocaleString()}</time></div><p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-700">{comment.body}</p></article>) : <p className="text-sm text-gray-500">Start the discussion with a comment.</p>}</div>
            <form onSubmit={async (event) => {
              event.preventDefault(); setBusy(true); setError(""); setFeedback("");
              try { const comment = await addTaskComment(task.sourceId, body); setComments((items) => [...items, comment]); setBody(""); setFeedback("Comment posted."); await refresh(); }
              catch (err) { setError(message(err)); } finally { setBusy(false); }
            }}><label className="block text-xs font-semibold text-gray-600">Add a comment<textarea disabled={busy} rows={3} maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} className={control} placeholder="Share an update or ask a question…" /></label><button disabled={busy || !body.trim()} className="mt-3 rounded-xl bg-[#7C5CFC] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Post comment</button></form>
          </section>
        </> : null}
      </div>
    </aside>
  </div>;
}
