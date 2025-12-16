export default function DebugPage() {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  const apiKeyPreview = process.env.ANTHROPIC_API_KEY 
    ? `${process.env.ANTHROPIC_API_KEY.slice(0, 15)}...` 
    : 'NOT SET';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Environment Debug</h1>
        
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">ANTHROPIC_API_KEY:</span>
                <span className={hasApiKey ? 'text-green-400' : 'text-red-400'}>
                  {hasApiKey ? '✅ Set' : '❌ Not Set'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Preview:</span>
                <code className="text-sm bg-gray-800 px-2 py-1 rounded">
                  {apiKeyPreview}
                </code>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Starts with sk-ant:</span>
                <span className={process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant') ? 'text-green-400' : 'text-red-400'}>
                  {process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant') ? '✅ Yes' : '❌ No'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>If API key is not set, create <code className="bg-gray-800 px-2 py-1 rounded">.env.local</code> in project root</li>
              <li>Add: <code className="bg-gray-800 px-2 py-1 rounded">ANTHROPIC_API_KEY=sk-ant-...</code></li>
              <li>Restart dev server: <code className="bg-gray-800 px-2 py-1 rounded">npm run dev</code></li>
              <li>Refresh this page to verify</li>
            </ol>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
            <p className="text-gray-300 mb-4">
              {hasApiKey 
                ? '✅ API key is configured! Go back to the home page and try uploading a screenshot.'
                : '❌ API key is missing. Follow the instructions above.'}
            </p>
            <a 
              href="/"
              className="inline-block px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Go to Home Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

