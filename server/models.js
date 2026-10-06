import mongoose from "mongoose";

const { Schema, model, models } = mongoose;
const userSchema = new Schema({ username: { type: String, unique: true, required: true }, password: { type: String, required: true }, firstName: String, lastName: String, email: String, role: { type: String, enum: ["ADMIN", "MANAGER", "LEAD", "MEMBER"], required: true } }, { timestamps: true });
const projectSchema = new Schema({ name: { type: String, required: true }, slug: { type: String, unique: true }, description: String, status: { type: String, enum: ["ON_TRACK", "AT_RISK", "BLOCKED", "COMPLETE", "ARCHIVED"], default: "ON_TRACK" }, color: String, dueDate: Date, owner: { type: Schema.Types.ObjectId, ref: "TeamFlowUser" } }, { timestamps: true });
const membershipSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: "TeamFlowUser", required: true }, project: { type: Schema.Types.ObjectId, ref: "TeamFlowProject", required: true }, role: { type: String, enum: ["OWNER", "LEAD", "MEMBER"], default: "MEMBER" } }, { timestamps: true }); membershipSchema.index({ user: 1, project: 1 }, { unique: true });
const taskSchema = new Schema({ title: { type: String, required: true }, description: String, project: { type: Schema.Types.ObjectId, ref: "TeamFlowProject", required: true }, assignee: { type: Schema.Types.ObjectId, ref: "TeamFlowUser" }, status: { type: String, enum: ["BACKLOG", "IN_PROGRESS", "IN_REVIEW", "DONE"], default: "BACKLOG" }, priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], default: "MEDIUM" }, dueDate: Date }, { timestamps: true });
const eventSchema = new Schema({ title: String, description: String, project: { type: Schema.Types.ObjectId, ref: "TeamFlowProject" }, startsAt: Date, endsAt: Date, attendees: [{ type: Schema.Types.ObjectId, ref: "TeamFlowUser" }], meetingUrl: String }, { timestamps: true });
const activitySchema = new Schema({ actor: { type: Schema.Types.ObjectId, ref: "TeamFlowUser", required: true }, project: { type: Schema.Types.ObjectId, ref: "TeamFlowProject" }, task: { type: Schema.Types.ObjectId, ref: "TeamFlowTask" }, type: String, message: String }, { timestamps: true });
const invitationSchema = new Schema({ email: { type: String, required: true }, role: { type: String, default: "MEMBER" }, invitedBy: { type: Schema.Types.ObjectId, ref: "TeamFlowUser", required: true }, status: { type: String, enum: ["PENDING", "ACCEPTED"], default: "PENDING" } }, { timestamps: true });
const meetingInvitationSchema = new Schema({ event: { type: Schema.Types.ObjectId, ref: "TeamFlowEvent", required: true }, invitee: { type: Schema.Types.ObjectId, ref: "TeamFlowUser", required: true }, invitedBy: { type: Schema.Types.ObjectId, ref: "TeamFlowUser", required: true }, status: { type: String, enum: ["PENDING", "ACCEPTED", "DECLINED"], default: "PENDING" } }, { timestamps: true }); meetingInvitationSchema.index({ event: 1, invitee: 1 }, { unique: true });
const notificationSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: "TeamFlowUser", required: true }, title: String, body: String, read: { type: Boolean, default: false }, link: String, meetingInvitation: { type: Schema.Types.ObjectId, ref: "TeamFlowMeetingInvitation" } }, { timestamps: true });
const teamSchema = new Schema({ name: String, description: String, createdBy: { type: Schema.Types.ObjectId, ref: "TeamFlowUser" } }, { timestamps: true });
const teamMembershipSchema = new Schema({ team: { type: Schema.Types.ObjectId, ref: "TeamFlowTeam", required: true }, user: { type: Schema.Types.ObjectId, ref: "TeamFlowUser", required: true }, role: { type: String, enum: ["OWNER", "LEAD", "MEMBER"], default: "MEMBER" } }, { timestamps: true }); teamMembershipSchema.index({ team: 1, user: 1 }, { unique: true });
const channelSchema = new Schema({ team: { type: Schema.Types.ObjectId, ref: "TeamFlowTeam", required: true }, type: { type: String, enum: ["GROUP", "DIRECT"], required: true }, name: String, members: [{ type: Schema.Types.ObjectId, ref: "TeamFlowUser" }], createdBy: { type: Schema.Types.ObjectId, ref: "TeamFlowUser" } }, { timestamps: true });
const messageSchema = new Schema({ channel: { type: Schema.Types.ObjectId, ref: "TeamFlowChannel", required: true }, sender: { type: Schema.Types.ObjectId, ref: "TeamFlowUser", required: true }, body: { type: String, required: true } }, { timestamps: true });

export const TeamFlowUser = models.TeamFlowUser || model("TeamFlowUser", userSchema);
export const TeamFlowProject = models.TeamFlowProject || model("TeamFlowProject", projectSchema);
export const TeamFlowMembership = models.TeamFlowMembership || model("TeamFlowMembership", membershipSchema);
export const TeamFlowTask = models.TeamFlowTask || model("TeamFlowTask", taskSchema);
export const TeamFlowEvent = models.TeamFlowEvent || model("TeamFlowEvent", eventSchema);
export const TeamFlowActivity = models.TeamFlowActivity || model("TeamFlowActivity", activitySchema);
export const TeamFlowInvitation = models.TeamFlowInvitation || model("TeamFlowInvitation", invitationSchema);
export const TeamFlowMeetingInvitation = models.TeamFlowMeetingInvitation || model("TeamFlowMeetingInvitation", meetingInvitationSchema);
export const TeamFlowNotification = models.TeamFlowNotification || model("TeamFlowNotification", notificationSchema);
export const TeamFlowTeam = models.TeamFlowTeam || model("TeamFlowTeam", teamSchema);
export const TeamFlowTeamMembership = models.TeamFlowTeamMembership || model("TeamFlowTeamMembership", teamMembershipSchema);
export const TeamFlowChannel = models.TeamFlowChannel || model("TeamFlowChannel", channelSchema);
export const TeamFlowMessage = models.TeamFlowMessage || model("TeamFlowMessage", messageSchema);

export const TeamFlowTaskComment = models.TeamFlowTaskComment || model("TeamFlowTaskComment", new Schema({ task: { type: Schema.Types.ObjectId, ref: "TeamFlowTask", required: true, index: true }, author: { type: Schema.Types.ObjectId, ref: "TeamFlowUser", required: true }, body: { type: String, required: true, maxlength: 5000 } }, { timestamps: true }));
