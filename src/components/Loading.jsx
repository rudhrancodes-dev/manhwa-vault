export default function Loading({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}
