import { Star, ChevronLeft, ChevronRight, CheckCircle2, ShoppingBag, Sparkles, MessageSquareQuote } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

function Stars({ count = 5 }) {
  return (
    <div className="flex items-center gap-1 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < count ? "fill-amber-400 text-amber-400" : "text-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

function TestimonialCard({ item }) {
  const formattedDate = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="h-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between select-none">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Stars count={item.rating || 5} />
            <span className="text-xs font-black text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg shrink-0">
              {item.rating}.0★
            </span>
          </div>
          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Verified Buyer
          </span>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed italic line-clamp-4 mt-2">
          "{item.quote}"
        </p>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {item.productImage ? (
            <img
              src={item.productImage}
              alt={item.role || "Product"}
              className="h-10 w-10 rounded-xl object-contain border border-slate-200 bg-slate-50 shrink-0 p-0.5"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center border border-indigo-200 shrink-0 shadow-xs">
              {item.initials || item.name?.slice(0, 2)?.toUpperCase() || "PS"}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-900 truncate">
              {item.name}
            </div>
            {item.role && (
              <a
                href="/store"
                className="text-[11px] font-semibold text-indigo-600 truncate flex items-center gap-1 hover:underline"
              >
                <ShoppingBag className="h-3 w-3 shrink-0" />
                <span className="truncate">{item.role}</span>
              </a>
            )}
          </div>
        </div>

        {formattedDate && (
          <span className="text-[10px] font-bold text-slate-400 shrink-0">
            {formattedDate}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Testimonials() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(1);
  const autoplayRef = useRef(null);

  // Fetch real reviews exclusively from database
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/reviews`);
        if (res.data && Array.isArray(res.data)) {
          setReviews(res.data);
        }
      } catch (err) {
        console.error("Error fetching testimonials reviews:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  useEffect(() => {
    function updateVisible() {
      const w = window.innerWidth;
      if (w >= 1024) setVisible(3);
      else if (w >= 768) setVisible(2);
      else setVisible(1);
    }

    updateVisible();
    window.addEventListener("resize", updateVisible);
    return () => window.removeEventListener("resize", updateVisible);
  }, []);

  const shouldSlide = reviews.length > visible;

  useEffect(() => {
    if (!shouldSlide) return;
    const maxIndex = Math.max(0, reviews.length - visible);
    autoplayRef.current = setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, 4500);

    return () => clearInterval(autoplayRef.current);
  }, [visible, reviews.length, shouldSlide]);

  function goPrev() {
    clearInterval(autoplayRef.current);
    const maxIndex = Math.max(0, reviews.length - visible);
    setIndex((i) => (i <= 0 ? maxIndex : i - 1));
  }

  function goNext() {
    clearInterval(autoplayRef.current);
    const maxIndex = Math.max(0, reviews.length - visible);
    setIndex((i) => (i >= maxIndex ? 0 : i + 1));
  }

  return (
    <section className="mb-8 rounded-4xl border border-slate-200/70 bg-white px-4 py-8 shadow-sm sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500 flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>What Our Customers Say</span>
        </h2>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Authentic feedback and star ratings from verified PrintSphere customers
        </p>
        <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-indigo-600" />
      </div>

      <div className="mt-8 relative w-full">
        {loading ? (
          <div className="py-12 flex justify-center items-center text-slate-400 text-xs font-semibold">
            Loading customer reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-12 px-4 text-center bg-slate-50 border border-slate-100 rounded-3xl max-w-md mx-auto">
            <MessageSquareQuote className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">
              No customer reviews yet
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Be the first to order and share your feedback on your completed orders!
            </p>
          </div>
        ) : !shouldSlide ? (
          /* Static centered grid when items fit the screen */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {reviews.map((t, idx) => (
              <div key={t._id || idx} className="h-full">
                <TestimonialCard item={t} />
              </div>
            ))}
          </div>
        ) : (
          /* Sliding carousel when items exceed visible columns */
          <div>
            <div className="overflow-hidden py-1">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${index * (100 / visible)}%)`,
                }}
              >
                {reviews.map((t, idx) => (
                  <div
                    key={t._id || `${t.name}-${idx}`}
                    className="px-2.5 shrink-0"
                    style={{
                      flex: `0 0 ${100 / visible}%`,
                      maxWidth: `${100 / visible}%`,
                    }}
                  >
                    <TestimonialCard item={t} />
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel Navigation Arrows */}
            <button
              onClick={goPrev}
              aria-label="Previous"
              className="absolute -left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50 hover:text-indigo-600 flex items-center justify-center transition cursor-pointer z-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goNext}
              aria-label="Next"
              className="absolute -right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50 hover:text-indigo-600 flex items-center justify-center transition cursor-pointer z-10"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dot Indicators */}
            <div className="mt-6 flex justify-center">
              <div className="flex items-center gap-1.5">
                {Array.from({
                  length: Math.max(1, reviews.length - visible + 1),
                }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      clearInterval(autoplayRef.current);
                      setIndex(i);
                    }}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      i === index
                        ? "w-6 bg-indigo-600"
                        : "w-2 bg-slate-200 hover:bg-slate-300"
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
