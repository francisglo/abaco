import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { UserCard, GroupCard, PostCard } from '../components/coworkingBaseComponents';
import CoworkingNotifications from '../components/CoworkingNotifications';
import { TextField, InputAdornment, IconButton, MenuItem, Select, Tabs, Tab } from '@mui/material';
import { MdSearch, MdFilterList } from 'react-icons/md';
import { Card, CardContent, Button } from '@mui/material';
import { useGetUsersQuery, useGetPostsQuery, useGetGroupsQuery } from '../api/coworkingApi';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProposals } from '../store/studentProposalsSlice';

// Datos de ejemplo
const users = [
  { id: '1', name: 'Ana Torres', bio: 'Gestora de proyectos sociales', avatar: '', },
  { id: '2', name: 'Luis Pérez', bio: 'Desarrollador GovTech', avatar: '', },
  { id: '3', name: 'María López', bio: 'Consultora institucional', avatar: '', },
];
const groups = [
  { id: 'g1', name: 'Innovación Pública', description: 'Proyectos y retos de gobierno abierto.' },
  { id: 'g2', name: 'Educación Digital', description: 'Transformación educativa y tecnología.' },
];
const posts = [
  { id: 'p1', authorId: '1', content: '¡Busco aliados para proyecto de datos abiertos!', createdAt: new Date(), reactions: [], comments: [] },
  { id: 'p2', authorId: '2', content: '¿Quién se suma a hackathon GovTech?', createdAt: new Date(), reactions: [], comments: [] },
];

export default function CoworkingPage() {
  const [search, setSearch] = React.useState('');
  const [sector, setSector] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [feedTab, setFeedTab] = React.useState('all');
  const [following, setFollowing] = React.useState(['2']); // ids de usuarios seguidos
  const { data: users = [] } = useGetUsersQuery();
  const { data: posts = [] } = useGetPostsQuery();
  const { data: groups = [] } = useGetGroupsQuery ? useGetGroupsQuery() : { data: [] };
  const dispatch = useDispatch();
  const proposals = useSelector(state => state.studentProposals.proposals);
  const auth = useSelector(state => state.auth);
  React.useEffect(() => {
    if (auth?.user?.id) dispatch(fetchProposals(auth.token));
  }, [dispatch, auth?.user?.id, auth.token]);
  const filteredUsers = users.filter(user =>
    (!search || user.name.toLowerCase().includes(search.toLowerCase()) || user.bio.toLowerCase().includes(search.toLowerCase())) &&
    (!sector || user.bio.toLowerCase().includes(sector.toLowerCase())) &&
    (!location || user.bio.toLowerCase().includes(location.toLowerCase()))
  );
  const suggested = users.filter(u => !following.includes(u.id) && u.id !== 'me');
  // Unificar posts y propuestas estudiantiles en el feed
  let feedPosts = [
    ...posts,
    ...proposals.map(p => ({
      id: `proposal-${p.id}`,
      authorId: p.userId?.toString() || 'estudiante',
      content: `[Propuesta estudiantil] ${p.title}\n${p.description}`,
      createdAt: p.createdAt,
      reactions: [],
      comments: [],
      isProposal: true
    }))
  ];
  // Ordenar por fecha descendente
  feedPosts = feedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (feedTab === 'network') feedPosts = feedPosts.filter(p => myNetworkIds.includes(p.authorId));
  if (feedTab === 'trending') feedPosts = trendingPosts;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <CoworkingNotifications />
      </Box>
      <Typography variant="h3" fontWeight={800} mb={2}>Coworking ÁBACO</Typography>
      <Typography variant="h6" mb={2}>Explora profesionales y conecta</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Buscar por nombre, bio..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MdSearch />
              </InputAdornment>
            )
          }}
        />
        <Select
          size="small"
          value={sector}
          onChange={e => setSector(e.target.value)}
          displayEmpty
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">Todos los sectores</MenuItem>
          <MenuItem value="social">Social</MenuItem>
          <MenuItem value="govtech">GovTech</MenuItem>
          <MenuItem value="institucional">Institucional</MenuItem>
        </Select>
        <Select
          size="small"
          value={location}
          onChange={e => setLocation(e.target.value)}
          displayEmpty
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">Todas las ubicaciones</MenuItem>
          <MenuItem value="cdmx">CDMX</MenuItem>
          <MenuItem value="monterrey">Monterrey</MenuItem>
          <MenuItem value="guadalajara">Guadalajara</MenuItem>
        </Select>
        <IconButton><MdFilterList /></IconButton>
      </Box>
      <Grid container spacing={2} mb={4}>
        {filteredUsers.map(user => (
          <Grid item xs={12} sm={6} md={4} key={user.id}>
            <UserCard user={user} onConnect={() => alert('Conectar con ' + user.name)} />
          </Grid>
        ))}
      </Grid>
      <Typography variant="h6" mb={2}>Grupos destacados</Typography>
      <Grid container spacing={2} mb={4}>
        {groups.map(group => (
          <Grid item xs={12} sm={6} md={4} key={group.id}>
            <GroupCard group={group} onJoin={() => alert('Unirse a ' + group.name)} />
          </Grid>
        ))}
      </Grid>
      <Typography variant="h6" mb={2}>Sugerencias para conectar</Typography>
      <Grid container spacing={2} mb={4}>
        {suggested.map(user => (
          <Grid item xs={12} sm={6} md={4} key={user.id}>
            <Card>
              <CardContent>
                <UserCard user={user} onConnect={() => handleFollow(user.id)} />
                <Button variant="outlined" size="small" onClick={() => handleFollow(user.id)} sx={{ mt: 1 }} disabled={following.includes(user.id)}>
                  {following.includes(user.id) ? 'Siguiendo' : 'Seguir'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Typography variant="h6" mb={2}>Feed de publicaciones</Typography>
      <Tabs value={feedTab} onChange={(_, v) => setFeedTab(v)} sx={{ mb: 2 }}>
        <Tab value="all" label="Para ti" />
        <Tab value="network" label="De tu red" />
        <Tab value="trending" label="Tendencias" />
      </Tabs>
      {feedPosts.map(post => {
        const author = users.find(u => u.id === post.authorId) || users[0];
        return <PostCard key={post.id} post={post} author={author} />;
      })}
    </Box>
  );
}
