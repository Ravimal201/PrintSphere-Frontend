export default function ToolButton({ text }) {
  return (
    <button className="w-full px-5 py-4 rounded-2xl bg-gray-100 hover:bg-indigo-100 text-left">
      {text}
    </button>
  );
}