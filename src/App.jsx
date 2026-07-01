import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppShell from './components/layout/AppShell';
import AuthFlow from './pages/auth/AuthFlow';

import Home from './pages/Home';
import Calendar from './pages/Calendar';
import AddPost from './pages/AddPost';
import PostDetail from './pages/PostDetail';
import Ideas from './pages/Ideas';
import Ranking from './pages/Ranking';
import Profile from './pages/Profile';

import AdminDashboard from './pages/AdminDashboard';
import AdminAffiliates from './pages/AdminAffiliates';
import AdminPosts from './pages/AdminPosts';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';
import { APP_NAME } from './lib/config';

export default function App() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <AuthFlow />;
  }

  if (currentUser.role === 'admin') {
    return (
      <AppShell title="Admin">
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/affiliates" element={<AdminAffiliates />} />
          <Route path="/admin/posts" element={<AdminPosts />} />
          <Route path="/admin/ideas" element={<Ideas adminView />} />
          <Route path="/admin/ranking" element={<Ranking adminView />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AppShell>
    );
  }

  return (
    <AppShell title={APP_NAME}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/add" element={<AddPost />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/post/:id/edit" element={<AddPost editMode />} />
        <Route path="/ideas" element={<Ideas />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
