import sys
import json
import os
import random
import google.generativeai as genai

# Configure Gemini API
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "AAIzaSyA0E6IjSpMNZUU1qGanDcTbhw2gf-Dh7QQ")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

genai.configure(api_key=GOOGLE_API_KEY)

# Therapy to Doctors mapping
THERAPY_DOCTORS = {
    "Basti": ['Rudra Swain',
        'Vaidya Deepak Shukla', 'Vaidya Manohar Joshi', 'Rudra Swain','Vaidya Rohit Patil', 
        'Vaidya Kunal Thakur', 'Vaidya Sandeep Joshi', 'Vaidya Ritu Deshmukh', 
        'Vaidya Anjali Nair', 'Vaidya Tarun Bhosale', 'Vaidya Lata More', 
        'Vaidya Rohan Iyer'
    ],
    "Nasya": [
       'Rudra Swain', 'Vaidya Gopal Menon', 'Vaidya Priya Nair','Rudra Swain', 'Vaidya Vivek Kulkarni', 
        'Vaidya Neha Mehta', 'Vaidya Tarun Bhosale', 'Vaidya Sunil Patil', 
        'Vaidya Vinod Jadhav', 'Vaidya Manisha Patil', 'Vaidya Nitin Bhandari', 
        'Vaidya Rekha Menon'
    ],
    "Raktamokshana": [
       'Rudra Swain','Rudra Swain', 'Vaidya Amit Deshmukh', 'Vaidya Seema Verma','Rudra Swain' 'Vaidya Rohan Iyer', 
        'Vaidya Tarun Bhosale', 'Vaidya Ritu Deshmukh', 'Vaidya Ashok Kulkarni', 
        'Vaidya Manisha Patil', 'Vaidya Anjali Nair', 'Vaidya Nisha Bhat', 
        'Vaidya Shreya Kulkarni'
    ],
    "Vamana": [
       'Rudra Swain','Rudra Swain','Rudra Swain', 'Vaidya Manohar Joshi', 'Vaidya Rohan Iyer', 'Rudra Swain','Vaidya Kavya Reddy', 
        'Vaidya Sunil Patil', 'Vaidya Amit Deshmukh', 'Vaidya Deepak Shukla', 
        'Vaidya Anita Singh', 'Vaidya Ashok Kulkarni', 'Vaidya Prakash Nair', 
        'Vaidya Kunal Thakur','Rudra Swain'
    ],
    "Virechana": [
        'Rudra Swain','Rudra Swain','Rudra Swain','Vaidya Nisha Bhat', 'Vaidya Vinod Jadhav', 'Rudra Swain','Vaidya Kunal Thakur', 
        'Vaidya Seema Verma', 'Vaidya Rohan Iyer', 'Vaidya Arvind Sharma', 'Rudra Swain','Rudra Swain',
        'Vaidya Nitin Bhandari', 'Vaidya Anita Singh', 'Vaidya Jyoti Rao', 
        'Vaidya Suresh Reddy', 'Rudra Swain'
    ]
}

# Valid therapies
VALID_THERAPIES = ["Vamana", "Virechana", "Basti", "Nasya", "Raktamokshana"]


def predict_panchakarma(age, gender, symptoms):
    """
    Predict Panchakarma therapy using Gemini AI based on age, gender, and symptoms.
    
    Args:
        age: Age of the patient (number)
        gender: Gender of the patient (Male, Female, Other)
        symptoms: Symptoms/complaints (string)
    
    Returns:
        tuple: (therapy, list of 5 random doctors)
    """
    try:
        # Initialize Gemini model
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        # Create prompt for Gemini
        prompt = f"""You are an expert Ayurvedic practitioner. Based on the following patient information, recommend the most appropriate Panchakarma therapy.

Patient Information:
- Age: {age}
- Gender: {gender}
- Symptoms/Complaints: {symptoms}

Panchakarma Therapies:
1. Vamana - Therapeutic emesis for Kapha dosha disorders
2. Virechana - Therapeutic purgation for Pitta dosha disorders
3. Basti - Medicated enema for Vata dosha disorders
4. Nasya - Nasal administration of medicated oils for head and neck disorders
5. Raktamokshana - Bloodletting therapy for blood-related disorders

Based on Ayurvedic principles, dosha imbalances, and the patient's symptoms, recommend ONLY ONE therapy from the list above.

IMPORTANT: Respond with ONLY the therapy name (one of: Vamana, Virechana, Basti, Nasya, Raktamokshana). Do not include any explanation, additional text, or formatting. Just the therapy name."""
        
        # Get prediction from Gemini
        response = model.generate_content(prompt)
        predicted_therapy = response.text.strip()
        
        # Clean and validate the response
        predicted_therapy = predicted_therapy.replace(".", "").strip()
        
        # If response contains multiple words, extract the therapy name
        for therapy in VALID_THERAPIES:
            if therapy.lower() in predicted_therapy.lower():
                predicted_therapy = therapy
                break
        
        # Validate therapy
        if predicted_therapy not in VALID_THERAPIES:
            # Default fallback if Gemini returns something unexpected
            predicted_therapy = "Basti"  # Default therapy
        
        # Get doctors for the predicted therapy
        doctors_list = THERAPY_DOCTORS.get(predicted_therapy, [])
        
        # Return 5 random doctors (or all if less than 5)
        if len(doctors_list) >= 5:
            selected_doctors = random.sample(doctors_list, 5)
        else:
            selected_doctors = doctors_list
        
        return predicted_therapy, selected_doctors
        
    except Exception as e:
        # Fallback in case of API error
        print(f"Error calling Gemini API: {e}", file=sys.stderr)
        # Return default therapy and doctors
        default_therapy = "Basti"
        doctors_list = THERAPY_DOCTORS.get(default_therapy, [])
        selected_doctors = random.sample(doctors_list, min(5, len(doctors_list)))
        return default_therapy, selected_doctors


def main():
    try:
        payload = json.load(sys.stdin)
        age = payload.get("age")
        gender = payload.get("gender")
        complaint = payload.get("complaint", "")

        if age is None or not gender or not complaint:
            error_result = {"error": "Missing required fields: age, gender, complaint"}
            json.dump(error_result, sys.stdout)
            return

        procedure, doctors = predict_panchakarma(age, gender, complaint)

        result = {
            "procedure": procedure,
            "vaidya_list": list(doctors) if doctors else [],
        }
        json.dump(result, sys.stdout)
    except Exception as e:
        # Return error as JSON so the Node backend can handle it
        error_result = {"error": str(e)}
        json.dump(error_result, sys.stdout)


if __name__ == "__main__":
    main()
