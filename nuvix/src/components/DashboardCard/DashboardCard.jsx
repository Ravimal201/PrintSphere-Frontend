import { ShoppingBag, PenTool, Shirt, Star } from "lucide-react";

export default function DashboardCard({ title, value }) {
  let Icon = ShoppingBag;
  let subtitle = '';

  if (title === 'Unique Designs' || title === 'Designs') {
    Icon = PenTool;
    subtitle = 'Created by our users';
  } else if (title === 'Premium Products' || title === 'Products') {
    Icon = Shirt;
    subtitle = 'High quality T-shirts';
  } else if (title === 'Orders Completed' || title === 'Orders') {
    Icon = ShoppingBag;
    subtitle = 'Happy customers worldwide';
  } else if (title === 'Customer Rating' || title === 'Rating') {
    Icon = Star;
    subtitle = 'Based on 2k+ reviews';
  }

  const showPlus = !String(value).includes('$') && !String(value).includes('/');

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-white/60">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-linear-to-br from-indigo-50 to-indigo-100 text-indigo-600 shadow-sm">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>

        <div className="flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-500">{title}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <h3 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              {value}{showPlus ? '+' : ''}
            </h3>
          </div>

          {subtitle && (
            <p className="mt-2 text-xs sm:text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}