import os
import json
from typing import Optional, Tuple, Dict, Any
from dotenv import load_dotenv
from PIL import Image
import google.generativeai as genai

load_dotenv()


class FashionAnalyzer:
    def __init__(self, model: str = "gemini-2.5-flash"):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        genai.configure(api_key=api_key)
        self.client = genai
        self.model = model

    def _extract_json_block(self, text: str) -> Optional[str]:
        """
        Extract the first valid JSON block by counting braces.
        Handles nested structures safely.
        """
        start = text.find("{")
        if start == -1:
            return None

        depth = 0
        for i, ch in enumerate(text[start:], start=start):
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return text[start:i + 1]
        return None

    def _coerce_json(self, text: str) -> Optional[dict]:
        """
        Try to extract a JSON object from the given text.
        - First, try to parse the entire text as JSON.
        - If that fails, attempt to extract the first valid JSON block using brace matching.
        """
        if not text:
            return None

        # Try direct parse first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Extract a block and try again
        block = self._extract_json_block(text)
        if block:
            try:
                return json.loads(block)
            except json.JSONDecodeError:
                return None
        return None

    def analyze(self, image_path: str) -> Tuple[str, Optional[Dict[str, Any]]]:
        """
        Analyze a fashion image and return:
        - raw model response text
        - parsed JSON (or None if not parseable)
        """
        img = Image.open(image_path).convert("RGB")

        prompt = (
            "You are a fashion AI analyst. Analyze the clothing items in this image and return ONLY a structured JSON response with the following format:\n"
            "{\n"
            '  "items": [\n'
            '    {\n'
            '      "type": "clothing_type",\n'
            '      "style": "style_category",\n'
            '      "colors": ["color1", "color2"],\n'
            '      "patterns": ["pattern1", "pattern2"],\n'
            '      "materials": ["material1", "material2"],\n'
            '      "details": ["detail1", "detail2"]\n'
            '    }\n'
            '  ],\n'
            '  "accessories": ["accessory1", "accessory2"],\n'
            '  "overall": {\n'
            '    "dominant_colors": ["color1", "color2"],\n'
            '    "style": "overall_style",\n'
            '    "seasons": ["season1", "season2"],\n'
            '    "occasions": ["occasion1", "occasion2"]\n'
            '  },\n'
            '  "description": "Brief AI-readable description with keywords"\n'
            "}\n"
            "Return ONLY the JSON object. No additional text, explanations, or formatting. Ensure all values are concise and keyword-focused for AI processing."
        )


        model = self.client.GenerativeModel(self.model)
        resp = model.generate_content([prompt, img])

        raw = resp.text or ""
        parsed = self._coerce_json(raw)
        return raw, parsed

    def suggest(self, context_prompt: str) -> str:
        """
        Generate outfit suggestion based on wardrobe and weather context.
        """
        model = self.client.GenerativeModel(self.model)
        resp = model.generate_content([context_prompt])
        return resp.text or ""
