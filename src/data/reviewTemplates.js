/**
 * Offline review bank.
 *
 * The AI endpoint is the primary source, but it can fail — missing key, quota,
 * a network blip — and before this existed the UI fell back to ONE hardcoded
 * sentence, so every customer pasted an identical review onto Google. Identical
 * reviews are the single clearest footprint of fake-review activity, so a
 * repeated fallback actively hurt the business it was meant to help.
 *
 * Every entry takes {business} and is written to read like a real customer:
 * varied openings, varied length, varied sentence shape, no emoji or hashtags.
 * They mention the kind of thing people genuinely search for — service, staff,
 * pricing, timeliness, cleanliness, recommendation — which is what makes a
 * review useful for local SEO, without stuffing keywords.
 *
 * Kept deliberately industry-neutral: one funnel serves restaurants, salons,
 * clinics, boutiques and tour operators alike, so nothing here may assume food,
 * treatment, stock or a booking.
 */

export const REVIEW_TEMPLATES = [
  // --- overall experience -------------------------------------------------
  "Genuinely impressed with {business}. Everything was handled properly from start to finish, and I did not have to chase anyone once.",
  "Had a really good experience at {business}. They took the time to understand what I actually needed instead of pushing me towards something else.",
  "{business} made the whole thing easy. Clear answers, no runaround, and everything happened when they said it would.",
  "Second time using {business} and they were just as good as the first. Consistency like that is rare.",
  "I went to {business} on a recommendation and I can see why. Well run, and the people there clearly know what they are doing.",
  "Really pleased with how things went at {business}. Straightforward, professional, and no surprises at the end.",
  "{business} exceeded what I expected. I came in with a fairly specific requirement and they handled it without any fuss.",
  "Great experience with {business} from the first phone call through to the end. Would happily use them again.",
  "Everything about my visit to {business} was smooth. Booked easily, was seen on time, and left happy.",
  "{business} is one of those places that just does what it promises. No overselling, no drama.",

  // --- staff and service --------------------------------------------------
  "The team at {business} are excellent. Patient, friendly, and they actually listened rather than rushing me through.",
  "Staff at {business} were welcoming from the moment I walked in. Nothing felt like too much trouble.",
  "What stood out at {business} was how helpful everyone was. They answered every question properly, even the daft ones.",
  "Lovely people at {business}. You can tell they enjoy what they do, and it makes a real difference.",
  "The person who looked after me at {business} was brilliant — knowledgeable without being condescending about it.",
  "Really friendly service at {business}. I never felt like I was being hurried along to the next customer.",
  "{business} has genuinely good staff. Polite, well trained, and happy to explain things properly.",
  "Everyone at {business} was courteous and professional. It is a small thing but it makes you want to come back.",
  "I appreciated how the team at {business} explained my options rather than just deciding for me.",
  "The service at {business} is a step above. Attentive without hovering, which is a hard balance to get right.",

  // --- quality and attention to detail ------------------------------------
  "The quality at {business} is excellent. You can see the care that goes into the work.",
  "Really happy with the standard of work from {business}. Attention to detail was obvious throughout.",
  "{business} does not cut corners. Everything was finished properly and checked before I left.",
  "Impressed by the standard at {business}. The little details were right, which tells you a lot.",
  "Quality was exactly what I hoped for at {business}, and honestly a bit better than I expected for the price.",
  "{business} clearly takes pride in their work. It shows in the finish.",
  "Everything was done thoroughly at {business}. No rushing, no half-measures.",
  "The workmanship at {business} was spot on. I have no complaints at all.",

  // --- value and pricing --------------------------------------------------
  "Fair pricing at {business} and, more importantly, no surprises. What they quoted is what I paid.",
  "Good value at {business}. I have paid more elsewhere for noticeably worse.",
  "{business} were upfront about costs from the start, which I really appreciated.",
  "Honest pricing at {business}. They even suggested a cheaper option that suited me better.",
  "Reasonably priced and genuinely good — {business} strikes a good balance between the two.",
  "I felt like I got my money's worth at {business}, which is not something I say often.",
  "No hidden charges at {business}. The final bill matched the estimate exactly.",
  "{business} gave me a clear quote before starting and stuck to it. Refreshing.",

  // --- speed and reliability ----------------------------------------------
  "Quick and efficient service from {business} without feeling rushed. Exactly the right pace.",
  "{business} were prompt and stuck to the timings they gave me. That alone puts them ahead of most.",
  "Turnaround at {business} was faster than I expected, and the quality did not suffer for it.",
  "Booked with {business} and was seen right on time. No sitting around waiting.",
  "Reliable is the word for {business}. They said a time, they kept to it.",
  "{business} sorted everything out far quicker than I thought it would take.",
  "Really punctual service at {business}. My whole day did not have to be built around the appointment.",

  // --- communication ------------------------------------------------------
  "Communication from {business} was excellent throughout. I always knew what was happening and when.",
  "{business} kept me updated the whole way through, which took a lot of the stress out of it.",
  "Easy to get hold of and quick to reply — {business} are good at the basics that most places get wrong.",
  "Every question I sent {business} got a proper answer, usually the same day.",
  "{business} explained everything in plain language rather than jargon. Made the decision much easier.",
  "Really responsive team at {business}. No chasing required.",

  // --- cleanliness and setup ----------------------------------------------
  "The place is spotless and well organised. {business} clearly cares about how they present themselves.",
  "Clean, comfortable and well kept — {business} is a pleasant place to be.",
  "{business} has a really calm, tidy setup. Made the whole experience more relaxed.",
  "Everything at {business} was clean and properly maintained. It gives you confidence.",
  "Nice atmosphere at {business}. Somewhere you actually do not mind spending time.",

  // --- going above and beyond ---------------------------------------------
  "{business} went out of their way to help me with something that was not really their responsibility. That says everything.",
  "I had an awkward request and {business} sorted it without making me feel like a nuisance.",
  "Something came up at the last minute and {business} rearranged things for me without any fuss.",
  "{business} followed up afterwards to check everything was fine. Nobody does that any more.",
  "They did a bit more than they needed to at {business}, and did not charge me for it.",
  "{business} fixed a small issue afterwards straight away, no argument and no cost. Proper service.",

  // --- recommendation and loyalty -----------------------------------------
  "Would happily recommend {business} to anyone. Genuinely good from start to finish.",
  "I have already recommended {business} to two people. That is how good it was.",
  "If you are deciding between places, go with {business}. You will not regret it.",
  "{business} has earned a regular customer out of me.",
  "I will not be going anywhere else now that I have found {business}.",
  "Been with {business} for a while now and they have never let me down.",
  "Recommending {business} to friends and family without hesitation.",
  "{business} is my go-to now. Reliable every single time.",
  "Happy to give {business} five stars. Well deserved.",
  "Finally found somewhere I can trust. {business} is that place.",

  // --- first-time and nervous customers -----------------------------------
  "First time at {business} and they put me completely at ease. I will be back.",
  "I was a bit unsure beforehand but {business} were patient and talked me through everything.",
  "As a first-time customer I felt properly looked after at {business}. No pressure at all.",
  "{business} made a slightly daunting process feel simple. Grateful for that.",
  "Walked into {business} not really knowing what I wanted and left very happy.",

  // --- local and convenience ----------------------------------------------
  "Great local business. Glad to have {business} nearby.",
  "{business} is well worth the trip. Easy to find and easy to deal with.",
  "Nice to support a local place that actually delivers. {business} does.",
  "Convenient, well run and genuinely good — {business} ticks all three.",
  "Been looking for somewhere decent locally for ages. {business} is it.",

  // --- longer, more detailed ----------------------------------------------
  "I had been putting this off for a while and I am glad I finally went to {business}. They talked me through the options without any pressure, gave me a clear price up front, and everything was finished when they said it would be. Genuinely no complaints.",
  "Booking with {business} was simple, the team were friendly and professional throughout, and the result was better than I expected. It is rare to find somewhere that gets the service and the actual work right. I will definitely be back.",
  "What I appreciated most about {business} was the honesty. They told me what I actually needed rather than the most expensive option, and stuck to the quote exactly. That kind of straightforwardness earns repeat business.",
  "From the first enquiry to the end, {business} were on top of everything. Quick to respond, clear about timings, and the quality of the work speaks for itself. Highly recommended if you want it done properly.",
  "Really good experience with {business}. The staff took time to understand what I was after, kept me updated along the way, and the final result was exactly right. Fair price too.",
  "I have used a few places over the years and {business} stands out. Professional, punctual and genuinely pleasant to deal with. It should not be unusual to get all three, but it is.",
  "{business} handled a fairly complicated request without any drama. Everything was explained clearly, the pricing was transparent, and they kept in touch throughout. Could not ask for much more.",
  "Excellent from beginning to end. {business} were welcoming, the work was done to a high standard, and they followed up afterwards to make sure I was happy. That extra step is why I will keep going back.",

  // --- short and punchy ---------------------------------------------------
  "Excellent service at {business}. Highly recommended.",
  "Very happy with {business}. Professional and friendly throughout.",
  "{business} did a great job. Simple as that.",
  "Top marks for {business}. Will be back.",
  "Really good experience at {business}. Thank you.",
  "{business} — reliable, friendly and fairly priced.",
  "No complaints at all about {business}. Great work.",
  "Brilliant service from {business}. Five stars.",
  "Very pleased with {business}. Would use again.",
  "{business} came through exactly as promised.",
];

/** Fill the {business} token; falls back to a neutral phrase when unnamed. */
export function fillTemplate(template, businessName) {
  const name = (businessName || '').trim() || 'this business';
  return template.replace(/\{business\}/g, name);
}

export const TEMPLATE_COUNT = REVIEW_TEMPLATES.length;
