import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, ChevronLeft } from "lucide-react";

const dietaryProfileSchema = z.object({
  allergies: z.array(z.string()).optional(),
  dietaryPreferences: z.array(z.string()).optional(),
  healthRestrictions: z.array(z.string()).optional(),
});

type DietaryProfileFormValues = z.infer<typeof dietaryProfileSchema>;

interface DietaryProfileFormProps {
  userId: number;
  existingProfile?: DietaryProfileFormValues;
  onComplete: () => void;
}

export default function DietaryProfileForm({
  userId,
  existingProfile,
  onComplete,
}: DietaryProfileFormProps) {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();

  const form = useForm<DietaryProfileFormValues>({
    resolver: zodResolver(dietaryProfileSchema),
    defaultValues: {
      allergies: existingProfile?.allergies || [],
      dietaryPreferences: existingProfile?.dietaryPreferences || [],
      healthRestrictions: existingProfile?.healthRestrictions || [],
    },
  });

  const allergyOptions = [
    {
      id: "peanuts",
      label: "Peanuts",
      description: "No peanuts or peanut-derived ingredients",
    },
    {
      id: "tree-nuts",
      label: "Tree Nuts",
      description: "No almonds, cashews, walnuts, etc.",
    },
    {
      id: "dairy",
      label: "Dairy",
      description: "No milk, cheese, butter, etc.",
    },
    { id: "eggs", label: "Eggs", description: "No eggs or egg products" },
    {
      id: "shellfish",
      label: "Shellfish",
      description: "No shrimp, crab, lobster, etc.",
    },
    {
      id: "wheat",
      label: "Wheat",
      description: "No wheat or wheat-derived ingredients",
    },
    { id: "soy", label: "Soy", description: "No soy or soy derivatives" },
    { id: "fish", label: "Fish", description: "No fish or fish products" },
    {
      id: "sesame",
      label: "Sesame",
      description: "No sesame seeds or sesame oil",
    },
  ];

  const dietaryPreferenceOptions = [
    { id: "vegetarian", label: "Vegetarian", description: "No meat products" },
    { id: "vegan", label: "Vegan", description: "No animal products" },
    { id: "keto", label: "Keto", description: "Low carb, high fat diet" },
    {
      id: "paleo",
      label: "Paleo",
      description: "No processed foods, grains, dairy",
    },
    {
      id: "pescatarian",
      label: "Pescatarian",
      description: "Avoids meat but consumes fish and seafood",
    },
    {
      id: "halal",
      label: "Halal",
      description: "Foods permissible under Islamic law",
    },
    {
      id: "kosher",
      label: "Kosher",
      description: "Foods prepared according to Jewish dietary laws",
    },
    {
      id: "gluten-free",
      label: "Gluten Free",
      description: "No wheat, barley, rye, etc.",
    },
    {
      id: "dairy-free",
      label: "Dairy Free",
      description: "No milk, cheese, butter, etc.",
    },
  ];

  const healthRestrictionOptions = [
    {
      id: "diabetes",
      label: "Diabetes",
      description: "Low sugar, balanced carbohydrates",
    },
    {
      id: "hypertension",
      label: "Hypertension",
      description: "Low sodium, heart-healthy diet",
    },
    {
      id: "heart-disease",
      label: "Heart Disease",
      description: "Low saturated fat, low sodium",
    },
    {
      id: "celiac-disease",
      label: "Celiac Disease",
      description: "Strict gluten-free diet",
    },
    {
      id: "kidney-disease",
      label: "Kidney Disease",
      description: "Limited protein, potassium, phosphorus",
    },
    {
      id: "low-sugar",
      label: "Low Sugar",
      description: "Reduced or no added sugars",
    },
    {
      id: "low-sodium",
      label: "Low Sodium",
      description: "Reduced salt content",
    },
    {
      id: "low-fat",
      label: "Low Fat",
      description: "Reduced total fat content",
    },
  ];

  const steps = [
    {
      title: "What allergies do you have?",
      description: "Select all that apply",
      fieldName: "allergies" as const,
      options: allergyOptions,
    },
    {
      title: "What are your dietary preferences?",
      description: "Select all that apply",
      fieldName: "dietaryPreferences" as const,
      options: dietaryPreferenceOptions,
    },
    {
      title: "Do you have any health restrictions?",
      description: "Select all that apply",
      fieldName: "healthRestrictions" as const,
      options: healthRestrictionOptions,
    },
  ];

  const currentStepData = steps[currentStep];

  const onSubmit = async (values: DietaryProfileFormValues) => {
    setIsSubmitting(true);

    const requestBody = {
      allergies: values.allergies || [],
      dietaryPreferences: values.dietaryPreferences || [],
      healthRestrictions: values.healthRestrictions || [],
    };

    const queryKey = [`/api/dietary-profile/${userId}`];
    const previousData =
      queryClient.getQueryData<DietaryProfileFormValues>(queryKey);

    queryClient.setQueryData(queryKey, {
      ...previousData,
      ...requestBody,
    });

    toast({
      title: "Profile Updated",
      description: "Your dietary profile has been updated.",
      duration: 3000,
    });

    try {
      await apiRequest("POST", "/api/dietary-profile", requestBody);
      queryClient.invalidateQueries({ queryKey });
      onComplete();
    } catch (error) {
      if (previousData) {
        queryClient.setQueryData(queryKey, previousData);
      }
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    console.log(`Current step: ${currentStep}, Total steps: ${steps.length}`);
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      // Only submit when on the last step
      form.handleSubmit(onSubmit)();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const renderStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">
          {currentStepData.title}
        </h2>
        <p className="text-gray-500 mt-2">{currentStepData.description}</p>
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name={currentStepData.fieldName}
          render={() => (
            <div className="space-y-4">
              {currentStepData.options.map((option) => (
                <FormItem
                  key={option.id}
                  className="flex items-center space-x-3 space-y-0 bg-white rounded-full p-4 shadow-sm border border-black"
                >
                  <FormControl>
                    <Checkbox
                      checked={form
                        .watch(currentStepData.fieldName)
                        ?.includes(option.id)}
                      onCheckedChange={(checked) => {
                        const currentValues =
                          form.getValues(currentStepData.fieldName) || [];
                        const newValues = checked
                          ? [...currentValues, option.id]
                          : currentValues.filter((val) => val !== option.id);
                        form.setValue(currentStepData.fieldName, newValues, {
                          shouldValidate: true,
                        });
                      }}
                    />
                  </FormControl>
                  <div className="flex-1">
                    <FormLabel className="text-base font-medium">
                      {option.label}
                    </FormLabel>
                    <p className="text-sm text-gray-500">
                      {option.description}
                    </p>
                  </div>
                </FormItem>
              ))}
            </div>
          )}
        />
        <FormMessage />
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto">
      <Form {...form}>
        <form
          onSubmit={(e) => {
            // Prevent form submission on Enter key
            if (currentStep < steps.length - 1) {
              e.preventDefault();
              handleNext();
            } else {
              form.handleSubmit(onSubmit)(e);
            }
          }}
          className="space-y-8"
        >
          {renderStep()}
          <div className="flex justify-between pt-6">
            {currentStep > 0 ? (
              <Button type="button" variant="outline" onClick={handlePrev}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={handleSkip}>
                Skip for now
              </Button>
            )}

            <Button
              type="button" // Change to button type for all steps
              onClick={
                currentStep === steps.length - 1
                  ? form.handleSubmit(onSubmit)
                  : handleNext
              }
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Saving..."
              ) : currentStep === steps.length - 1 ? (
                "Save to Profile"
              ) : (
                <>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
