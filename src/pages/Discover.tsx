import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DiscoverRooms from '@/components/DiscoverRooms';
import FeedbackForm from '@/components/FeedbackForm';

export default function Discover() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-terminal p-4 md:p-8 scanlines">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/workrooms')}
          className="font-retro glow-border"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Rooms
        </Button>

        <DiscoverRooms />

        <FeedbackForm />
      </div>
    </div>
  );
}
