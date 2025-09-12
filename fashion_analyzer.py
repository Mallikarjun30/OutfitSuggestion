import os
import json
from typing import Optional, Tuple, Dict, Any
from dotenv import load_dotenv
from PIL import Image
from google import genai
from google.genai import types

load_dotenv()


class FashionAnalyzer:
    def __init__(self, model: str = "gemini-2.5-flash"):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        self.client = genai.Client(api_key=api_key)
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
            "You are a meticulous fashion analyst. Describe each article of clothing in the image in well-structured, "
            "clear, human-readable text. For each item, explain: the type of clothing (e.g., t-shirt, jeans), its style "
            "(casual, formal, streetwear, etc.), colors, patterns, materials, and any notable details (logos, graphics, "
            "embellishments). Also mention visible accessories. After describing individual items, give an overall summary "
            "of the outfit, including dominant colors, overall style, which seasons it is suitable for (hot, warm, cool, cold), "
            "and what occasions it would fit best (work, party, casual, sport, etc.). Make it descriptive, natural, and "
            "easy to read like a fashion magazine note. If unsure, make reasonable guesses but avoid adding imaginary items."
            "Dont give ANYTHING other than the description. Every word must have a reason. Everything you give is directly stord in a database. Make sure that the description is not too long and keep it small with keywords. It should be AI - understandable and not Human understandable"

        )


        resp = self.client.models.generate_content(
            model=self.model,
            contents=[prompt, img]
        )

        raw = resp.text or ""
        parsed = self._coerce_json(raw)
        return raw, parsed

    def suggest(self, context_prompt: str) -> str:
        """
        Generate outfit suggestion based on wardrobe and weather context.
        """
        resp = self.client.models.generate_content(
            model=self.model,
            contents=[context_prompt]
        )
        return resp.text or ""
