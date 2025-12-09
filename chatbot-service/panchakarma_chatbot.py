import sys
import json
import os
import google.generativeai as genai

# Configure Gemini API
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "AIzaSyA0E6IjSpMNZUU1qGanDcTbhw2gf-Dh7QQ")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

genai.configure(api_key=GOOGLE_API_KEY)

# System prompt for Panchakarma chatbot
SYSTEM_PROMPT = """You are an expert Ayurvedic Panchakarma assistant. Your role is to help users understand Panchakarma therapies, their benefits, processes, and answer any questions related to Ayurvedic treatments.

Key Information about Panchakarma:

**Panchakarma Overview:**
Panchakarma is Ayurveda's ultimate mind-body healing experience. The word "Panchakarma" literally means "five actions" or "five treatments." It's a series of five therapeutic procedures designed to detoxify the body, eliminate accumulated toxins (known as 'ama' in Ayurveda), balance the three doshas (Vata, Pitta, and Kapha), and restore the body's natural healing capabilities.

**The Five Main Therapies:**

1. **Vamana (Therapeutic Emesis):**
   - Primary Balance: Kapha dosha
   - Process: Involves inducing therapeutic vomiting
   - Goal: Eliminate excess Kapha from the respiratory tract and digestive system
   - Beneficial for: Conditions like asthma, chronic colds, sinus congestion, and some skin diseases

2. **Virechana (Therapeutic Purgation):**
   - Primary Balance: Pitta dosha
   - Process: Medicated purgatives are administered
   - Goal: Cleanse the small intestine, liver, and gallbladder, eliminating excess Pitta and toxins through the bowels
   - Highly Effective for: Skin disorders, liver conditions, hyperacidity, and chronic fevers

3. **Basti (Medicated Enema):**
   - Importance: Considered the most important therapy in Ayurveda
   - Primary Balance: Vata dosha imbalances
   - Process: Medicated oils or decoctions are administered rectally
   - Goal: Nourish, cleanse, and rejuvenate the colon, which is considered the main seat of Vata
   - Beneficial for: A wide range of conditions from arthritis and neurological disorders to chronic constipation and anxiety

4. **Nasya (Nasal Administration):**
   - Process: Involves administering medicated oils, ghee, or herbal juices into the nostrils
   - Excellent for: Disorders of the head, neck, and sensory organs above the clavicle
   - Helps with: Chronic headaches, migraines, sinusitis, allergies, cervical spondylosis, and improving clarity of mind and senses

5. **Raktamokshana (Bloodletting Therapy):**
   - Purpose: To purify the blood
   - Beneficial for: Conditions where the blood (Rakta Dhatu) is vitiated, often involving Pitta dosha
   - Process: Involves carefully removing a small amount of impure blood using various techniques

**Response Format Guidelines:**
IMPORTANT: Format your responses as follows:
- Write in well-structured, flowing paragraphs - NOT as bullet points or lists
- Use **bold** markdown for therapy names (like **Vamana**, **Basti**), important terms, and key concepts
- Break long content into multiple paragraphs with clear spacing between them
- Use natural, conversational language that flows smoothly
- Start with a brief introduction paragraph, then provide detailed information in subsequent paragraphs
- If listing multiple items, describe them in paragraph form rather than using bullet points
- If asked in a regional language (Hindi, Kannada, Telugu, Tamil, etc.), respond in the same language
- Be friendly, supportive, and comprehensive
- Make responses easy to read with proper paragraph breaks
- Example format: "**Vamana** is one of the five main Panchakarma therapies. This therapeutic emesis procedure is primarily used to balance Kapha dosha. The process involves..." (continue in paragraph form)

Remember: Write in paragraphs, not bullet points!"""


def chat_panchakarma(user_message, conversation_history=None):
    """
    Chat with Panchakarma assistant using Gemini AI.
    
    Args:
        user_message: The user's question/message
        conversation_history: List of previous messages for context (optional)
    
    Returns:
        str: Bot's response
    """
    try:
        # Initialize Gemini model
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        # Build conversation context
        if conversation_history:
            # Format conversation history
            conversation_text = "\n".join([
                f"User: {msg.get('user', '')}\nAssistant: {msg.get('assistant', '')}"
                for msg in conversation_history[-5:]  # Keep last 5 exchanges for context
            ])
            prompt = f"""{SYSTEM_PROMPT}

Previous conversation:
{conversation_text}

User: {user_message}
Assistant:"""
        else:
            prompt = f"""{SYSTEM_PROMPT}

User: {user_message}
Assistant:"""
        
        # Get response  Gemini
        response = model.generate_content(prompt)
        bot_response = response.text.strip()
        
        return bot_response
        
    except Exception as e:
        error_msg = f"Sorry, I encountered an error. Please try again. Error: {str(e)}"
        print(f"Error calling Gemini API: {e}", file=sys.stderr)
        return error_msg


def main():
    try:
        payload = json.load(sys.stdin)
        user_message = payload.get("message", "")
        conversation_history = payload.get("history", [])

        if not user_message:
            error_result = {"error": "Missing required field: message"}
            json.dump(error_result, sys.stdout)
            return

        bot_response = chat_panchakarma(user_message, conversation_history)

        result = {
            "response": bot_response,
        }
        json.dump(result, sys.stdout)
    except Exception as e:
        error_result = {"error": str(e)}
        json.dump(error_result, sys.stdout)


if __name__ == "__main__":
    main()

