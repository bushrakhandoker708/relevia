// Writing prompts and the optional feeling list used by Journaling.jsx. Moved here unchanged
// from the component so the page itself stays readable.

export const promptLibrary = {
  beginner: {
    empathic: [
      "What are three small things that brought you comfort today?",
      "Describe a place where you feel completely safe.",
      "What would you say to comfort a friend feeling like you do now?",
      "Write about the last time you felt genuinely happy.",
      "What colors describe your mood today and why?",
      "What made you smile recently, even if just for a moment?",
      "Describe someone who makes you feel understood.",
      "What's one thing you're grateful for right now?"
    ],
    cbt: [
      "What is one thought that keeps coming back today?",
      "If this problem had a simple solution, what might it be?",
      "What would you tell a friend in your situation?",
      "What's one small step you could take toward feeling better?",
      "What evidence do you have that this feeling will pass?",
      "What assumptions might you be making about this situation?",
      "How might someone else view what you're going through?",
      "What would happen if you tried a different approach?"
    ],
    creative: [
      "If your day was a weather report, what would it say?",
      "Write a short letter to your past self from one year ago.",
      "Describe your ideal peaceful morning in detail.",
      "What song best matches your current emotions?",
      "If you could have a conversation with your feelings, what would you ask?",
      "Imagine your stress as a character - what would it look like?",
      "Write about your emotions as if they were colors painting a canvas.",
      "If your thoughts had a voice, what would they sound like?"
    ],
    mindfulness: [
      "What do you notice about your breathing right now?",
      "Describe five things you can sense in this moment.",
      "What thoughts are passing through your mind without judgment?",
      "How does your body feel as you sit here writing?",
      "What sounds can you hear around you right now?",
      "Notice the weight of your hands - what do you feel?",
      "What textures can you touch from where you're sitting?",
      "Observe your emotions like clouds passing by - what do you see?"
    ]
  },
  intermediate: [
    "Explore the connection between your physical sensations and emotions right now.",
    "What patterns do you notice in your thinking when you feel this way?",
    "How has your perspective on this situation changed over time?",
    "What would it look like to hold space for both your pain and your hope?",
    "Write about a time when you successfully navigated similar feelings.",
    "What story are you telling yourself about this experience? What other stories exist?",
    "How might your current challenge be connected to your personal growth?",
    "What would self-compassion look like in this specific situation?",
    "Explore the relationship between your expectations and your current reality.",
    "What would you discover if you approached this with curiosity instead of judgment?"
  ],
  advanced: [
    "Examine the story you're telling yourself about this experience. What alternative narratives exist?",
    "How might your current struggle be connected to your deeper values and growth?",
    "What would radical self-compassion look like in this moment?",
    "Explore the paradox of accepting difficult emotions while also working to change them.",
    "What would you discover if you approached this situation with curious detachment?",
    "How do your past experiences influence your interpretation of current events?",
    "What would it mean to find meaning in this difficult experience?",
    "Explore the tension between control and acceptance in your current situation.",
    "How might your suffering be connected to your capacity for empathy and connection?",
    "What would it look like to embrace the uncertainty in your life right now?"
  ]
};

// Enhanced mood tracking with energy levels, categories, and intensity
export const moodCategories = {
  emotional: [
    { emoji: '😊', label: 'Joyful', color: 'bg-yellow-200 hover:bg-yellow-300', value: 0.9, energy: 0.6 },
    { emoji: '💝', label: 'Grateful', color: 'bg-pink-200 hover:bg-pink-300', value: 0.8, energy: 0.5 },
    { emoji: '😌', label: 'Content', color: 'bg-green-200 hover:bg-green-300', value: 0.6, energy: 0.3 },
    { emoji: '🙂', label: 'Hopeful', color: 'bg-blue-200 hover:bg-blue-300', value: 0.5, energy: 0.4 },
    { emoji: '😐', label: 'Neutral', color: 'bg-gray-200 hover:bg-gray-300', value: 0, energy: 0 },
    { emoji: '😔', label: 'Sad', color: 'bg-blue-300 hover:bg-blue-400', value: -0.6, energy: -0.3 },
    { emoji: '😟', label: 'Anxious', color: 'bg-orange-200 hover:bg-orange-300', value: -0.4, energy: 0.6 },
    { emoji: '😢', label: 'Overwhelmed', color: 'bg-purple-200 hover:bg-purple-300', value: -0.8, energy: -0.5 },
    { emoji: '😤', label: 'Frustrated', color: 'bg-red-200 hover:bg-red-300', value: -0.7, energy: 0.7 }
  ],
  energy: [
    { emoji: '⚡', label: 'Energized', color: 'bg-yellow-200 hover:bg-yellow-300', value: 0.8, energy: 0.9 },
    { emoji: '☕', label: 'Alert', color: 'bg-orange-200 hover:bg-orange-300', value: 0.5, energy: 0.7 },
    { emoji: '🌊', label: 'Calm', color: 'bg-blue-200 hover:bg-blue-300', value: 0.3, energy: 0.2 },
    { emoji: '🍃', label: 'Peaceful', color: 'bg-green-200 hover:bg-green-300', value: 0.4, energy: 0.1 },
    { emoji: '😴', label: 'Tired', color: 'bg-purple-200 hover:bg-purple-300', value: -0.2, energy: -0.4 },
    { emoji: '🌙', label: 'Drained', color: 'bg-indigo-200 hover:bg-indigo-300', value: -0.4, energy: -0.7 },
    { emoji: '🔋', label: 'Restless', color: 'bg-red-200 hover:bg-red-300', value: -0.1, energy: 0.8 }
  ],
  physical: [
    { emoji: '💪', label: 'Strong', color: 'bg-green-200 hover:bg-green-300', value: 0.7, energy: 0.8 },
    { emoji: '🧘', label: 'Relaxed', color: 'bg-purple-200 hover:bg-purple-300', value: 0.6, energy: 0.2 },
    { emoji: '🤕', label: 'Unwell', color: 'bg-red-200 hover:bg-red-300', value: -0.5, energy: -0.6 },
    { emoji: '😷', label: 'Under Weather', color: 'bg-gray-200 hover:bg-gray-300', value: -0.3, energy: -0.4 },
    { emoji: '🏃', label: 'Active', color: 'bg-blue-200 hover:bg-blue-300', value: 0.5, energy: 0.9 },
    { emoji: '🛌', label: 'Resting', color: 'bg-indigo-200 hover:bg-indigo-300', value: 0.2, energy: -0.2 }
  ]
};
