from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import sqlite3
from datetime import datetime
import google.generativeai as genai
from PIL import Image
import io
import os
import uvicorn

app = FastAPI()

#Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production (e.g., ["http://localhost:3000"])
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

# Database setup
def setup_database():
    conn = sqlite3.connect('clothing_analysis.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS clothing_analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            labels TEXT,
            wear_score REAL,
            tier TEXT,
            refund_percentage TEXT,
            result TEXT,
            analysis_date TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS auction_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_description TEXT,
            buyer_offer REAL,
            platform TEXT,
            created_at TEXT
        )
    ''')
    
    conn.commit()
    return conn

conn = setup_database()

# Endpoint 1: Analyze clothing image
@app.post("/analyze-clothing/")
async def analyze_clothing(file: UploadFile = File(...)):
    try:
        image_data = await file.read()
        img = Image.open(io.BytesIO(image_data))
        
        prompt = """
        Analyze this clothing image and evaluate its wear and tear. Look for signs like stains, tears, holes, or fading.
        Provide a wear score (0 to 1, where 0 is pristine and 1 is heavily damaged) and categorize the return eligibility into tiers:
        - A Tier: 0 to 0.25 (pristine, 100% refund, accepted)
        - B Tier: 0.25 to 0.5 (minor wear, 50% refund, accepted)
        - C Tier: 0.5 to 0.75 (moderate wear, not accepted)
        - D Tier: 0.75 to 1 (heavy damage, not accepted)
        Return the result in this format:
        - Labels: [list of detected features]
        - Wear Score: [score]
        - Tier: [A/B/C/D]
        - Refund: [100%/50%/0%]
        - Result: [Accepted/Not Accepted]
        """
        
        response = model.generate_content([img, prompt])
        response_text = response.text
        
        lines = response_text.split('\n')
        labels = []
        wear_score = 0.0
        tier = ''
        refund = ''
        result = ''
        
        for line in lines:
            if line.startswith('- Labels:'):
                labels = eval(line.replace('- Labels: ', ''))
            elif line.startswith('- Wear Score:'):
                wear_score = float(line.replace('- Wear Score: ', ''))
            elif line.startswith('- Tier:'):
                tier = line.replace('- Tier: ', '')
            elif line.startswith('- Refund:'):
                refund = line.replace('- Refund: ', '')
            elif line.startswith('- Result:'):
                result = line.replace('- Result: ', '')

        cursor = conn.cursor()
        current_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute('''
            INSERT INTO clothing_analysis (filename, labels, wear_score, tier, refund_percentage, result, analysis_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (file.filename, ','.join(labels), wear_score, tier, refund, result, current_date))
        conn.commit()
        
        return {
            "filename": file.filename,
            "labels": labels,
            "wear_score": wear_score,
            "tier": tier,
            "refund": refund,
            "result": result,
            "analysis_date": current_date
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint 2: Get all returned products
@app.get("/returned-products/")
async def get_returned_products():
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM clothing_analysis')
        rows = cursor.fetchall()
        
        results = [{
            "id": row[0],
            "filename": row[1],
            "labels": row[2].split(','),
            "wear_score": row[3],
            "tier": row[4],
            "refund_percentage": row[5],
            "result": row[6],
            "analysis_date": row[7]
        } for row in rows]
        
        return {"returned_products": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint 3: Auction items
@app.post("/auction-item/")
async def create_auction_item(item_description: str, buyer_offer: float, platform: str):
    try:
        cursor = conn.cursor()
        current_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.execute('''
            INSERT INTO auction_items (item_description, buyer_offer, platform, created_at)
            VALUES (?, ?, ?, ?)
        ''', (item_description, buyer_offer, platform, current_date))
        conn.commit()
        
        return {
            "item_description": item_description,
            "buyer_offer": buyer_offer,
            "platform": platform,
            "created_at": current_date
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/auction-items/")
async def get_auction_items():
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM auction_items')
        rows = cursor.fetchall()
        
        results = [{
            "id": row[0],
            "item_description": row[1],
            "buyer_offer": row[2],
            "platform": row[3],
            "created_at": row[4]
        } for row in rows]
        
        return {"auction_items": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
