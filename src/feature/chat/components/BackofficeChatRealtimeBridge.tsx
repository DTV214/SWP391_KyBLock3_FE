import { useEffect } from "react";
import { getCurrentUserId } from "@/feature/chat/services/chatService";
import { chatRealtimeService } from "@/feature/chat/services/chatRealtime";

const JOIN_USER_GROUP_METHODS = [
  "JoinUserGroup",
  "JoinCustomerGroup",
  "JoinAccountGroup",
  "JoinPersonalGroup",
  "JoinUserRoom",
];

const LEAVE_USER_GROUP_METHODS = [
  "LeaveUserGroup",
  "LeaveCustomerGroup",
  "LeaveAccountGroup",
  "LeavePersonalGroup",
  "LeaveUserRoom",
];

const JOIN_ROLE_GROUP_METHODS = [
  "JoinRoleGroup",
  "JoinRoleRoom",
  "JoinRoleChannel",
  "JoinRole",
  "JoinPermissionGroup",
];

const LEAVE_ROLE_GROUP_METHODS = [
  "LeaveRoleGroup",
  "LeaveRoleRoom",
  "LeaveRoleChannel",
  "LeaveRole",
  "LeavePermissionGroup",
];

const JOIN_BACKOFFICE_GROUP_METHODS = [
  "JoinAdminGroup",
  "JoinStaffGroup",
  "JoinSupportGroup",
  "JoinBackofficeGroup",
  "JoinOperatorGroup",
  "JoinChatAdminGroup",
  "JoinAllConversations",
  "JoinAllConversationGroup",
  "JoinAllChats",
  "JoinAllChatRooms",
  "JoinNotificationGroup",
  "JoinUnreadGroup",
  "JoinManagementGroup",
];

const LEAVE_BACKOFFICE_GROUP_METHODS = [
  "LeaveAdminGroup",
  "LeaveStaffGroup",
  "LeaveSupportGroup",
  "LeaveBackofficeGroup",
  "LeaveOperatorGroup",
  "LeaveChatAdminGroup",
  "LeaveAllConversations",
  "LeaveAllConversationGroup",
  "LeaveAllChats",
  "LeaveAllChatRooms",
  "LeaveNotificationGroup",
  "LeaveUnreadGroup",
  "LeaveManagementGroup",
];

export default function BackofficeChatRealtimeBridge() {
  const rawRole = (localStorage.getItem("role") || "").toUpperCase();
  const isBackofficeRole = rawRole === "ADMIN" || rawRole === "STAFF";

  useEffect(() => {
    if (!isBackofficeRole) return;

    const userId = getCurrentUserId();
    const roleKey = rawRole.toLowerCase();

    const unsubscribeConnection = chatRealtimeService.subscribeConnection(
      () => undefined,
    );

    void chatRealtimeService.joinGroup(
      "backoffice:global",
      JOIN_BACKOFFICE_GROUP_METHODS,
    );
    void chatRealtimeService.joinGroup(
      `backoffice:role:${roleKey}`,
      JOIN_ROLE_GROUP_METHODS,
      rawRole,
    );

    if (userId) {
      void chatRealtimeService.joinGroup(
        `backoffice:user:${userId}`,
        JOIN_USER_GROUP_METHODS,
        userId,
      );
    }

    return () => {
      unsubscribeConnection();

      void chatRealtimeService.leaveGroup(
        "backoffice:global",
        LEAVE_BACKOFFICE_GROUP_METHODS,
      );
      void chatRealtimeService.leaveGroup(
        `backoffice:role:${roleKey}`,
        LEAVE_ROLE_GROUP_METHODS,
        rawRole,
      );

      if (userId) {
        void chatRealtimeService.leaveGroup(
          `backoffice:user:${userId}`,
          LEAVE_USER_GROUP_METHODS,
          userId,
        );
      }
    };
  }, [isBackofficeRole, rawRole]);

  return null;
}
