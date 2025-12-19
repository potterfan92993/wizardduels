import { Switch, Route } from "wouter";
import { Dashboard } from "@/components/dashboard";
import { OverlayDisplay } from "@/components/game-overlay";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/overlay" component={OverlayDisplay} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return <Router />;
}

export default App;
