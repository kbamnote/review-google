import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Star, Camera, X, ArrowLeft, RefreshCw } from 'lucide-react';
import { REVIEW_TEMPLATES, fillTemplate } from '../data/reviewTemplates';

const API_BASE = 'https://app.tapify.co.in/api/reviews';

// The AI call had no timeout, so a hanging upstream left the customer stuck on
// "AI is writing your review..." with no way forward. Past this we stop waiting
// and serve a review from the local bank instead.
const AI_TIMEOUT_MS = 8000;

export default function ReviewFlow() {
  const { slug } = useParams();
  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [showPositiveFeedbackScreen, setShowPositiveFeedbackScreen] = useState(false);
  const [generatedFeedback, setGeneratedFeedback] = useState('');
  const [generatingReview, setGeneratingReview] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [copied, setCopied] = useState(false);

  // Draw-without-replacement over the local bank. A customer tapping "Show me a
  // different one" must never be handed a line they have already seen, and two
  // customers scanning the same code must not paste identical text onto Google —
  // duplicate reviews are the clearest signal of fake-review activity there is.
  const usedIdx = useRef(new Set());
  const pickLocalReview = useCallback((businessName) => {
    if (usedIdx.current.size >= REVIEW_TEMPLATES.length) usedIdx.current.clear();
    let i;
    do {
      i = Math.floor(Math.random() * REVIEW_TEMPLATES.length);
    } while (usedIdx.current.has(i));
    usedIdx.current.add(i);
    return fillTemplate(REVIEW_TEMPLATES[i], businessName);
  }, []);

  useEffect(() => {
    // Fetch funnel and log scan
    axios.get(`${API_BASE}/public_get_funnel.php?slug=${encodeURIComponent(slug)}`, { timeout: AI_TIMEOUT_MS })
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

  /**
   * Fetch a review: AI first, local bank as the safety net.
   *
   * `avoid` is the text currently on screen. If the AI hands back something we
   * are already showing (or nothing usable), we serve from the bank instead —
   * otherwise pressing "Show me a different one" could appear to do nothing.
   */
  const fetchReview = useCallback(async (businessName, avoid = '') => {
    try {
      const aiRes = await axios.post(
        `${API_BASE}/public_generate_review.php`,
        { business_name: businessName },
        { timeout: AI_TIMEOUT_MS }
      );
      const text = (aiRes?.data?.data?.text || '').trim();
      if (aiRes?.data?.success && text && text !== avoid.trim()) return text;
    } catch (e) {
      console.error('AI review unavailable, using local bank:', e?.message || e);
    }
    return pickLocalReview(businessName);
  }, [pickLocalReview]);

  const handleRating = async (selectedRating) => {
    setRating(selectedRating);

    if (selectedRating >= 4) {
      // 4-5 stars: Show positive feedback screen and generate a review
      setShowPositiveFeedbackScreen(true);
      setGeneratingReview(true);
      setGeneratedFeedback(await fetchReview(funnel.business_name));
      setGeneratingReview(false);
    } else {
      // 1-3 stars: Show private feedback form
      setShowFeedbackForm(true);
    }
  };

  /** "Show me a different one" — swap the suggestion without losing the screen. */
  const regenerateReview = async () => {
    if (swapping || generatingReview) return;
    setSwapping(true);
    setCopied(false);   // the text is changing, so a previous "Copied!" is stale
    setGeneratedFeedback(await fetchReview(funnel.business_name, generatedFeedback));
    setSwapping(false);
  };

  const handleCopyAndRedirect = async () => {
    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(generatedFeedback);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }

    // Track redirect
    try {
      await axios.post(`${API_BASE}/public_track_redirect.php`, { funnel_id: funnel.id });
    } catch (e) { console.error(e); }
    
    // Redirect
    let redirectUrl = funnel.google_review_url;
    if (!redirectUrl.match(/^https?:\/\//i)) {
      redirectUrl = 'https://' + redirectUrl;
    }
    
    // Slight delay so they see "Copied!" before navigating away
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 800);
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
    formData.append('customer_name', name);
    formData.append('customer_phone', phone);
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
            disabled={submitting || (!feedback && !mediaFile && !name && !phone)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${(!feedback && !mediaFile && !name && !phone) || submitting ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        )}
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        {!showFeedbackForm && !showPositiveFeedbackScreen ? (
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
        ) : showPositiveFeedbackScreen ? (
          <div className="animate-fade-in flex flex-col items-center h-full pt-4">
            <div className="flex justify-center gap-1 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <div key={star} className="p-1">
                  <Star className={`w-8 h-8 stroke-1 ${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'fill-transparent text-gray-300'}`} />
                </div>
              ))}
            </div>

            <h2 className="text-xl font-medium text-gray-900 mb-2 text-center">We love you too!</h2>
            <p className="text-gray-500 text-sm text-center mb-6">
              To make it easy, we generated a glowing review for you. Feel free to edit it, then copy and paste it on Google!
            </p>

            {generatingReview ? (
              <div className="w-full h-32 flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-gray-200 mb-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-3"></div>
                <p className="text-sm text-gray-500">Writing your review...</p>
              </div>
            ) : (
              <div className="w-full relative mb-3">
                <textarea
                  className="w-full h-32 p-4 text-[15px] resize-none outline-none border border-blue-200 focus:border-blue-500 rounded-xl shadow-sm bg-blue-50/30 disabled:opacity-60"
                  value={generatedFeedback}
                  disabled={swapping}
                  onChange={(e) => { setGeneratedFeedback(e.target.value); setCopied(false); }}
                ></textarea>
                {swapping && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            )}

            {/* Every customer scanning this code should paste something different
                onto Google, so the suggestion is always swappable. */}
            <button
              type="button"
              onClick={regenerateReview}
              disabled={generatingReview || swapping}
              className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${swapping ? 'animate-spin' : ''}`} />
              {swapping ? 'Finding another…' : 'Show me a different one'}
            </button>

            <button 
              onClick={handleCopyAndRedirect}
              disabled={generatingReview}
              className={`w-full py-3.5 rounded-xl font-medium text-[15px] transition-all flex items-center justify-center gap-2 ${
                generatingReview 
                  ? 'bg-gray-100 text-gray-400' 
                  : copied 
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Copied! Redirecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                  Copy & Post on Google
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="flex justify-center gap-1 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
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

            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 text-[15px] border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 placeholder-gray-400 transition-all"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone number</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2.5 text-[15px] border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 placeholder-gray-400 transition-all"
                  placeholder="+91 00000 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <textarea
              className="w-full h-40 text-[15px] resize-none outline-none placeholder-gray-500"
              placeholder="Share details of your own experience at this place"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
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
