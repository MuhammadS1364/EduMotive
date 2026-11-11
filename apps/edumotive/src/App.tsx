import type { ReactNode } from 'react';
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@project/components/ui/sonner';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ArticlesPage from './pages/ArticlesPage';
import ArticlePage from './pages/ArticlePage';
import IssuesPage from './pages/IssuesPage';
import IssueReaderPage from './pages/IssueReaderPage';
import ProgramsPage from './pages/ProgramsPage';
import ResultsPage from './pages/ResultsPage';
import AboutPage from './pages/AboutPage';
import SubscribePage from './pages/SubscribePage';
import AccountPage from './pages/AccountPage';
import WritePage from './pages/WritePage';
import SectionPage from './pages/SectionPage';
import AuthorsPage from './pages/AuthorsPage';
import AuthorPage from './pages/AuthorPage';
import ContactPage from './pages/ContactPage';
import NewsPage from './pages/NewsPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider } from './lib/auth';
import { useContent } from './lib/content';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

function NotFound() {
  return <div className="text-center py-24 space-y-3"><h1 className="text-4xl font-bold">Page not found</h1><Link to="/" className="text-primary underline">Go to home</Link></div>;
}

function Gate({ setting, children }: { setting: string; children: ReactNode }) {
  const { data } = useContent();
  if (data && data.settings[setting] === 'false') return <NotFound />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={qc}>
        <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/articles" element={<ArticlesPage />} />
              <Route path="/articles/:id" element={<ArticlePage />} />
              <Route path="/section/:slug" element={<SectionPage />} />
              <Route path="/authors" element={<AuthorsPage />} />
              <Route path="/authors/:id" element={<AuthorPage />} />
              <Route path="/issues" element={<IssuesPage />} />
              <Route path="/issues/:id" element={<IssueReaderPage />} />
              <Route path="/programs" element={<Gate setting="showPrograms"><ProgramsPage /></Gate>} />
              <Route path="/results" element={<Gate setting="showResults"><ResultsPage /></Gate>} />
              <Route path="/subscribe" element={<Gate setting="showSubscribe"><SubscribePage /></Gate>} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/write" element={<WritePage />} />
              <Route path="/write/:id" element={<WritePage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
