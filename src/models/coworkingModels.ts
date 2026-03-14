// Modelos de datos para coworking ÁBACO (TypeScript style)

// Usuario
export interface User {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  experience: string[];
  education: string[];
  portfolio: Project[];
  followers: string[];
  following: string[];
  posts: string[];
  groups: string[];
  createdAt: Date;
}

// Proyecto en portafolio
export interface Project {
  id: string;
  title: string;
  description: string;
  link?: string;
  image?: string;
}

// Post
export interface Post {
  id: string;
  authorId: string;
  content: string;
  media?: string[];
  createdAt: Date;
  reactions: Reaction[];
  comments: Comment[];
}

export interface Reaction {
  userId: string;
  type: 'like' | 'celebrate' | 'recommend';
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

// Grupo
export interface Group {
  id: string;
  name: string;
  description: string;
  members: string[];
  posts: string[];
  admins: string[];
}

// Conexión
export interface Connection {
  userId: string;
  targetUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
}
