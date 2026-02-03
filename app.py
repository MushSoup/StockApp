from flask import Flask, render_template, jsonify, request
import joblib
import warnings
import pandas as pd
import os
warnings.filterwarnings('ignore')


app = Flask(__name__)


# data = industryCompanyMergedData

industries = ["Advertising Agencies",
"Aerospace & Defense",
"Airlines",
"Apparel Manufacturing",
"Apparel Retail",
"Asset Management",
"Auto & Truck Dealerships",
"Auto Manufacturers",
"Auto Parts",
"Banks - Regional",
"Beverages - Non-Alcoholic",
"Biotechnology",
"Broadcasting",
"Building Products & Equipment",
"Capital Markets",
"Chemicals",
"Communication Equipment",
"Computer Hardware",
"Conglomerates",
"Consulting Services",
"Credit Services",
"Diagnostics & Research",
"Drug Manufacturers - General",
"Drug Manufacturers - Specialty & Generic",
"Education & Training Services",
"Electrical Equipment & Parts",
"Electronic Components",
"Electronic Gaming & Multimedia",
"Engineering & Construction",
"Entertainment",
"Farm & Heavy Construction Machinery",
"Farm Products",
"Financial Data & Stock Exchanges",
"Food Distribution",
"Footwear & Accessories",
"Furnishings, Fixtures & Appliances",
"Gold",
"Grocery Stores",
"Health Information Services",
"Healthcare Plans",
"Household & Personal Products",
"Industrial Distribution",
"Information Technology Services",
"Insurance - Life",
"Insurance - Property & Casualty",
"Insurance - Specialty",
"Insurance Brokers",
"Integrated Freight & Logistics",
"Internet Content & Information",
"Internet Retail",
"Leisure",
"Medical Care Facilities",
"Medical Devices",
"Medical Instruments & Supplies",
"Metal Fabrication",
"Mortgage Finance",
"Oil & Gas E&P",
"Oil & Gas Equipment & Services",
"Oil & Gas Midstream",
"Oil & Gas Refining & Marketing",
"Other Industrial Metals & Mining",
"Packaged Foods",
"Packaging & Containers",
"Personal Services",
"Pollution & Treatment Controls",
"Real Estate - Development",
"Real Estate Services",
"Recreational Vehicles",
"Rental & Leasing Services",
"Residential Construction",
"Resorts & Casinos",
"Restaurants",
"Scientific & Technical Instruments",
"Security & Protection Services",
"Semiconductor Equipment & Materials",
"Semiconductors",
"Software - Application",
"Software - Infrastructure",
"Solar",
"Specialty Business Services",
"Specialty Chemicals",
"Specialty Industrial Machinery",
"Specialty Retail",
"Staffing & Employment Services",
"Steel",
"Telecom Services",
"Tools & Accessories",
"Travel Services",
"Trucking",
"Utilities - Regulated Electric",
"Utilities - Regulated Gas",
"Utilities - Regulated Water",
"Utilities - Renewable",
"Waste Management"]

def normalize_industry(industry: str) -> str:
    charsToRemove = "&-"
    translationTable = str.maketrans('', '', charsToRemove)
    industry = industry.translate(translationTable)
    industry = " ".join(industry.split())
    return industry.replace(" ", "_")

def get_industry_rank(industry):
    industry = normalize_industry(industry)
    fullPredictionPath = os.path.join('static', 'data', 'predictionResult', f'{industry}_prediction_results.json')
    tables = pd.read_json(fullPredictionPath).T
    # tables['Actual Rank'] = tables['Rank Target'].rank(ascending=False)
    tables = tables.drop('Rank Target', axis=1)
    tables = tables.drop('score', axis=1)
    return {
        "type": "table",
        "columns": tables.columns.tolist(),
        "rows": tables.values.tolist()
    }

def get_industry_metrics(industry):
    industry = normalize_industry(industry)
    date = '2025-06-30'
    fullMetricPath = os.path.join('static', 'data', 'industryCombinedMetric', f'{industry}.json')
    data = pd.read_json(fullMetricPath).T
    data = data[['index', 'company ID', 'Revenue Growth', 'TTM Growth', 'Operating Margin', 'Gross Margin', 'OCF Margin', 'Free Cash Flow Margin', 'Return On Equity', 'Return On Assets', 'Return On Invested Capital', 'Current Ratio', 'Accruals Ratio', 'Capital Expenditure Revenue Ratio', 'Interest Coverage Ratio', 'Cash Flow to Net Income Ratio', 'Research Development Sales Ratio', 'Debt To Equity', 'Debt To EBITDA', 'Asset Turnover', 'Cash Conversion Cycle', 'FCF Per Share']]
    data["index"]=  pd.to_datetime(data['index'], unit='ms')
    df = data[data["index"] == date].copy()
    df = df.drop('index', axis=1)
    return {
        "type": "metricTable",
        "columns": df.columns.tolist(),
        "rows": df.values.tolist()
    }

def get_industry_model_test(industry):
    industry = normalize_industry(industry)
    fullFoldPath = os.path.join('static', 'data', 'testingResults', f'{industry}_fold.json')
    images = [
        f"static/images/{industry}_plot_feature_importance.png",
        f"static/images/{industry}_plot_IC_by_fold.png",
        f"static/images/{industry}_plot_prediction_distribution.png"
    ]
    df = pd.read_json(fullFoldPath).T
    df = df.drop('IC_Shuffle', axis=1)
    return {
        "type": "model_test",
        "images": images,
        "table": {
            "columns": df.columns.tolist(),
            "rows": df.values.tolist()
        }
    }

VIEW_HANDLERS = {
    "stockRank": get_industry_rank,
    "metrics": get_industry_metrics,
    "model": get_industry_model_test
}


@app.route("/")
def home():


    return render_template(
        "index.html",
        industries=industries
    )

@app.route("/industry-view")
def industry_view():
    industry = request.args.get("industry")
    view = request.args.get("view")
    
    handler = VIEW_HANDLERS.get(view)
    if not handler:
        return jsonify({"type": "error", "message": "Invalid view"})

    return jsonify(handler(industry))

if __name__ == "__main__":
    app.run(debug=True)