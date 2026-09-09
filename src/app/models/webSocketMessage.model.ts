export type WebSocketMessageValue =
  | 'NEW_LOGIN'
  | 'DISABLE_USER'
  | 'DISABLE_ROLE'
  | 'NOTIFICATION_LOGOUT'
  | 'CLOSE_ALL_SESSIONS'
  | 'ERROR_SOCKET';

export type WebSocketMessageType = 'LOGOUT' | 'ERROR';

export interface WebSocketSessionEventData {
  token: string | null;
  userId: string;
}

export type WebSocketMessageData = WebSocketSessionEventData | string;

export interface WebSocketMessage {
  data: WebSocketMessageData;
  webSocketMessageValue: WebSocketMessageValue;
  webSocketMessageType: WebSocketMessageType;
  sessionId: string;
}

export function isWebSocketSessionData(data: WebSocketMessageData): data is WebSocketSessionEventData {
  return typeof data === 'object' && data !== null && 'userId' in data;
}
