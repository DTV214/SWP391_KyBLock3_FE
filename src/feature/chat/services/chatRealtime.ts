import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import BASE_URL from "@/api/apiConfig";

type RealtimeListener = () => void;
type ConnectionListener = (connected: boolean) => void;
type PersistentGroupSubscription = {
  methodNames: string[];
  args: unknown[];
  referenceCount: number;
};

const SIGNALR_EVENT_NAMES = Array.from(
  new Set([
    "ReceiveMessage",
    "MessageReceived",
    "NewMessage",
    "ChatMessageReceived",
    "ReceiveChatMessage",
    "ReceiveConversationMessage",
    "ReceiveReply",
    "ReplyReceived",
    "ReceiveAdminMessage",
    "AdminMessageReceived",
    "ReceiveStaffMessage",
    "StaffMessageReceived",
    "ReceiveSupportMessage",
    "SupportMessageReceived",
    "ReceiveUserMessage",
    "UserMessageReceived",
    "MessagesRead",
    "ConversationReadUpdated",
    "ChatUpdated",
    "ConversationUpdated",
    "ReceiveConversationUpdate",
    "ConversationListUpdated",
    "ChatListUpdated",
    "UnreadCountUpdated",
    "UnreadUpdated",
    "UnreadMessagesUpdated",
    "UnreadConversationsUpdated",
    "MessagesUpdated",
    "MessageRead",
    "ReceiveMessageRead",
    "NewConversation",
    "ConversationCreated",
    "ChatNotificationReceived",
    "ReceiveChatNotification",
    "NotificationReceived",
    "ReceiveNotification",
  ]),
);

const normalizeUrl = (value: string): string => value.replace(/\/+$/, "");

const resolveHubCandidates = (): string[] => {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  const envHubUrl = env?.VITE_CHAT_HUB_URL?.trim();
  const apiBase = normalizeUrl(BASE_URL);
  const rootBase = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;

  return [
    envHubUrl,
    `${rootBase}/chatHub`,
    `${rootBase}/chathub`,
    `${rootBase}/hubs/chat`,
    `${apiBase}/chatHub`,
    `${apiBase}/hubs/chat`,
  ].filter((value, index, array): value is string =>
    Boolean(value) && array.indexOf(value) === index,
  );
};

class ChatRealtimeService {
  private connection: HubConnection | null = null;
  private startPromise: Promise<boolean> | null = null;
  private realtimeListeners = new Set<RealtimeListener>();
  private connectionListeners = new Set<ConnectionListener>();
  private persistentGroups = new Map<string, PersistentGroupSubscription>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  subscribe(listener: RealtimeListener): () => void {
    this.realtimeListeners.add(listener);
    void this.ensureConnected();
    return () => {
      this.realtimeListeners.delete(listener);
      void this.stopIfIdle();
    };
  }

  subscribeConnection(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);
    listener(this.isConnected());
    void this.ensureConnected();
    return () => {
      this.connectionListeners.delete(listener);
      void this.stopIfIdle();
    };
  }

  isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }

  private emitRealtime(): void {
    this.realtimeListeners.forEach((listener) => listener());
  }

  private emitConnection(): void {
    const connected = this.isConnected();
    this.connectionListeners.forEach((listener) => listener(connected));
  }

  private hasActiveListeners(): boolean {
    return this.realtimeListeners.size > 0 || this.connectionListeners.size > 0;
  }

  private clearReconnectTimer(): void {
    if (!this.reconnectTimer) return;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private scheduleReconnect(delayMs = 1500): void {
    if (this.reconnectTimer) return;
    if (this.startPromise) return;
    if (this.isConnected()) return;
    if (!this.hasActiveListeners()) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.ensureConnected();
    }, delayMs);
  }

  private attachConnectionHandlers(connection: HubConnection): void {
    SIGNALR_EVENT_NAMES.forEach((eventName) => {
      connection.on(eventName, () => {
        this.emitRealtime();
      });
    });

    connection.onreconnected(() => {
      this.emitConnection();
      void this.rejoinPersistentGroups();
    });

    connection.onreconnecting(() => {
      this.emitConnection();
    });

    connection.onclose(() => {
      this.emitConnection();
      if (this.realtimeListeners.size > 0 || this.connectionListeners.size > 0) {
        void this.ensureConnected();
      }
    });
  }

  private async invokeOnConnection(
    connection: HubConnection,
    methodNames: string[],
    args: unknown[],
  ): Promise<boolean> {
    for (const methodName of methodNames) {
      try {
        await connection.invoke(methodName, ...args);
        return true;
      } catch {
        // Try the next candidate method name.
      }
    }

    return false;
  }

  private async rejoinPersistentGroups(): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      return;
    }

    const connection = this.connection;
    const groups = Array.from(this.persistentGroups.values());

    await Promise.all(
      groups.map((group) =>
        this.invokeOnConnection(connection, group.methodNames, group.args),
      ),
    );

    this.emitRealtime();
  }

  private async createAndStartConnection(): Promise<boolean> {
    const tokenFactory = () => localStorage.getItem("token") || "";
    const hadPreviousConnection = this.connection !== null;
    this.clearReconnectTimer();

    for (const url of resolveHubCandidates()) {
      const connection = new HubConnectionBuilder()
        .withUrl(url, {
          accessTokenFactory: tokenFactory,
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build();

      this.attachConnectionHandlers(connection);

      try {
        await connection.start();
        this.connection = connection;
        if (hadPreviousConnection) {
          await this.rejoinPersistentGroups();
        }
        this.clearReconnectTimer();
        this.emitConnection();
        return true;
      } catch {
        await connection.stop().catch(() => undefined);
      }
    }

    this.connection = null;
    this.emitConnection();
    return false;
  }

  async ensureConnected(): Promise<boolean> {
    if (this.isConnected()) {
      return true;
    }

    if (this.startPromise) {
      return this.startPromise;
    }

    this.startPromise = this.createAndStartConnection()
      .then((connected) => {
        if (!connected) {
          this.scheduleReconnect();
        }
        return connected;
      })
      .finally(() => {
        this.startPromise = null;
      });

    return this.startPromise;
  }

  async invokeFirstSuccessful(
    methodNames: string[],
    ...args: unknown[]
  ): Promise<boolean> {
    const connected = await this.ensureConnected();
    if (!connected || !this.connection) {
      return false;
    }

    return this.invokeOnConnection(this.connection, methodNames, args);
  }

  async joinGroup(
    key: string,
    methodNames: string[],
    ...args: unknown[]
  ): Promise<boolean> {
    const existing = this.persistentGroups.get(key);
    if (existing) {
      existing.referenceCount += 1;
      existing.methodNames = [...methodNames];
      existing.args = [...args];
      void this.ensureConnected();
      return true;
    }

    this.persistentGroups.set(key, {
      methodNames: [...methodNames],
      args: [...args],
      referenceCount: 1,
    });
    return this.invokeFirstSuccessful(methodNames, ...args);
  }

  async leaveGroup(
    key: string,
    methodNames: string[],
    ...args: unknown[]
  ): Promise<boolean> {
    const existing = this.persistentGroups.get(key);
    if (!existing) {
      return false;
    }

    if (existing.referenceCount > 1) {
      existing.referenceCount -= 1;
      return true;
    }

    this.persistentGroups.delete(key);

    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      return false;
    }

    return this.invokeOnConnection(this.connection, methodNames, args);
  }

  async stopIfIdle(): Promise<void> {
    if (this.realtimeListeners.size > 0 || this.connectionListeners.size > 0) {
      return;
    }

    this.clearReconnectTimer();
    if (!this.connection) return;

    const connection = this.connection;
    this.connection = null;
    this.persistentGroups.clear();
    await connection.stop().catch(() => undefined);
    this.emitConnection();
  }
}

export const chatRealtimeService = new ChatRealtimeService();
