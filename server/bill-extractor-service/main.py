from fastapi import FastAPI, UploadFile, File
from transformers import AutoProcessor, AutoModelForTokenClassification
from PIL import Image
import torch
import io
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

app = FastAPI()

MODEL_NAME = "nielsr/layoutlmv3-finetuned-cord"
processor = AutoProcessor.from_pretrained(MODEL_NAME, apply_ocr=True)  # OCR runs via pytesseract internally
model = AutoModelForTokenClassification.from_pretrained(MODEL_NAME)
id2label = model.config.id2label

@app.post("/extract-bill")
async def extract_bill(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # processor OCRs the image (via Tesseract) AND prepares model inputs in one call
    encoding = processor(image, return_tensors="pt", truncation=True)

    with torch.no_grad():
        outputs = model(**encoding)

    predictions = outputs.logits.argmax(-1).squeeze().tolist()
    tokens = processor.tokenizer.convert_ids_to_tokens(encoding["input_ids"].squeeze().tolist())
    labels = [id2label[p] for p in predictions]

    # Group tokens by predicted label into a simple structured result
    fields = {}
    for token, label in zip(tokens, labels):
        if label == "O" or token in ("<s>", "</s>", "<pad>"):
            continue
        clean_label = label.replace("B-", "").replace("I-", "")
        fields.setdefault(clean_label, []).append(token.replace("Ġ", " "))

    result = {k: "".join(v).strip() for k, v in fields.items()}
    return {"fields": result}