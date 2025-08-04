import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground">PomodoroConnect</h1>
          <p className="text-muted-foreground mt-2">Sync your focus with nearby study sessions</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Timer Section */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg border border-border p-8 text-center">
              <div className="text-6xl font-mono font-bold text-foreground mb-4">
                25:00
              </div>
              <p className="text-muted-foreground mb-6">Focus Time</p>
              
              <div className="flex gap-3 justify-center mb-6">
                <Button size="lg" className="px-8">
                  Start
                </Button>
                <Button variant="outline" size="lg">
                  Reset
                </Button>
              </div>

              <div className="flex justify-center gap-2 text-sm text-muted-foreground">
                <span className="bg-accent px-3 py-1 rounded-full">Focus: 25min</span>
                <span className="bg-accent px-3 py-1 rounded-full">Break: 5min</span>
              </div>
            </div>

            {/* Session Controls */}
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" size="lg" className="h-16">
                <div className="text-center">
                  <div className="font-semibold">Host Session</div>
                  <div className="text-sm text-muted-foreground">Start a new study room</div>
                </div>
              </Button>
              <Button variant="outline" size="lg" className="h-16">
                <div className="text-center">
                  <div className="font-semibold">Join Session</div>
                  <div className="text-sm text-muted-foreground">Find nearby sessions</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Sessions List */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Active Sessions</h2>
              <div className="space-y-3">
                {/* Sample sessions */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-foreground">Study Group Alpha</h3>
                      <p className="text-sm text-muted-foreground">Deep Work Session</p>
                    </div>
                    <div className="text-sm text-muted-foreground">12:45 remaining</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">3 participants</div>
                    <Button size="sm">Join</Button>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-foreground">Focus Flow</h3>
                      <p className="text-sm text-muted-foreground">Coding Session</p>
                    </div>
                    <div className="text-sm text-muted-foreground">8:23 remaining</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">5 participants</div>
                    <Button size="sm">Join</Button>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-foreground">Exam Prep</h3>
                      <p className="text-sm text-muted-foreground">Silent Study</p>
                    </div>
                    <div className="text-sm text-muted-foreground">Break - 2:15 remaining</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">8 participants</div>
                    <Button size="sm">Join</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
