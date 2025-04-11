import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { translate } from "@/lib/i18n";
import { LoanTerms } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function AffordabilityCalculator() {
  const { language } = useStore();
  const { toast } = useToast();

  // Form state
  const [monthlyIncome, setMonthlyIncome] = useState<string>("56000");
  const [downPayment, setDownPayment] = useState<string>("1000000");
  const [loanTerm, setLoanTerm] = useState<string>("20");
  const [interestRate, setInterestRate] = useState<string>("13.5");

  // Results state
  const [maxHomePrice, setMaxHomePrice] = useState<number>(0);
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [debtToIncome, setDebtToIncome] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);

  // Calculate affordability when inputs change
  useEffect(() => {
    calculateAffordability();
  }, []);

  const calculateAffordability = () => {
    try {
      // Parse inputs
      const income = parseFloat(monthlyIncome) || 0;
      const deposit = parseFloat(downPayment) || 0;
      const years = parseInt(loanTerm) || 20;
      const rate = parseFloat(interestRate) || 13.5;

      // Basic affordability calculation
      // Using a maximum of 40% of monthly income for mortgage payment
      const maxMonthlyPayment = income * 0.4;
      
      // Calculate max loan amount based on monthly payment
      // Formula: P = PMT * (1 - (1 + r)^-n) / r
      // Where: P = loan amount, PMT = monthly payment, r = monthly interest rate, n = number of payments
      const monthlyRate = rate / 100 / 12;
      const payments = years * 12;
      
      // Max loan amount based on max monthly payment
      const maxLoanAmount = maxMonthlyPayment * ((1 - Math.pow(1 + monthlyRate, -payments)) / monthlyRate);
      
      // Max home price = loan amount + down payment
      const calculatedMaxHomePrice = maxLoanAmount + deposit;
      
      // Calculated monthly payment for the max loan amount
      const calculatedMonthlyPayment = (maxLoanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -payments));
      
      // Debt-to-income ratio
      const calculatedDebtToIncome = (calculatedMonthlyPayment / income) * 100;
      
      // Total interest paid over loan term
      const calculatedTotalInterest = (calculatedMonthlyPayment * payments) - maxLoanAmount;

      // Update state with calculated values
      setMaxHomePrice(Math.round(calculatedMaxHomePrice));
      setMonthlyPayment(Math.round(calculatedMonthlyPayment));
      setDebtToIncome(Math.round(calculatedDebtToIncome));
      setTotalInterest(Math.round(calculatedTotalInterest));
    } catch (error) {
      toast({
        title: "Calculation Error",
        description: "Please check your inputs and try again.",
        variant: "destructive",
      });
    }
  };

  // Format number as Kenyan Shillings
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE').format(amount);
  };

  return (
    <div className="bg-white rounded-xl">
      <div className="md:flex">
        <div className="md:w-1/2 p-6 md:p-8 lg:p-10">
          <h2 className="text-2xl font-heading font-bold mb-2">{translate("affordabilityCalculator", language)}</h2>
          <p className="text-neutral-600 mb-6">{translate("calculatorDesc", language)}</p>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="monthlyIncome">{translate("monthlyIncome", language)}</Label>
              <Input
                id="monthlyIncome"
                type="number"
                placeholder="e.g., 100,000"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="downPayment">{translate("downPayment", language)}</Label>
              <Input
                id="downPayment"
                type="number"
                placeholder="e.g., 1,000,000"
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="loanTerm">{translate("loanTerm", language)}</Label>
              <Select 
                value={loanTerm} 
                onValueChange={setLoanTerm}
              >
                <SelectTrigger id="loanTerm" className="mt-1">
                  <SelectValue placeholder="Select loan term" />
                </SelectTrigger>
                <SelectContent>
                  {LoanTerms.map((term) => (
                    <SelectItem key={term.value} value={term.value.toString()}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="interestRate">{translate("interestRate", language)}</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.1"
                placeholder="e.g., 13.5"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="pt-2">
              <Button 
                className="w-full" 
                onClick={calculateAffordability}
              >
                {translate("calculate", language)}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="md:w-1/2 bg-primary p-6 md:p-8 lg:p-10 text-white">
          <h3 className="text-xl font-heading font-semibold mb-4">{translate("estimatedAffordability", language)}</h3>
          
          <div className="mb-6">
            <div className="text-3xl font-bold mb-1">KSh {formatCurrency(maxHomePrice)}</div>
            <p className="text-white/80">{translate("maxHomePrice", language)}</p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white/10 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm text-white/80">{translate("monthlyMortgage", language)}</div>
                <div className="font-semibold">KSh {formatCurrency(monthlyPayment)}</div>
              </div>
              <div className="w-full bg-white/20 rounded-full h-1.5">
                <div className="bg-white h-1.5 rounded-full" style={{ width: `${Math.min(debtToIncome, 100)}%` }}></div>
              </div>
            </div>
            
            <div className="bg-white/10 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm text-white/80">{translate("debtToIncome", language)}</div>
                <div className="font-semibold">{debtToIncome}%</div>
              </div>
              <div className="w-full bg-white/20 rounded-full h-1.5">
                <div className="bg-white h-1.5 rounded-full" style={{ width: `${Math.min(debtToIncome, 100)}%` }}></div>
              </div>
            </div>
            
            <div className="bg-black/10 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm text-white/80">{translate("totalInterest", language)}</div>
                <div className="font-semibold">KSh {formatCurrency(totalInterest)}</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <Button
              variant="outline"
              className="text-black border-white hover:bg-white hover:text-secondary"
              onClick={() => {
                const minPrice = Math.round(maxHomePrice * 0.8);
                const maxPrice = Math.round(maxHomePrice * 1.2);
                
                const store = useStore.getState();
                store.setSearchFilters({
                  minPrice,
                  maxPrice
                });
              }}
            >
              {translate("seeProperties", language)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
