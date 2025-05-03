from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import os
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__, 
    static_folder='static',
    template_folder='templates'
)
CORS(app)

# Training data for the chatbot
training_data = {
    "how does phishblade work": "PhishBlade works by analyzing links in real-time using advanced AI algorithms. When you click a link, it checks for suspicious patterns, domain reputation, and known phishing indicators. If a threat is detected, it blocks the page and alerts you immediately.",
    
    "what is phishing": "Phishing is a cyber attack where scammers try to trick you into giving away sensitive information like passwords or credit card numbers. They often create fake websites that look like legitimate ones. PhishBlade helps protect you from these attacks by detecting and blocking suspicious links.",
    
    "how to stay safe online": "Here are some tips to stay safe online: Use strong, unique passwords. Enable two-factor authentication. Be cautious of suspicious links. Keep your software updated. Use PhishBlade for extra protection. Don't share personal information with unknown sources. Verify website authenticity before entering sensitive data.",
    
    "tell me about your features": "PhishBlade offers several key features: Real-time link scanning. AI-powered threat detection. Automatic blocking of malicious sites. Educational alerts about threats. User-friendly interface. Regular security updates. Browser extension compatibility. Privacy-focused design.",
    
    "what is phishblade": "PhishBlade is a browser extension that helps protect you from phishing attacks. It analyzes links in real-time, detects suspicious patterns, and blocks malicious websites before they can harm you. It's like having a security guard for your browser!",
    
    "how to install phishblade": "To install PhishBlade: Visit our download page. Click the 'Download' button. Follow the installation instructions. Restart your browser. You're now protected!",
    
    "is phishblade free": "Yes, PhishBlade is completely free to use! We believe in making online security accessible to everyone. You can download and use all our features without any cost.",
    
    "what browsers support phishblade": "PhishBlade currently supports: Google Chrome. Mozilla Firefox. Microsoft Edge. Opera. We're working on adding support for more browsers soon!"
}

# Initialize the vectorizer and fit it with our training data
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(training_data.keys())

def get_best_response(user_input):
    # Vectorize the user input
    user_vector = vectorizer.transform([user_input.lower()])
    
    # Calculate similarity scores
    similarity_scores = cosine_similarity(user_vector, X)
    
    # Get the index of the most similar question
    best_match_idx = np.argmax(similarity_scores)
    best_score = similarity_scores[0][best_match_idx]
    
    # If the best match has a low similarity score, return a default response
    if best_score < 0.3:
        return "I'm BladeBot, your AI security assistant! I can help you understand: How PhishBlade works. What phishing is. How to stay safe online. Our security features. Just ask me anything about online security!"
    
    # Get the corresponding response
    best_question = list(training_data.keys())[best_match_idx]
    return training_data[best_question]

# Routes for serving HTML pages
@app.route('/')
def home():
    return render_template('home.html')

@app.route('/download')
def download():
    return render_template('download.html')

@app.route('/how-it-works')
def how_it_works():
    return render_template('how-it-works.html')

@app.route('/chatbot')
def chatbot_page():
    return render_template('chatbot.html')

# API endpoint for chat
@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({
                'status': 'error',
                'message': 'Please provide a message.'
            }), 400

        # Get the best response using our ML model
        bot_response = get_best_response(user_message)
        
        return jsonify({
            'status': 'success',
            'response': bot_response
        })
            
    except Exception as e:
        logger.error(f"Server Error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True) 