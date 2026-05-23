import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Star, Camera, X, ArrowLeft } from 'lucide-react';

const API_BASE = 'https://tapify-backend-production.up.railway.app/api/reviews';

export default function ReviewFlow() {
  const { slug } = useParams();
  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Fetch funnel and log scan
    axios.get(`${API_BASE}/public_get_funnel.php?slug=${slug}`)
      .then(res => {
        if (res.data.success) {
          setFunnel(res.data.data);
        } else {
          console.error(res.data.message);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  const handleRating = async (selectedRating) => {
    setRating(selectedRating);
    
    if (selectedRating >= 4) {
      // 4-5 stars: Track redirect and send to Google
      try {
        await axios.post(`${API_BASE}/public_track_redirect.php`, { funnel_id: funnel.id });
      } catch (e) { console.error(e); }
      
      window.location.href = funnel.google_review_url;
    } else {
      // 1-3 stars: Show private feedback form
      setShowFeedbackForm(true);
    }
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const submitFeedback = async () => {
    setSubmitting(true);
    const formData = new FormData();
    formData.append('funnel_id', funnel.id);
    formData.append('rating', rating);
    formData.append('feedback_text', feedback);
    if (mediaFile) {
      formData.append('media', mediaFile);
    }

    try {
      const res = await axios.post(`${API_BASE}/public_submit_review.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setSubmitted(true);
      } else {
        alert('Failed to submit review');
      }
    } catch (e) {
      alert('Error submitting review');
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!funnel) {
    return <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-gray-500">Review link not found.</p>
    </div>;
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h2 className="text-2xl font-medium text-gray-900 mb-2">Thank you for your feedback!</h2>
        <p className="text-gray-600">We appreciate you taking the time to help us improve.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white max-w-2xl mx-auto flex flex-col font-sans">
      
      {/* Google-style Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium text-sm">
              {funnel.business_name ? funnel.business_name.charAt(0).toUpperCase() : 'B'}
            </div>
            <div>
              <h1 className="font-medium text-[15px] leading-tight text-gray-900">{funnel.business_name || 'Business'}</h1>
              <p className="text-[13px] text-gray-500 leading-tight">Publicly posting as Anonymous</p>
            </div>
          </div>
        </div>
        {showFeedbackForm && (
          <button 
            onClick={submitFeedback}
            disabled={submitting || (!feedback && !mediaFile)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${(!feedback && !mediaFile) || submitting ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        )}
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        {!showFeedbackForm ? (
          <div className="flex flex-col items-center justify-center h-full pt-10">
            <h2 className="text-2xl font-medium text-gray-900 mb-8 text-center">Rate and review</h2>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-2 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-12 h-12 stroke-1 ${
                      (hoverRating || rating) >= star
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-transparent text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="flex justify-center gap-1 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-8 h-8 stroke-1 ${
                      rating >= star
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-transparent text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              className="w-full h-40 text-[15px] resize-none outline-none placeholder-gray-500"
              placeholder="Share details of your own experience at this place"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              autoFocus
            ></textarea>

            {mediaPreview && (
              <div className="relative inline-block mt-4 mb-4">
                <img src={mediaPreview} alt="Preview" className="h-24 w-auto rounded-lg object-cover border border-gray-200" />
                <button 
                  onClick={removeMedia}
                  className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 shadow-sm hover:bg-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="mt-4 border border-gray-200 rounded-full inline-flex">
              <label className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-50 rounded-full transition-colors text-sm font-medium text-gray-700">
                <Camera className="w-5 h-5 text-gray-500 stroke-[1.5]" />
                Add photos
                <input 
                  type="file" 
                  accept="image/*,video/*" 
                  className="hidden" 
                  onChange={handleMediaChange}
                />
              </label>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
