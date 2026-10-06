import test from "node:test";
import assert from "node:assert/strict";
import routes from "../routes.js";
import { TeamFlowTask, TeamFlowMembership, TeamFlowActivity, TeamFlowTaskComment } from "../models.js";

const handlers = new Map();
const app = Object.fromEntries(["get", "post", "patch"].map((method) => [method, (path, handler) => handlers.set(`${method} ${path}`, handler)]));
routes(app);
const id = "507f1f77bcf86cd799439011";
const res = () => ({ code: 200, data: undefined, status(code) { this.code = code; return this; }, sendStatus(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } });
const invoke = async (method, suffix, body = {}, session = { teamFlowUserId: id }) => {
  const response = res(); await handlers.get(`${method} /api/teamflow/tasks/:id${suffix}`)({ params: { id }, body, session }, response); return response;
};

test("task editing and comments respect membership, validation and persistence", async () => {
  const originals = [ [TeamFlowTask, "findById"], [TeamFlowMembership, "exists"], [TeamFlowActivity, "create"], [TeamFlowTaskComment, "create"], [TeamFlowTaskComment, "find"] ];
  const saved = originals.map(([model, key]) => model[key]);
  let writes = 0, allowed = true;
  const task = { _id: id, project: id, title: "Original", status: "BACKLOG", async save() { writes++; } };
  TeamFlowTask.findById = async () => task;
  TeamFlowMembership.exists = async () => allowed;
  TeamFlowActivity.create = async () => ({});
  const comments = [];
  TeamFlowTaskComment.create = async (value) => { const item = { ...value, _id: id, populate: async () => item }; comments.push(item); return item; };
  TeamFlowTaskComment.find = () => ({ populate: () => ({ sort: () => ({ lean: async () => comments }) }) });
  try {
    assert.equal((await invoke("patch", "", { title: "Change" }, {})).code, 401);
    allowed = false;
    assert.equal((await invoke("patch", "", { title: "Change" })).code, 404);
    assert.equal((await invoke("post", "/comments", { body: "Hidden" })).code, 404);
    allowed = true;
    for (const body of [{ status: "INVALID" }, { priority: "INVALID" }, { title: " " }, { dueDate: "invalid" }, { assigneeId: "invalid" }]) assert.equal((await invoke("patch", "", body)).code, 400);
    assert.equal(writes, 0);
    const response = await invoke("patch", "", { title: " Updated ", description: "Details", priority: "HIGH", status: "IN_REVIEW", assigneeId: id, dueDate: "2026-10-10T23:59:59" });
    assert.equal(response.code, 200); assert.equal(task.title, "Updated"); assert.equal(task.status, "IN_REVIEW"); assert.equal(task.assignee, id); assert.equal(writes, 1);
    await invoke("patch", "", { assigneeId: "", dueDate: null });
    assert.equal(task.assignee, undefined); assert.equal(task.dueDate, undefined);
    assert.equal((await invoke("post", "/comments", { body: " " })).code, 400);
    assert.equal((await invoke("post", "/comments", { body: " Update posted " })).code, 201);
    const loaded = await invoke("get", "/comments"); assert.equal(loaded.data.length, 1); assert.equal(loaded.data[0].body, "Update posted");
    allowed = false; assert.equal((await invoke("get", "/comments")).code, 404);
  } finally { originals.forEach(([model, key], index) => { model[key] = saved[index]; }); }
});
