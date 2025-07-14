import os
from dotenv import load_dotenv
from typing import Dict

from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import PlainTextResponse

from langchain_huggingface import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS

from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,      # FLAN‑T5
    AutoModelForCausalLM        # distilGPT-2
)
import torch

# ──────────────────────────────────────────────────────────────────
# 1.  Startup
# ──────────────────────────────────────────────────────────────────
load_dotenv()
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

app = FastAPI()

# ----------  FLAN‑T5 (small, instruction‑tuned)  ----------
flan_name = "google/flan-t5-small"
flan_tokenizer = AutoTokenizer.from_pretrained(flan_name)
flan_model = AutoModelForSeq2SeqLM.from_pretrained(flan_name).to(device)
flan_model.eval()

# ----------  distilGPT-2 (for next‑word prediction) ----------
gpt_name = "distilgpt2"
gpt_tokenizer = AutoTokenizer.from_pretrained(gpt_name)
gpt_model = AutoModelForCausalLM.from_pretrained(gpt_name).to(device)
gpt_model.eval()

# ──────────────────────────────────────────────────────────────────
# 2.  Helpers
# ──────────────────────────────────────────────────────────────────
def get_embeddings():
    return HuggingFaceEmbeddings(
        model_name="BAAI/bge-small-en-v1.5",
        model_kwargs={"device": device.type},
        encode_kwargs={"normalize_embeddings": False},
    )

def load_vector_store(embeddings):
    try:
        # Get the absolute path to the chatagent directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        me_txt_path = os.path.join(current_dir, "me.txt")
        
        with open(me_txt_path, "r", encoding="utf-8") as f:
            text = f.read()
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="me.txt not found in chatagent directory")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1_000,
        chunk_overlap=200,
        separators=["\n\n", "\n", " ", ""],
    )
    chunks = splitter.split_text(text)
    return FAISS.from_texts(chunks, embedding=embeddings)

def flan_generate(prompt: str, *, max_new_tokens: int = 120) -> str:
    inputs = flan_tokenizer(prompt, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = flan_model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=0.4,
            top_p=0.9,
            do_sample=True,
        )
    return flan_tokenizer.decode(outputs[0], skip_special_tokens=True)

# ──────────────────────────────────────────────────────────────────
# 3.  Endpoints
# ──────────────────────────────────────────────────────────────────
@app.get("/chat", response_class=PlainTextResponse)
async def chat(query: str, embeddings=Depends(get_embeddings)):
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    vector_store = load_vector_store(embeddings)
    retriever = vector_store.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 3, "lambda_mult": 0.5},
    )
    docs = retriever.invoke(query)
    context = " ".join(d.page_content for d in docs) or "No relevant context."

    prompt = (
        "You are an expert assistant. Answer the question **in at most two sentences**, "
        "using the provided context. If the answer is not in the context, say you don't know.\n\n"
        f"Context: {context}\n"
        f"Question: {query}\n"
        "Answer:"
    )
    full = flan_generate(prompt, max_new_tokens=80)
    answer = full.split("Answer:")[-1].strip()
    return answer

@app.post("/predict")
async def predict_next_word(request: Dict[str, str]):
    prompt = request.get("prompt", "")
    if not prompt.strip():
        return {"next_word": ""}

    # generate one token using distilGPT‑2
    inputs = gpt_tokenizer(prompt, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = gpt_model.generate(
            **inputs,
            max_new_tokens=1,
            do_sample=True,
            top_k=50,
            top_p=0.95,
            pad_token_id=gpt_tokenizer.eos_token_id,
        )
    next_id = outputs[0][-1].item()
    next_word = gpt_tokenizer.decode([next_id]).strip()

    if next_word in {".", ",", "?", "!", ":", ";", '"', "'"}:
        next_word = ""
    return {"next_word": next_word}
