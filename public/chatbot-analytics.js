/**
 * Chatbot Analytics Integration for Lead Generation Chatbot Pro
 * Add this to your chatbot's JavaScript
 */

class ChatbotAnalytics {
  constructor(chatbotId = 'lead_gen_chatbot_pro') {
    this.chatbotId = chatbotId;
    this.conversationStarted = false;
    this.currentStep = 0;
    this.userResponses = [];
    this.startTime = null;
    
    this.initTracking();
  }

  initTracking() {
    // Track when chatbot opens/loads
    this.trackChatbotStart();
  }

  trackChatbotStart() {
    this.startTime = Date.now();
    this.conversationStarted = true;
    
    // Send to form analytics as chatbot form start
    this.sendToHeatmap('form_start', {
      form_id: this.chatbotId,
      form_type: 'chatbot_lead_generation',
      form_name: 'Lead Generation Chatbot Pro',
      total_fields: this.getTotalSteps(),
    });
  }

  trackUserResponse(stepName, questionText, userAnswer, buttonClicked = null) {
    this.currentStep++;
    
    const response = {
      step: this.currentStep,
      stepName,
      questionText,
      userAnswer,
      buttonClicked,
      timestamp: Date.now()
    };
    
    this.userResponses.push(response);
    
    // Track as field interaction
    this.sendToHeatmap('field_interaction', {
      form_id: this.chatbotId,
      field_name: stepName,
      field_type: 'chatbot_step',
      field_label: questionText,
      field_position: this.currentStep,
      interaction_type: buttonClicked ? 'button_click' : 'text_input',
      interaction_value: userAnswer,
      timestamp_ms: Date.now()
    });
  }

  trackLeadCompletion(leadData) {
    const completionTime = (Date.now() - this.startTime) / 1000;
    
    // Track successful lead generation
    this.sendToHeatmap('form_complete', {
      form_id: this.chatbotId,
      form_type: 'chatbot_lead_generation',
      form_name: 'Lead Generation Chatbot Pro',
      completion_time: Math.floor(completionTime),
      fields_completed: this.currentStep,
      total_fields: this.getTotalSteps(),
      lead_data: {
        email: leadData.email,
        phone: leadData.phone,
        interest_level: leadData.interestLevel,
        source: 'chatbot'
      }
    });
  }

  trackChatbotAbandonment(reason = 'user_left') {
    if (!this.conversationStarted) return;
    
    const timeSpent = (Date.now() - this.startTime) / 1000;
    
    this.sendToHeatmap('form_abandon', {
      form_id: this.chatbotId,
      form_type: 'chatbot_lead_generation', 
      abandon_reason: reason,
      steps_completed: this.currentStep,
      total_steps: this.getTotalSteps(),
      time_spent_seconds: Math.floor(timeSpent),
      last_question: this.userResponses[this.userResponses.length - 1]?.questionText
    });
  }

  trackButtonClick(buttonText, buttonValue, stepName) {
    // Track specific button clicks for heatmap
    this.sendToHeatmap('button_click', {
      form_id: this.chatbotId,
      button_text: buttonText,
      button_value: buttonValue,
      step_name: stepName,
      step_number: this.currentStep,
      x_coordinate: event.clientX,
      y_coordinate: event.clientY,
      timestamp_ms: Date.now()
    });
  }

  getTotalSteps() {
    // Define your chatbot's total number of steps
    return 5; // Adjust based on your chatbot flow
  }

  sendToHeatmap(eventType, data) {
    if (typeof window.heatmapTracking !== 'undefined') {
      fetch('/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'heatmap_chatbot_tracking',
          event_type: eventType,
          data: JSON.stringify({
            site_id: window.heatmapTracking.siteId,
            session_id: window.heatmapTracking.sessionId,
            ...data
          }),
          nonce: window.heatmapTracking.nonce
        })
      }).catch(error => {
        console.error('Chatbot tracking error:', error);
      });
    }
  }
}

// Example integration in your chatbot code:
const chatbotAnalytics = new ChatbotAnalytics();

// Track each conversation step
function askQuestion(stepName, questionText, options) {
  // Your existing chatbot logic...
  
  // Add tracking when user responds
  document.querySelectorAll('.chatbot-option').forEach(button => {
    button.addEventListener('click', (e) => {
      const answer = e.target.textContent;
      chatbotAnalytics.trackUserResponse(stepName, questionText, answer, true);
      chatbotAnalytics.trackButtonClick(answer, e.target.value, stepName);
    });
  });
}

// Track when user completes lead form
function onLeadSubmitted(leadData) {
  chatbotAnalytics.trackLeadCompletion(leadData);
  
  // Your existing lead processing...
}

// Track abandonment
window.addEventListener('beforeunload', () => {
  chatbotAnalytics.trackChatbotAbandonment('page_leave');
});

// Track chatbot close
document.addEventListener('click', (e) => {
  if (e.target.matches('.chatbot-close')) {
    chatbotAnalytics.trackChatbotAbandonment('user_closed');
  }
});