import { Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const testimonials = [
  {
    quote: "Amazing quality and the 3D designer is super easy to use!",
    name: "Sarah K.",
    role: "Graphic Designer",
    rating: 5,
    avatar: "https://i.pravatar.cc/100?img=32",
  },
  {
    quote: "I love how I can see my design in real-time.",
    name: "James L.",
    role: "Entrepreneur",
    rating: 4,
    avatar: "https://i.pravatar.cc/100?img=12",
  },
  {
    quote: "Fast delivery and excellent customer service.",
    name: "Priya M.",
    role: "Marketing Lead",
    rating: 5,
    avatar: "https://i.pravatar.cc/100?img=44",
  },
  {
    quote: "Great fabrics and the print quality is top-notch.",
    name: "Carlos R.",
    role: "Store Owner",
    rating: 5,
    avatar: "https://i.pravatar.cc/100?img=5",
  },
  {
    quote: "Easy customization and fast turnaround.",
    name: "Aisha B.",
    role: "Influencer",
    rating: 4,
    avatar: "https://i.pravatar.cc/100?img=15",
  },
  {
    quote: "Their support helped me with a tricky design — excellent!",
    name: "Tom H.",
    role: "Developer",
    rating: 5,
    avatar: "https://i.pravatar.cc/100?img=8",
  },
  {
    quote: "I'll definitely reorder — colors last through many washes.",
    name: "Maya S.",
    role: "Teacher",
    rating: 5,
    avatar: "https://i.pravatar.cc/100?img=22",
  },
];

function Stars({ count = 5 }) {
  return (
    <div className="flex items-center gap-1 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < count ? "opacity-100" : "opacity-30"}`} />
      ))}
    </div>
  );
}

function TestimonialCard({ item }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="text-3xl text-slate-500">“</div>
      <p className="mt-3 text-sm text-slate-700 leading-6">{item.quote}</p>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={item.avatar} alt={item.name} className="h-10 w-10 rounded-full object-cover" />
          <div>
            <div className="text-sm font-medium text-slate-900">{item.name}</div>
            {item.role && <div className="text-xs text-slate-500">{item.role}</div>}
          </div>
        </div>

        <Stars count={item.rating} />
      </div>
    </div>
  );
}

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(1);
  const autoplayRef = useRef(null);

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

  useEffect(() => {
    // autoplay that advances by one "page" (index) with wrap based on visible count
    const maxIndex = Math.max(0, testimonials.length - visible);
    autoplayRef.current = setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, 4500);

    return () => clearInterval(autoplayRef.current);
  }, [visible]);

  function goPrev() {
    clearInterval(autoplayRef.current);
    const maxIndex = Math.max(0, testimonials.length - visible);
    setIndex((i) => (i <= 0 ? maxIndex : i - 1));
  }

  function goNext() {
    clearInterval(autoplayRef.current);
    const maxIndex = Math.max(0, testimonials.length - visible);
    setIndex((i) => (i >= maxIndex ? 0 : i + 1));
  }

  return (
    <section className="mb-8 rounded-2xl border border-white/70 bg-white px-4 py-8 shadow-sm sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">What Our Customers Say</h2>
        <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-indigo-600" />
      </div>

      <div className="mt-8 relative w-full">
        {/* cards: show single active card */}
        <div className="overflow-hidden">
          <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${index * (100 / visible)}%)` }}>
            {testimonials.map((t) => (
              <div key={t.name} className="px-2 shrink-0" style={{ flex: `0 0 ${100 / visible}%`, maxWidth: `${100 / visible}%` }}>
                <TestimonialCard item={t} />
              </div>
            ))}
          </div>
        </div>

        {/* arrows */}
        <button onClick={goPrev} aria-label="Previous" className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md hover:bg-white">
          ‹
        </button>
        <button onClick={goNext} aria-label="Next" className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md hover:bg-white">
          ›
        </button>

        {/* dots */}
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.max(1, testimonials.length - visible + 1) }).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  clearInterval(autoplayRef.current);
                  setIndex(i);
                }}
                className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-indigo-600" : "w-2 bg-slate-200"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
