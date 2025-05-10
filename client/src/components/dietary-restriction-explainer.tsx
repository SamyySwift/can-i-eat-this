import React, { useState } from 'react';
import { 
  AlertCircle, 
  Apple, 
  Beef, 
  Egg, 
  Fish, 
  Wheat, 
  Milk, 
  Nut,
  HeartPulse, 
  Salad, 
  XCircle, 
  Check,
  HelpCircle
} from 'lucide-react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type RestrictionType = "allergy" | "dietary" | "health";

interface RestrictionInfo {
  id: string;
  label: string;
  type: RestrictionType;
  description: string;
  icon: React.ReactNode;
  examples: string[];
  color: string;
}

interface DietaryRestrictionExplainerProps {
  userAllergies?: string[];
  userDietaryPreferences?: string[];
  userHealthRestrictions?: string[];
}

export default function DietaryRestrictionExplainer({
  userAllergies = [],
  userDietaryPreferences = [],
  userHealthRestrictions = []
}: DietaryRestrictionExplainerProps) {
  const [selectedType, setSelectedType] = useState<RestrictionType | "all">("all");

  const restrictions: RestrictionInfo[] = [
    // Allergies
    {
      id: "dairy",
      label: "Dairy",
      type: "allergy",
      description: "Allergic reaction to milk proteins or lactose intolerance",
      icon: <Milk className="h-6 w-6" />,
      examples: ["Milk", "Cheese", "Yogurt", "Butter", "Ice cream"],
      color: "bg-red-100 text-red-800"
    },
    {
      id: "peanuts",
      label: "Peanuts",
      type: "allergy",
      description: "One of the most common and potentially severe food allergies",
      icon: <Nut className="h-6 w-6" />,
      examples: ["Peanut butter", "Mixed nuts", "Many Asian and African dishes"],
      color: "bg-red-100 text-red-800" 
    },
    {
      id: "tree-nuts",
      label: "Tree Nuts",
      type: "allergy",
      description: "Allergic reaction to nuts grown on trees",
      icon: <Nut className="h-6 w-6" />,
      examples: ["Almonds", "Walnuts", "Cashews", "Pistachios"],
      color: "bg-red-100 text-red-800"
    },
    {
      id: "shellfish",
      label: "Shellfish",
      type: "allergy",
      description: "Common allergy that can cause severe reactions",
      icon: <Fish className="h-6 w-6" />,
      examples: ["Shrimp", "Lobster", "Crab", "Clams", "Oysters"],
      color: "bg-red-100 text-red-800"
    },
    {
      id: "eggs",
      label: "Eggs",
      type: "allergy",
      description: "Allergic reaction to proteins found in egg whites or yolks",
      icon: <Egg className="h-6 w-6" />,
      examples: ["Baked goods", "Mayonnaise", "Some pasta"],
      color: "bg-red-100 text-red-800"
    },
    {
      id: "wheat",
      label: "Wheat",
      type: "allergy",
      description: "Reaction to proteins found in wheat",
      icon: <Wheat className="h-6 w-6" />,
      examples: ["Bread", "Pasta", "Cereals", "Baked goods"],
      color: "bg-red-100 text-red-800"
    },
    {
      id: "soy",
      label: "Soy",
      type: "allergy",
      description: "Allergic reaction to soybean proteins",
      icon: <AlertCircle className="h-6 w-6" />,
      examples: ["Tofu", "Soy sauce", "Soy milk", "Many processed foods"],
      color: "bg-red-100 text-red-800"
    },
    
    // Dietary Preferences
    {
      id: "vegetarian",
      label: "Vegetarian",
      type: "dietary",
      description: "Avoids meat but may consume animal byproducts like eggs and dairy",
      icon: <Salad className="h-6 w-6" />,
      examples: ["Plant-based foods", "Dairy", "Eggs"],
      color: "bg-green-100 text-green-800"
    },
    {
      id: "vegan",
      label: "Vegan",
      type: "dietary",
      description: "Avoids all animal products including dairy, eggs, and honey",
      icon: <Apple className="h-6 w-6" />,
      examples: ["Fruits", "Vegetables", "Grains", "Plant-based alternatives"],
      color: "bg-green-100 text-green-800"
    },
    {
      id: "pescatarian",
      label: "Pescatarian",
      type: "dietary",
      description: "Avoids meat but consumes fish and seafood",
      icon: <Fish className="h-6 w-6" />,
      examples: ["Fish", "Shellfish", "Plant-based foods"],
      color: "bg-green-100 text-green-800"
    },
    {
      id: "kosher",
      label: "Kosher",
      type: "dietary",
      description: "Follows Jewish dietary laws",
      icon: <HelpCircle className="h-6 w-6" />,
      examples: ["Permitted meats", "No pork", "No shellfish", "Meat and dairy not mixed"],
      color: "bg-green-100 text-green-800"
    },
    {
      id: "halal",
      label: "Halal",
      type: "dietary",
      description: "Follows Islamic dietary laws",
      icon: <HelpCircle className="h-6 w-6" />,
      examples: ["Permitted meats", "No pork", "No alcohol"],
      color: "bg-green-100 text-green-800"
    },
    
    // Health Restrictions
    {
      id: "diabetes",
      label: "Diabetes",
      type: "health",
      description: "Requires careful monitoring of carbohydrate intake",
      icon: <HeartPulse className="h-6 w-6" />,
      examples: ["Low sugar foods", "Complex carbohydrates", "High fiber foods"],
      color: "bg-blue-100 text-blue-800"
    },
    {
      id: "gluten-free",
      label: "Gluten-Free",
      type: "health",
      description: "Avoids gluten, essential for those with celiac disease",
      icon: <Wheat className="h-6 w-6" />,
      examples: ["Rice", "Corn", "Quinoa", "Gluten-free labeled products"],
      color: "bg-blue-100 text-blue-800"
    },
    {
      id: "low-sodium",
      label: "Low Sodium",
      type: "health",
      description: "Restricts sodium intake for heart health",
      icon: <HeartPulse className="h-6 w-6" />,
      examples: ["Fresh fruits and vegetables", "Herbs and spices instead of salt"],
      color: "bg-blue-100 text-blue-800"
    },
    {
      id: "low-fat",
      label: "Low Fat",
      type: "health",
      description: "Restricts fat intake, often recommended for certain conditions",
      icon: <HeartPulse className="h-6 w-6" />,
      examples: ["Lean proteins", "Fruits", "Vegetables", "Whole grains"],
      color: "bg-blue-100 text-blue-800"
    }
  ];

  const userRestrictions = [
    ...userAllergies,
    ...userDietaryPreferences,
    ...userHealthRestrictions
  ];

  // Filter restrictions based on selected type
  const filteredRestrictions = restrictions.filter(
    restriction => selectedType === "all" || restriction.type === selectedType
  );

  const typeColors = {
    allergy: "bg-red-600",
    dietary: "bg-green-600",
    health: "bg-blue-600",
    all: "bg-purple-600"
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Dietary Restrictions Guide</span>
          {userRestrictions.length > 0 && (
            <Badge variant="outline" className="ml-2">
              {userRestrictions.length} Active
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Learn about different dietary restrictions and how they affect food choices
        </CardDescription>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button 
            variant={selectedType === "all" ? "default" : "outline"}
            className={selectedType === "all" ? `${typeColors.all}` : ""}
            onClick={() => setSelectedType("all")}
            size="sm"
          >
            All Types
          </Button>
          <Button 
            variant={selectedType === "allergy" ? "default" : "outline"}
            className={selectedType === "allergy" ? `${typeColors.allergy}` : ""}
            onClick={() => setSelectedType("allergy")}
            size="sm"
          >
            Allergies
          </Button>
          <Button 
            variant={selectedType === "dietary" ? "default" : "outline"}
            className={selectedType === "dietary" ? `${typeColors.dietary}` : ""}
            onClick={() => setSelectedType("dietary")}
            size="sm"
          >
            Dietary Preferences
          </Button>
          <Button 
            variant={selectedType === "health" ? "default" : "outline"}
            className={selectedType === "health" ? `${typeColors.health}` : ""}
            onClick={() => setSelectedType("health")}
            size="sm"
          >
            Health Restrictions
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {filteredRestrictions.map((restriction) => {
            const isUserRestriction = userRestrictions.includes(restriction.id);
            
            return (
              <AccordionItem 
                key={restriction.id} 
                value={restriction.id}
                className={`border rounded-md mb-2 ${isUserRestriction ? 'border-primary' : ''}`}
              >
                <AccordionTrigger className="px-4 py-2 hover:no-underline">
                  <div className="flex items-center w-full">
                    <div className={`p-2 rounded-full ${restriction.color} mr-3`}>
                      {restriction.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-md">{restriction.label}</p>
                      <p className="text-xs text-gray-500 capitalize">{restriction.type}</p>
                    </div>
                    {isUserRestriction && (
                      <Badge variant="outline" className="ml-auto mr-4 bg-primary text-white">
                        <Check className="h-3 w-3 mr-1" /> Active
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <p className="text-gray-700 mb-3">{restriction.description}</p>
                  <div>
                    <p className="text-sm font-medium mb-2">Common examples:</p>
                    <div className="flex flex-wrap gap-2">
                      {restriction.examples.map((example, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {isUserRestriction && (
                    <div className="mt-4 p-2 bg-primary/10 rounded-md flex items-center">
                      <AlertCircle className="h-4 w-4 text-primary mr-2" />
                      <p className="text-sm text-primary">This restriction is active in your profile</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}