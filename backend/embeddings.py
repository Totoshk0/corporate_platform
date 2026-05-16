from sentence_transformers import SentenceTransformer

class EmbeddingService:
    def __init__(self, model_name: str = "ai-forever/ru-en-RoSBERTa"):
        self.model = SentenceTransformer(model_name)

    def generate_embedding(self, text: str):
        return self.model.encode(text).tolist()

embedding_service = EmbeddingService()
