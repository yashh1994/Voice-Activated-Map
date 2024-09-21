from spellchecker import SpellChecker # type: ignore
import spacy # type: ignore

# Initialize spell checker and spaCy model
spell = SpellChecker()
nlp = spacy.load("en_core_web_md")

def correct_spelling(text, locations):
    corrected_text = []
    for word in text.split():
        # Correct spelling if the word is not a known location
        if word.lower() not in locations:
            corrected_text.append(spell.candidates(word).pop() if spell.candidates(word) else word)
        else:
            corrected_text.append(word)
    return ' '.join(corrected_text)

def process_command(command):
    # Correct spelling errors
    corrected_command = command
    print(f"Corrected Command: {corrected_command}")  # Debugging

    # Process the corrected command with spaCy
    doc = nlp(corrected_command)

    # Debugging: print out entities and tokens
    print(f"Tokens: {[token.text for token in doc]}")
    print(f"Entities: {[ent.text for ent in doc.ents]}")

    # Initialize response
    response = {
        "action": "unknown",
        "message": "I'm not sure how to help with that.",
        "details": None,
        "zoom": None
    }

    locs = [ent.text.lower() for ent in doc.ents if ent.label_ in ["GPE", "LOC"]]

    # Correct spelling only for non-location words
    corrected_command = correct_spelling(command, locs)
    location_entities = [ent.text for ent in doc.ents if ent.label_ in ["GPE", "LOC"]]

    # Check for location searching
    if any(token.text.lower() in ["where", "find", "search"] for token in doc) and len(location_entities) == 1:
        location_entities
        if location_entities:
            location = ", ".join(location_entities)
            response["action"] = "find_location"
            response["message"] = f"The desired location, '{location}', is somewhere here."
            response["details"] = {"location": location}
        else:
            response["message"] = "I need more information to find the location."

    # Check for distance calculation
    elif any(token.text.lower() in ["distance", "between", "from", "to"] for token in doc) and \
        any(phrase in corrected_command.lower() for phrase in ["distance between", "how far", "distance from"]):
        # location_entities = [ent.text for ent in doc.ents if ent.label_ in ["GPE", "LOC"]]
        if len(location_entities) >= 2:
            response["action"] = "find_distance"
            response["message"] = f"Calculating distance between '{location_entities[0]}' and '{location_entities[1]}'."
            response["details"] = {"place1": location_entities[0], "place2": location_entities[1]}
        elif len(location_entities) == 1 and "current location" in corrected_command:
            response["action"] = "distance_from_current"
            response["message"] = f"Calculating distance from current location to '{location_entities[0]}'."
            response["details"] = {"place1": "current location", "place2": location_entities[0]}
        else:
            response["message"] = "I need at least one location to calculate the distance."

    # Check for reading details
    elif any(token.text in ["details", "information", "read"] for token in doc) and \
        any(phrase in corrected_command.lower() for phrase in ["details about", "information on"]):
        if location_entities:
            location = ", ".join(location_entities)
            response["action"] = "read_details"
            response["message"] = f"Fetching details about '{location}'."
            response["details"] = {"location": location}
        else:
            response["message"] = "I need more information to fetch details."

    # Check for zooming in or out
    elif any(token.text.lower() in ["zoom", "in", "out"] for token in doc) and \
        any(phrase in corrected_command.lower() for phrase in ["zoom in", "zoom out"]):
        if location_entities:
            zoom_level = "in" if "in" in corrected_command else "out"
            location = ", ".join(location_entities)
            response["action"] = "zoom"
            response["message"] = f"Zooming {zoom_level} on location '{location}'."
            response["details"] = {"location": location, "zoom": zoom_level}
        else:
            response["message"] = "I need more information to zoom in or out."

    return response


# Example usage
# commands = [
#     "Where is NewYork located?",
#     "How much is the distance between Rajkot and Junagadh?",
#     "How far is Rajkot from current location?",
#     "Tell me the details about Mumbai.",
#     "Zoom in on Junagadh.",
#     "Zoom out from Rajkot.",
#     "Where is Mumbai?"
# ]


# for command in commands:
#     print(f"Command: {command}")
#     response = process_command(command)
#     print(f"Response: {response}")

#Responses
# Command: Where is NewYork located?
# Corrected Command: Where is NewYork located?
# Tokens: ['Where', 'is', 'NewYork', 'located', '?']
# Entities: ['NewYork']
# Response: {'action': 'find_location', 'message': "The desired location, 'NewYork', is somewhere here.", 'details': {'location': 'NewYork'}, 'zoom': None}

# Command: How much is the distance between Rajkot and Junagadh?
# Corrected Command: How much is the distance between Rajkot and Junagadh?
# Tokens: ['How', 'much', 'is', 'the', 'distance', 'between', 'Rajkot', 'and', 'Junagadh', '?']
# Entities: ['Rajkot', 'Junagadh']
# Response: {'action': 'find_distance', 'message': "Calculating distance between 'Rajkot' and 'Junagadh'.", 'details': {'place1': 'Rajkot', 'place2': 'Junagadh'}, 'zoom': None}

# Command: How far is Rajkot from current location?
# Corrected Command: How far is Rajkot from current location?
# Tokens: ['How', 'far', 'is', 'Rajkot', 'from', 'current', 'location', '?']
# Entities: ['Rajkot']
# Response: {'action': 'distance_from_current', 'message': "Calculating distance from current location to 'Rajkot'.", 'details': {'place1': 'current location', 'place2': 'Rajkot'}, 'zoom': None}    
#   
# Command: Tell me the details about Mumbai.
# Corrected Command: Tell me the details about Mumbai.
# Tokens: ['Tell', 'me', 'the', 'details', 'about', 'Mumbai', '.']
# Entities: ['Mumbai']
# Response: {'action': 'read_details', 'message': "Fetching details about 'Mumbai'.", 'details': {'location': 'Mumbai'}, 'zoom': None}

# Command: Zoom in on Junagadh.
# Corrected Command: Zoom in on Junagadh.
# Tokens: ['Zoom', 'in', 'on', 'Junagadh', '.']
# Entities: ['Junagadh']
# Response: {'action': 'zoom', 'message': "Zooming in on location 'Junagadh'.", 'details': {'location': 'Junagadh', 'zoom': 'in'}, 'zoom': None}

# Command: Zoom out from Rajkot.
# Corrected Command: Zoom out from Rajkot.
# Tokens: ['Zoom', 'out', 'from', 'Rajkot', '.']
# Entities: ['Rajkot']
# Response: {'action': 'zoom', 'message': "Zooming out on location 'Rajkot'.", 'details': {'location': 'Rajkot', 'zoom': 'out'}, 'zoom': None}

# Command: Where is Mumbai?
# Corrected Command: Where is Mumbai?
# Tokens: ['Where', 'is', 'Mumbai', '?']
# Entities: ['Mumbai']
# Response: {'action': 'find_location', 'message': "The desired location, 'Mumbai', is somewhere here.", 'details': {'location': 'Mumbai'}, 'zoom': None}
