import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { coworkingApi } from '../api/coworkingApi';

// Async thunks opcionales si necesitas lógica extra
export const fetchGroups = createAsyncThunk('groups/fetchGroups', async (_, { dispatch }) => {
  const result = await dispatch(coworkingApi.endpoints.getGroups.initiate());
  return result.data || [];
});

const groupsSlice = createSlice({
  name: 'groups',
  initialState: {
    groups: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default groupsSlice.reducer;
