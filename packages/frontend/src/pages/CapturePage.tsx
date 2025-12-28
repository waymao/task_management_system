import { QuickCapture } from '../components/capture/QuickCapture';
import { FullCaptureForm } from '../components/capture/FullCaptureForm';
import { RecentCaptures } from '../components/capture/RecentCaptures';

export function CapturePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Capture</h1>
        <p className="text-gray-600">
          Quickly capture tasks and todos into your system
        </p>
      </div>

      <QuickCapture />

      <FullCaptureForm />

      <RecentCaptures />
    </div>
  );
}
