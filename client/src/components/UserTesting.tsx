
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Star, Send, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FeedbackEntry {
  id: string;
  category: string;
  rating: number;
  comment: string;
  timestamp: Date;
  area: string;
}

const feedbackCategories = [
  "User Interface",
  "Form Usability", 
  "Strategy Selection",
  "Report Generation",
  "Overall Experience"
];

const feedbackAreas = [
  "Client Data Form",
  "Strategy Bank",
  "Report Preview",
  "Navigation",
  "Performance",
  "General"
];

export default function UserTesting() {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [newFeedback, setNewFeedback] = useState({
    category: '',
    rating: 0,
    comment: '',
    area: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const submitFeedback = async () => {
    if (!newFeedback.category || !newFeedback.area || newFeedback.rating === 0) {
      toast({
        title: "Incomplete feedback",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const feedbackEntry: FeedbackEntry = {
        id: Date.now().toString(),
        ...newFeedback,
        timestamp: new Date()
      };

      // In a real implementation, this would send to analytics service
      console.log('User feedback submitted:', feedbackEntry);
      
      setFeedback(prev => [feedbackEntry, ...prev]);
      setNewFeedback({ category: '', rating: 0, comment: '', area: '' });
      
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback! It helps improve the application.",
      });
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ rating, onRate }: { rating: number; onRate: (rating: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onRate(star)}
          className={`text-xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
        >
          <Star className="h-5 w-5 fill-current" />
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            User Testing & Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Feedback Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Application Area</Label>
              <Select value={newFeedback.area} onValueChange={(value) => setNewFeedback(prev => ({ ...prev, area: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {feedbackAreas.map(area => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Feedback Category</Label>
              <Select value={newFeedback.category} onValueChange={(value) => setNewFeedback(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {feedbackCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rating</Label>
            <StarRating 
              rating={newFeedback.rating} 
              onRate={(rating) => setNewFeedback(prev => ({ ...prev, rating }))} 
            />
          </div>

          <div className="space-y-2">
            <Label>Comments & Suggestions</Label>
            <Textarea
              placeholder="Share your experience, suggestions for improvement, or any issues encountered..."
              value={newFeedback.comment}
              onChange={(e) => setNewFeedback(prev => ({ ...prev, comment: e.target.value }))}
              rows={4}
            />
          </div>

          <Button onClick={submitFeedback} disabled={isSubmitting} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </CardContent>
      </Card>

      {/* Feedback History */}
      {feedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedback.slice(0, 5).map((entry) => (
                <div key={entry.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-2">
                      <Badge variant="outline">{entry.area}</Badge>
                      <Badge variant="secondary">{entry.category}</Badge>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`h-4 w-4 ${star <= entry.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  {entry.comment && (
                    <p className="text-sm text-gray-600 mb-2">{entry.comment}</p>
                  )}
                  <p className="text-xs text-gray-400">{entry.timestamp.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
