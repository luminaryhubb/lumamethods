window.StatCard = ({ title, value }) => (
  <div className="text-center">
    <div className="text-sm text-gray-300">{title}</div>
    <div className="text-2xl font-bold mt-2">{value}</div>
  </div>
);
window.ShortnerItem = ({ url, meta }) => (
  <div className="flex justify-between p-2 bg-neutral-800 rounded">
    <div className="truncate">{url}</div>
    <div className="text-sm text-gray-400">{meta}</div>
  </div>
);
