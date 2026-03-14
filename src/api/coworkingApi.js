// Ejemplo de consumo de usuarios y posts reales desde el backend (RTK Query)
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const coworkingApi = createApi({
  reducerPath: 'coworkingApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/coworking/' }),
  endpoints: (builder) => ({
    getUsers: builder.query({ query: () => 'users' }),
    getPosts: builder.query({ query: () => 'posts' }),
    // ...otros endpoints
  }),
});

export const { useGetUsersQuery, useGetPostsQuery } = coworkingApi;

// En tu store: import { coworkingApi } y agregar coworkingApi.reducer y middleware
// En CoworkingPage.jsx:
// const { data: users = [] } = useGetUsersQuery();
// const { data: posts = [] } = useGetPostsQuery();
