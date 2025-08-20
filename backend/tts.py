import pyttsx3

class TextToSpeechEngine:
    def __init__(self, engine: str = "pyttsx3"):
        if engine != "pyttsx3":
            raise ValueError("Only pyttsx3 is supported in this build")
        self.engine = pyttsx3.init()

    def speak_to_file(self, text: str, out_path: str) -> None:
        self.engine.save_to_file(text, out_path)
        self.engine.runAndWait()