import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import BASE_URL from "@/api/apiConfig";

type RealtimeListener = () => void;
type ConnectionListener = (connected: boolean) => void;

const SIGNALR_EVENT_NAMES = [
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
  "UnreadCountUpdated",
  "MessagesUpdated",
];

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

  private attachConnectionHandlers(connection: HubConnection): void {
    SIGNALR_EVENT_NAMES.forEach((eventName) => {
      connection.on(eventName, () => {
        this.emitRealtime();
      });
    });

    connection.onreconnected(() => {
      this.emitConnection();
      this.emitRealtime();
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

  private async createAndStartConnection(): Promise<boolean> {
    const tokenFactory = () => localStorage.getItem("token") || "";

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

    this.startPromise = this.createAndStartConnection().finally(() => {
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

    for (const methodName of methodNames) {
      try {
        await this.connection.invoke(methodName, ...args);
        return true;
      } catch {
        // Try the next candidate method name.
      }
    }

    return false;
  }

  async stopIfIdle(): Promise<void> {
    if (this.realtimeListeners.size > 0 || this.connectionListeners.size > 0) {
      return;
    }

    if (!this.connection) return;

    const connection = this.connection;
    this.connection = null;
    await connection.stop().catch(() => undefined);
    this.emitConnection();
  }
}

export const chatRealtimeService = new ChatRealtimeService();
