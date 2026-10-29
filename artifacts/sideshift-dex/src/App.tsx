import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import Home from '@/pages/Home';
import Faq from '@/pages/Faq';
import Terms from '@/pages/Terms';
import Help from '@/pages/Help';
import BrandAssets from '@/pages/BrandAssets';
import { usePageMeta } from '@/hooks/use-page-meta';

const queryClient = new QueryClient();

function PageMetadata() {
  usePageMeta();
  return null;
}

export default function App({ ssrPath }: { ssrPath?: string } = {}) {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter ssrPath={ssrPath} base={import.meta.env.BASE_URL?.replace(/\/$/, '') || ""}>
        <PageMetadata />
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/faq" component={Faq} />
          <Route path="/terms" component={Terms} />
          <Route path="/help" component={Help} />
          <Route path="/brand-assets" component={BrandAssets} />
          <Route path="/:from/:to" component={Home} />
          <Route>
            <div className="flex min-h-screen items-center justify-center">
              <h1 className="text-2xl font-bold">404 - Not Found</h1>
            </div>
          </Route>
        </Switch>
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
