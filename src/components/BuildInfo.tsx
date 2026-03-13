export default function BuildInfo() {
  const buildTime = process.env.BUILD_TIME;

  if (!buildTime) {
    return null;
  }

  const buildDate = new Date(buildTime);
  const now = new Date();
  const diffMs = now.getTime() - buildDate.getTime();
  
  let timeAgo = '';
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    timeAgo = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    timeAgo = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
      <p className="text-gray-700">
        <span className="font-semibold">Build Time:</span> {buildDate.toLocaleString()} ({timeAgo})
      </p>
    </div>
  );
}
