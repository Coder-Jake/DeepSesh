import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Coffee, Users, Code, DollarSign, TrendingUp, Lightbulb, Linkedin } from "lucide-react"; // Import Linkedin icon
import { toast } from 'sonner'; // Import toast from sonner directly
import { Link } from "react-router-dom";
import FeedbackAndCollaborateSection from "@/components/FeedbackAndCollaborateSection";
import { useTimer } from '@/contexts/TimerContext';

const ChipIn = () => {
  const [amount, setAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isBTCMode, setIsBTCMode] = useState(false); // NEW: State to toggle between $ and BTC
  const { setHasWonPrize } = useTimer();

  const quickAmounts = [5, 10, 25, 50];

  const handleQuickAmount = (value: number) => {
    setSelectedAmount(value);
    setAmount(value.toString());
  };

  const handleCustomAmount = (value: string) => {
    setSelectedAmount(null);
    setAmount(value);
  };

  const toggleCurrencyMode = () => { // NEW: Function to toggle currency
    setIsBTCMode(prev => !prev);
  };

  const handleDonate = () => {
    const donationAmount = parseFloat(amount);

    if (!amount || donationAmount <= 0) {
      toast.error("Invalid amount", {
        description: "Please enter a valid donation amount.",
      });
      return;
    }

    // In a real app, this would integrate with a payment processor
    // For simplicity, the prize condition remains based on the numerical value,
    // assuming it's still a USD equivalent for the prize logic.
    if (donationAmount > 50) {
      toast.success("Congratulations! 🎉", {
        description: "Please speak to the dev to collect your prize!",
      });
      setHasWonPrize(true);
    } else {
      toast.info("Is that really all you've got? 💜", {
        description: `Please donate a larger amount!`,
      });
    }
    
    setAmount("");
    setSelectedAmount(null);
  };

  return (
    <main className="max-w-4xl mx-auto pt-16 px-4 pb-4 lg:pt-20 lg:px-6 lg:pb-6">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Heart className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Chip In</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Support the developers, contribute toward ongoing costs,
          give feedback or make suggestions.
        </p>
      </div>

      {/* New Feedback and Collaborate Section */}
      <FeedbackAndCollaborateSection />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
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
                    {isBTCMode ? value : `$${value}`} {/* MODIFIED: Conditional display */}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-amount" onClick={toggleCurrencyMode} className="cursor-pointer select-none"> {/* MODIFIED: Added onClick and cursor style */}
                Custom amount ({isBTCMode ? "BTC" : "$"}) {/* MODIFIED: Conditional display */}
              </Label>
              <Input
                id="custom-amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => handleCustomAmount(e.target.value)}
                min="1"
                step="0.01"
                onFocus={(e) => e.target.select()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Link
                to="/feedback"
                id="message"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-muted-foreground items-start"
              >
                Leave a message for the developers...
              </Link>
            </div>

            <Button 
              onClick={handleDonate} 
              className="w-full h-12 text-lg"
              disabled={!amount || parseFloat(amount) <= 0}
            >
              <Heart className="h-4 w-4 mr-2" />
              Donate {isBTCMode ? `${amount || "0"} BTC` : `$${amount || "0"}`} {/* MODIFIED: Conditional display */}
            </Button>
          </CardContent>
        </Card>

        {/* Financial Background */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Background
              </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Development Costs:</p>
                  <p>$6,000 (initial development & design)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Annual Expenses per User:</p>
                  <p>$0.69 (hosting, database, third-party services)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Funding Already Received:</p>
                  <p>$4,500 (from early supporters)</p>
                </div>
              </div>
              <Link to="/upcoming-features" className="block cursor-pointer hover:bg-muted rounded-md p-2 -mx-2 -my-1 transition-colors">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Upcoming Developments:</p>
                    <ul className="list-disc list-inside ml-2 text-muted-foreground">
                      <li>Mobile app</li>
                      <li>User Verification</li>
                      <li>Real-time collaboration</li>
                      <li>Leaderboard</li>
                      <li>Personal Statistics</li>
                      <li>Stake accountability</li>
                    </ul>
                  </div>
                </div>
              </Link>
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
                <li>• Sharing DeepSesh with friends</li>
                <li>• Providing <Link to="/feedback" className="text-blue-500 hover:underline">feedback and suggestions</Link></li>
                <li>• Reporting bugs you encounter</li>
                <li>• Contributing to our community</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8 flex justify-between items-center">
        <a 
          href="https://www.linkedin.com/company/deepsesh/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-muted-foreground hover:text-blue-600 transition-colors"
          aria-label="DeepSesh LinkedIn Profile"
        >
          <Linkedin className="h-5 w-5" />
        </a>
        <Link to="/credits" className="text-sm text-muted-foreground hover:underline">
          Credits
        </Link>
        {/* Empty div for balance */}
        <div className="w-5 h-5" /> 
      </div>
    </main>
  );
};

export default ChipIn;