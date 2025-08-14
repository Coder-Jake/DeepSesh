import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Coffee, Users, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ChipIn = () => {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const { toast } = useToast();

  const quickAmounts = [5, 10, 25, 50];

  const handleQuickAmount = (value: number) => {
    setSelectedAmount(value);
    setAmount(value.toString());
  };

  const handleCustomAmount = (value: string) => {
    setSelectedAmount(null);
    setAmount(value);
  };

  const handleDonate = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid donation amount.",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would integrate with a payment processor
    toast({
      title: "Thank you! 💜",
      description: `Your support means the world to us. Donation processing would happen here.`,
    });
    
    setAmount("");
    setMessage("");
    setSelectedAmount(null);
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Heart className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Chip In</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Here you can support the developers, contribute toward the ongoing costs of running this platform, 
          give feedback or make suggestions to the developers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Donation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              Make a Donation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Quick amounts</Label>
              <div className="grid grid-cols-2 gap-2">
                {quickAmounts.map((value) => (
                  <Button
                    key={value}
                    variant={selectedAmount === value ? "default" : "outline"}
                    onClick={() => handleQuickAmount(value)}
                    className="h-12"
                  >
                    ${value}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-amount">Custom amount ($)</Label>
              <Input
                id="custom-amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => handleCustomAmount(e.target.value)}
                min="1"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Leave a message for the developers..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>

            <Button 
              onClick={handleDonate} 
              className="w-full h-12 text-lg"
              disabled={!amount || parseFloat(amount) <= 0}
            >
              <Heart className="h-4 w-4 mr-2" />
              Donate ${amount || "0"}
            </Button>
          </CardContent>
        </Card>

        {/* Impact Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Coffee className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">$5</p>
                    <p className="text-sm text-muted-foreground">Buys a coffee for late-night coding</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Code className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">$25</p>
                    <p className="text-sm text-muted-foreground">Covers hosting costs for a month</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Heart className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">$50+</p>
                    <p className="text-sm text-muted-foreground">Helps fund new features</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Other Ways to Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Can't donate? No problem! You can still help by:
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Sharing FlowSesh with friends</li>
                <li>• Providing feedback and suggestions</li>
                <li>• Reporting bugs you encounter</li>
                <li>• Contributing to our community</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default ChipIn;