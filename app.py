from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
import os
from werkzeug.utils import secure_filename
import osmnx as ox
from geopy.geocoders import Nominatim
import csv 

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

if 'GOOGLE_API_KEY' not in os.environ:
    print('Error: GOOGLE_API_KEY environment variable not set.')
    exit(1)

genai.configure(api_key=os.environ['GOOGLE_API_KEY'])
model = genai.GenerativeModel('gemini-1.5-flash')


doctors = {} 
try:
    with open('doctors.csv', 'r', encoding='utf-8') as csvfile:
        csv_reader = csv.DictReader(csvfile)
        for row in csv_reader:
            if 'name' in row:
                doctors[row['name'].lower().replace(" ", "_")] = row
            else:
                print("Error: Could not read a row in the CSV file. Please double check the CSV file formatting.")
except FileNotFoundError:
    print("Error: 'doctors.csv' file not found.")
except Exception as e:
    print(f"Error reading CSV file: {e}")

specialty_synonyms = {
    "ear doctor": "Ear, Nose & Throat Doctor",
    "ent specialist": "Ear, Nose & Throat Doctor",
    "otolaryngologist": "Ear, Nose & Throat Doctor",
    "skin doctor": "Dermatologist",
    "skin specialist": "Dermatologist",
    "cardiologist": "Cardiologist",
    "heart doctor":"Cardiologist",
    "pediatrician": "Pediatrician",
    "pediatric":"Pediatrician",
    "rheumatologist": "Rheumatologist",
    "urologist": "Urologist",
    "nephrologist":"Nephrologist",
    "psychiatrist":"Psychiatrist",
    "neurologist":"Neurologist",
    "surgeon":"Surgeon",
    "radiologist":"Radiologist",
    "oncologist":"Oncologist",
    "acupuncturist":"Acupuncturist",
    "chiropractor":"Chiropractor",
    "dentist":"Dentist",
    "podiatrist":"Podiatrist",
    "endocrinologist":"Endocrinologist",
    "physiatrist":"Physiatrist",
    "physician assistant":"Physician Assistant",
    "nurse practitioner":"Nurse Practitioner",
    "audiologist":"Audiologist",
    "gastroenterologist":"Gastroenterologist"
}

def modify_query_with_synonyms(query, specialty_synonyms):
    query = query.lower().strip()
    for synonym, actual_specialty in specialty_synonyms.items():
        if synonym in query:
            query = actual_specialty.lower()
            return query
    return query


def search_local_doctors(query, doctors):
    query = modify_query_with_synonyms(query, specialty_synonyms)  
    matching_doctors = []
    exact_match_doctors = [] 
    for doctor_id, doctor_info in doctors.items():
        
        try:
            if query == doctor_info['name'].lower() or query == doctor_info['specialty'].lower():
                exact_match_doctors.append(f"{doctor_info['name']} (Experience: {doctor_info.get('experience', 'N/A')}, Mobile No: {doctor_info.get('Mobile No.', 'N/A')})")

        except Exception as e:
                print(f"Error reading doctor info: {e}")

    if not exact_match_doctors:
            for doctor_id, doctor_info in doctors.items():
          
             name_match = any(word in doctor_info['name'].lower() for word in query.split())
             specialty_match = any(word in doctor_info['specialty'].lower() for word in query.split())

             if name_match or specialty_match:
                 try:
                    matching_doctors.append(f"{doctor_info['name']} (Experience: {doctor_info.get('experience', 'N/A')}, Mobile No: {doctor_info.get('Mobile No.', 'N/A')})")
                 except Exception as e:
                    print(f"Error reading doctor info: {e}")

    else:
         return exact_match_doctors[:5] 

    return matching_doctors[:5]


def search_doctors_osm(query, location_name='purnia,bihar pincode:-844101'):
    try:
        if location_name:
            geolocator = Nominatim(user_agent="my_geocoder")
            location = geolocator.geocode(location_name)
            if location:
                G = ox.graph_from_point((location.latitude, location.longitude), dist=500, network_type="all") 
                nodes, edges = ox.graph_to_gdfs(G)
                
                healthcare_places = nodes[nodes['amenity'].isin(['hospital','clinic','doctors','dentist'])]
                return_data = []
                for index, row in healthcare_places.iterrows():
                     return_data.append(f"{row['name']} (Type: {row['amenity']}, Address: {row['address']})") 
                return return_data[:5] 
            else:
               return None
        else:
           return None

    except Exception as e:
        print("Error in OSM search: ",e)
        return None


@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({"error": "Missing or invalid message in request body."}), 400
        user_message = data['message']
        prompt = f"""You are a helpful AI doctor assistant trained by Md Rahmat Ali. Given the user's message: '{user_message}', provide a response related to health ,wellness and you can Provide Doctor name and specialist . Focus on providing specific recommendations and actionable advice, and avoid medical jargon where possible. If you do not have a proper response to the query.  provide any specific medication recommendations."""
        response = model.generate_content(prompt)
        if not response or not response.text:
            return jsonify({"error": "Invalid response from Google API"}), 500
        bot_message = response.text

        
        doctor_keywords = ["doctor", "specialist", "physician", "medical"]
        if any(keyword in user_message.lower() for keyword in doctor_keywords):
            local_doctors = search_local_doctors(user_message, doctors)
            if local_doctors:
                bot_message += "\n\nHere are some doctors I know about:\n" + "\n".join(local_doctors)
            else:
                 osm_doctors = search_doctors_osm(user_message, location_name="Purnia,Bihar")  
                 if osm_doctors:
                    bot_message += "\n\nHere are some healthcare providers:\n" + "\n".join(osm_doctors)
                 
        if "helo" in user_message.lower() or "hello" in user_message.lower():
              bot_message = "Hello! How can I assist you today?"
        elif "headache" in user_message.lower():
              bot_message += "\n\nFor mild to moderate headaches, over-the-counter pain relievers like acetaminophen or ibuprofen may provide relief. However, if your headache is severe or persistent, seek medical advice immediately. Consult with your doctor or pharmacist for personalized recommendations"
        else:
            bot_message += "\n\nPlease consult a medical professional for further guidance."
        print('Response from Google Gemini:', bot_message)
        return jsonify({"botMessage": bot_message})
    except Exception as e:
        print('Error during API call:', e)
        return jsonify({"error": "An error occurred while processing the message.", "details": str(e)}), 500

@app.route('/api/analyze-image', methods=['POST'])
def analyze_image():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image part in the request'}), 400
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        if file:
            contents = file.read()
            image_part = {"mime_type": file.content_type, "data": contents}
            prompt = "Analyze the contents of the image and tell me what it contains and if there are any health related issues or any issues that need immediate medical attention Answer give in concsie manner and also give possibilities like eg(high chance to tumor,low chances for blood cancer)."
            response = model.generate_content(contents=[prompt, image_part])

            if not response or not response.text:
                return jsonify({'error': 'Invalid response from Google API'}), 500

            image_analysis = response.text
            
            doctor_keywords = ["doctor", "specialist", "physician", "medical"]
            if any(keyword in image_analysis.lower() for keyword in doctor_keywords):
                 local_doctors = search_local_doctors(image_analysis, doctors)
                 if local_doctors:
                    image_analysis += "\n\nHere are some doctors I know about:\n" + "\n".join(local_doctors)
                 else:
                     image_analysis += "\n\nNo doctors found for this search."
            if "headache" in image_analysis.lower():
                 image_analysis += "\n\nFor mild to moderate headaches, over-the-counter pain relievers like acetaminophen or ibuprofen may provide relief. However, if your headache is severe or persistent, seek medical advice immediately. Consult with your doctor or pharmacist for personalized recommendations"
            return jsonify({'result': image_analysis})

    except Exception as e:
        print('Error during image analysis API call:', e)
        return jsonify({'error': 'An error occurred during image analysis.', "details": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)