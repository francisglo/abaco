// Modelo de mensaje para chat grupal
export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}
