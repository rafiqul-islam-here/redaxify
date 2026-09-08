export const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds}`;
  };

// utils/formatDate.ts
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString();  // Formats the date according to the user's locale
}


/* Write and export necessary utility functions from here. */
export interface PricingPlan {
  title: string;
  description: string;
  price: number;
}

export interface FormattedPricingPlan {
  title: string;
  description: string;
  price: string;
  duration: "Per Month" | "Per Year";
}

export const calculatePricing = (
  plans: PricingPlan[],
  isMonthly: boolean,
  discountRate: number = 0.15
): FormattedPricingPlan[] => {
  return plans.map((plan) => ({
    title: plan.title,
    description: plan.description,
    price: isMonthly
      ? `${plan.price}`
      : `${Math.round(plan.price * 12 * (1 - discountRate))}`,
    duration: isMonthly ? "Per Month" : "Per Year",
  }));
};


/* Features used in Pricing.tsx */
export const features = [
  {
    name: "Video Redaction (Manual, Object Tracking, and AI Automatic)",
    plans: ["Doc", "Lite", "Standard", "Premium"],
  },
  {
    name: "Automatic Faces, License Plates, Vehicles, People, Screens, and Paper Objects Redaction",
    plans: ["", "Lite", "Standard", "Premium"],
  },
  {
    name: "Video Enhancement Tools (35+ effects)",
    plans: ["Doc", "", "Standard", "Premium"],
  },
  {
    name: "Video Editing Tools (cut, merge, rotate, and more)",
    plans: ["Doc", "", "Standard", "Premium"],
  },
  { name: "Image Redaction", plans: ["", "", "Standard", "Premium"] },
];