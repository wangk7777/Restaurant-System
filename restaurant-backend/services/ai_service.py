import os
import traceback
import google.generativeai as genai
from dotenv import load_dotenv
import database
from collections import defaultdict
from fastapi import HTTPException

# Load environment variables
load_dotenv(override=True)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


def analyze_survey(survey_id: str, language: str):
    """
    Generates an AI analysis for a specific survey using Google Gemini.
    """
    print(f"DEBUG: Analyzing survey {survey_id} in {language}")

    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured on server.")

    try:
        # 1. Fetch data
        survey = database.get_survey_by_id(survey_id)
        if not survey:
            raise HTTPException(status_code=404, detail="Survey not found")

        responses = database.get_responses(survey_id)
        if not responses:
            msg = "No data available." if language == 'en' else "暂无数据。"
            return msg

        # 2. Separate Active vs Unlinked Data
        active_q_ids = {q['id']: q for q in survey['questions']}

        active_data_parts = []
        unlinked_data_parts = []

        # Group answers by Question ID
        answers_map = defaultdict(list)
        for r in responses:
            if not r.get('answers'): continue
            for q_id, val in r['answers'].items():
                if val and str(val).strip():
                    answers_map[q_id].append(str(val).strip())

        # Build Active Data String
        for q_id, q_obj in active_q_ids.items():
            ans_list = answers_map.get(q_id, [])
            if ans_list:
                # Limit size to prevent context overflow (simplified approach)
                joined_ans = ", ".join(ans_list[:100])
                active_data_parts.append(f"Question: {q_obj['text']}\nAnswers: {joined_ans}")

        active_data_str = "\n\n".join(active_data_parts) if active_data_parts else "No active data."

        # Build Unlinked Data String
        for q_id, ans_list in answers_map.items():
            if q_id not in active_q_ids:
                joined_ans = ", ".join(ans_list[:50])
                unlinked_data_parts.append(f"Old Question (ID: {q_id}): {joined_ans}")

        unlinked_data_str = "\n\n".join(unlinked_data_parts) if unlinked_data_parts else "No historical data."

        # 3. Construct Prompt
        lang_name = "Chinese" if language == 'zh' else "English"

        prompt = f"""You are a world-class restaurant business consultant. Analyze the following survey data for "{survey['name']}".

DATA OVERVIEW:
{active_data_str}

HISTORICAL CONTEXT (Old versions of questions):
{unlinked_data_str}

Please provide your analysis in {lang_name} using Markdown format.

Strictly follow this structure for your analysis:

### 1. User Persona & Growth Strategy (用户画像与增长策略)
- **User Persona**: Analyze the main consumer demographics based on the answers.
- **Growth Strategy**: Provide specific strategies to attract more consumers matching this persona.

### 2. Performance Diagnosis (经营表现深度诊断)
- **Overall Satisfaction**: Brief summary of the sentiment trend.
- **Key Strengths**: What are customers happiest about?
- **Critical Weaknesses**: Deeply analyze the most complained points and root causes.

### 3. Recommended New Survey Questions (建议新增的问卷问题)
- Based on the "Critical Weaknesses", design **3 specific new questions**.
- Explain *why* each question is needed.
"""

        # 4. AI Model Selection
        print("DEBUG: Listing available models via API to find a match...")

        candidates = [
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-2.0-flash",
            "gemini-1.5-flash"
        ]

        chosen_model_name = "gemini-2.5-flash"  # Default fallback

        try:
            available_models = []
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    available_models.append(m.name)

            print(f"DEBUG: Found models: {available_models}")

            for cand in candidates:
                if f"models/{cand}" in available_models:
                    chosen_model_name = cand
                    break
        except Exception as list_err:
            print(f"DEBUG: Failed to list models, defaulting to {chosen_model_name}. Error: {list_err}")

        print(f"DEBUG: Selected model: {chosen_model_name}")
        model = genai.GenerativeModel(chosen_model_name)

        # 5. Execute
        response = model.generate_content(prompt)
        print("DEBUG: Response received.")

        return response.text

    except Exception as e:
        print("!!! AI ANALYSIS ERROR !!!")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI Analysis Failed: {str(e)}")
