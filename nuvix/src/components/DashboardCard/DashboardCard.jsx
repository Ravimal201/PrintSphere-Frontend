import { ShoppingBag, PenTool, Shirt, Star } from "lucide-react";

export default function DashboardCard({ title, value, subtitle: customSubtitle }) {
  let Icon = ShoppingBag;
  let defaultSubtitle = "";

  if (title === "Unique Designs" || title === "Designs") {
    Icon = PenTool;
    defaultSubtitle = "Created by our users";
  } else if (title === "Premium Products" || title === "Products") {
    Icon = Shirt;
    defaultSubtitle = "High quality T-shirts";
  } else if (title === "Orders Completed" || title === "Orders") {
    Icon = ShoppingBag;
    defaultSubtitle = "Happy customers worldwide";
  } else if (title === "Customer Rating" || title === "Rating") {
    Icon = Star;
    defaultSubtitle = "Based on verified reviews";
  }

  const subtitle = customSubtitle || defaultSubtitle;
  const isRating = title === "Customer Rating" || title === "Rating" || String(value).includes("/");
  const showPlus = !isRating && !String(value).includes("$") && !String(value).includes("Rs");

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 hover:shadow-md hover:border-indigo-100 transition duration-200">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 shadow-xs shrink-0">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-slate-500 truncate">{title}</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900">
              {value}{showPlus ? "+" : ""}
            </h3>
          </div>

          {subtitle && (
            <p className="mt-1.5 text-xs text-slate-500 line-clamp-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}