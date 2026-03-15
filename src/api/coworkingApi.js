// Ejemplo de consumo de usuarios y posts reales desde el backend (RTK Query)
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const coworkingApi = createApi({
  reducerPath: 'coworkingApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/coworking/' }),
  endpoints: (builder) => ({
    getUsers: builder.query({ query: () => 'users' }),
    getPosts: builder.query({ query: () => 'posts' }),
    // Endpoints de grupos
    getGroups: builder.query({ query: () => 'groups' }),
    createGroup: builder.mutation({
      query: (group) => ({
        url: 'groups',
        method: 'POST',
        body: group,
      }),
    }),
    joinGroup: builder.mutation({
      query: (groupId) => ({
        url: `groups/${groupId}/join`,
        method: 'POST',
      }),
    }),
    leaveGroup: builder.mutation({
      query: (groupId) => ({
        url: `groups/${groupId}/leave`,
        method: 'POST',
      }),
    }),
    // Endpoint de mensajes directos
    getMessages: builder.query({
      query: (userId) => `messages/${userId}`
    }),
    // Endpoint de eventos
    getEvents: builder.query({
      query: () => 'events'
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetPostsQuery,
  useGetGroupsQuery,
  useCreateGroupMutation,
  useJoinGroupMutation,
  useLeaveGroupMutation,
  useGetMessagesQuery,
  useGetEventsQuery
} = coworkingApi;

// En tu store: import { coworkingApi } y agregar coworkingApi.reducer y middleware
// En CoworkingPage.jsx:
// const { data: users = [] } = useGetUsersQuery();
// const { data: posts = [] } = useGetPostsQuery();
