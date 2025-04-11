import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useStore } from "./lib/store";

import MainLayout from "@/components/layouts/MainLayout";
import Home from "@/pages/Home";
import PropertyDetails from "@/pages/PropertyDetails";
import Favorites from "@/pages/Favorites";
import Messages from "@/pages/Messages";
import Profile from "@/pages/Profile";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/not-found";

function Router() {
  const { checkAuth } = useStore();

  /* Check auth status when app loads
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
*/
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/property/:id" component={PropertyDetails} />
        <Route path="/favorites" component={Favorites} />
        <Route path="/messages" component={Messages} />
        <Route path="/messages/:userId" component={Messages} />
        <Route path="/profile" component={Profile} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
