import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk para simular fetch de mensajes de grupo (reemplazar por RTK Query o WebSocket en producción)
export const fetchGroupMessages = createAsyncThunk('groupChat/fetchGroupMessages', async (groupId) => {
  // Aquí iría la llamada real a la API o WebSocket
  return [
    { id: 'm1', groupId, senderId: 'u1', senderName: 'Ana', content: '¡Bienvenidos al grupo!', createdAt: new Date().toISOString() },
    { id: 'm2', groupId, senderId: 'u2', senderName: 'Luis', content: '¡Hola a todos!', createdAt: new Date().toISOString() },
  ];
});

const groupChatSlice = createSlice({
  name: 'groupChat',
  initialState: {
    messagesByGroup: {}, // { [groupId]: [messages] }
    loading: false,
    error: null,
  },
  reducers: {
    addMessage(state, action) {
      const { groupId, message } = action.payload;
      if (!state.messagesByGroup[groupId]) state.messagesByGroup[groupId] = [];
      state.messagesByGroup[groupId].push(message);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroupMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupMessages.fulfilled, (state, action) => {
        const groupId = action.meta.arg;
        state.loading = false;
        state.messagesByGroup[groupId] = action.payload;
      })
      .addCase(fetchGroupMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { addMessage } = groupChatSlice.actions;
export default groupChatSlice.reducer;
