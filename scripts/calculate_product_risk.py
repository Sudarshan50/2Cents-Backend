# calculate_product_risk.py
import yfinance as yf
import argparse
import json
import warnings

# Suppress yfinance warnings that could break JSON output
warnings.filterwarnings("ignore")

# Parse arguments
parser = argparse.ArgumentParser()
parser.add_argument("--stock", type=str, required=True)
parser.add_argument("--max_var_value", type=float, required=True)
parser.add_argument("--issue_price", type=float, required=True)
parser.add_argument("--barrier", type=float, required=True)
parser.add_argument("--strike", type=float, required=True)
parser.add_argument("--coupon", type=float, required=True)
args = parser.parse_args()

# Extract arguments
ticker = args.stock
max_var_value = args.max_var_value
issue_price = args.issue_price
B = args.barrier
S = args.strike
Coupon = args.coupon

# Fetch latest close price
try:
    live_data = yf.Ticker(ticker)
    current_price = live_data.history(period="1d")["Close"].iloc[-1]
except Exception as e:
    print(json.dumps({"error": f"Error fetching price for {ticker}: {str(e)}"}))
    exit(1)

# Calculate barrier distance and product risk
d_B = (100 - B) - (100 - (current_price * 100 / issue_price))

if max_var_value <= d_B:
    product_var = 0
else:
    product_var = max_var_value - d_B - (Coupon * S / 100)

# ✅ Define and print result as JSON
result = {
    "barrier_distance": d_B,
    "product_var": product_var,
    "current_price": current_price
}

print(json.dumps(result))