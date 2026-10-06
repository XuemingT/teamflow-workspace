import { api } from "../api";

export const signin = async (credentials: { username: string; password: string }) => {
  const { data } = await api.post("/api/teamflow/auth/signin", credentials);
  return data;
};
export const getWorkspace = async () => {
  const { data } = await api.get("/api/teamflow/workspace");
  return data;
};

export const getSession = async () => (await api.get("/api/teamflow/auth/session")).data;
export const signout = async () => api.post("/api/teamflow/auth/signout");
export const updateProfile = async (payload: { firstName?: string; lastName?: string; email?: string; currentPassword?: string; newPassword?: string }) => (await api.patch("/api/teamflow/auth/profile", payload)).data;
export const createProject = async (payload: any) => (await api.post("/api/teamflow/projects", payload)).data;
export const updateProjectStatus = async (projectId: string, status: string) => (await api.patch(`/api/teamflow/projects/${projectId}`, { status })).data;
export const createTask = async (payload: any) => (await api.post("/api/teamflow/tasks", payload)).data;
export const createEvent = async (payload: any) => (await api.post("/api/teamflow/events", payload)).data;
export const createInvitation = async (payload: any) => (await api.post("/api/teamflow/invitations", payload)).data;
export const updateTaskStatus = async (taskId: string, status: string) => (await api.patch(`/api/teamflow/tasks/${taskId}`, { status })).data;
export const getNotifications = async () => (await api.get("/api/teamflow/notifications")).data;
export const markNotificationRead = async (notificationId: string) => (await api.post(`/api/teamflow/notifications/${notificationId}/read`)).data;
export const markAllNotificationsRead = async () => api.post("/api/teamflow/notifications/read-all");
export const respondToMeetingInvitation = async (invitationId: string, status: "ACCEPTED" | "DECLINED") => (await api.post(`/api/teamflow/meeting-invitations/${invitationId}/respond`, { status })).data;
export const getPeople = async (search?: string) => (await api.get("/api/teamflow/people", { params: search ? { search } : undefined })).data;
export const getChannels = async () => (await api.get("/api/teamflow/channels")).data;
export const getChannelMessages = async (channelId: string) => (await api.get(`/api/teamflow/channels/${channelId}/messages`)).data;
export const createDirectChannel = async (memberId: string) => (await api.post("/api/teamflow/channels/direct", { memberId })).data;
export const createGroupChannel = async (name: string, memberIds: string[]) => (await api.post("/api/teamflow/channels/group", { name, memberIds })).data;

export const getTaskDetail = async (id: string) => (await api.get(`/api/teamflow/tasks/${id}`)).data;
export const updateTask = async (id: string, payload: { title: string; description: string; status: string; priority: string; assigneeId: string; dueDate: string | null }) => (await api.patch(`/api/teamflow/tasks/${id}`, payload)).data;
export const getTaskComments = async (id: string) => (await api.get(`/api/teamflow/tasks/${id}/comments`)).data;
export const addTaskComment = async (id: string, body: string) => (await api.post(`/api/teamflow/tasks/${id}/comments`, { body })).data;
