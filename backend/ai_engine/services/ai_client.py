import os
import requests
from django.conf import settings

class GroqService:
    API_URL = "https://api.groq.com/openai/v1/chat/completions"
    MODELS = [
        "qwen/qwen3.8-27b",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
    ]

    @classmethod
    def get_api_key(cls):
        api_key = (
            getattr(settings, 'GROQ_API_KEY', '') or
            os.environ.get('GROQ_API_KEY', '') or
            ''
        )
        return api_key.strip()

    @classmethod
    def is_available(cls):
        key = cls.get_api_key()
        return bool(key and key.startswith('gsk_'))

    @classmethod
    def generate_json(cls, system_prompt: str, user_prompt: str, timeout: int = 15):
        api_key = cls.get_api_key()
        if not api_key:
            raise ValueError("Groq API key is not configured.")

        configured_model = getattr(settings, 'GROQ_MODEL', 'qwen/qwen3.8-27b')
        models_to_try = [configured_model] + [m for m in cls.MODELS if m != configured_model]

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        last_error = None
        for model_name in models_to_try:
            payload = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.2,
            }
            try:
                resp = requests.post(cls.API_URL, headers=headers, json=payload, timeout=timeout)
                if resp.status_code == 200:
                    data = resp.json()
                    if not isinstance(data, dict) or "choices" not in data or not data["choices"]:
                        last_error = RuntimeError(f"Model {model_name} returned malformed response structure.")
                        continue
                    message = data["choices"][0].get("message", {})
                    content = message.get("content", "")
                    if not content or not content.strip():
                        last_error = RuntimeError(f"Model {model_name} returned empty content.")
                        continue
                    cleaned = content.strip()
                    for prefix in ("```json", "```"):
                        if cleaned.startswith(prefix):
                            cleaned = cleaned[len(prefix):]
                    if cleaned.endswith("```"):
                        cleaned = cleaned[:-3]
                    parsed = json.loads(cleaned.strip())
                    if not isinstance(parsed, dict) or not parsed:
                        last_error = RuntimeError(f"Model {model_name} returned invalid or empty JSON.")
                        continue
                    return parsed
                else:
                    last_error = RuntimeError(f"Groq API error ({resp.status_code}): {resp.text}")
            except Exception as exc:
                last_error = exc
                continue

        if last_error:
            raise last_error
        raise RuntimeError("Failed to generate response from Groq.")


