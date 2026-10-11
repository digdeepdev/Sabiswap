import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import Home from '@/pages/Home';
import Faq from '@/pages/Faq';
import Terms from '@/pages/Terms';
import Help from '@/pages/Help';
import BrandAssets from '@/pages/BrandAssets';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, '') || ""}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/faq" component={Faq} />
          <Route path="/terms" component={Terms} />
          <Route path="/help" component={Help} />
          <Route path="/brand-assets" component={BrandAssets} />
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
